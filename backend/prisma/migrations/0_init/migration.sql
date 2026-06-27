-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "verification";

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('pending_verification', 'active', 'suspended', 'banned', 'deleted');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('member', 'verification_officer', 'moderator', 'admin', 'health_professional');

-- CreateEnum
CREATE TYPE "gender_type" AS ENUM ('man', 'woman', 'other');

-- CreateEnum
CREATE TYPE "relationship_goal" AS ENUM ('marriage', 'serious_relationship', 'friendship');

-- CreateEnum
CREATE TYPE "language_code" AS ENUM ('am', 'en');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('submitted', 'in_review', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "verification_method" AS ENUM ('self_upload', 'telehealth');

-- CreateEnum
CREATE TYPE "liveness_result" AS ENUM ('pass', 'fail', 'manual_review');

-- CreateEnum
CREATE TYPE "swipe_action" AS ENUM ('like', 'pass');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('active', 'unmatched');

-- CreateEnum
CREATE TYPE "quiz_question_type" AS ENUM ('single_choice', 'multi_choice', 'scale', 'free_text');

-- CreateEnum
CREATE TYPE "message_type" AS ENUM ('text', 'image');

-- CreateEnum
CREATE TYPE "video_call_status" AS ENUM ('scheduled', 'completed', 'canceled');

-- CreateEnum
CREATE TYPE "report_category" AS ENUM ('harassment', 'fake_profile', 'outing_threat', 'solicitation', 'scam', 'underage_suspicion', 'other');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "report_severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "moderation_action_type" AS ENUM ('warn', 'suspend', 'ban', 'request_resubmission', 'none');

-- CreateEnum
CREATE TYPE "resource_category" AS ENUM ('treatment_info', 'u_equals_u', 'hotline', 'general');

-- CreateEnum
CREATE TYPE "qa_thread_status" AS ENUM ('open', 'answered', 'closed');

-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'canceled', 'expired', 'past_due');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'member',
    "status" "user_status" NOT NULL DEFAULT 'pending_verification',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "destination" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "user_id" UUID,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "push_token" TEXT,
    "platform" TEXT NOT NULL,
    "public_key" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" UUID NOT NULL,
    "nickname" TEXT NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "gender_type" NOT NULL,
    "region_id" UUID,
    "relationship_goals" "relationship_goal"[],
    "bio" TEXT,
    "discreet_mode" BOOLEAN NOT NULL DEFAULT false,
    "low_bandwidth_mode" BOOLEAN NOT NULL DEFAULT false,
    "preferred_language" "language_code" NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "interest_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "interest_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_interest_tags" (
    "profile_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "profile_interest_tags_pkey" PRIMARY KEY ("profile_id","tag_id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "storage_ref" TEXT NOT NULL,
    "position" SMALLINT NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "blurred_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_reveal_grants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "photo_id" UUID NOT NULL,
    "granted_to_user_id" UUID NOT NULL,
    "match_id" UUID,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "photo_reveal_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swipes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "action" "swipe_action" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_a_id" UUID NOT NULL,
    "user_b_id" UUID NOT NULL,
    "status" "match_status" NOT NULL DEFAULT 'active',
    "matched_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unmatched_at" TIMESTAMPTZ,
    "unmatched_by" UUID,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_quiz_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_text" TEXT NOT NULL,
    "question_type" "quiz_question_type" NOT NULL,
    "order_index" SMALLINT NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "compatibility_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_quiz_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "order_index" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "compatibility_quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_quiz_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "response_text" TEXT,
    "response_numeric" DECIMAL(65,30),
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compatibility_quiz_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_quiz_response_options" (
    "response_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,

    CONSTRAINT "compatibility_quiz_response_options_pkey" PRIMARY KEY ("response_id","option_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message_type" "message_type" NOT NULL DEFAULT 'text',
    "ciphertext" BYTEA NOT NULL,
    "nonce" BYTEA NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMPTZ,
    "read_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "storage_ref" TEXT NOT NULL,
    "blurred_default" BOOLEAN NOT NULL DEFAULT true,
    "revealed_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_verification_calls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "initiated_by" UUID NOT NULL,
    "status" "video_call_status" NOT NULL DEFAULT 'scheduled',
    "scheduled_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "video_verification_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporter_id" UUID NOT NULL,
    "reported_id" UUID NOT NULL,
    "match_id" UUID,
    "category" "report_category" NOT NULL,
    "description" TEXT,
    "evidence_ref" TEXT,
    "status" "report_status" NOT NULL DEFAULT 'open',
    "severity" "report_severity" NOT NULL DEFAULT 'low',
    "assigned_to" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID,
    "target_user_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" "moderation_action_type" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "actor_role" "user_role",
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "resource_category" NOT NULL,
    "language" "language_code" NOT NULL DEFAULT 'en',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qa_threads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "health_professional_id" UUID,
    "status" "qa_thread_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ,

    CONSTRAINT "qa_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qa_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "thread_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qa_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "success_stories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submitted_by_user_id" UUID,
    "title" TEXT NOT NULL,
    "story_text" TEXT NOT NULL,
    "approved_by" UUID,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ,

    CONSTRAINT "success_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan" "subscription_plan" NOT NULL DEFAULT 'free',
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "payment_provider" TEXT,
    "external_subscription_id" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_end" TIMESTAMPTZ,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification"."telehealth_partners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "contact_info" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "telehealth_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification"."verification_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "method" "verification_method" NOT NULL DEFAULT 'self_upload',
    "status" "verification_status" NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decision_at" TIMESTAMPTZ,
    "reviewer_id" UUID,
    "rejection_reason" TEXT,
    "expiry_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification"."documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "verification_record_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "storage_ref" TEXT,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification"."liveness_checks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "verification_record_id" UUID NOT NULL,
    "selfie_storage_ref" TEXT,
    "result" "liveness_result" NOT NULL DEFAULT 'manual_review',
    "reviewed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liveness_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification"."telehealth_referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "verification_record_id" UUID NOT NULL,
    "telehealth_partner_id" UUID NOT NULL,
    "reference_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "telehealth_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_otp_codes_destination" ON "otp_codes"("destination");

-- CreateIndex
CREATE INDEX "idx_devices_user_id" ON "devices"("user_id");

-- CreateIndex
CREATE INDEX "idx_profiles_region_id" ON "profiles"("region_id");

-- CreateIndex
CREATE UNIQUE INDEX "interest_tags_name_key" ON "interest_tags"("name");

-- CreateIndex
CREATE INDEX "idx_photos_profile_id" ON "photos"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "photo_reveal_grants_photo_id_granted_to_user_id_key" ON "photo_reveal_grants"("photo_id", "granted_to_user_id");

-- CreateIndex
CREATE INDEX "idx_swipes_target_id" ON "swipes"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "swipes_actor_id_target_id_key" ON "swipes"("actor_id", "target_id");

-- CreateIndex
CREATE INDEX "idx_matches_user_a_id" ON "matches"("user_a_id");

-- CreateIndex
CREATE INDEX "idx_matches_user_b_id" ON "matches"("user_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user_a_id_user_b_id_key" ON "matches"("user_a_id", "user_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "compatibility_quiz_responses_profile_id_question_id_key" ON "compatibility_quiz_responses"("profile_id", "question_id");

-- CreateIndex
CREATE INDEX "idx_messages_match_id_sent_at" ON "messages"("match_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_blocker_id_blocked_id_key" ON "blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "idx_reports_status_severity" ON "reports"("status", "severity");

-- CreateIndex
CREATE INDEX "idx_audit_logs_target" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_qa_messages_thread_id" ON "qa_messages"("thread_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_verification_records_user_id" ON "verification"."verification_records"("user_id");

-- CreateIndex
CREATE INDEX "idx_verification_records_status" ON "verification"."verification_records"("status");

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interest_tags" ADD CONSTRAINT "profile_interest_tags_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interest_tags" ADD CONSTRAINT "profile_interest_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "interest_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_reveal_grants" ADD CONSTRAINT "photo_reveal_grants_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_reveal_grants" ADD CONSTRAINT "photo_reveal_grants_granted_to_user_id_fkey" FOREIGN KEY ("granted_to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_reveal_grants" ADD CONSTRAINT "photo_reveal_grants_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_unmatched_by_fkey" FOREIGN KEY ("unmatched_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_quiz_options" ADD CONSTRAINT "compatibility_quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "compatibility_quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_quiz_responses" ADD CONSTRAINT "compatibility_quiz_responses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_quiz_responses" ADD CONSTRAINT "compatibility_quiz_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "compatibility_quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_quiz_response_options" ADD CONSTRAINT "compatibility_quiz_response_options_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "compatibility_quiz_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_quiz_response_options" ADD CONSTRAINT "compatibility_quiz_response_options_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "compatibility_quiz_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_verification_calls" ADD CONSTRAINT "video_verification_calls_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_verification_calls" ADD CONSTRAINT "video_verification_calls_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_threads" ADD CONSTRAINT "qa_threads_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_threads" ADD CONSTRAINT "qa_threads_health_professional_id_fkey" FOREIGN KEY ("health_professional_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_messages" ADD CONSTRAINT "qa_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "qa_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_messages" ADD CONSTRAINT "qa_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "success_stories" ADD CONSTRAINT "success_stories_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "success_stories" ADD CONSTRAINT "success_stories_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."verification_records" ADD CONSTRAINT "verification_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."verification_records" ADD CONSTRAINT "verification_records_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."documents" ADD CONSTRAINT "documents_verification_record_id_fkey" FOREIGN KEY ("verification_record_id") REFERENCES "verification"."verification_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."liveness_checks" ADD CONSTRAINT "liveness_checks_verification_record_id_fkey" FOREIGN KEY ("verification_record_id") REFERENCES "verification"."verification_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."liveness_checks" ADD CONSTRAINT "liveness_checks_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."telehealth_referrals" ADD CONSTRAINT "telehealth_referrals_verification_record_id_fkey" FOREIGN KEY ("verification_record_id") REFERENCES "verification"."verification_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."telehealth_referrals" ADD CONSTRAINT "telehealth_referrals_telehealth_partner_id_fkey" FOREIGN KEY ("telehealth_partner_id") REFERENCES "verification"."telehealth_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

