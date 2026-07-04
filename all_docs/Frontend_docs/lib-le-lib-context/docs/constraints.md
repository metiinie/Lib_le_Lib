# Hard Constraints

These are limits, not preferences. If a task seems to require crossing one, stop and
raise it explicitly — don't route around it quietly.

## Data

- No legal name field, anywhere, ever — nickname only.
- No exact GPS coordinates stored or transmitted — region/city only (`regions` table).
- No third-party ad SDKs. No third-party analytics SDK that ties events to a user identity.
- The `chk_profiles_min_age` database constraint (18+) is never removed, bypassed, or
  weakened at the application layer.

## Verification

- Verification documents are reachable **only** through the `verification_officer` role,
  **only** via short-lived signed URLs, **never** through a long-lived link or a public bucket.
- No code outside the `verification/` module reads from the `verification` schema directly.

## Photos & chat

- A photo is never sent unblurred to a client unless an active, non-revoked
  `photo_reveal_grants` row exists for that exact viewer.
- Chat message plaintext is never available server-side. If a feature request implies
  the server needs to read message content (e.g. "auto-moderate chat text"), that's a
  constraint conflict — flag it rather than quietly building something that looks
  server-side but secretly isn't, or vice versa.

## Engineering

- No new dependency added without a one-line justification in the PR — especially
  anything that makes outbound network calls.
- Never break a published API contract (route, request/response shape) without a version
  bump; the mobile app ships on its own release cycle and can't always update in lockstep.
- Stay inside the architecture in `docs/architecture.md` — no new top-level layers, and
  no bypassing the repository pattern "just this once."

## Performance budget (placeholder — tune with real production data post-launch)

- `POST /swipes`: p95 < 200ms.
- Message send-to-delivery: p95 < 1s on a normal connection.
- Discovery feed load: p95 < 500ms.
