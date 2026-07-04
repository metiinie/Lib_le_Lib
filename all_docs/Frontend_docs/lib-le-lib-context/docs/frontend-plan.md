# Frontend Development Plan
## Lib le Lib — Expo (React Native) Client

This document is the frontend counterpart to `docs/backend-plan.md`.
Read alongside `docs/architecture.md` (mobile folder structure, service-layer rules),
`docs/stack.md` (pinned versions), and `docs/constraints.md` (the hard limits that
affect UI code just as much as backend code).

---

## Decisions made upfront

These are locked before Phase 0 begins. Revisit only by updating this file and
`docs/stack.md` together.

| Decision | Choice | Reason |
|---|---|---|
| SDK | **Expo SDK 56** (stable, May 21 2026) | Ships RN 0.85, React 19.2, Hermes v1 by default, New Architecture on by default |
| Navigation | **Expo Router v4** (file-based, bundled with SDK 56) | SDK 56 decoupled it from React Navigation; file-based routing matches backend's REST resource naming |
| Server state | **TanStack Query v5** | Caching, background refetch, optimistic updates for likes/swipes |
| Local/UI state | **Zustand v5** | Discreet mode, draft profile, E2E key store, notification preferences |
| Forms | **React Hook Form + Zod** | Validation schemas shared with backend DTOs; critical for DOB age gate |
| Animations | **React Native Reanimated v4** (New Arch-first) | Swipe gesture, blur/reveal crossfade, photo animations |
| Gestures | **React Native Gesture Handler v2** | Required peer of Reanimated; swipe cards |
| Images | **expo-image** | Built-in blurhash support — the blur placeholder maps directly onto the blur/reveal mechanic |
| E2E chat | **matrix-js-sdk + Olm/Megolm** | Genuine device-level encryption; server stores only ciphertext |
| Push | **expo-notifications** | Generic payloads only — see constraints.md |
| Camera/docs | **expo-camera + expo-document-picker** | Verification document capture + selfie liveness |
| Secure storage | **expo-secure-store** | JWT tokens, E2E private keys |
| Subscriptions | **expo-in-app-purchases** or **react-native-iap** | Decide at Phase 7; App Store/Play Store policy compliance required |

---

## Folder structure (inside `src/`)

