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
