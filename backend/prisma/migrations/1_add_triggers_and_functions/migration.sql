-- ============================================================================
-- LIB LE LIB — RAW SQL MIGRATION
-- Adds Triggers, Functions, Check Constraints, and Comments not supported natively by Prisma
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- SHARED TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_verification_records_updated_at BEFORE UPDATE ON verification.verification_records
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Auto-create a match the moment a like becomes mutual.
CREATE OR REPLACE FUNCTION public.fn_create_match_on_mutual_like() RETURNS TRIGGER AS $$
DECLARE
  reciprocal_exists BOOLEAN;
BEGIN
  IF NEW.action = 'like' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.swipes
      WHERE actor_id = NEW.target_id AND target_id = NEW.actor_id AND action = 'like'
    ) INTO reciprocal_exists;

    IF reciprocal_exists THEN
      INSERT INTO public.matches (user_a_id, user_b_id, status)
      VALUES (LEAST(NEW.actor_id, NEW.target_id), GREATEST(NEW.actor_id, NEW.target_id), 'active')
      ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_match_on_mutual_like
  AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_match_on_mutual_like();

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

ALTER TABLE public.users ADD CONSTRAINT chk_users_has_contact CHECK (phone IS NOT NULL OR email IS NOT NULL);
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_min_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years');
ALTER TABLE public.swipes ADD CONSTRAINT chk_swipes_no_self CHECK (actor_id <> target_id);
ALTER TABLE public.matches ADD CONSTRAINT chk_matches_ordered_pair CHECK (user_a_id < user_b_id);
ALTER TABLE public.blocks ADD CONSTRAINT chk_blocks_no_self CHECK (blocker_id <> blocked_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'Core auth identity. No legal name field by design (doc 4.2).';
COMMENT ON CONSTRAINT chk_profiles_min_age ON public.profiles IS 'Database-level 18+ floor, independent of any client-side check.';
COMMENT ON COLUMN public.profiles.region_id IS 'City/region only — exact GPS coordinates are never stored (doc 5.2).';
COMMENT ON TABLE verification.verification_records IS 'Status lifecycle: submitted -> in_review -> approved/rejected -> expired -> re-submission (doc 4.1).';
COMMENT ON TABLE verification.documents IS 'Only the verification_officer role may read these via short-lived signed URLs. Purged ~30 days after decision_at.';
COMMENT ON TABLE public.blocks IS 'Mutual disappearance is enforced at the application/query layer: hide blocker from blocked and vice versa.';
COMMENT ON TABLE public.audit_logs IS 'Append-only by convention. Every verification and moderation decision must write a row here (doc 4.8).';
COMMENT ON TABLE public.resources IS 'Admin-curated static content only — never user-generated (doc 4.6).';
COMMENT ON COLUMN public.success_stories.submitted_by_user_id IS 'Opt-in and anonymized in the product (doc 4.6) — keep this column out of any client-facing query or serializer.';
