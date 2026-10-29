// Compile the real exported components with only mdsvex + Svelte.
// Resolve the two finite eager glob forms explicitly; no Vite or global install.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { compile as svx } from 'mdsvex';
import { compile as svelte } from 'svelte/compiler';
import { render } from 'svelte/server';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const all = fs.readdirSync('src', { recursive: true }).filter(f => /\.(svx|svelte|ts|json)$/.test(f)).map(f => 'src/' + f).sort();
const pages = all.filter(f => f.endsWith('/+page.svx'));
const output = f => path.resolve('.build', f.replace(/\.(svx|svelte|ts|json)$/, '.mjs'));
const layout = path.resolve('src/lib/layouts/runbook.svelte');
const pageMetadata = new Map();
const warnings = [];

function expandGlobs(source, filename) {
  const extraImports = [];
  let count = 0;
  source = source.replace(/import\.meta\.glob(?:<[^>]+>)?\(([^\n]+?)\)/g, (match, args) => {
    let matches, imported;
    if (args.includes('/src/lib/data/tenants/*.json')) {
      matches = all.filter(f => f.startsWith('src/lib/data/tenants/') && f.endsWith('.json'));
      imported = 'default';
    } else if (args.includes('/src/routes/kb/*/**/+page.svx')) {
      matches = pages.filter(f => f !== 'src/routes/kb/+page.svx');
      imported = '*';
    } else throw Error('Unsupported glob in ' + filename + ': ' + match);
    const entries = matches.map(f => {
      const name = '__glob_' + count++;
      extraImports.push(`import ${imported === '*' ? '* as ' : ''}${name} from ${JSON.stringify(pathToFileURL(output(f)).href)};`);
      return `${JSON.stringify('/' + f)}: ${name}`;
    });
    return '{' + entries.join(',') + '}';
  });
  if (extraImports.length) {
    if (filename.endsWith('.svelte')) source = source.replace(/<script([^>]*)>/, match => match + '\n' + extraImports.join('\n'));
    else source = extraImports.join('\n') + '\n' + source;
  }
  return source;
}

function resolveImports(code, filename) {
  return code.replace(/(\bfrom\s*|\bimport\s*)(['"])([^'"]+)\2/g, (match, prefix, quote, spec) => {
    let target;
    if (spec.startsWith('#lib/')) target = path.resolve('src/lib', spec.slice(5));
    else if (spec.startsWith(root + '/src/')) target = spec;
    else if (spec.startsWith('.')) target = path.resolve(path.dirname(filename), spec);
    else return match;
    if (!path.extname(target)) target += '.ts';
    const relative = path.relative(root, target);
    assert.ok(all.includes(relative), 'Unknown source import: ' + spec + ' in ' + filename);
    return prefix + quote + pathToFileURL(output(relative)).href + quote;
  });
}

for (const filename of all) {
  let code = fs.readFileSync(filename, 'utf8');
  if (filename.endsWith('.json')) code = 'export default ' + code + ';';
  else if (filename.endsWith('.svx')) {
    const result = await svx(code, { filename: path.resolve(filename), layout: { runbook: layout } });
    assert.ok(result, filename);
    pageMetadata.set(filename, result.data.fm);
    code = result.code;
  }
  code = expandGlobs(code, filename);
  if (filename.endsWith('.svx') || filename.endsWith('.svelte')) {
    const result = svelte(code, { filename: path.resolve(filename), generate: 'server', css: 'injected' });
    warnings.push(...result.warnings.map(w => ({ file: filename, code: w.code, message: w.message })));
    code = result.js.code;
  } else if (filename.endsWith('.ts')) code = stripTypeScriptTypes(code);
  code = resolveImports(code, filename);
  fs.mkdirSync(path.dirname(output(filename)), { recursive: true });
  fs.writeFileSync(output(filename), code);
}

fs.mkdirSync('rendered', { recursive: true });
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
for (const filename of pages) {
  const module = await import(pathToFileURL(output(filename)).href);
  const result = render(module.default);
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${result.head}</head><body>${result.body}</body></html>\n`;
  const route = filename.replace(/^src\/routes\//, '').replace(/\/\+page.svx$/, '/index.html');
  fs.mkdirSync(path.dirname('rendered/' + route), { recursive: true });
  fs.writeFileSync('rendered/' + route, html);
  if (filename.includes('4471-analysis')) {
    assert.ok(!html.includes('no desk ref'), 'Signature missing in rendered page');
    const audit = JSON.parse(fs.readFileSync('evidence/audit-summary.json', 'utf8'));
    assert.ok(html.includes(audit.deskRef), 'Computed desk ref absent');
    assert.ok(html.includes('379') && html.includes('33'), 'Cause table missing');
    assert.ok(html.includes('R-41620'), 'Uncertainty notes absent');
    assert.ok(html.includes('2026-10-04T21:49:00+02:00'), 'Source timestamp absent');
    assert.ok(html.includes('<svg'), 'Timeline absent');
  }
}
const links = pages.map(f => {
  const href = '/' + f.replace(/^src\/routes\//, '').replace('/+page.svx', '/');
  return `<li><a href="${href}">${escape(pageMetadata.get(f)?.title ?? href)}</a></li>`;
}).join('\n');
fs.writeFileSync('rendered/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>S01E03 local review</title></head><body style="max-width:760px;margin:3rem auto;font:18px/1.6 system-ui"><h1>S01E03 · local review</h1><p>Rendered snapshots from the exported mdsvex/Svelte components. The original triage explorer's controls require a hydrated app; this static review preserves its initial rendered examples.</p><ul>${links}</ul><p><a href="/tickets/parser.md">Parser ticket draft</a> · <a href="/tickets/hint.md">Hint ticket draft</a> · <a href="/evidence/report-ledger.csv">Report ledger</a></p></body></html>`);
fs.writeFileSync('evidence/build-verification.json', JSON.stringify({ pages: pages.length, compiledFiles: all.length, warnings,
  checks: ['real mdsvex + Svelte server compilation', 'rendered signature matches derived desk ref', 'cause counts visible',
    'uncertainty IDs visible', 'source offset timestamp visible', 'timeline SVG present'] }, null, 2) + '\n');
console.log(`Rendered ${pages.length} pages from ${all.length} source files. Compiler warnings: ${warnings.length}.`);
