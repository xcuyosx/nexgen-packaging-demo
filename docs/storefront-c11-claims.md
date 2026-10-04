# C11 — Home claims

- [x] Existing stat text moved unchanged into src/businessStats.ts.
- [x] SQF tile has an explicit TODO(bradley) for wording, certificate, and scope.
- [x] Home's single h1 was implemented and verified with C6.
- [ ] TODO(bradley): D7 — confirm the five locations, 500k+ square feet, 50+
  machines, and approved SQF wording with supporting evidence.

No claims, figures, or event dates were invented or rewritten. The existing SQF
placeholder still displays and must be resolved before launch. Trade-show changes
are P1 (C17), so have not been started.

Verification: source diff preserves the original four values/labels; final
TypeScript/lint/build checks cover the data extraction. No new test duplicates
this simple static-data change.
