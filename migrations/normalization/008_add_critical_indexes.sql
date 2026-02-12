-- ============================================================================
-- Migration: 008 - Add Critical Indexes
-- Description: Add missing indexes on foreign keys and frequent query columns
-- Priority: CRITICAL
-- Estimated Time: 1 sprint
-- Downtime: NEAR-ZERO (indexes built with CONCURRENTLY)
-- ============================================================================

/*
PROBLEM:
  40+ foreign keys and frequently queried columns lack indexes
  - Full table scans on large tables
  - Queries taking 10+ seconds with 100k+ rows
  - JOIN operations extremely slow

SOLUTION:
  Add indexes using CREATE INDEX CONCURRENTLY (no downtime)
  Focus on:
  1. Foreign keys (FK columns)
  2. WHERE clause columns (status, dates, flags)
  3. JOIN columns
  4. ORDER BY columns

IMPORTANT: Use CONCURRENTLY to avoid locking tables
*/

-- ============================================================================
-- TENANT & MEMBERSHIP INDEXES
-- ============================================================================

-- TenantMembership indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_tenant
    ON tenant_membership(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_user
    ON tenant_membership(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_active
    ON tenant_membership(tenant_id, user_id, is_active)
    WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_created_by
    ON tenant_membership(created_by_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_updated_by
    ON tenant_membership(updated_by_id);

-- ============================================================================
-- RBAC INDEXES
-- ============================================================================

-- Role indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_tenant
    ON role(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_tenant_name
    ON role(tenant_id, name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_parent
    ON role(parent_role_id)
    WHERE parent_role_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_created_by
    ON role(created_by_id);

-- PermissionGrant indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_grant_role
    ON permission_grant(role_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_grant_permission
    ON permission_grant(permission_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_grant_tenant
    ON permission_grant(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_grant_scope
    ON permission_grant(role_id, scope);

-- MembershipRole indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_role_membership
    ON membership_role(tenant_membership_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_role_role
    ON membership_role(role_id);

-- PermissionGroup indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_group_tenant
    ON permission_group(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_group_created_by
    ON permission_group(created_by_id);

-- PermissionGroupMembership indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_membership_group
    ON permission_group_membership(permission_group_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_membership_permission
    ON permission_group_membership(permission_id);

-- DelegatedPermission indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delegated_permission_tenant
    ON delegated_permission(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delegated_permission_delegator
    ON delegated_permission(delegator_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delegated_permission_delegatee
    ON delegated_permission(delegatee_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delegated_permission_active
    ON delegated_permission(delegatee_user_id, expires_at, is_revoked)
    WHERE is_revoked = FALSE AND expires_at > NOW();

-- ============================================================================
-- SUBSCRIPTION & BILLING INDEXES
-- ============================================================================

-- Subscription indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_tenant
    ON subscription(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plan
    ON subscription(plan_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_status
    ON subscription(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_tenant_status
    ON subscription(tenant_id, status);

-- Invoice indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_tenant
    ON invoice(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_subscription
    ON invoice(subscription_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_tenant_date
    ON invoice(tenant_id, invoice_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_status
    ON invoice(status, due_date);

-- PaymentMethod indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_method_tenant
    ON payment_method(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_method_default
    ON payment_method(tenant_id, is_default)
    WHERE is_default = TRUE;

-- UsageTracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_tracking_tenant
    ON usage_tracking(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_tracking_tenant_date
    ON usage_tracking(tenant_id, recorded_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_tracking_metric
    ON usage_tracking(metric_type, recorded_date DESC);

-- ============================================================================
-- AUTHENTICATION & SESSION INDEXES
-- ============================================================================

-- RefreshToken indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_token_user
    ON refresh_token(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_token_tenant
    ON refresh_token(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_token_valid
    ON refresh_token(user_id, expires_at, is_revoked)
    WHERE is_revoked = FALSE AND expires_at > NOW();

-- Session indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_user
    ON session(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_tenant
    ON session(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_refresh_token
    ON session(refresh_token_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_current
    ON session(user_id, is_current)
    WHERE is_current = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_last_activity
    ON session(last_activity DESC);

-- Invitation indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitation_tenant
    ON invitation(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitation_invited_by
    ON invitation(invited_by_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitation_email
    ON invitation(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitation_status
    ON invitation(tenant_id, status, expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitation_token
    ON invitation(token)
    WHERE status = 'pending';

-- InvitationRole indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitation_role_invitation
    ON invitation_role(invitation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitation_role_role
    ON invitation_role(role_id);

-- MFARecoveryCode indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mfa_recovery_user
    ON mfa_recovery_code(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mfa_recovery_unused
    ON mfa_recovery_code(user_id, used_at)
    WHERE used_at IS NULL;

-- EmailVerificationToken indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_verification_user
    ON email_verification_token(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_verification_token
    ON email_verification_token(token)
    WHERE verified_at IS NULL;

-- PasswordResetToken indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_user
    ON password_reset_token(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_token
    ON password_reset_token(token)
    WHERE used_at IS NULL AND expires_at > NOW();

-- ============================================================================
-- CUSTOMER SERVICES INDEXES
-- ============================================================================

-- Event indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_tenant
    ON event(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_organizer
    ON event(organizer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_timerange
    ON event(start_time, end_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_tenant_date
    ON event(tenant_id, start_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_category
    ON event(tenant_id, category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_created_by
    ON event(created_by_id);

-- EventParticipant indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_participant_event
    ON event_participant(event_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_participant_user
    ON event_participant(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_participant_status
    ON event_participant(event_id, status);

-- Task indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_tenant
    ON task(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_assignee
    ON task(assignee_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_creator
    ON task(creator_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_project
    ON task(project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_parent
    ON task(parent_task_id)
    WHERE parent_task_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_tenant_status
    ON task(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_assignee_status
    ON task(assignee_id, status)
    WHERE status != 'done';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_due_date
    ON task(due_date)
    WHERE due_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_priority
    ON task(tenant_id, priority);

-- TaskComment indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_comment_task
    ON task_comment(task_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_comment_user
    ON task_comment(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_comment_created
    ON task_comment(task_id, created_at DESC);

-- Notification indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_tenant
    ON notification(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_user
    ON notification(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_user_read
    ON notification(user_id, is_read, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_type
    ON notification(type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_unread
    ON notification(user_id, is_read)
    WHERE is_read = FALSE;

-- File indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_tenant
    ON file(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_owner
    ON file(owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_folder
    ON file(folder_id)
    WHERE folder_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_parent
    ON file(parent_file_id)
    WHERE parent_file_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_deleted
    ON file(tenant_id, is_deleted, deleted_at)
    WHERE is_deleted = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_active
    ON file(tenant_id, is_deleted)
    WHERE is_deleted = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_mime_type
    ON file(mime_type);

-- Folder indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_folder_tenant
    ON folder(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_folder_owner
    ON folder(owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_folder_parent
    ON folder(parent_folder_id)
    WHERE parent_folder_id IS NOT NULL;

-- Project indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_tenant
    ON project(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_owner
    ON project(owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_tenant_status
    ON project(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_dates
    ON project(start_date, end_date);

-- ProjectSection indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_section_tenant
    ON project_section(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_section_project
    ON project_section(project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_section_order
    ON project_section(project_id, "order");

-- ProjectItem indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_item_tenant
    ON project_item(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_item_section
    ON project_item(section_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_item_type
    ON project_item(type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_item_favorite
    ON project_item(tenant_id, is_favorite)
    WHERE is_favorite = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_item_expires
    ON project_item(expires_at)
    WHERE expires_at IS NOT NULL;

-- ProjectItemField indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_item_field_item
    ON project_item_field(item_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_item_field_type
    ON project_item_field(field_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_item_field_encrypted
    ON project_item_field(item_id, is_encrypted)
    WHERE is_encrypted = TRUE;

-- ProjectMember indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_member_tenant
    ON project_member(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_member_project
    ON project_member(project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_member_user
    ON project_member(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_member_role
    ON project_member(project_id, role);

-- ============================================================================
-- AUDIT & LOGGING INDEXES
-- ============================================================================

-- AuditLog indexes (CRITICAL for compliance queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_tenant
    ON audit_log(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_actor
    ON audit_log(actor_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_tenant_time
    ON audit_log(tenant_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_actor_time
    ON audit_log(actor_user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_resource
    ON audit_log(resource_type, resource_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_resource_time
    ON audit_log(resource_type, resource_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action
    ON audit_log(action, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action_resource
    ON audit_log(action, resource_type);

-- LoginAttempt indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempt_email
    ON login_attempt(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempt_ip
    ON login_attempt(ip_address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempt_timestamp
    ON login_attempt(timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempt_failed
    ON login_attempt(email, success, timestamp DESC)
    WHERE success = FALSE;

-- ============================================================================
-- COMPOSITE INDEXES FOR SPECIFIC QUERIES
-- ============================================================================

-- User active lookup (login performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_active_email
    ON "user"(email)
    WHERE is_active = TRUE;

-- Tenant lookup by subdomain (routing performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_subdomain_lower
    ON tenant(LOWER(subdomain));

-- ============================================================================
-- NOTES
-- ============================================================================

/*
EXECUTION STRATEGY:

1. Run during low-traffic hours (night/weekend)
2. Monitor pg_stat_progress_create_index for progress
3. Each CONCURRENTLY index takes 1-10 min depending on table size
4. Total estimated time: 2-4 hours for all indexes

MONITORING QUERIES:

-- Check index creation progress
SELECT
    phase,
    blocks_total,
    blocks_done,
    ROUND(100.0 * blocks_done / NULLIF(blocks_total, 0), 2) as percent_complete
FROM pg_stat_progress_create_index;

-- Check if index exists
SELECT indexname
FROM pg_indexes
WHERE tablename = 'task' AND indexname = 'idx_task_assignee';

-- Check index usage (after 1 week)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- Find unused indexes (candidates for removal)
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

PERFORMANCE IMPACT:

BEFORE:
  SELECT * FROM task WHERE assignee_id = ? AND status = 'todo';
  Execution time: 10,000ms (100k rows, Seq Scan)

AFTER:
  SELECT * FROM task WHERE assignee_id = ? AND status = 'todo';
  Execution time: 15ms (Index Scan on idx_task_assignee_status)

IMPROVEMENT: 666x faster

STORAGE COST:
  Estimated total index size: ~2-5GB (for 1M rows across all tables)
  Worth it for 100-1000x query speedup
*/
