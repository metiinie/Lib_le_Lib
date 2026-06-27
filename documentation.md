# Lib le Lib — Build Documentation

> **Secure Dating and Support Platform for People Living with HIV**
> *Product & Technical Build Documentation*
> Version 1.0 | June 2026

---

## 1. Executive Summary
Lib le Lib is an exclusive, verified mobile application designed for people living with HIV (PLHIV) to pursue marriage, serious relationships, and friendship in an environment free of disclosure-related fear and stigma. Access is restricted to members who complete a confidential medical verification process; once verified, members browse, match, and message other verified members without needing to disclose or discuss their status as a precondition of connection.

## 2. Problem Statement & Vision
**Problem:** People living with HIV frequently face stigma, fear of rejection, and privacy risk when seeking relationships through general-purpose dating platforms.
**Vision:** To be the most trusted, secure, and dignified relationship platform for people living with HIV, where verified status removes the need for individual disclosure.

### Objectives
* Provide an exclusive, verified space for PLHIV.
* Protect identity and health data through privacy-first technical design.
* Operate strictly as a dating and matchmaking product with curated support content.
* Build member trust through rigorous verification, clear safety tooling, and accountable moderation.

## 3. Target Users & Use Cases
* **Primary Users**: HIV-positive men and women seeking marriage, serious relationships, or friendship.
* **User Roles**: Member, Verification Officer, Moderator, Admin.

### Core User Journeys
1. **New member**: sign up → verification submission → pending (limited, blurred browsing) → approved → full access.
2. **Daily user**: browse → like/pass → match → chat (photos blurred until reveal is authorized) → optional safe meetup.
3. **Verification Officer**: review queue → approve / reject / request resubmission.
4. **Moderator**: reports queue → investigate flagged thread → warn / suspend / ban.

## 4. Complete Feature Set
* **Onboarding & Verification**: OTP confirmation, medical document submission, liveness selfie check, and re-verification reminders.
* **Profile & Identity Privacy**: Nickname-only identity, photos blurred by default (revocable reveal), discreet mode.
* **Discovery & Matching**: Filters (age, gender, region), relationship-intent compatibility quiz, mutual match.
* **Messaging & Connection**: One-to-one end-to-end encrypted chat, optional pre-meetup video verification call.
* **Safety & Trust**: Mutual disappearance block, structured reports, in-app meetup safety checklist.
* **Support & Wellbeing**: Admin-curated vetted resource library, anonymous Q&A with health professional, opt-in success stories.

## 5. System Architecture
### Privacy & Security Architecture
* **Chat confidentiality**: End-to-end encryption.
* **Location**: Region/city-level only; exact coordinates never stored.
* **Photos**: Server-side blur; original withheld until consented reveal.
* **Verification documents**: Isolated storage, short retention window, role-gated access.
* **Notifications**: Generic content by default.

### Technology Stack
* **Mobile app**: React Native or Flutter.
* **Backend**: Node.js (NestJS) with PostgreSQL.
* **Document storage**: Isolated encrypted object storage (e.g., S3 with KMS).
* **Chat**: Self-hosted Matrix or custom WebSocket service using libsignal.
* **Push notifications**: FCM / APNs.

## 6. Roadmap & Timeline
* **MVP (~4-5 months)**: Auth, manual verification, profile, discovery, matching, E2E chat with blur/reveal, block/report, admin dashboard.
* **Phase 2 (+2-3 months)**: Telehealth-linked verification, anonymous Q&A, compatibility quiz, discreet-mode polish.
* **Phase 3 (+2-3 months)**: Pre-meetup video verification, multi-language expansion.

## 7. Intellectual Property Strategy
* **Trademark**: "Lib le Lib" name and logo.
* **Copyright**: Source code, UI design, written content.
* **Trade Secret**: Internal verification workflow and matching logic.
* **Patent**: Reserved for genuinely novel technical mechanisms only.
