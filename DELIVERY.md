# S01E03 · what it shows

Public repository: `marcengineb/mega-s01e03-what-it-shows`.
The reviewed 52-file snapshot and both issues have been published. The course accepted the two tickets
at step one; final Challenge validation is still pending.

## Engineering outcome reported by the course

After accepting the tickets, the course page revealed `#4471 · closed 05 oct`:

- Parser: **FIXED**, `fix(dates): parse dd/mm for eu locales` — close issue #1 as completed.
- Hint: **WON'T FIX**, `booking-v3 form retired` — close issue #2 as not planned.

Source: <https://hq.mega.dev/challenges/what-it-shows>. No closure clock time or timezone is supplied.
These are reported outcomes, not production patches or regression results supplied in the export.
The new KB page records that distinction. The issue draft files preserve the original submitted snapshots.

## Result and limits

The provided course export has 427 rows representing 412 unique reports merged into source-system ticket #4471.
The executable KB rule separates them into **379 parser** and **33 hint** reports. Intake labels would instead
give 371 and 41 and are not the classification authority. There are 38 disagreements with intake tags.
Five desk-noted one-day-move reports are included once in parser, with an explicit uncertainty note.
They are rule-assigned reports, not five independently confirmed parser reproductions.

The export is dated 4 October 2026; this analysis was reviewed on 28 October 2026 (the student's session date).
Its counts describe the historical export; the later course engineering outcome is separately attributed above.
Source timestamp offsets are preserved.
The biggest merge day, 2 July, has 184 merges and only 2 newly received reports. Merging is a different event
from receipt. All original export files are preserved byte for byte, including the accepted 2024 decision.

## Deliverables

| Path | Purpose |
|---|---|
| `src/routes/kb/incidents/4471-analysis/+page.svx` | Signed KB reassessment and separately sourced engineering outcome; status reviewed |
| `src/lib/kb/analysis.ts` | Count and evidence computations |
| `src/lib/kb/AnalysisDetails.svelte` | Computed checks, uncertainty notes and timeline context |
| `tickets/parser.md` | Full draft GitHub issue: 379 reports |
| `tickets/hint.md` | Full draft GitHub issue: 33 reports |
| `evidence/report-ledger.csv` | Every unique report ID, assigned cause and original timestamps |
| `evidence/audit-summary.json` | Counts, source hashes, duplicate IDs and group membership |
| `evidence/verification.txt` | Successful data checks |
| `evidence/build-verification.json` | Compiler warnings and render checks |
| `rendered/kb/incidents/4471-analysis/index.html` | Actual mdsvex/Svelte-rendered new page |
| `rendered/kb/` and `rendered/index.html` | Static views of the original pages and a local index |
| `scripts/`, `package.json`, `package-lock.json` | Reproducible build, audit and loopback-only preview |

Human attribution remains **`marcengineb · S01E03 · Codex`**. The page's `signature` field contains the exact
start proof issued by the course, as its latest validation message explicitly requires. This signed proof is
intentionally public in that frontmatter and identifies the course participant pseudonymously; it was not part
of the initial 52-file publication approval. It is not copied into issue bodies, comments, evidence or logs.
`RenderStamp` derives **`DR-VTET-EBHA`** from the page's actual signature. The audit reads that frontmatter
instead of hardcoding the human attribution as the signature, and checks the derived reference in the final HTML.
The original KB owner fields and report text belong to the course's support-desk story, not the student.

## Reproduce

Requires Node.js 22.18+ (tested on 26.3.0) and npm. Dependencies are local; there is no global install.

```sh
npm ci --ignore-scripts
npm run build
npm run preview
```

Open <http://127.0.0.1:4173/kb/incidents/4471-analysis/>.
The preview server binds only to 127.0.0.1. It serves the HTML and linked evidence/draft files.
The build uses the actual supplied components, the Svelte compiler and mdsvex; no manual substitute table.
It expands the export's two finite eager `import.meta.glob` patterns at build time.
The page is a static rendered snapshot. The original triage explorer displays its initial computed examples;
its form controls are not hydrated. The new reassessment page has no interactive controls.

The audit verifies that duplicate IDs have identical content before deduplicating, then compares the supplied
classification rule with a separate per-ID implementation using the tenant directory, channel and form version.
Groups must be disjoint, complete and placed. It also checks receipt/merge time ordering using explicit offsets.
New data requires a rebuild and review before updating the public issues, whose bodies are dated snapshots.

## Publication boundary

Only the exercise files listed in the external review manifest are proposed for publication. That includes
the course export's report bodies, fictional tenant names and IDs, the added page, signature, evidence, scripts,
HTML and both issue bodies. Everything in a public GitHub repository, including its issues and commit history,
is visible to anyone and can be copied. The course reads the repository for evaluation.

`node_modules/`, `.build/`, npm cache/logs, local review screenshots and student chat/review notes are excluded.
No account credentials, tokens, OAuth receipts or local absolute paths are intentionally included.
Before any GitHub write, the student must approve the exact repository and the reviewed publication contents.
After approval, use a GitHub noreply commit address rather than adding a personal email to public history.
The student may delete the repository after the course accepts the result; deletion cannot recall copies.

## Technical references

- [Svelte compiler documentation](https://svelte.dev/docs/svelte/svelte-compiler)
- [Svelte server rendering](https://svelte.dev/docs/svelte/svelte-server)
- [mdsvex source and documentation](https://github.com/pngwn/mdsvex)

These references explain the local rendering tools. The findings about reports come from the supplied course
export, not from these external technical references.
