import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1719540000000 implements MigrationInterface {
  name = 'InitialSchema1719540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
-- ============================================================================
-- LIB LE LIB — DATABASE SCHEMA
-- PostgreSQL 14+
--
-- Maps directly to Section 5.1 (Data Model) and Section 5.2 (Privacy &
-- Security Architecture) of the Build Documentation, expanded to cover every
-- feature in Section 4 (Complete Feature Set).
--
-- Design principles carried over from the documentation:
--   1. Verification data lives in its own schema, isolated from app data.
--   2. No legal name is ever stored — nickname only.
--   3. Exact GPS coordinates are never stored — region/city only.
--   4. Photos are blurred by default; reveal is an explicit, revocable grant.
--   5. Chat is end-to-end encrypted — the server only ever sees ciphertext.
--   6. Every verification and moderation decision is audit-logged.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_status        AS ENUM ('pending_verification','active','suspended','banned','deleted');

-- 'health_professional' is added beyond the four roles listed in section 3.3,
-- because section 4.6 (Anonymous Q&A) requires someone to staff that role.
CREATE TYPE user_role          AS ENUM ('member','verification_officer','moderator','admin','health_professional');

CREATE TYPE gender_type        AS ENUM ('man','woman','other');
CREATE TYPE relationship_goal  AS ENUM ('marriage','serious_relationship','friendship');
CREATE TYPE language_code      AS ENUM ('am','en');

CREATE TYPE verification_status AS ENUM ('submitted','in_review','approved','rejected','expired');
CREATE TYPE verification_method AS ENUM ('self_upload','telehealth');
CREATE TYPE liveness_result     AS ENUM ('pass','fail','manual_review');

CREATE TYPE swipe_action   AS ENUM ('like','pass');
CREATE TYPE match_status   AS ENUM ('active','unmatched');

CREATE TYPE quiz_question_type AS ENUM ('single_choice','multi_choice','scale','free_text');

CREATE TYPE message_type   AS ENUM ('text','image');

CREATE TYPE video_call_status AS ENUM ('scheduled','completed','canceled');

CREATE TYPE report_category AS ENUM
  ('harassment','fake_profile','outing_threat','solicitation','scam','underage_suspicion','other');
CREATE TYPE report_status   AS ENUM ('open','investigating','resolved','dismissed');
CREATE TYPE report_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE moderation_action_type AS ENUM ('warn','suspend','ban','request_resubmission','none');

CREATE TYPE resource_category AS ENUM ('treatment_info','u_equals_u','hotline','general');
CREATE TYPE qa_thread_status  AS ENUM ('open','answered','closed');

CREATE TYPE subscription_plan   AS ENUM ('free','premium');
CREATE TYPE subscription_status AS ENUM ('active','canceled','expired','past_due');

-- Verification data is isolated in its own schema (Section 5.2: "Isolated
-- storage, short retention window, role-gated signed-URL access"). In
-- production this schema can additionally live on a separate physical
-- database/instance with its own credentials.
CREATE SCHEMA IF NOT EXISTS verification;

-- ============================================================================
-- SHARED TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at() RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE IDENTITY  (users, auth, devices)
-- ============================================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT UNIQUE,
  email           TEXT UNIQUE,
  password_hash   TEXT,                     -- nullable: OTP-only auth is supported
  role            user_role NOT NULL DEFAULT 'member',
  status          user_status NOT NULL DEFAULT 'pending_verification',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at   TIMESTAMPTZ,
  CONSTRAINT chk_users_has_contact CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
COMMENT ON TABLE users IS 'Core auth identity. No legal name field by design (doc 4.2).';

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE otp_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination   TEXT NOT NULL,              -- phone or email being verified
  code_hash     TEXT NOT NULL,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  attempts      SMALLINT NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_codes_destination ON otp_codes(destination);

CREATE TABLE devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token        TEXT,
  platform          TEXT NOT NULL,          -- 'ios' | 'android'
  public_key        TEXT,                   -- E2E key-exchange public key for this device
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- ============================================================================
-- PROFILE  (doc 4.2, 4.3, 4.7)
-- ============================================================================

CREATE TABLE regions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code  TEXT NOT NULL,              -- ISO 3166-1 alpha-2, e.g. 'ET'
  name          TEXT NOT NULL                -- city/region display name only — never exact coordinates
);

CREATE TABLE profiles (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname            TEXT NOT NULL,
  date_of_birth       DATE NOT NULL,
  gender              gender_type NOT NULL,
  region_id           UUID REFERENCES regions(id),
  relationship_goals  relationship_goal[] NOT NULL DEFAULT '{}',
  bio                 TEXT,
  discreet_mode       BOOLEAN NOT NULL DEFAULT false,     -- doc 4.2
  low_bandwidth_mode  BOOLEAN NOT NULL DEFAULT false,     -- doc 4.7
  preferred_language  language_code NOT NULL DEFAULT 'en',-- doc 4.7
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_profiles_min_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
);
COMMENT ON CONSTRAINT chk_profiles_min_age ON profiles IS 'Database-level 18+ floor, independent of any client-side check.';
COMMENT ON COLUMN profiles.region_id IS 'City/region only — exact GPS coordinates are never stored (doc 5.2).';

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_profiles_region_id ON profiles(region_id);
CREATE INDEX idx_profiles_relationship_goals ON profiles USING GIN (relationship_goals);

CREATE TABLE interest_tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE profile_interest_tags (
  profile_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES interest_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, tag_id)
);

