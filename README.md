# TruthCart — The Conversational Shopping Assistant That Doesn't Lie

A beginner-friendly innovation-challenge prototype built with React, TypeScript, and Vite. The project includes 60+ fictional products, fictional policy documents, a deterministic shopping assistant, evidence panels, catalogue CRUD/import/export, policy upload, data-quality checks, and a runnable evaluation lab.

> **Important:** all sample products, brands, prices, stock states, specifications, and policies are fictional demo data. Nothing is connected to a real retailer or live inventory.

## Requirements
- Node.js 20+ and npm
- A modern browser

## Run locally
1. Unzip the project.
2. Open a terminal in the `truthcart` folder.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL Vite prints (normally `http://localhost:5173`).

Build for production with `npm run build`; preview the built site with `npm run preview`.

## Included features
- **Overview:** live counts calculated from local catalogue and policy data.
- **Shopping Assistant:** free-text questions, deterministic retrieval, clarifying prompts for ambiguous product records, missing-field handling, conflict handling, comparisons, basic filters, policy retrieval, and expandable evidence.
- **Product Catalogue:** paginated search, category filter, view/edit/add/delete, CSV and JSON import/export, import preview/validation, duplicate ID and malformed row checks.
- **Policy Centre:** generated fictional returns/refunds, warranty, delivery, cancellations, and exchanges policies. Upload TXT/Markdown and text-based PDF. PDF text extraction errors are surfaced; scanned PDF OCR is not included.
- **Evidence Explorer:** inspect/export evidence entries attached to chat responses.
- **Evaluation Lab:** 30 original generated tests, edit/add/import/export, run all or individual tests, actual output/pass/fail, and metrics based on executed tests.
- **Data Quality:** calculated counts for missing fields, duplicate IDs, conflicting same-name prices, and invalid records; flagged records link to catalogue edit.
- **Admin Settings:** browser-storage and security limitations, backup export, reset.
- **Responsive layout** with desktop sidebar and mobile navigation.

## Persistence and architecture
This version uses **browser `localStorage`** as its persistence layer. It is persistent across reloads in the same browser profile but is not a shared database; clearing site data, switching devices, or using another browser can separate or remove changes. Export a backup from Admin Settings to keep a copy.

The prototype deliberately uses deterministic rules and does not require a paid AI API. It has no server-side backend or retailer API. Natural-language intent recognition is rule-based, so unusual phrasings may be misclassified. The stored catalogue remains the source of truth; uploaded content is parsed as data and never executed as code.

### CSV import format
Recommended columns: `id,name,brand,category,description,price,currency,stock,warranty,delivery,source,updatedAt,specs`.
- `price` may be blank or a non-negative number.
- `stock` should be `in_stock`, `out_of_stock`, or `unknown`.
- `specs` can be a JSON object when importing CSV, for example `"{""ram"":""8 GB""}"` (quote/escape according to CSV rules). JSON import is easier for nested specifications.
- Import adds rows; it does not silently overwrite existing IDs. Duplicate IDs are flagged for review.

## Evaluation metrics
- **Executed tests** are only tests that have been run.
- **Pass rate** = passed executed cases / executed cases.
- **Answerable-question accuracy** = passed executed cases in the defined `price`, `spec`, `stock`, `filter`, and `compare` groups / executed cases in those groups.
- **Correct abstention / missing** = passed executed `missing`, `unsupported`, and `notfound` cases / executed cases in those groups.
- **Ambiguity handling** = passed executed `ambiguous` cases / executed cases in that group.
- **Policy answer correctness** = passed executed `policy` and `unsupported` cases / executed cases in those groups.
- **Product identification** = passed executed `price`, `spec`, `stock`, and `compare` cases / executed cases in those groups.
- **Evidence coverage** = executed tests whose result includes at least one evidence item / all executed tests.
- **Unsupported-claim rate** is a simple prototype heuristic over executed outputs and failures; it is not a calibrated model metric.

These checks are deterministic heuristics, not an independent scientific benchmark. A passing score on fictional seed data does not establish real-world truthfulness. Inspect failed outputs and improve the rules before presenting results.

## Security and deployment limitations
- Admin routes are not protected by authentication; do not use real customer or retailer data.
- `localStorage` is not suitable for multi-user or production data.
- No API keys or secrets are included. There is no AI provider configured, so no key is needed.
- Before production deployment, add a server API, database, authentication/authorization, server-side schema validation, upload size limits, rate limits, audit logs, secure headers, and tests against real approved data/policies.
- Uploaded policy text is treated as untrusted evidence. This is a client-side demo, not a security-reviewed application.

## Project structure
- `src/data.ts` — generated fictional catalogue, policy seed data, and evaluation questions.
- `src/engine.ts` — deterministic retrieval, evidence generation, conflict/missing checks, and test runner.
- `src/App.tsx` — application UI, CRUD, imports, exports, policy parsing, persistence, evaluation, dashboard.
- `src/styles.css` — responsive UI styles.

## Reset / export
- Use **Admin Settings → Export full backup** to export products, policies, and tests.
- Use **Reset demo** in the top bar to restore original demo data. This overwrites local changes.