```
app/                          ← Expo Router file-based screens
  (auth)/
    welcome.tsx               ← splash + CTA
    otp.tsx                   ← phone/email OTP entry + verify
  (onboarding)/
    profile-create.tsx
    doc-upload.tsx            ← document + selfie capture
    liveness.tsx
    pending.tsx               ← read-only blurred browsing while in review
    rejected.tsx              ← reason + resubmit CTA
  (tabs)/
    discover.tsx              ← browse + swipe/grid
    matches.tsx               ← match list
    support.tsx               ← resource library home
    profile.tsx               ← my profile view
  profiles/[id].tsx           ← view any profile
  quiz/index.tsx
  chat/[matchId].tsx
  reveal/[photoId].tsx        ← photo blur → reveal consent flow
  video-call/[matchId].tsx    ← pre-meetup video metadata
  resources/[id].tsx
  qa/thread.tsx
  stories/index.tsx
  settings/
    index.tsx                 ← discreet mode, notifications
    subscription.tsx
    account.tsx               ← delete account (full, not deactivate)
  modals/
    report-[userId].tsx
    meetup-safety.tsx

src/
  components/
    ui/                       ← atoms: Button, Input, Avatar, Badge, Tag
    photos/
      BlurredPhoto.tsx        ← the core blur/reveal component — see Phase 2
      PhotoRevealPrompt.tsx
      PhotoGrid.tsx
    profiles/
      ProfileCard.tsx
      ProfileDetail.tsx
    chat/
      MessageBubble.tsx
      ChatInput.tsx
      AttachmentPreview.tsx
    discovery/
      SwipeCard.tsx
      FilterSheet.tsx
    verification/
      DocumentUploadStep.tsx
      SelfieStep.tsx
      VerificationStatus.tsx
    safety/
      ReportSheet.tsx
      MeetupSafetyChecklist.tsx
    common/
      DiscreetBanner.tsx      ← shown when discreet mode is on
      LowBandwidthBanner.tsx
      OfflineNotice.tsx

  hooks/
    useAuth.ts                ← session, OTP flow
    useVerificationStatus.ts
    useProfile.ts
    useDiscovery.ts
    useMatches.ts
    useChat.ts                ← wraps matrix-js-sdk
    useChatEncryption.ts      ← key management, device registration
    usePhotoReveal.ts         ← grant/revoke logic
    useBlur.ts                ← blurhash generation + reveal animation
    useDiscreetMode.ts
    useSubscription.ts

  services/                   ← the ONLY place fetch is called (architecture.md)
    auth.service.ts
    verification.service.ts
    profile.service.ts
    photo.service.ts
    discovery.service.ts
    match.service.ts
    message.service.ts
    safety.service.ts
    resource.service.ts
    qa.service.ts
    subscription.service.ts

  crypto/
    keys.ts                   ← Olm/Megolm key generation, storage in SecureStore
    encrypt.ts
    decrypt.ts
    deviceRegistration.ts

  state/
    auth.store.ts             ← JWT tokens (SecureStore-backed Zustand)
    discreet.store.ts
    draftProfile.store.ts
    notifications.store.ts

  lib/
    api.ts                    ← axios/fetch base client, token injection, refresh
    queryClient.ts            ← TanStack Query global client + defaults
    zod-schemas.ts            ← shared Zod schemas (DOB age gate lives here)
    push.ts                   ← notification registration + discreet payload guard
```

---

## The blur/reveal mechanic — built once, used everywhere

This is the most important UI component in the app and needs to be built once,
correctly, in Phase 2, and never duplicated.

```
<BlurredPhoto
  photoId="..."
  matchId="..."          ← undefined = not yet matched; always blurred
  blurhash="..."         ← from API response; shown while loading and when blurred
  revealGranted={bool}   ← from photo_reveal_grants via usePhotoReveal()
  onRevealRequest={fn}   ← opens PhotoRevealPrompt sheet
/>
```

Behaviour:
- If `revealGranted = false`, always show the blurhash placeholder via `expo-image`.
  Never load the full asset URL, even into memory — the URL is never sent by the
  API unless a grant exists.
- If `revealGranted = true`, crossfade from the blurhash to the full asset using
  Reanimated v4's `withTiming`.
- Revoking a grant re-blurs immediately — no cache of the unblurred image is kept
  past the in-memory lifetime of the component.
- The same component is used for profile photos, chat attachment previews, and
  success-story thumbnails. Do not fork it.

---

## Phase 0 — Project scaffold & tooling
**Duration: 2–3 days**

- [ ] `npx create-expo-app@latest lib-le-lib --template blank-typescript` on SDK 56
- [ ] Install all packages listed in the Decisions table above in one go — avoid
      incremental installs that lead to peer-dep conflicts
- [ ] Set up EAS Build profile (development, preview, production) — do this now,
      not after the first crash report
- [ ] Absolute imports via `tsconfig.json` `paths` — `@/components`, `@/services`,
      `@/hooks`, `@/crypto`, `@/state`, `@/lib`
- [ ] ESLint + Prettier, matching `docs/conventions.md`
- [ ] GitHub Actions CI: `expo-doctor`, TypeScript check, ESLint, Jest unit tests
      on every PR
- [ ] `app.json`: `bundleIdentifier`, `package`, `icon`, and — critically —
      a **discreet app name** (not "Lib le Lib" literally if the team decides the
      home-screen name should be less identifiable, per constraints.md)
- [ ] `expo-notifications` config plugin wired — confirm push payloads are
      generic before submitting to any store

