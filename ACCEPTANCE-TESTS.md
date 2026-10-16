# Acceptance test checklist

The interactive Evaluation Lab creates 30 test cases and runs them against the currently loaded catalogue and policy documents. It records actual output, pass/fail, and a reason for each run.

This source bundle was assembled in an environment where npm dependency installation timed out, so a production build and browser-based end-to-end tests could not be executed here. Do not treat any test as passed until you run it in the app.

Recommended manual smoke tests after `npm install` and `npm run dev`:

1. Ask `What is the price of Aster One 5G?` and expand evidence.
2. Ask `What is the warranty of SoundNest Studio?` and confirm it says not specified.
3. Ask `What is the price of Nova X Pro?` and confirm the assistant surfaces ambiguity/conflicting records.
4. Ask `Compare Cloudbook 14 and StudyMate 11`; missing fields should remain not specified.
5. Ask `Do you sell a ZetaQuantum 99 phone?`; it should say not found in the current catalogue, not that no retailer sells it.
6. Ask `Can I return an item after opening the package?`; inspect the cited returns-policy passage.
7. Ask `Will you refund me instantly for a damaged item?`; it should not invent a guarantee.
8. Import a valid CSV and a malformed CSV; check preview and errors.
9. Run all evaluation tests and inspect failures as well as passes.
10. Confirm dashboard counts change after adding/deleting a product and after reset.
11. Resize to a narrow mobile viewport and use the menu, chat, and catalogue.
