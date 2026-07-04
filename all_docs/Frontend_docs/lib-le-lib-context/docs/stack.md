# Stack & Versions (pinned)

Confirm these against `npm ls` / `expo --version` at scaffold time. This list reflects
what's current as of mid-2026 — the JS/RN ecosystem moves fast, and the AI should defer
to what's actually installed in the repo over what's written here if the two disagree.

## Frontend — Expo app

```
expo                    56.x        (bundles React Native 0.85.x, React 19.2.x)
typescript               6.0.x
expo-router               (bundled with SDK 56)
@tanstack/react-query     5.x       — server state / caching
zustand                   5.x       — local UI state (discreet mode, draft profile, etc.)
expo-camera, expo-image-picker, expo-document-picker
                                    — verification document + selfie capture, profile photos
matrix-js-sdk + Olm/Megolm          — end-to-end encrypted chat
                                       (a libsignal-based alternative is acceptable if
                                       evaluated first — don't switch mid-project without
                                       updating this file)
```

## Backend — API

```
node                     24.x LTS
@nestjs/core              11.x      (v12 is in beta as of mid-2026 — do not adopt until
                                      it reaches stable and this file is updated)
typescript                6.0.x
postgresql                 16+ (18.x recommended for new deployments;
                                 the reference schema was validated against 16)
```

## Infrastructure

```
Object storage     S3-compatible + KMS-managed encryption
                    (isolated bucket for verification docs, separate from profile photos)
Push notifications  FCM (Android) / APNs (iOS) — generic payloads only, see constraints.md
```

## Deliberately not in this stack (yet)

The Tinder/Bumble-scale reference stack (Cassandra, Kafka, Elasticsearch, Kubernetes,
Redis-backed match caching) solves problems — billions of swipes a day, global
geosharding — that this app does not have at MVP stage. A single well-indexed Postgres
instance handles the data model in `lib-le-lib-schema.sql` comfortably for a long time.
Revisit this file if and when real load numbers say otherwise — don't pre-adopt
infrastructure complexity for a scale that hasn't arrived.

## Why pinned, not "latest"

An AI agent told to "use the latest version" will hallucinate APIs from whatever it last
trained on. Pin exact majors here; bump deliberately, one version at a time, after
reading that version's changelog.
