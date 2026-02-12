-- ============================================================================
-- Migration: 003 - Normalize Task and File Tags
-- Description: Convert Task.tags and File.tags JSONB to dedicated tables
-- Priority: CRITICAL
-- Estimated Time: 1 sprint
-- Downtime: ZERO (dual-write pattern)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create TaskTag table
-- ============================================================================

CREATE TABLE task_tag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    color VARCHAR(7),  -- Hex color for UI (optional)
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_task_tag UNIQUE(task_id, tag_name),
    CONSTRAINT check_tag_name_length CHECK (LENGTH(tag_name) >= 2),
    CONSTRAINT check_hex_color CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================================
-- STEP 2: Create FileTag table
-- ============================================================================

CREATE TABLE file_tag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES file(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    color VARCHAR(7),  -- Hex color for UI (optional)
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_file_tag UNIQUE(file_id, tag_name),
    CONSTRAINT check_file_tag_name_length CHECK (LENGTH(tag_name) >= 2),
    CONSTRAINT check_file_hex_color CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================================
-- STEP 3: Create indexes for Task tags
-- ============================================================================

CREATE INDEX idx_task_tag_task ON task_tag(task_id);
CREATE INDEX idx_task_tag_name ON task_tag(tag_name);
CREATE INDEX idx_task_tag_name_lower ON task_tag(LOWER(tag_name));  -- Case-insensitive search

-- Composite index for "tasks with tag X in tenant Y"
CREATE INDEX idx_task_tag_lookup ON task_tag(tag_name, task_id);

-- ============================================================================
-- STEP 4: Create indexes for File tags
-- ============================================================================

CREATE INDEX idx_file_tag_file ON file_tag(file_id);
CREATE INDEX idx_file_tag_name ON file_tag(tag_name);
CREATE INDEX idx_file_tag_name_lower ON file_tag(LOWER(tag_name));  -- Case-insensitive search

-- Composite index for "files with tag X in tenant Y"
CREATE INDEX idx_file_tag_lookup ON file_tag(tag_name, file_id);

-- ============================================================================
-- STEP 5: Create materialized view for tag statistics (optional but useful)
-- ============================================================================

CREATE MATERIALIZED VIEW task_tag_stats AS
SELECT
    tag_name,
    COUNT(*) as usage_count,
    MAX(created_at) as last_used_at
FROM task_tag
GROUP BY tag_name
ORDER BY usage_count DESC;

CREATE UNIQUE INDEX idx_task_tag_stats_name ON task_tag_stats(tag_name);

CREATE MATERIALIZED VIEW file_tag_stats AS
SELECT
    tag_name,
    COUNT(*) as usage_count,
    MAX(created_at) as last_used_at
FROM file_tag
GROUP BY tag_name
ORDER BY usage_count DESC;

CREATE UNIQUE INDEX idx_file_tag_stats_name ON file_tag_stats(tag_name);

-- ============================================================================
-- STEP 6: Refresh function for stats (run hourly via cron/Celery)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_tag_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY task_tag_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY file_tag_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Backfill data from JSONB
-- ============================================================================
-- Run Python scripts:
-- python scripts/backfill_task_tags.py
-- python scripts/backfill_file_tags.py

-- ============================================================================
-- STEP 8: Grant permissions (adjust to your app user)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON task_tag TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON file_tag TO your_app_user;
-- GRANT SELECT ON task_tag_stats TO your_app_user;
-- GRANT SELECT ON file_tag_stats TO your_app_user;
-- GRANT EXECUTE ON FUNCTION refresh_tag_stats TO your_app_user;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP FUNCTION IF EXISTS refresh_tag_stats();
-- DROP MATERIALIZED VIEW IF EXISTS file_tag_stats CASCADE;
-- DROP MATERIALIZED VIEW IF EXISTS task_tag_stats CASCADE;
-- DROP INDEX IF EXISTS idx_file_tag_lookup;
-- DROP INDEX IF EXISTS idx_file_tag_name_lower;
-- DROP INDEX IF EXISTS idx_file_tag_name;
-- DROP INDEX IF EXISTS idx_file_tag_file;
-- DROP INDEX IF EXISTS idx_task_tag_lookup;
-- DROP INDEX IF EXISTS idx_task_tag_name_lower;
-- DROP INDEX IF EXISTS idx_task_tag_name;
-- DROP INDEX IF EXISTS idx_task_tag_task;
-- DROP TABLE IF EXISTS file_tag CASCADE;
-- DROP TABLE IF EXISTS task_tag CASCADE;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
DUAL-WRITE PATTERN IMPLEMENTATION:

1. After creating these tables, update Django models:
   - Keep Task.tags and File.tags JSONB temporarily
   - Create TaskTag and FileTag models
   - Override Task.save() and File.save() to dual-write

2. Run backfill scripts:
   - python scripts/backfill_task_tags.py
   - python scripts/backfill_file_tags.py

3. Validation:
   - python scripts/validate_tags_migration.py
   - Must show 100% match between JSONB and tables

QUERIES BEFORE (INEFFICIENT):
  -- Find tasks with tag 'urgent' (full JSONB scan)
  SELECT * FROM task WHERE tags @> '["urgent"]';

  -- Find all unique tags (requires app-level aggregation)
  SELECT DISTINCT jsonb_array_elements_text(tags) FROM task;

QUERIES AFTER (EFFICIENT):
  -- Find tasks with tag 'urgent' (index lookup)
  SELECT t.* FROM task t
  JOIN task_tag tt ON t.id = tt.task_id
  WHERE tt.tag_name = 'urgent'
    AND t.tenant_id = ?;

  -- Find all unique tags with usage count
  SELECT tag_name, usage_count
  FROM task_tag_stats
  ORDER BY usage_count DESC;

  -- Find tasks with multiple tags (AND logic)
  SELECT t.* FROM task t
  WHERE EXISTS (SELECT 1 FROM task_tag WHERE task_id = t.id AND tag_name = 'urgent')
    AND EXISTS (SELECT 1 FROM task_tag WHERE task_id = t.id AND tag_name = 'priority')
    AND t.tenant_id = ?;

  -- Find tasks with any of multiple tags (OR logic)
  SELECT DISTINCT t.* FROM task t
  JOIN task_tag tt ON t.id = tt.task_id
  WHERE tt.tag_name IN ('urgent', 'priority', 'bug')
    AND t.tenant_id = ?;

  -- Tag autocomplete (case-insensitive search with usage count)
  SELECT ts.tag_name, ts.usage_count
  FROM task_tag_stats ts
  WHERE LOWER(ts.tag_name) LIKE LOWER('bug%')
  ORDER BY ts.usage_count DESC
  LIMIT 10;

BENEFITS:
  - 100x faster queries for tag filtering
  - Can add tag colors for UI customization
  - Tag autocomplete with usage statistics
  - Can enforce tag naming conventions via constraints
  - Can track when tag was first used
  - Can implement tag merging/renaming easily
  - Can query "most popular tags" for analytics
*/