**Done when:** `npx expo start` renders a blank screen on both platforms, EAS
development build installs on a real device, and CI is green.

---

## Phase 1 — Auth screens
**Duration: 1 week** · Screens: `(auth)/welcome`, `(auth)/otp`

- [ ] Welcome screen: app name/tagline, "Get started" CTA — no HIV-related language
      on the splash (app-store policy)
- [ ] OTP flow: phone or email input → 6-digit code entry → verify against
      `POST /auth/otp/verify` → JWT stored in SecureStore via `auth.store.ts`
- [ ] Route guard: `useAuth` redirects unauthenticated users to `(auth)/welcome`
      and verified members past the onboarding stack
- [ ] `useAuth` hook: reads JWT, calls refresh when needed, exposes `signOut`
- [ ] Tests: OTP timer, resend throttle, incorrect code error state, token
      persistence across app restart

**Done when:** A real phone number receives a code, enters it, and the app
navigates to the onboarding stack with a valid JWT in SecureStore.

---

## Phase 2 — Onboarding & profile creation
**Duration: 1.5 weeks** · Screens: `(onboarding)/profile-create`, `doc-upload`,
`liveness`, `pending`, `rejected`

- [ ] `profile-create`: nickname, DOB (date picker), gender, region picker,
      relationship goals (multi-select), bio — Zod schema with 18+ age gate on
      DOB, matching the DB constraint
- [ ] `doc-upload`: `expo-camera` + `expo-document-picker` for document capture;
      guidance overlay ("cover patient ID number if preferred"); upload via
      signed URL from `POST /photos/upload-url` to the verification bucket
- [ ] `liveness`: selfie capture with the camera; submit alongside the document
- [ ] `pending`: read-only browse with all photos blurred; polls
      `GET /verification/me/status` — this is when `BlurredPhoto` first ships
- [ ] `rejected`: structured rejection reason + resubmit CTA
- [ ] Build `BlurredPhoto` (see above) here — it's needed for `pending` and
      everything after it
- [ ] Tests: 18+ Zod gate rejects correctly; `BlurredPhoto` never loads a full
      asset when `revealGranted = false`

**Done when:** A test user completes onboarding end-to-end on a real device,
submits a document, sees the pending state with blurred browse, and the
`BlurredPhoto` automated test passes the constraints.md blur test.

---

## Phase 3 — Discovery & matching
**Duration: 1 week** · Screens: `(tabs)/discover`, `profiles/[id]`,
`(tabs)/matches`, `quiz/index`

- [ ] Discovery browse: grid layout (intentional choice over gamified swipe cards
      per product principle "dating not gamified"); filter sheet for age, gender,
      region, relationship goal
