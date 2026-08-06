# Lib le Lib — 6 Modifications
> Analysed, shaped, and implemented with the Lib le Lib colour system
>
> **Colour system:** Primary `#1B4D5C` · Accent `#2A6B80` · Teal `#4A9B7F` · Sand `#D4784F` · Off-white `#F8F5F0` · Dark `#0F1E24`

---

## Table of Contents

| # | Modification | Status |
|---|---|---|
| 1 | [Auth Flow](#1-auth-flow) | 📋 Tracked |
| 2 | [Discover UI](#2-discover-ui) | 📋 Tracked |
| 3 | [Premium Logic](#3-premium-logic) | 📋 Tracked |
| 4 | [Likes Rename](#4-likes-rename) | 📋 Tracked |
| 5 | [Chat UI](#5-chat-ui) | 📋 Tracked |
| 6 | [Registration](#6-registration) | 📋 Tracked |

---

## Ground Rules for All Modifications

> [!IMPORTANT]
> **Addition-first policy.** All modifications ADD to the existing system unless explicitly stated as a replacement below. New columns are additive. New screens are additive. Only where the spec clearly says "remove and replace" does existing logic change.

> [!NOTE]
> **Photo privacy rule (project-wide).** Photos are **unblurred by default** for verified members. The `revealGranted={true}` logic in `BlurredPhoto` components is the correct baseline. Do **not** introduce blur-by-default anywhere in these modifications.

---

## 1. Auth Flow

### What this is

The current auth flow sends an OTP on every login. This modification replaces that with a split **Register / Login** architecture where:
- **OTP is sent only once** — at registration, to verify the phone number permanently.
- **All subsequent logins** use phone + password (or SSO).
- A **Forgot Password** flow, **1-week auto-logout**, and **Apple / Google / Phone SSO** are added.

### What is REMOVED (replacement, not addition)

| Removed item | Location | Reason |
|---|---|---|
| `"Get Started"` single CTA on welcome | `(auth)/welcome.tsx` L27 | Replaced by Register / Login two-button layout |
| OTP-on-every-login flow | `(auth)/otp.tsx` entire file | Login now uses phone + password |
| Single `(auth)/otp.tsx` unified screen | `(auth)/otp.tsx` | Split into `register-phone.tsx` + `verify-otp.tsx` + `set-password.tsx` |
| `authService.requestOtp()` / `authService.verifyOtp()` called at login | `services/auth.service.ts` | Login calls `authService.login()` instead |

> [!WARNING]
> The backend `POST /auth/otp/request` and `POST /auth/otp/verify` endpoints are **kept** — they are reused in the registration flow. Only the frontend routing changes so that login no longer calls them.

### What is ADDED

#### Frontend — New Screens

| Screen | Path | Purpose |
|---|---|---|
| **Welcome** (updated) | `(auth)/welcome.tsx` | Tagline + two buttons: Register / Login |
| **Login** | `(auth)/login.tsx` | NEW — Apple / Google / Phone SSO options |
| **Login with Phone** | `(auth)/login-phone.tsx` | NEW — phone + password; reached from "Continue with Phone" |
| **Register — Enter Phone** | `(auth)/register-phone.tsx` | NEW — step 1; triggers OTP SMS |
| **Register — Verify OTP** | `(auth)/verify-otp.tsx` | NEW — step 2; 6-digit; 3-attempt max; 10-min expiry; one-time only |
| **Register — Set Password** | `(auth)/set-password.tsx` | NEW — step 3; min 8 chars, 1 number, 1 symbol; confirm field |
| **Forgot Password** | `(auth)/forgot-password.tsx` | NEW — phone input → SMS reset link; no re-OTP needed |

#### Frontend — Updated Files

| File | Change |
|---|---|
| `(auth)/welcome.tsx` | Replace single `"Get Started"` button with `Register` + `Login` buttons + app tagline |
| `services/auth.service.ts` | Add `login()`, `registerWithPhone()`, `setPassword()`, `forgotPassword()`, `resetPassword()`, `loginWithApple()`, `loginWithGoogle()` |
| `hooks/useAuth.ts` | Add `signInWithPassword()`, `signInWithSSO()`, `requestPasswordReset()` alongside existing `signIn()` |
| `state/auth.store.ts` | No shape change — refresh token 7-day expiry enforced by backend |

#### Backend — Additive Changes

| File | Change |
|---|---|
| `auth/auth.controller.ts` | Add `POST /auth/login`, `POST /auth/sso/apple`, `POST /auth/sso/google`, `POST /auth/password/forgot`, `POST /auth/password/reset` |
| `auth/auth.service.ts` | Add `loginWithPassword()`, `loginWithApple()`, `loginWithGoogle()`, `forgotPassword()`, `resetPassword()` |
| `auth/dto/` | Add `LoginDto`, `SsoDto`, `ForgotPasswordDto`, `ResetPasswordDto` |
| `auth/strategies/` | Add `AppleStrategy`, `GoogleStrategy` (Passport.js) |

#### Database — Additive Columns Only

```sql
-- ADD to existing users table (no existing column removed)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sso_provider       TEXT,         -- 'apple' | 'google' | null
  ADD COLUMN IF NOT EXISTS sso_subject        TEXT,         -- provider's user ID
  ADD COLUMN IF NOT EXISTS phone_verified_at  TIMESTAMPTZ;  -- set once on first OTP verify, never reset
-- NOTE: password_hash already exists as nullable.
-- Registration flow now requires it to be set at step 3 (Set Password).
-- Legacy OTP-only rows (password_hash = NULL) must be prompted to set a password at next login.
```

### Screen Specification

#### Welcome Screen (updated)

```
┌─────────────────────────────────────┐
│                                     │
│         Lib le Lib                  │  <- text-4xl, #0F1E24 / white
│   Where love meets the soul         │  <- text-base, #4A7A8A
│                                     │
│  A trusted, verified space for      │  <- text-sm, #4A7A8A
│  meaningful connections.            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Register            │    │  <- bg-[#1B4D5C], text-white
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │           Login             │    │  <- border-[#1B4D5C], text-[#1B4D5C]
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### Login Screen — `(auth)/login.tsx` (new)

```
┌─────────────────────────────────────┐
│  Login                              │
│                                     │
│  ┌─ Apple Continue with Apple ─────┐ │  <- bg-black, text-white, full-width
│  └────────────────────────────────┘ │
│  ┌─ G  Continue with Google ───────┐ │  <- bg-white, border, text-#0F1E24, full-width
│  └────────────────────────────────┘ │
│  ┌─ Phone Continue with Phone ─────┐ │  <- bg-[#1B4D5C], text-white, full-width
│  └────────────────────────────────┘ │
│         (navigates to next page)    │
└─────────────────────────────────────┘
```

#### Login with Phone — `(auth)/login-phone.tsx` (new — separate page)

```
┌─────────────────────────────────────┐
│  <-  Login with Phone               │
│                                     │
│  Phone number                       │
│  ┌─────────────────────────────────┐ │
│  │  +251 9__ ___ ____              │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Password                           │
│  ┌─────────────────────────────────┐ │
│  │  ........                       │ │
│  └─────────────────────────────────┘ │
│                                     │
│         Forgot password?            │  <- link -> forgot-password.tsx
│                                     │
│  ┌─────────────────────────────────┐ │
│  │            Login                │ │  <- bg-[#1B4D5C]
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Register Flow — One Field Per Page

Each step = its own full screen with back arrow, step indicator dots, single "Continue ->" CTA at bottom.

```
Step 1  register-phone.tsx   ->  Enter phone number (OTP SMS sent)
Step 2  verify-otp.tsx       ->  Enter 6-digit OTP [3 attempts / 10-min expiry]
Step 3  set-password.tsx     ->  Set password + confirm [>=8 chars, 1 number, 1 symbol]
Step 4+                      ->  Profile forms (see Mod 6 -- each field = one page)
...                          ->  Document verification upload
...  pending.tsx             ->  Pending -> on approval -> main app
```

### Session & Auto-Logout Logic

| Token | Expiry |
|---|---|
| JWT access token | 15 minutes |
| Refresh token | 7 days of inactivity |

- 7 days without opening the app -> refresh token expires -> forced to `(auth)/login.tsx` (phone + password, no OTP).
- SSO path: SSO auth -> new user -> OTP phone verify -> profile forms -> docs. Existing user -> straight in.
- Forgot Password: SMS reset link to verified phone. No re-OTP (phone already verified).

### Apple SSO Compliance Note

Apple requires "Sign in with Apple" whenever any third-party login is offered. This app includes it — compliant. Apple may provide a hidden relay email — **phone number is the primary identifier**, not email. SSO registration must collect phone + run OTP verify before proceeding to profile forms.

---

## 2. Discover UI

### What this is

The current `discover.tsx` renders a 2-column FlatList grid. This modification **replaces the presentation layer** with a full-screen one-person-at-a-time layout (TikTok/Konjo-style) with a right-column action rail.

### What is REMOVED (full UI replacement)

| Removed item | Location |
|---|---|
| 2-column FlatList grid layout | `(tabs)/discover.tsx` L119–130 |
| Educational banner card | `(tabs)/discover.tsx` L90–100 |
| `renderItem` grid card with `aspect-[3/4]` styling | `(tabs)/discover.tsx` L17–73 |

> [!NOTE]
> `useDiscovery()` hook, `FilterSheet`, and `DiscoveryProfile` type are **kept**. Only the presentation layer changes.

### What is ADDED / CHANGED

#### New Screen Structure

```
┌────────────────────────────────────────┐
│  Discover        [filter]  [...menu]  │  <- header kept
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────┐  Like       │
│  │                      │             │
│  │   [Full-screen       │  Pass       │
│  │    profile photo]    │             │
│  │                      │  DM [star]  │  <- gold star badge = premium signal
│  │  Tigist, 26          │             │
│  │  Addis Ababa         │             │
│  │  Marriage            │             │
│  │  Verified            │             │
│  │  [Reading][Cooking]  │             │
│  └──────────────────────┘             │
│                                        │
│      Swipe up for next person         │
└────────────────────────────────────────┘
```

#### Component Changes

| File | Change |
|---|---|
| `(tabs)/discover.tsx` | Replace grid FlatList with vertical paged FlatList (`pagingEnabled={true}`). Each page = full-screen profile. Right-column action rail. |
| `components/discovery/SwipeCard.tsx` | UPDATE — full-screen single-profile renderer with action rail |
| `components/discovery/ActionRail.tsx` | NEW — vertical column: Like, Pass, DM (gold star badge) |
| `services/discovery.service.ts` | Add `sendDM(profileId)` — checks premium; shows upgrade sheet if free |

#### Action Button Behaviour

| Button | Free User | Premium User |
|---|---|---|
| Like | Works (daily limit applies) | Works (unlimited) |
| Pass | Works | Works |
| DM | Bottom sheet: "Upgrade to Premium to send a direct message" | Opens DM compose |

DM button shows a gold star badge. Free users see a smooth bottom sheet — never an abrupt block.

#### Recommendation Engine Priority (backend — additive)

Update `discovery/discovery.service.ts` query sort:

```
Priority 1  People who already liked you (surfaces them first — user does not know why)
Priority 2  High compatibility quiz alignment (same goal, overlapping interests, compatible lookingFor)
Priority 3  Region proximity (same city first, then same country)
Priority 4  Activity recency (active in last 7 days ranked above inactive)
Excluded    Already liked / passed / blocked / matched / people who blocked you
```

#### Swipe-Up Navigation

`pagingEnabled={true}` on the vertical FlatList advances to the next person. No horizontal swipe — intentional (avoids gamification feel).

---

## 3. Premium Logic

### What this is

A complete premium access map layered on top of the existing `subscriptions` module. Nothing removed from the current system — logic gates are added.

### New Tables (additive)

```sql
-- DM credit balance for premium users
CREATE TABLE IF NOT EXISTS dm_credits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance     SMALLINT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DM request threads (outside of matched chat)
CREATE TABLE IF NOT EXISTS dm_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_message   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  -- status values: 'pending' | 'accepted' | 'ignored' | 'blocked'
  expires_at      TIMESTAMPTZ NOT NULL,    -- 7 days from created_at
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sender_id, recipient_id)         -- 1 DM per person ever
);
```

### Free vs Premium Feature Map

| Feature | Free | Premium |
|---|---|---|
| Mutual match chat | Unlimited | Unlimited |
| Receiving DMs from premium users | Yes | Yes |
| Liking profiles | Daily limit (default 20/day) | Unlimited |
| Support tab, resources, Q&A | Yes | Yes |
| See who liked you (Received tab) | Count + blurred silhouettes + age + region only | Full profile revealed |
| Send DM without matching | Upgrade prompt | 1 DM credit per person |
| Advanced Discover filters | Basic only | All filters |

### The Smart Free Matching Loop

```
1. Abebe (free) likes Sara -> Sara gets blurred card in Received tab
2. Sara (free) cannot reveal who it is
3. Algorithm surfaces Abebe FIRST in Sara's Discover queue (she doesn't know why)
4. Sara sees Abebe in Discover -> likes him -> INSTANT MATCH (he already liked her)
5. Matched chat opens -- completely free for both parties
```

Free users can still get matches. Premium = speed + control, not gating connections.

### DM Credit System

```
1. Premium user taps DM on a profile -> sees credit balance
2. Composes message -> 1 credit consumed per unique recipient (not per message)
3. Recipient sees "Message Requests" section in Matches tab (separate from mutual matches)
4. If recipient replies -> thread opens freely
5. If ignored 7 days -> request expires (credit NOT refunded -- spam protection)

Anti-spam rules:
- Max 5 DM requests per day
- 1 DM per person ever (cannot re-DM someone who ignored or blocked)
- If DM reported -> sender loses credits and DM ability reviewed by moderator
```

### Frontend Changes

| File | Change |
|---|---|
| `(tabs)/discover.tsx` | DM button checks `useSubscription()` -> BottomSheet upsell if free |
| `(tabs)/likes.tsx` | Received tab: blur silhouettes for free; show age + region text; premium upsell CTA |
| `components/discovery/ActionRail.tsx` | DM button: gold star badge |
| `hooks/useSubscription.ts` | ADD `isPremium`, `dmCredits`, `consumeDmCredit()` |
| `(tabs)/matches.tsx` | ADD "Message Requests" section above matched chats |

### Backend Changes (additive)

| File | Change |
|---|---|
| `subscriptions/subscriptions.service.ts` | Add `isPremium(userId)`, `getDmCredits(userId)`, `consumeDmCredit(userId)` |
| `discovery/discovery.service.ts` | Gate advanced filters behind `isPremium()` check |
| `matches/matches.controller.ts` | Add `GET /matches/dm-requests`, `POST /matches/dm-requests`, `PATCH /matches/dm-requests/:id/accept` |

---

## 4. Likes Rename

### What this is

A text/label rename of the two tabs on the Likes screen. **Frontend-only — no backend or database change required.**

### What is REMOVED (label replacement)

| Old Label | Location |
|---|---|
| `"Who Liked Me"` | `(tabs)/likes.tsx` L179 |
| `"People I Liked"` | `(tabs)/likes.tsx` L186 |

### What is ADDED

| New Label | Tab value | Amharic equivalent |
|---|---|---|
| `Received` (with heart emoji) | `'received'` | wegede ene yehonu |
| `Sent` (with heart emoji) | `'sent'` | yelakuwachehu |

The heart emoji is a deliberate accessibility aid — communicates meaning visually without needing to read text, important for Amharic-first users.

### Exact File Diff

**File:** `frontend/src/app/(tabs)/likes.tsx`

```diff
- <Text>Who Liked Me</Text>
+ <Text>Received ❤️</Text>

- <Text>People I Liked</Text>
+ <Text>Sent ❤️</Text>

- <Text>{activeProfiles.length} people liked your profile.</Text>
+ <Text>{activeProfiles.length} people liked you</Text>
```

### Updated Likes Screen UI

```
┌────────────────────────────────────┐
│  Likes                             │
│                                    │
│  ┌──────────────┬──────────────┐   │
│  │ Received     │   Sent       │   │  <- active tab = white pill
│  └──────────────┴──────────────┘   │
│                                    │
│  9 people liked you        PREMIUM │
│                                    │
│  ┌────────┐  ┌────────┐           │
│  │  [?]   │  │  [?]   │           │  <- blurred silhouette (free tier)
│  │ Age 29 │  │ Age 34 │           │
│  │ Addis  │  │ Bahir  │           │
│  └────────┘  └────────┘           │
│                                    │
│  Upgrade to see who liked you      │
└────────────────────────────────────┘
```

---

## 5. Chat UI

### What this is

The existing `chat/[matchId].tsx` opens the gallery picker directly on `+` press. This modification adds **voice messages** (Telegram-style) and a proper **attachment menu** with Gallery, Camera, and Voice options.

### What is REMOVED

| Removed item | Location |
|---|---|
| `+` icon that calls `pickImage()` directly on press | `chat/[matchId].tsx` L190–198 |

### What is ADDED

| Added item | Description |
|---|---|
| Attachment menu (bottom sheet) | Opens on `+` press; shows Gallery, Camera, Voice |
| Gallery option | Existing `ImagePicker.launchImageLibraryAsync()` moved inside the menu |
| Camera option | NEW — `ImagePicker.launchCameraAsync()` |
| Voice message recording | NEW — hold-to-record mic; release to send; swipe left to cancel |
| Voice message playback bubble | NEW — play button + duration display in `MessageBubble` |
| `message_type` enum extension | ADD `'voice'` to backend `message_type` enum |

#### Updated Chat Input Bar

```
┌──────────────────────────────────────────┐
│  [+]  │  Type a message...      │  [mic] │
└──────────────────────────────────────────┘
   ^                                   ^
   Opens attachment menu           Hold to record voice
                                   Release to send
                                   Swipe left to cancel
```

When input has text: mic becomes Send button. When empty: mic shown for voice recording.

#### Attachment Menu (bottom sheet on + press)

```
┌────────────────────────────────┐
│  Gallery                       │  -> launchImageLibraryAsync
│  Camera                        │  -> launchCameraAsync
│  Voice                         │  -> activates hold-to-record UI
└────────────────────────────────┘
```

#### Frontend Files

| File | Change |
|---|---|
| `chat/[matchId].tsx` | Replace direct `pickImage()` on `+` with attachment bottom sheet; add voice recording state |
| `components/chat/AttachmentMenu.tsx` | NEW — bottom sheet with 3 options |
| `components/chat/VoiceRecorder.tsx` | NEW — hold-to-record; produces audio blob |
| `components/chat/MessageBubble.tsx` | ADD voice branch: `type === 'voice'` -> show play button + duration bar |

#### Backend Files (additive)

| File | Change |
|---|---|
| `messages/messages.service.ts` | Handle `message_type = 'voice'`; store as encrypted audio blob |
| DB migration | ADD `'voice'` to `message_type` enum |

#### Privacy Rules

- Voice messages: E2E encrypted same as text — stored as encrypted audio blobs, never raw audio.
- Voice auto-delete from server after both parties download (default 30 days, configurable).
- Photos in chat: unblurred by default for matched users (per project-wide photo rule — no reveal grant needed for matched users).
- Screenshot warning banner on first photo send — existing behaviour, unchanged.

---

## 6. Registration

### What this is

Three new fields are added to the registration profile form, and the layout changes from a **single long-scroll screen** to a **one-field-per-screen wizard**. All existing profile fields and validation logic are preserved and redistributed across step screens.

### New Fields Added

| Field | Type | Options | Default | DB Column |
|---|---|---|---|---|
| Who I'm looking for | Enum | `men` / `women` / `both` | required | `profiles.looking_for` |
| Virus type | Enum | `hiv_1` / `hiv_2` / `unknown` / `prefer_not_to_say` | `prefer_not_to_say` | `profiles.virus_type` |
| Profile photo | Upload | — | required (at least 1) | `photos` table (already exists) |

#### Database Changes (additive only)

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS looking_for  TEXT
    CHECK (looking_for IN ('men', 'women', 'both')),
  ADD COLUMN IF NOT EXISTS virus_type   TEXT NOT NULL DEFAULT 'prefer_not_to_say'
    CHECK (virus_type IN ('hiv_1', 'hiv_2', 'unknown', 'prefer_not_to_say'));
```

> [!NOTE]
> `virus_type` is encrypted at the application service layer before write — same treatment as verification data. Never stored as a plain indexable tag or used as a hard discovery filter.

> [!CAUTION]
> `looking_for` is a **bidirectional filter**. If Dawit selects `"women"`, he only appears in Discover feeds of users who selected `"men"` or `"both"`, AND he only sees those users in his own feed. Update `discovery/discovery.service.ts` to enforce both sides of this filter.

### What is REMOVED (layout replacement only)

| Removed | Location |
|---|---|
| Single long-scroll profile form | `(onboarding)/profile-create.tsx` |

The form's logic (Zod schema, `profileService.createProfile()`, region loading) is **preserved** — redistributed across the step screens below. Only the layout changes from one scrollable form to a multi-page stepper.

### New Registration Step Sequence

Each step = its own full screen. Progress dots shown at top. Single "Continue ->" CTA at bottom.

| Step | Screen file | Field | Notes |
|---|---|---|---|
| 1 (Auth) | `(auth)/register-phone.tsx` | Phone number | OTP SMS sent |
| 2 (Auth) | `(auth)/verify-otp.tsx` | OTP code | One-time only — phone verified permanently here |
| 3 (Auth) | `(auth)/set-password.tsx` | Password + confirm | Min 8 chars, 1 number, 1 symbol |
| 4 | `(onboarding)/step-nickname.tsx` | Nickname | |
| 5 | `(onboarding)/step-dob.tsx` | Date of birth | 18+ gate (Zod + DB constraint) |
| 6 | `(onboarding)/step-gender.tsx` | Gender | Man / Woman / Other |
| 7 | `(onboarding)/step-region.tsx` | Region / City | Picker (API + fallback list) |
| 8 | `(onboarding)/step-looking-for.tsx` | Who I'm looking for | Men / Women / Both |
| 9 | `(onboarding)/step-relationship-goal.tsx` | Relationship goal | Marriage / Serious / Friendship |
| 10 | `(onboarding)/step-virus-type.tsx` | Virus type | `prefer_not_to_say` default |
| 11 | `(onboarding)/step-bio.tsx` | Bio | Optional |
| 12 | `(onboarding)/photo-upload.tsx` | Profile photo | Required, at least 1 (already exists) |
| 13 | `(onboarding)/doc-upload.tsx` | Medical doc + selfie | Already exists |
| 14 | `(onboarding)/pending.tsx` | Pending state | Already exists |

> [!IMPORTANT]
> All step screens accumulate values in the shared `state/draftProfile.store.ts` (already exists). `profileService.createProfile()` fires only at the end of step 11 (after bio). Photo upload (`POST /photos`) fires at step 12.

#### Step Screen Layout Template

```
┌────────────────────────────────────────┐
│  <-   Step 5 of 11        [progress]  │  <- back + progress dots
│                                        │
│  Date of Birth                         │  <- field label
│                                        │
│  ┌──────────────────────────────────┐  │
│  │   DD / MM / YYYY                 │  │  <- single input
│  └──────────────────────────────────┘  │
│                                        │
│  You must be at least 18 years old.   │  <- hint text
│                                        │
│  ┌──────────────────────────────────┐  │
│  │          Continue ->             │  │  <- bg-[#1B4D5C]
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

#### Virus Type Field — Display Rules

| Context | Display |
|---|---|
| Discover card (full-screen) | **Not shown** |
| Profile detail view (`profiles/[id].tsx`) | Small badge e.g. `HIV-1` — visible to verified members only |
| Discovery algorithm | Soft compatibility signal; **never a hard filter** (cannot filter OUT by type) |
| Profile edit | Editable any time; can be set to `prefer_not_to_say` to hide |

#### Profile Photo Rules

- Required at step 12 — cannot proceed to doc upload without at least 1 photo.
- Photos unblurred by default per project rule.
- Up to 6 total photos; minimum 1 at registration.
- Verification officer sees primary photo during doc review (to match selfie).

#### Who I'm Looking For — Discovery Filter Logic

Bidirectional example:
```
Dawit selects "Women"
  -> Dawit appears ONLY in Discover feeds of users who selected "men" or "both"
  -> Dawit's own feed shows ONLY users whose looking_for includes "men" or "both"
```

Filter is editable any time via Profile -> Edit. Uses same `step-looking-for.tsx` component logic.

### Frontend Files Summary

| File | Change |
|---|---|
| `(onboarding)/profile-create.tsx` | REPLACED by step screens below |
| `(onboarding)/step-nickname.tsx` | NEW |
| `(onboarding)/step-dob.tsx` | NEW |
| `(onboarding)/step-gender.tsx` | NEW |
| `(onboarding)/step-region.tsx` | NEW |
| `(onboarding)/step-looking-for.tsx` | NEW |
| `(onboarding)/step-relationship-goal.tsx` | NEW |
| `(onboarding)/step-virus-type.tsx` | NEW |
| `(onboarding)/step-bio.tsx` | NEW |
| `(onboarding)/_layout.tsx` | UPDATE — add new step routes to the stack |
| `lib/zod-schemas.ts` | ADD `lookingFor` and `virusType` fields to `profileSchema` |
| `services/profile.service.ts` | ADD `lookingFor` and `virusType` to `createProfile()` and `updateProfile()` payloads |
| `state/draftProfile.store.ts` | ADD `lookingFor` and `virusType` fields |

---

## Cross-Modification Dependency Map

```
Mod 1 (Auth)
  └── feeds into Mod 6 (Registration)
      register-phone, verify-otp, set-password are steps 1-3 of the registration wizard

Mod 2 (Discover UI)
  └── feeds into Mod 3 (Premium Logic)
      DM button on the action rail is the premium gate entry point

Mod 3 (Premium Logic)
  └── feeds into Mod 4 (Likes Rename)
      blurred received tab is the premium upsell surface

Mod 5 (Chat UI)
  └── independent; depends only on the existing match system

Mod 6 (Registration)
  └── depends on Mod 1 for the first 3 wizard steps
  └── looking_for column feeds the Mod 2 Discover recommendation engine
```

---

## Implementation Order (Recommended)

| Week | Work |
|---|---|
| Week 1 | **Mod 4** Likes Rename — quick win, 1 file, no backend change |
| Week 1 | **Mod 1** Auth frontend — welcome + login screens |
| Week 2 | **Mod 1** Auth backend — password login, SSO endpoints, 7-day refresh |
| Week 2 | **Mod 6** DB — ADD `looking_for` + `virus_type` columns |
| Week 3 | **Mod 6** Screens — 8 new step screens + layout |
| Week 4 | **Mod 2** Discover UI — full-screen card + action rail |
| Week 4 | **Mod 3** Premium Logic — DM credits, likes gate, received blur |
| Week 5 | **Mod 5** Chat UI — attachment menu + voice messages |

---

## Definition of Done (per Modification)

A modification is **done** when:

1. **Tested** — unit tests for new logic; auth flow tested on real device (iOS + Android)
2. **Documented** — public functions, new endpoints, new columns have JSDoc/inline comments
3. **Checked against `docs/constraints.md`** — especially for mods touching photos, auth, and health data (Mods 1, 3, 6)
4. **Privacy verified** — `virus_type` encrypted before write; voice messages encrypted at rest; SSO hidden-email handled gracefully
5. **Colour system consistent** — all new UI uses `#1B4D5C` / `#2A6B80` / `#4A9B7F` / `#0F1E24` only; no ad-hoc colours