-- ============================================================================
-- PHOTOS & VISIBILITY  (doc 4.2: "blurred by default", "revocable reveal")
-- ============================================================================

CREATE TABLE photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  storage_ref     TEXT NOT NULL,            -- key in object storage; never the raw file
  position        SMALLINT NOT NULL DEFAULT 0,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  blurred_default BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_photos_profile_id ON photos(profile_id);

-- A reveal grant is what actually unblurs a photo for a specific viewer
-- within a specific match. Deleting/expiring this row re-blurs it — this is
-- the "revocable reveal" mechanic from doc 4.2 and 4.4.
CREATE TABLE photo_reveal_grants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id          UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  granted_to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id          UUID,                   -- FK added after \`matches\` is defined below
  granted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at        TIMESTAMPTZ,
  UNIQUE (photo_id, granted_to_user_id)
);

-- ============================================================================
-- VERIFICATION  (isolated schema — doc 4.1, 5.2, Step 7)
-- ============================================================================

CREATE TABLE verification.telehealth_partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  country_code  TEXT NOT NULL,
  contact_info  TEXT,
  active        BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE verification.verification_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method          verification_method NOT NULL DEFAULT 'self_upload',
  status          verification_status NOT NULL DEFAULT 'submitted',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  decision_at     TIMESTAMPTZ,
  reviewer_id     UUID REFERENCES users(id),       -- must hold role = 'verification_officer'
  rejection_reason TEXT,
  expiry_date     DATE,                            -- doc 4.1: re-verification every 12–24 months
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE verification.verification_records IS
  'Status lifecycle: submitted -> in_review -> approved/rejected -> expired -> re-submission (doc 4.1).';

CREATE TRIGGER trg_verification_records_updated_at BEFORE UPDATE ON verification.verification_records
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_verification_records_user_id ON verification.verification_records(user_id);
CREATE INDEX idx_verification_records_status ON verification.verification_records(status);
CREATE INDEX idx_verification_records_expiry ON verification.verification_records(expiry_date)
  WHERE status = 'approved'; -- powers the re-verification reminder job

-- Raw documents: short retention only. storage_ref is nulled out by a purge
-- job once decision_at + retention window has passed (doc 5.2: "short
-- retention window"); deleted_at records when that happened.
CREATE TABLE verification.documents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID NOT NULL REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  document_type           TEXT NOT NULL,    -- e.g. 'lab_report', 'clinic_letter' — varies by region
  storage_ref              TEXT,            -- nulled by the retention purge job
  uploaded_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                TIMESTAMPTZ
);
COMMENT ON TABLE verification.documents IS
  'Only the verification_officer role may read these via short-lived signed URLs. Purged ~30 days after decision_at.';

CREATE TABLE verification.liveness_checks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID NOT NULL REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  selfie_storage_ref      TEXT,
  result                  liveness_result NOT NULL DEFAULT 'manual_review',
  reviewed_by             UUID REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE verification.telehealth_referrals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID NOT NULL REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  telehealth_partner_id   UUID NOT NULL REFERENCES verification.telehealth_partners(id),
  reference_code          TEXT,
  status                  TEXT NOT NULL DEFAULT 'pending'
);

-- ============================================================================
-- DISCOVERY & MATCHING  (doc 4.3)
-- ============================================================================

CREATE TABLE swipes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      swipe_action NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (actor_id, target_id),
  CONSTRAINT chk_swipes_no_self CHECK (actor_id <> target_id)
);
CREATE INDEX idx_swipes_target_id ON swipes(target_id); -- powers "who liked me"

CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        match_status NOT NULL DEFAULT 'active',
  matched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  unmatched_at  TIMESTAMPTZ,
  unmatched_by  UUID REFERENCES users(id),
  UNIQUE (user_a_id, user_b_id),
  CONSTRAINT chk_matches_ordered_pair CHECK (user_a_id < user_b_id)
);
CREATE INDEX idx_matches_user_a_id ON matches(user_a_id);
CREATE INDEX idx_matches_user_b_id ON matches(user_b_id);

ALTER TABLE photo_reveal_grants
  ADD CONSTRAINT fk_photo_reveal_grants_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;

-- Auto-create a match the moment a like becomes mutual.
CREATE OR REPLACE FUNCTION fn_create_match_on_mutual_like() RETURNS TRIGGER AS \$\$
DECLARE
  reciprocal_exists BOOLEAN;
BEGIN
  IF NEW.action = 'like' THEN
    SELECT EXISTS (
      SELECT 1 FROM swipes
      WHERE actor_id = NEW.target_id AND target_id = NEW.actor_id AND action = 'like'
    ) INTO reciprocal_exists;

    IF reciprocal_exists THEN
      INSERT INTO matches (user_a_id, user_b_id, status)
      VALUES (LEAST(NEW.actor_id, NEW.target_id), GREATEST(NEW.actor_id, NEW.target_id), 'active')
      ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_match_on_mutual_like
  AFTER INSERT ON swipes
  FOR EACH ROW EXECUTE FUNCTION fn_create_match_on_mutual_like();

-- Compatibility quiz (doc 4.3)
CREATE TABLE compatibility_quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text  TEXT NOT NULL,
  question_type  quiz_question_type NOT NULL,
  order_index    SMALLINT NOT NULL DEFAULT 0,
  active         BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE compatibility_quiz_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES compatibility_quiz_questions(id) ON DELETE CASCADE,
  option_text  TEXT NOT NULL,
  order_index  SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE compatibility_quiz_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES compatibility_quiz_questions(id) ON DELETE CASCADE,
  response_text    TEXT,        -- for free_text
  response_numeric NUMERIC,     -- for scale
  answered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, question_id)
);

-- supports single_choice and multi_choice questions
CREATE TABLE compatibility_quiz_response_options (
  response_id UUID NOT NULL REFERENCES compatibility_quiz_responses(id) ON DELETE CASCADE,
  option_id   UUID NOT NULL REFERENCES compatibility_quiz_options(id) ON DELETE CASCADE,
  PRIMARY KEY (response_id, option_id)
);

-- ============================================================================
-- MESSAGING  (doc 4.4 — end-to-end encrypted; server stores ciphertext only)
-- ============================================================================

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id),
  message_type    message_type NOT NULL DEFAULT 'text',
  ciphertext      BYTEA NOT NULL,           -- the server never sees plaintext
  nonce           BYTEA NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ
);
CREATE INDEX idx_messages_match_id_sent_at ON messages(match_id, sent_at);

-- Photos shared inside chat follow the same blur/reveal/revoke rules as
-- profile photos (doc 4.4), but are independent rows since they may never be
-- added to the sender's profile gallery.
CREATE TABLE message_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  storage_ref     TEXT NOT NULL,
  blurred_default BOOLEAN NOT NULL DEFAULT true,
  revealed_at     TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ
);

-- Pre-meetup video verification call (doc 4.4, Phase 3)
CREATE TABLE video_verification_calls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  initiated_by  UUID NOT NULL REFERENCES users(id),
  status        video_call_status NOT NULL DEFAULT 'scheduled',
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ
);

-- ============================================================================
-- SAFETY & TRUST  (doc 4.5, 4.8)
-- ============================================================================

CREATE TABLE blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CONSTRAINT chk_blocks_no_self CHECK (blocker_id <> blocked_id)
);
COMMENT ON TABLE blocks IS 'Mutual disappearance is enforced at the application/query layer: hide blocker from blocked and vice versa.';

CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES users(id),
  reported_id   UUID NOT NULL REFERENCES users(id),
  match_id      UUID REFERENCES matches(id),
  category      report_category NOT NULL,
  description   TEXT,
  evidence_ref  TEXT,                       -- storage path to attached evidence, if any
  status        report_status NOT NULL DEFAULT 'open',
  severity      report_severity NOT NULL DEFAULT 'low',
  assigned_to   UUID REFERENCES users(id),  -- must hold role = 'moderator'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX idx_reports_status_severity ON reports(status, severity);

CREATE TABLE moderation_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID REFERENCES reports(id),  -- nullable: proactive actions aren't always report-driven
  target_user_id  UUID NOT NULL REFERENCES users(id),
  actor_id        UUID NOT NULL REFERENCES users(id), -- moderator or admin
  action          moderation_action_type NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ                    -- for temporary suspensions
);

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id),  -- NULL = system-initiated action
  actor_role  user_role,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE audit_logs IS 'Append-only by convention. Every verification and moderation decision must write a row here (doc 4.8).';
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- SUPPORT & WELLBEING  (doc 4.6)
-- ============================================================================

CREATE TABLE resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,             -- markdown
  category    resource_category NOT NULL,
  language    language_code NOT NULL DEFAULT 'en',
  published   BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID REFERENCES users(id), -- must hold role = 'admin'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE resources IS 'Admin-curated static content only — never user-generated (doc 4.6).';

CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE qa_threads (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id               UUID NOT NULL REFERENCES users(id),
  health_professional_id  UUID REFERENCES users(id), -- assigned on pickup; must hold role = 'health_professional'
  status                  qa_thread_status NOT NULL DEFAULT 'open',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at               TIMESTAMPTZ
);

CREATE TABLE qa_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES qa_threads(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qa_messages_thread_id ON qa_messages(thread_id);

CREATE TABLE success_stories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by_user_id UUID REFERENCES users(id), -- internal accountability only; never exposed via the public API
  title               TEXT NOT NULL,
  story_text          TEXT NOT NULL,
  approved_by         UUID REFERENCES users(id),  -- must hold role = 'admin'
  published           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at        TIMESTAMPTZ
);
COMMENT ON COLUMN success_stories.submitted_by_user_id IS
  'Opt-in and anonymized in the product (doc 4.6) — keep this column out of any client-facing query or serializer.';

-- ============================================================================
-- MONETIZATION  (doc 10)
-- ============================================================================

CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                    subscription_plan NOT NULL DEFAULT 'free',
  status                  subscription_status NOT NULL DEFAULT 'active',
  payment_provider        TEXT,
  external_subscription_id TEXT,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end      TIMESTAMPTZ
);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- ============================================================================
-- OPTIONAL — Row-Level Security (illustrative; relevant if hosting on
-- Supabase, which pairs well with Expo). Enable and adapt per your auth
-- setup; not required if access is mediated entirely by a backend API.
-- ============================================================================

-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY profiles_owner_write ON profiles
--   FOR UPDATE USING (user_id = auth.uid());
-- CREATE POLICY profiles_read_active_members ON profiles
--   FOR SELECT USING (
--     EXISTS (SELECT 1 FROM users WHERE id = profiles.user_id AND status = 'active')
--   );

-- ALTER TABLE verification.documents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY documents_officer_only ON verification.documents
--   FOR SELECT USING (
--     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'verification_officer')
--   );

`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS verification CASCADE;`);
    await queryRunner.query(`
            DROP TABLE IF EXISTS public.subscriptions CASCADE;
            DROP TABLE IF EXISTS public.success_stories CASCADE;
            DROP TABLE IF EXISTS public.qa_messages CASCADE;
            DROP TABLE IF EXISTS public.qa_threads CASCADE;
            DROP TABLE IF EXISTS public.resources CASCADE;
            DROP TABLE IF EXISTS public.audit_logs CASCADE;
            DROP TABLE IF EXISTS public.moderation_actions CASCADE;
            DROP TABLE IF EXISTS public.reports CASCADE;
            DROP TABLE IF EXISTS public.blocks CASCADE;
            DROP TABLE IF EXISTS public.video_verification_calls CASCADE;
            DROP TABLE IF EXISTS public.message_attachments CASCADE;
            DROP TABLE IF EXISTS public.messages CASCADE;
            DROP TABLE IF EXISTS public.compatibility_quiz_response_options CASCADE;
            DROP TABLE IF EXISTS public.compatibility_quiz_responses CASCADE;
            DROP TABLE IF EXISTS public.compatibility_quiz_options CASCADE;
            DROP TABLE IF EXISTS public.compatibility_quiz_questions CASCADE;
            DROP TABLE IF EXISTS public.photo_reveal_grants CASCADE;
            DROP TABLE IF EXISTS public.photos CASCADE;
            DROP TABLE IF EXISTS public.profile_interest_tags CASCADE;
            DROP TABLE IF EXISTS public.interest_tags CASCADE;
            DROP TABLE IF EXISTS public.profiles CASCADE;
            DROP TABLE IF EXISTS public.regions CASCADE;
            DROP TABLE IF EXISTS public.devices CASCADE;
            DROP TABLE IF EXISTS public.otp_codes CASCADE;
            DROP TABLE IF EXISTS public.users CASCADE;
        `);
    await queryRunner.query(`
            DROP TYPE IF EXISTS public.user_status;
            DROP TYPE IF EXISTS public.user_role;
            DROP TYPE IF EXISTS public.gender_type;
            DROP TYPE IF EXISTS public.relationship_goal;
            DROP TYPE IF EXISTS public.language_code;
            DROP TYPE IF EXISTS public.verification_status;
            DROP TYPE IF EXISTS public.verification_method;
            DROP TYPE IF EXISTS public.liveness_result;
            DROP TYPE IF EXISTS public.swipe_action;
            DROP TYPE IF EXISTS public.match_status;
            DROP TYPE IF EXISTS public.quiz_question_type;
            DROP TYPE IF EXISTS public.message_type;
            DROP TYPE IF EXISTS public.video_call_status;
            DROP TYPE IF EXISTS public.report_category;
            DROP TYPE IF EXISTS public.report_status;
            DROP TYPE IF EXISTS public.report_severity;
            DROP TYPE IF EXISTS public.moderation_action_type;
            DROP TYPE IF EXISTS public.resource_category;
            DROP TYPE IF EXISTS public.qa_thread_status;
            DROP TYPE IF EXISTS public.subscription_plan;
            DROP TYPE IF EXISTS public.subscription_status;
        `);
  }
}
