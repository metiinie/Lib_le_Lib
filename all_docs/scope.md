# Scope of Work

Write one of these per task, before starting it. A missing scope card is the most common
reason an AI coding agent "helpfully" refactors three unrelated modules while fixing one bug.

## Template

```
# Scope: <task name>

✓ in:  <files/modules this task touches>
✗ out: <adjacent things it must NOT touch>

Done when: <the specific, checkable condition — not "it works">
```

## Worked example

```
# Scope: Verification submission flow (mobile)

✓ in:  app/(onboarding)/verify.tsx, src/services/verification.ts,
       src/hooks/useVerificationStatus.ts
✗ out: Reviewer dashboard (backend), liveness-check ML, telehealth
       partner integration — all separate tasks

Done when: a user can submit a document + selfie, see a pending
state, and see approved/rejected with a reason, against the real
API (not a mock).
```

## Worked example

```
# Scope: Blur/reveal on profile photos

✓ in:  photos table reads, photo_reveal_grants create/revoke
       endpoints, the blurred-vs-original image serving logic
✗ out: chat photo attachments (separate table, separate task) —
       don't unify them just because the logic looks similar

Done when: an ungranted viewer can never receive the unblurred
asset, even by guessing the storage key (test this — don't assume it).
```

## Why this matters more here than on a typical app

Almost every module in this codebase touches sensitive data in some way. "While I was in
there, I also..." is the exact failure mode that turns a one-file bug fix into an
accidental new data-exposure surface. The scope card is the guardrail against that.

---

## Active Scope: Phase 1 — Auth & Core Identity

```
# Scope: Phase 1 — Auth & Core Identity

✓ in:  src/auth/*, src/users/*, src/devices/*
✗ out: profiles, photos, verification, discovery, matches, messaging, safety, admin panel, subscriptions

Done when:
1. Users can request an OTP via phone/email, which hashes and writes to `otp_codes` table.
2. Users can verify the OTP, which creates/finds the `users` row and issues access + refresh JWT.
3. Access token refresh/rotation endpoint works.
4. Users can register their device's push token and E2E public key in `devices` table.
5. Guard implementation (`JwtAuthGuard`, `RolesGuard`) protects routes based on roles.
6. Automated integration tests pass for OTP rate-limiting, token rejection, and expiry.
```
✅ COMPLETED

---

## Active Scope: Phase 2 — Profiles & Photos

```
# Scope: Phase 2 — Profiles & Photos

✓ in:  src/profiles/*, src/photos/*, test/profiles-photos.e2e-spec.ts
✗ out: verification, discovery, matches, messaging, safety, admin, subscriptions

Done when:
1. GET /profiles/me, POST /profiles/me, PATCH /profiles/me all work end-to-end against real DB.
2. GET /regions and GET /interest-tags return seeded data.
3. POST /photos/upload-url returns a valid presigned PUT URL.
4. POST /photos registers a photo row with blurred_default = true.
5. GET /photos/:id returns blurred URL for ungranted viewer, original URL for granted viewer.
6. POST /photos/:id/reveal-grants grants, DELETE revokes.
7. Automated e2e tests prove: Blur/reveal, Revoked reveal, non-owner grant rejection, underage rejection.
```

## Active Scope: Phase 3 — Verification

```
# Scope: Phase 3 — Verification

✓ in:  src/verification/*, test/verification.e2e-spec.ts
✗ out: Auth, Profiles, Photos, matching, etc.

Done when:
1. submit -> review -> decide works end to end via API.
2. verification_officer role gate explicitly denies (403) non-officer requests.
3. Isolated S3 credentials are used for storage.
4. Audit logs are written atomically via transaction upon decision.
5. Automated test proves role isolation.
```
✅ COMPLETED
