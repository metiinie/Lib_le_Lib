# Lib le Lib Roles & Permissions

This document outlines the four administrative roles on the Lib le Lib web dashboard. **These roles never operate on the mobile app.**

## 1. Verification Officer

**Works on:** Web dashboard only — never the mobile app

The most sensitive role in the entire system. Reviews medical documents submitted by members and decides who gets verified access. Has no visibility into member profiles, chats, matches, or anything else. Document access is always via short-lived signed URLs — never a permanent link or a downloadable file.

### Core responsibilities
*   **Review the verification queue:** See all pending submissions in order of submission time. SLA timer shows how long each has been waiting — target: review within 48 hours.
*   **View submitted documents:** Open each document via a short-lived signed URL. The link expires after a fixed window. The raw file is never downloaded to the reviewer's device.
*   **Review the liveness selfie:** Manually compare the selfie against the document photo to confirm the same person submitted both.
*   **Make a decision:** Approve, Reject (with reason), or Request resubmission. Every decision is instantly logged in `audit_logs` in the same database transaction.
*   **Set expiry date on approval:** Every approved verification gets an expiry date (12–24 months). The system auto-reminds members before expiry — but the officer sets the date.

### Dashboard tools
*   **Queue view:** Submitted → In Review → Decided. Officer claims a submission to review (marks it In Review) so two officers don't review the same case.
*   **Rejection reason picker:** Structured list: document unclear / document expired / wrong document type / liveness mismatch / suspected fraud. Free text is optional, structured reason is required.
*   **Resubmission rate limit view:** Can see how many times a user has resubmitted. Flag suspicious patterns (e.g. 4+ resubmissions) without being able to ban — that goes to the Moderator.
*   **Re-verification queue:** Separate queue for members whose verification has expired and resubmitted. Treated the same as a new submission.
*   **Reference guide:** Built into the dashboard: accepted document types by country, what a valid lab result looks like, how to handle documents in different languages.

### Access boundaries — what this role can and cannot see
*   **✓ Yes** — Verification queue and documents (core job)
*   **✓ Yes** — Audit logs (own decisions only)
*   **✗ No access** — Member profiles, photos, bios
*   **✗ No access** — Chat messages or match data
*   **✗ No access** — Reports or moderation queue
*   **✗ No** — Suspend or ban accounts (escalate to Moderator)

### Critical rule
**Verification Officer and Moderator must always be different people.**
The person reading medical documents must never be the same person reading flagged chat content. This separation is both an ethical requirement and a legal defensibility point. One role handles health data, the other handles behavioural data. Never combine them into one person.

---

## 2. Moderator

**Works on:** Web dashboard only — never the mobile app

Keeps the platform safe after members are verified and using the app. Reviews reports submitted by members, investigates only the reported content, and takes action. Cannot see any chat thread except ones that have been formally reported. No access to verification documents.

### Core responsibilities
*   **Review the reports queue:** Sorted by severity (Critical → High → Medium → Low). Assign themselves to a report to begin investigation.
*   **Investigate reported content:** View only the flagged chat thread or profile content tied to the report — not the full conversation history of either user.
*   **Take moderation action:** Warn, Suspend (temporary, with expiry date), Ban (permanent), or Dismiss report as unfounded. Every action logged in `audit_logs` with reason.
*   **Resolve or escalate:** Mark a report Resolved or escalate to Admin for cases beyond their authority (e.g. legal threats, suspected criminal content).
*   **Enforce community guidelines:** Apply the written guidelines consistently — no improvised decisions. Every action has a documented reason, every reason is auditable.

### Dashboard tools
*   **Reports queue:** Each report card shows: reporter ID, reported user, category, severity tag, time open. Moderator claims a report to prevent double-handling.
*   **Report categories:** Harassment / Fake profile / Outing threat / Solicitation / Scam / Underage suspicion / Other. Each has its own investigation checklist.
*   **Severity tagging:** Moderator can upgrade severity (e.g. Low → High) if investigation reveals more than the initial report suggested.
*   **Account action panel:** Warn / Suspend (with duration picker) / Ban. Suspension auto-lifts when the expiry date passes without further action needed.
*   **Own action history:** Each moderator can see their own past decisions for consistency — but not other moderators' actions (that's Admin-level visibility).

### Access boundaries
*   **✓ Yes** — Reports queue and reported content (core job)
*   **✓ Yes** — Chat content of reported threads only (flagged threads only — not all chats)
*   **✓ Yes** — Suspend or ban accounts
*   **✗ No access** — Verification documents (different role entirely)
*   **✗ No access** — Unreported member chats
*   **✗ No access** — Full audit log across all moderators (Admin only)
*   **✗ No** — System configuration

### Escalation tiers
*   **Tier 1 — Warn:** First-time minor violations (mild harassment, borderline content). Written warning sent to the member's account.
*   **Tier 2 — Suspend:** Repeated violations or moderate severity. Account locked for a fixed period (1 day / 7 days / 30 days). Member can see the reason but cannot appeal inside the app in v1.
*   **Tier 3 — Ban:** Severe or repeated violations (outing threats, solicitation, fake verification). Permanent. Escalate to Admin first if unsure.
*   **Tier 4 — Escalate to Admin:** Legal threats, suspected criminal content, cases involving minors, or anything that might require external reporting. Document everything before escalating.

