# Architecture

## 1. System shape

```
Expo app (React Native)
   │  REST/JSON over HTTPS
   ▼
NestJS API  ── auth, profiles, discovery, matching, chat, safety, admin
   │
   ├── PostgreSQL — public schema (users, profiles, matches, messages, reports...)
   ├── PostgreSQL — verification schema (isolated: documents, liveness, telehealth)
   ├── Object storage (S3-compatible + KMS) — photos, verification docs
   └── Push (FCM/APNs) — generic payloads only
```

The mobile app never talks to Postgres or object storage directly. Every read and write
goes through the NestJS API — including photo and document uploads, where the API issues
short-lived signed upload/download URLs and the client never holds long-lived storage
credentials.

## 2. Layering (every backend module)

```
controller   → HTTP only: parse request, call service, shape response
service      → business logic lives here, and only here
repository   → the only layer that talks to the database
```

Rule: **no business logic in controllers, no SQL outside repositories.**

## 3. Module boundaries

- `auth/`, `users/`, `profiles/`, `photos/`, `discovery/`, `matches/`, `messages/`,
  `safety/`, `resources/`, `qa/`, `subscriptions/` — standard modules, standard layering.
- `verification/` — **its own NestJS module backed by its own database schema**
  (`verification.*` in `lib-le-lib-schema.sql`). No other module imports from
  `verification/` directly — it's reached only through a narrow `VerificationService`
  interface. The schema-level isolation only matters if the code respects it too.

## 4. Mobile folder structure

```
app/                 # Expo Router screens
src/
  components/         # reusable UI, no business logic
  hooks/              # useAuth, useDiscovery, useChat, etc.
  services/           # API client functions — the ONLY place fetch is called
  state/              # Zustand stores (local/UI state only)
  crypto/             # E2E encrypt/decrypt — isolated, heavily tested, rarely touched
```

Rule: a screen component should read as "fetch via a hook → render." If a screen is
doing parsing, encryption, or business logic inline, that logic belongs in `services/`,
`crypto/`, or a hook — not in the component body.

## 5. The three flows worth drawing explicitly

**Verification** — client uploads → API issues a signed URL → client uploads directly to
the isolated bucket → API creates a `verification.verification_records` row
(`status = submitted`) → a Verification Officer reviews via a signed read URL → decision
written → an `audit_logs` row written in the same transaction.

**Blur/reveal** — every photo read goes through the API, never a public URL. The API
checks for an active row in `photo_reveal_grants` for (photo, viewer); if none exists it
returns the blurred asset; if one exists and isn't revoked, it returns the original.

**Chat** — the message body is encrypted **on-device** before it ever reaches the API.
The API stores `ciphertext` / `nonce` and routes delivery; it cannot decrypt messages and
should never be given a reason to.