- [ ] Profile detail: `BlurredPhoto` grid, bio, interests, goals, like/pass action
- [ ] Like → mutual-match push notification (generic wording: "You have a new
      connection" — not HIV-adjacent language in the push payload)
- [ ] Match list: avatars, last-message preview (encrypted — show "New message",
      not the plaintext, until the screen is open and decrypted on-device)
- [ ] Compatibility quiz: question by question, scrollable, saves to API
- [ ] Tests: block exclusion — a blocked user must not appear in discovery or the
      match list; write this as an automated test, not a manual check

**Done when:** Two test accounts like each other, a match is created (by the DB
trigger, not the client), and the match appears in both lists within one
background-refetch cycle.

---

## Phase 4 — Chat & messaging
**Duration: 2 weeks** · Screens: `chat/[matchId]`, `reveal/[photoId]`,
`video-call/[matchId]`
**Most technically involved phase — do not compress the timeline.**

- [ ] Olm/Megolm session setup: `useChatEncryption` generates device keys on first
      launch, stores them in SecureStore, registers the public key with the API
      (`POST /devices`)
- [ ] Per-match Olm session: fetch the match partner's public key, establish an
      Olm session, encrypt outgoing messages, decrypt incoming
- [ ] `chat/[matchId]`: message list (FlatList, inverted), `ChatInput`, send/receive
      via WebSocket (or polling fallback)
- [ ] `MessageBubble`: text or image attachment; blurred by default for attachments;
      decrypt on render, not in the message list query
- [ ] `reveal/[photoId]`: consent screen — "Share this photo with [nickname]?" →
      calls `POST /photos/:id/reveal-grants`; revoke option always visible to sender
- [ ] Photo sharing in chat: same `BlurredPhoto` + `PhotoRevealPrompt` flow, reused
      from Phase 2
- [ ] `video-call/[matchId]`: metadata only (schedule, confirm, cancel) — no video
      infrastructure in MVP; Phase 3 product feature
- [ ] Read receipts suppressed when `discreet_mode = true`
- [ ] Tests: the Chat confidentiality test from `testing.md` — inspect the stored
      `ciphertext` and assert no plaintext is recoverable without the device key

**Done when:** Two real devices exchange an encrypted message, the network tab
shows only ciphertext in transit, and the automated test passes.

---

## Phase 5 — Safety & reporting
**Duration: 1 week** · Screens: `modals/report-[userId]`,
`modals/meetup-safety`, in-chat block/report

- [ ] Block flow: swipe-to-reveal or 3-dot menu → "Block [nickname]" →
      `POST /blocks` → user immediately disappears from discovery + chat list
      (optimistic update, then confirmed by invalidating the discovery query cache)
- [ ] Report sheet: structured reason categories (matching the DB enum exactly),
      optional description, optional photo attachment
- [ ] Meetup safety checklist: pre-meetup prompt when a user taps "Plan to meet"
      in a chat — not a gate, but a surfaced reminder with external share CTA
- [ ] Discreet mode toggle (in settings): hides activity status, suppresses read
      receipts, uses the generic push payload — no new UI change beyond what
      toggles a flag on the profile and in `discreet.store.ts`
- [ ] Tests: block visibility — after blocking, run the discovery and match queries
      and assert the blocked user is absent in both directions

**Done when:** A blocked user is invisible to the blocker and vice versa, across
discovery and matches, confirmed by automated test.

---

## Phase 6 — Support content & wellbeing
**Duration: 1 week** · Screens: `(tabs)/support`, `resources/[id]`,
`qa/thread`, `stories/index`

- [ ] Resource library: category filter (treatment info, U=U, hotlines, general),
      language filter (Amharic / English), markdown rendered via `react-native-markdown-display`
- [ ] `resources/[id]`: article detail, share button (plain text share, no
      app-identifying metadata in the share payload)
- [ ] `qa/thread`: anonymous message thread with a health professional; polling
      for new replies; no typing indicators (keeps complexity low in MVP)
- [ ] `stories/index`: anonymized success stories; no identifying information
      ever visible; no link back to any user account
- [ ] Low-bandwidth mode: when toggled, `BlurredPhoto` loads only the blurhash
      permanently (no reveal prompts, no full image loads); resource articles load
      text only with no embedded images

**Done when:** An Amharic article displays correctly, a Q&A message sends and
receives a reply, and low-bandwidth mode verifiably suppresses all image loads.

---

## Phase 7 — Profile management & subscription
**Duration: 1 week** · Screens: `profile/edit`, `settings/index`,
`settings/subscription`, `settings/account`

- [ ] Profile edit: all fields from Phase 2, plus photo management (add/remove/reorder,
      primary photo selection)
- [ ] Settings — discreet mode, notifications, language, low-bandwidth mode
- [ ] Subscription screen: plan comparison (free vs premium), in-app purchase,
      restore purchases
- [ ] Account deletion: full, permanent, not deactivation — requires confirmation
      step; calls `DELETE /users/me` which cascades per the schema; shows a plain
      confirmation of what will be deleted before proceeding
- [ ] Re-verification reminder: when `verification_records.expiry_date` is
      approaching, surface a non-blocking banner (not a gate) with a CTA to
      `(onboarding)/doc-upload`

**Done when:** A test user completes a subscription purchase, restores it, edits
their profile, and fully deletes their account with all data gone on the API side.

---

## Phase 8 — Polish, accessibility & QA
**Duration: 1 week**

- [ ] Accessibility pass: `accessibilityLabel` on every interactive element,
      focus order correct, minimum 44×44pt touch targets throughout
- [ ] Low-bandwidth mode: audit every screen for images that bypass the flag
- [ ] Offline notice: graceful degradation for no-network state (chat queue,
      pending swipes)
- [ ] App icon variants: if a discreet alternate icon is decided, implement via
      `expo-dynamic-app-icon`
- [ ] Full security test table from `testing.md` — every row automated and green
- [ ] Performance: FlatList `getItemLayout` on the chat screen, `removeClippedSubviews`
      on discovery grid; check startup time with Hermes v1 (should be fast by default
      in SDK 56)
- [ ] Detox or Maestro E2E: the four critical flows — sign up, verify, match,
      send message

**Done when:** Every row of the `testing.md` security table is green in CI,
all touch targets pass the 44pt minimum, and the E2E tests pass on both
platforms.

---

## Phase 9 — App store preparation & submission
**Duration: 3–4 days**

- [ ] App Store Connect + Google Play Console accounts ready
- [ ] Screenshots for all required sizes (use EAS Build + Detox screenshots)
- [ ] Privacy Nutrition Labels (Apple) and Data Safety form (Google): HIV status
      is sensitive health data — disclose it correctly; legal review required here
- [ ] Age rating: the app must be rated 17+ (Adult/Mature) for a dating app
- [ ] Review notes for Apple: explain the medical-verification requirement and the
      target community; apps for medical communities sometimes get extra scrutiny
- [ ] EAS Submit for both stores

**Done when:** Both builds are in review on their respective stores.

---

## Timeline summary

| Phase | Duration | Can run in parallel with |
|---|---|---|
| 0 — Scaffold | 2–3 days | Backend Phase 0 |
| 1 — Auth | 1 week | Backend Phase 1 |
| 2 — Onboarding | 1.5 weeks | Backend Phase 3 |
| 3 — Discovery & matching | 1 week | Backend Phase 4 |
| 4 — Chat | 2 weeks | Backend Phase 5–6 |
| 5 — Safety | 1 week | Backend Phase 6 |
| 6 — Support content | 1 week | Backend Phase 7 |
| 7 — Profile & subscription | 1 week | Backend Phase 7 |
| 8 — Polish & QA | 1 week | — |
| 9 — App store prep | 3–4 days | — |

**Solo frontend engineer:** ~10–11 weeks, sequential.
**Frontend + backend pair:** Frontend can start ~1 week after backend Phase 0 and
run roughly one phase behind; total wall-clock time ~8–9 weeks to both being
store-ready simultaneously.

---

## App store–specific notes (SDK 56)

- Expo SDK 56 raises minimum iOS to **16.4** (drops iPhone 7 and first-gen SE).
  Confirm this is acceptable for your target market before starting.
- **Expo Go is currently unavailable on the App Store** (see "Expo Go and the App
  Store in May 2026" post) — use EAS development builds exclusively for testing.
  This is already the right practice for an app with native modules like SecureStore
  and expo-camera.
- The privacy-manifest requirement (Apple) and the Data Safety section (Google) for
  an app that handles HIV status as health data need legal review — build that into
  the Phase 9 timeline, not as an afterthought.

---

## Deliberately deferred

- Live video calling (infrastructure, not just metadata scheduling) → Phase 3 product
- Telehealth-partner verification deep link → Phase 2 product
- Web/PWA version → not in scope for v1
- Amharic UI strings: translation strings are stubbed in Phase 0 using
  `i18n-js`; actual Amharic translations delivered before Phase 6 (support tab)
  because that content is most likely to need it first
