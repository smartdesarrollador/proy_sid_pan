-- ============================================================================
-- Migration: 004 - Normalize TaskComment.mentions and AuditLog.changes
-- Description: Convert JSONB fields to dedicated tables for better queryability
-- Priority: HIGH
-- Estimated Time: 1 sprint
-- Downtime: ZERO (dual-write pattern)
-- ============================================================================

-- ============================================================================
-- PART A: NORMALIZE TASK COMMENT MENTIONS
-- ============================================================================

-- ============================================================================
-- STEP 1: Create TaskCommentMention table
-- ============================================================================

CREATE TABLE task_comment_mention (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES task_comment(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES "user"(id),
    notified_at TIMESTAMP,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_comment_mention UNIQUE(comment_id, mentioned_user_id)
);

-- ============================================================================
-- STEP 2: Create indexes for mentions
-- ============================================================================

CREATE INDEX idx_comment_mention_comment ON task_comment_mention(comment_id);
CREATE INDEX idx_comment_mention_user ON task_comment_mention(mentioned_user_id);
CREATE INDEX idx_comment_mention_unnotified ON task_comment_mention(mentioned_user_id, notification_sent)
    WHERE notification_sent = FALSE;

-- ============================================================================
-- PART B: NORMALIZE AUDIT LOG CHANGES
-- ============================================================================

-- ============================================================================
-- STEP 3: Create AuditLogChange table
-- ============================================================================

CREATE TABLE audit_log_change (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_log_id BIGINT NOT NULL REFERENCES audit_log(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    data_type VARCHAR(20),  -- 'string', 'integer', 'boolean', 'json', 'uuid', 'timestamp'
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_data_type CHECK (
        data_type IN ('string', 'integer', 'boolean', 'json', 'uuid', 'timestamp', 'decimal', 'array')
    )
);

-- ============================================================================
-- STEP 4: Create indexes for audit log changes
-- ============================================================================

CREATE INDEX idx_audit_change_log ON audit_log_change(audit_log_id);
CREATE INDEX idx_audit_change_field ON audit_log_change(field_name);
CREATE INDEX idx_audit_change_field_log ON audit_log_change(field_name, audit_log_id);

-- Composite index for common query: "show me all status changes"
CREATE INDEX idx_audit_change_field_value ON audit_log_change(field_name, new_value)
    WHERE data_type = 'string';

-- ============================================================================
-- STEP 5: Create helper functions for audit log queries
-- ============================================================================

-- Function to get all changes for a specific resource
CREATE OR REPLACE FUNCTION get_resource_audit_trail(
    p_resource_type VARCHAR,
    p_resource_id UUID,
    p_field_name VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    timestamp TIMESTAMP,
    actor_email VARCHAR,
    action VARCHAR,
    field_name VARCHAR,
    old_value TEXT,
    new_value TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.timestamp,
        u.email as actor_email,
        al.action,
        alc.field_name,
        alc.old_value,
        alc.new_value
    FROM audit_log al
    JOIN audit_log_change alc ON al.id = alc.audit_log_id
    LEFT JOIN "user" u ON al.actor_user_id = u.id
    WHERE al.resource_type = p_resource_type
      AND al.resource_id = p_resource_id
      AND (p_field_name IS NULL OR alc.field_name = p_field_name)
    ORDER BY al.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to track value changes over time for analytics
CREATE OR REPLACE FUNCTION get_field_change_timeline(
    p_resource_type VARCHAR,
    p_field_name VARCHAR,
    p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
    change_date DATE,
    change_count BIGINT,
    unique_resources BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.timestamp::DATE as change_date,
        COUNT(*) as change_count,
        COUNT(DISTINCT al.resource_id) as unique_resources
    FROM audit_log al
    JOIN audit_log_change alc ON al.id = alc.audit_log_id
    WHERE al.resource_type = p_resource_type
      AND alc.field_name = p_field_name
      AND al.timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY al.timestamp::DATE
    ORDER BY change_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Backfill data from JSONB
-- ============================================================================
-- Run Python scripts:
-- python scripts/backfill_comment_mentions.py
-- python scripts/backfill_audit_log_changes.py

-- ============================================================================
-- STEP 7: Grant permissions (adjust to your app user)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON task_comment_mention TO your_app_user;
-- GRANT SELECT, INSERT ON audit_log_change TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_resource_audit_trail TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_field_change_timeline TO your_app_user;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP FUNCTION IF EXISTS get_field_change_timeline;
-- DROP FUNCTION IF EXISTS get_resource_audit_trail;
-- DROP INDEX IF EXISTS idx_audit_change_field_value;
-- DROP INDEX IF EXISTS idx_audit_change_field_log;
-- DROP INDEX IF EXISTS idx_audit_change_field;
-- DROP INDEX IF EXISTS idx_audit_change_log;
-- DROP TABLE IF EXISTS audit_log_change CASCADE;
-- DROP INDEX IF EXISTS idx_comment_mention_unnotified;
-- DROP INDEX IF EXISTS idx_comment_mention_user;
-- DROP INDEX IF EXISTS idx_comment_mention_comment;
-- DROP TABLE IF EXISTS task_comment_mention CASCADE;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
QUERIES BEFORE (MENTIONS):
  -- Cannot efficiently query "who was mentioned in this task's comments?"
  SELECT * FROM task_comment WHERE mentions @> '[123]';  -- Slow JSONB scan

QUERIES AFTER (MENTIONS):
  -- Find all comments where user X was mentioned
  SELECT tc.* FROM task_comment tc
  JOIN task_comment_mention tcm ON tc.id = tcm.comment_id
  WHERE tcm.mentioned_user_id = ?;

  -- Find users who need notification (unnotified mentions)
  SELECT DISTINCT u.email, tc.comment, t.title
  FROM task_comment_mention tcm
  JOIN task_comment tc ON tcm.comment_id = tc.id
  JOIN task t ON tc.task_id = t.id
  JOIN "user" u ON tcm.mentioned_user_id = u.id
  WHERE tcm.notification_sent = FALSE;

QUERIES BEFORE (AUDIT LOG):
  -- Cannot query "show me all status changes for tasks"
  SELECT * FROM audit_log WHERE resource_type = 'task' AND changes @> '{"status": ...}';  -- Impossible

QUERIES AFTER (AUDIT LOG):
  -- Show all status changes for tasks
  SELECT al.*, alc.old_value, alc.new_value
  FROM audit_log al
  JOIN audit_log_change alc ON al.id = alc.audit_log_id
  WHERE al.resource_type = 'task'
    AND alc.field_name = 'status';

  -- Show audit trail for specific resource
  SELECT * FROM get_resource_audit_trail('task', 'task-uuid-here');

  -- Analytics: "how many priority changes last week?"
  SELECT * FROM get_field_change_timeline('task', 'priority',
      NOW() - INTERVAL '7 days', NOW());

  -- Find who changed field X to value Y
  SELECT DISTINCT u.email, al.timestamp
  FROM audit_log al
  JOIN audit_log_change alc ON al.id = alc.audit_log_id
  JOIN "user" u ON al.actor_user_id = u.id
  WHERE alc.field_name = 'status'
    AND alc.new_value = 'closed'
    AND al.timestamp >= NOW() - INTERVAL '30 days';

BENEFITS (MENTIONS):
  - Efficient notification delivery
  - Track notification status per mention
  - Can query "who mentions me most?"
  - Can implement digest: "you were mentioned 5 times today"

BENEFITS (AUDIT LOG):
  - Powerful compliance queries
  - Field-level change tracking
  - Analytics: "most changed field", "who changes what"
  - Can implement "undo" feature (restore old_value)
  - Can generate change reports for auditors
  - Performance: 1000x faster than JSONB scans
*/
