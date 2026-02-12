-- ============================================================================
-- Migration: 002 - Normalize Event Reminders
-- Description: Convert Event.reminders JSONB to EventReminder table
-- Priority: CRITICAL
-- Estimated Time: 1 sprint
-- Downtime: ZERO (dual-write pattern)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create new normalized table
-- ============================================================================

CREATE TABLE event_reminder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL,  -- 'email', 'push', 'sms', 'in_app'
    minutes_before INTEGER NOT NULL CHECK (minutes_before > 0),     -- 15, 30, 60, 1440 (1 day), 10080 (1 week)
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    error_message TEXT,  -- If sending failed
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_event_reminder UNIQUE(event_id, reminder_type, minutes_before),
    CONSTRAINT check_reminder_type CHECK (
        reminder_type IN ('email', 'push', 'sms', 'in_app')
    ),
    CONSTRAINT check_sent_logic CHECK (
        (is_sent = FALSE AND sent_at IS NULL) OR
        (is_sent = TRUE AND sent_at IS NOT NULL)
    )
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX idx_event_reminder_event ON event_reminder(event_id);
CREATE INDEX idx_event_reminder_unsent ON event_reminder(event_id, is_sent, sent_at)
    WHERE is_sent = FALSE;
CREATE INDEX idx_event_reminder_type ON event_reminder(reminder_type);

-- Composite index for reminder job queries
CREATE INDEX idx_event_reminder_job ON event_reminder(is_sent, sent_at, event_id)
    WHERE is_sent = FALSE;

-- ============================================================================
-- STEP 3: Backfill data from Event.reminders JSONB
-- ============================================================================
-- Run Python script: scripts/backfill_event_reminders.py
-- Example JSONB format:
-- {
--   "email": [15, 60],     -- 15min and 1h before
--   "push": [30],          -- 30min before
--   "in_app": [1440]       -- 1 day before
-- }

-- ============================================================================
-- STEP 4: Add trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_event_reminder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_reminder_update_timestamp
BEFORE UPDATE ON event_reminder
FOR EACH ROW EXECUTE FUNCTION update_event_reminder_timestamp();

-- ============================================================================
-- STEP 5: Create helper function to calculate trigger time
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_reminder_trigger_time(
    event_start_time TIMESTAMP,
    minutes_before INTEGER
) RETURNS TIMESTAMP AS $$
BEGIN
    RETURN event_start_time - (minutes_before || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 6: Grant permissions (adjust to your app user)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON event_reminder TO your_app_user;
-- GRANT EXECUTE ON FUNCTION calculate_reminder_trigger_time TO your_app_user;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP FUNCTION IF EXISTS calculate_reminder_trigger_time;
-- DROP TRIGGER IF EXISTS event_reminder_update_timestamp ON event_reminder;
-- DROP FUNCTION IF EXISTS update_event_reminder_timestamp();
-- DROP INDEX IF EXISTS idx_event_reminder_job;
-- DROP INDEX IF EXISTS idx_event_reminder_type;
-- DROP INDEX IF EXISTS idx_event_reminder_unsent;
-- DROP INDEX IF EXISTS idx_event_reminder_event;
-- DROP TABLE IF EXISTS event_reminder CASCADE;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
DUAL-WRITE PATTERN IMPLEMENTATION:

1. After creating this table, update Django models:
   - Keep Event.reminders JSONB temporarily
   - Create EventReminder model
   - Override Event.save() to dual-write

2. Run backfill script:
   - python scripts/backfill_event_reminders.py

3. Validation:
   - python scripts/validate_event_reminders_migration.py
   - Must show 100% match between JSONB and table

QUERIES BEFORE (IMPOSSIBLE):
  -- Cannot filter events by reminder type efficiently
  SELECT * FROM event WHERE reminders @> '{"email": [15]}';  -- Slow JSONB scan

QUERIES AFTER:
  -- Find all events with email reminders 15min before
  SELECT e.* FROM event e
  JOIN event_reminder er ON e.id = er.event_id
  WHERE er.reminder_type = 'email'
    AND er.minutes_before = 15
    AND er.is_sent = FALSE;

  -- Find reminders to send in next 5 minutes
  SELECT e.*, er.*
  FROM event e
  JOIN event_reminder er ON e.id = er.event_id
  WHERE er.is_sent = FALSE
    AND calculate_reminder_trigger_time(e.start_time, er.minutes_before)
        BETWEEN NOW() AND NOW() + INTERVAL '5 minutes';

BENEFITS:
  - Efficient queries for reminder job (cron/Celery)
  - Track sent status per reminder
  - Retry failed reminders
  - Analytics: "how many email reminders sent last month?"
  - Can add new reminder types without schema change
*/
