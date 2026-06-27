# Testing & QA

## The pyramid

```
Unit          services & repositories, mocked DB           — fast, run on every save
Integration   API endpoints against a real test Postgres   — run in CI on every PR
E2E (mobile)  Detox or Maestro, critical flows only         — run before merge to main
Security      see below — these are not optional extras
```

## Security & privacy tests (traceable to docs/constraints.md)

| Constraint | Test |
|---|---|
| 18+ floor | Insert a profile with `date_of_birth` less than 18 years ago → expect a database-level rejection, not just a 400 from the API. |
| Blur/reveal | Request a photo with no `photo_reveal_grants` row → expect the blurred asset, never the original, even with a guessed/enumerated storage key. |
| Revoked reveal | Revoke a grant, then immediately re-request the same photo → expect it blurred again. |
| Mutual match | A one-sided like → expect zero rows in `matches`. A reciprocal like → expect exactly one row. |
| Block visibility | Block a user → expect them absent from discovery, swipe targets, and match lists, in both directions. |
| Chat confidentiality | Inspect the `messages` table directly in a test → the `ciphertext` column must not contain recognizable plaintext for any fixture message. |
| Verification isolation | Attempt to read `verification.documents` as a non-`verification_officer` test user → expect a hard denial, not a quietly filtered/empty result (filtering can mask an actual access bug). |

## Community / beta testing

Before any public release: a closed beta with real members of the target community, with
a direct, low-friction feedback channel (Step 10 of the build documentation). Automated
tests catch regressions. They do not catch "this feature is humiliating to use in
practice" — only real users from the actual community surface that, and it matters more
for this app than most.

## CI gate

A PR cannot merge unless:
1. Unit and integration tests pass.
2. The full security test table above passes — not a subset.
3. Any new table or column has a corresponding comment in `lib-le-lib-schema.sql`, not
   just a description in the migration commit message.
