# Business Rules & Domain

This is the logic no one can infer from the code by reading it. If behavior changes
here, update this file in the same PR — don't let it drift out of sync.

## Verification

- Status lifecycle: `submitted → in_review → approved | rejected → expired → (resubmission)`.
- Re-verification is required every 12–24 months (`verification_records.expiry_date`);
  the system sends a reminder ahead of expiry — it does not silently lock the account
  the moment a document expires.
- Rejected is not the same as banned. A rejection always carries a `rejection_reason` and
  allows resubmission, rate-limited to deter repeated fraudulent attempts.
- The `health_professional` role exists solely to staff the anonymous Q&A feature — it
  has no verification or moderation permissions, and should never be granted any.

## Eligibility

- 18+ is enforced at the database layer (`chk_profiles_min_age`) — application code must
  not be the only place this is checked.
- Relationship goals: `marriage | serious_relationship | friendship` — multi-select, not
  mutually exclusive.

## Matching

- A `match` is created automatically the instant a like becomes mutual (see the trigger
  in `lib-le-lib-schema.sql`) — there is no separate "confirm match" step in v1.
- Blocking is mutual and silent: a blocked user cannot tell they were blocked, and
  neither party appears in the other's discovery feed, regardless of any other
  relationship state between them.

## Photos

- Blurred by default, always. Reveal is a deliberate, revocable act by the photo's
  owner — never automatic on match, even though an earlier draft of the product
  considered that. Treat "auto-reveal on match" as explicitly out of scope unless it
  comes in as its own, separately-scoped task.

## Safety

- Report categories: `harassment, fake_profile, outing_threat, solicitation, scam,
  underage_suspicion, other`.
- Severity (`low / medium / high / critical`) drives queue ordering, not automatic
  action — a human moderator makes every suspend/ban decision. There is no fully
  automated ban path in v1.

## "Done," in this domain

Tested + documented is the generic bar. Here, done also means: if the task touches a
privacy or security constraint, that constraint has an explicit passing test attached to
it — not just an assumption that it "should" hold because the code looks right.