---

## 3. Admin

**Works on:** Web dashboard only — never the mobile app

Oversees the entire platform. Manages the team, controls what content appears in the Support tab, owns the audit log, and handles system configuration. Does not routinely read member data — their job is platform management, not member review.

### Team management
*   **Assign roles:** Promote a user account to Verification Officer, Moderator, or Health Professional. Demote or revoke roles. Only Admin can change roles — not self-assignable.
*   **Deactivate staff accounts:** When a Verification Officer or Moderator leaves, Admin deactivates their account. All their past actions remain in the audit log.
*   **Monitor team performance:** Verification queue SLA times, average moderation response time, open vs resolved report ratio. Aggregate numbers — not individual member data.

### Content management
*   **Publish health resources:** Write, edit, and publish articles in the Support tab resource library. Set language (Amharic / English), category, and published status. Only published articles appear to members.
*   **Approve success stories:** Review member-submitted success stories before they go public. Edit for privacy (remove any identifying detail) then approve or reject.
*   **Manage compatibility quiz questions:** Add, edit, deactivate quiz questions. Control question order. Changes apply to all new quiz sessions immediately.
*   **Manage interest tags and regions:** Add new cities / regions to the region picker. Add or retire interest tags that members use on their profiles.

### Audit log access
*   **Full audit log:** Every verification decision and every moderation action — who did it, when, what the outcome was. Filterable by actor, action type, and date range.
*   **Cross-moderator consistency check:** Can compare how different moderators are handling similar report categories — catches inconsistency early.
*   **Escalated cases:** Receives escalations from Moderators. Reviews and decides: extend suspension to ban, refer externally, or return to moderator with guidance.

### Platform metrics
*   **Aggregate anonymized stats only:** Total verified members, verification queue volume, match rate, report volume by category. No dashboard ever shows individual member health data.
*   **Verification SLA tracking:** Average time from submission to decision. Alert if average exceeds 48 hours — the target SLA.

### Access boundaries
*   **✓ Yes** — Full audit log
*   **✓ Yes** — Role assignment for staff
*   **✓ Yes** — Content publish / approve
*   **✓ Yes** — System configuration
*   **✓ Yes** — Suspend or ban accounts (for escalated cases)
*   **✗ No** — Verification documents (Verification Officer only)
*   **✗ No** — Member chat content (unreported) (not part of any job function)

---

## 4. Health Professional

**Works on:** Web dashboard only — never the mobile app

The narrowest role in the system. Exists solely to staff the anonymous Q&A feature in the Support tab. Picks up open member questions, replies, and closes threads. Has no access to profiles, matches, chats, reports, verification documents, or any other part of the platform.

### Core responsibilities
*   **Monitor the Q&A queue:** See all open threads in submission order. Pick up a thread to begin — status changes from "Open" to "Being answered" so another professional doesn't duplicate the work.
*   **Reply to member questions:** Back-and-forth text conversation with the member. The professional sees the member's nickname — but no profile, no photos, no HIV documentation. The member never knows the professional's identity.
*   **Close or archive a thread:** Mark a thread Answered and close it when the conversation is resolved. Member can re-open if they have follow-up questions.
*   **Recommend external resources:** When a question needs more than the app can provide (clinical advice, mental health crisis, legal issues), direct the member to an appropriate external professional or hotline — never handle it inside the app.

### Dashboard tools
*   **Q&A queue:** Open / Being answered / Answered / Closed. Oldest unanswered threads shown first.
*   **Thread view:** Full conversation history with that one member. Nothing else about the member is visible — no profile data, no match history.
*   **Resource link shortcut:** Quick-insert links to published health resources from the Support tab — so professionals can share vetted content without retyping URLs.
*   **Flag to Admin:** If a Q&A thread contains something that suggests the member is in crisis or at risk, the professional can flag it to Admin for review — without revealing the thread content to anyone else.

### Access boundaries — the most restricted non-member role
*   **✓ Yes** — Q&A threads assigned to them (only this)
*   **✗ No access** — Member profiles, photos, bio
*   **✗ No access** — Verification documents
*   **✗ No access** — Chat messages or matches
*   **✗ No access** — Reports or moderation queue
*   **✗ No access** — Audit log
*   **✗ No access** — Any moderation action

### Important requirement before assigning this role
*   **Must be a qualified health professional:** Nurse, clinical officer, HIV counselor, or equivalent. Not a general volunteer. Admin verifies credentials before assigning the role.
*   **Must sign a confidentiality agreement:** Q&A threads contain sensitive personal health disclosures. The professional must be contractually bound to confidentiality before they see a single thread.
*   **Cannot give clinical diagnosis or prescribe:** The Q&A is for information and guidance only. Any question requiring clinical judgment must be redirected to a real healthcare provider.
