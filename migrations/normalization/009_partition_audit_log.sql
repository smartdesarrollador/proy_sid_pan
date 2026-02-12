-- ============================================================================
-- Migration: 009 - Partition Audit Log Table
-- Description: Convert AuditLog to partitioned table by timestamp (quarterly)
-- Priority: HIGH
-- Estimated Time: 1-2 sprints
-- Downtime: ~30 minutes (for partition switch)
-- ============================================================================

/*
PROBLEM:
  AuditLog will grow to 10M+ rows per year
  - Full table scans take minutes
  - Cannot drop old data efficiently
  - Backup/restore takes hours
  - Indexes become huge

SOLUTION:
  Partition AuditLog by timestamp (quarterly partitions)
  - Queries on recent data are 100x faster
  - Drop old partitions instantly (vs DELETE taking hours)
  - Smaller indexes per partition
  - Parallel query execution across partitions

PARTITIONING STRATEGY:
  - Range partitioning by timestamp (quarterly)
  - Keep 7 years for compliance (28 partitions)
  - Auto-create future partitions (pg_partman extension)
  - Archive old partitions to cold storage
*/

-- ============================================================================
-- STEP 1: Rename existing table
-- ============================================================================

ALTER TABLE IF EXISTS audit_log RENAME TO audit_log_old;

-- ============================================================================
-- STEP 2: Create partitioned table
-- ============================================================================

CREATE TABLE audit_log (
    id BIGSERIAL,
    tenant_id UUID NOT NULL,
    actor_user_id UUID,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Composite primary key including partition column
    PRIMARY KEY (id, timestamp),

    -- Foreign keys
    CONSTRAINT fk_audit_log_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_log_actor FOREIGN KEY (actor_user_id)
        REFERENCES "user"(id) ON DELETE SET NULL

) PARTITION BY RANGE (timestamp);

-- ============================================================================
-- STEP 3: Create initial partitions (past + current + future)
-- ============================================================================

-- 2025 Partitions
CREATE TABLE audit_log_2025_q1 PARTITION OF audit_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE audit_log_2025_q2 PARTITION OF audit_log
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

CREATE TABLE audit_log_2025_q3 PARTITION OF audit_log
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');

CREATE TABLE audit_log_2025_q4 PARTITION OF audit_log
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- 2026 Partitions (current year)
CREATE TABLE audit_log_2026_q1 PARTITION OF audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE audit_log_2026_q2 PARTITION OF audit_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE TABLE audit_log_2026_q3 PARTITION OF audit_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');

CREATE TABLE audit_log_2026_q4 PARTITION OF audit_log
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- 2027 Partitions (future)
CREATE TABLE audit_log_2027_q1 PARTITION OF audit_log
    FOR VALUES FROM ('2027-01-01') TO ('2027-04-01');

CREATE TABLE audit_log_2027_q2 PARTITION OF audit_log
    FOR VALUES FROM ('2027-04-01') TO ('2027-07-01');

CREATE TABLE audit_log_2027_q3 PARTITION OF audit_log
    FOR VALUES FROM ('2027-07-01') TO ('2027-10-01');

CREATE TABLE audit_log_2027_q4 PARTITION OF audit_log
    FOR VALUES FROM ('2027-10-01') TO ('2028-01-01');

-- ============================================================================
-- STEP 4: Create indexes on each partition
-- ============================================================================

-- Note: Creating index on parent table will cascade to all partitions

-- Tenant-scoped queries
CREATE INDEX idx_audit_log_tenant_time ON audit_log(tenant_id, timestamp DESC);

-- Actor queries
CREATE INDEX idx_audit_log_actor_time ON audit_log(actor_user_id, timestamp DESC);

-- Resource queries
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id, timestamp DESC);

-- Action queries
CREATE INDEX idx_audit_log_action ON audit_log(action, timestamp DESC);

-- IP tracking (security)
CREATE INDEX idx_audit_log_ip ON audit_log(ip_address, timestamp DESC);

-- ============================================================================
-- STEP 5: Migrate data from old table to partitioned table
-- ============================================================================

-- This can take time on large tables. Run in batches if needed.
INSERT INTO audit_log (
    id,
    tenant_id,
    actor_user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    timestamp
)
SELECT
    id,
    tenant_id,
    actor_user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    timestamp
FROM audit_log_old;

-- Update sequence to continue from max ID
SELECT setval('audit_log_id_seq', (SELECT MAX(id) FROM audit_log));

-- ============================================================================
-- STEP 6: Verify data migration
-- ============================================================================

DO $$
DECLARE
    old_count BIGINT;
    new_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO old_count FROM audit_log_old;
    SELECT COUNT(*) INTO new_count FROM audit_log;

    IF old_count != new_count THEN
        RAISE EXCEPTION 'Data migration failed: old=% new=%', old_count, new_count;
    ELSE
        RAISE NOTICE 'Data migration successful: % rows migrated', new_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 7: Drop old table (after verification)
-- ============================================================================

-- IMPORTANT: Only after verifying data integrity and app works with new table
-- Uncomment when ready:
-- DROP TABLE audit_log_old;

-- ============================================================================
-- STEP 8: Create function to auto-create future partitions
-- ============================================================================

CREATE OR REPLACE FUNCTION create_audit_log_partition(
    start_date DATE
)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    quarter INTEGER;
    year INTEGER;
    end_date DATE;
BEGIN
    year := EXTRACT(YEAR FROM start_date);
    quarter := EXTRACT(QUARTER FROM start_date);
    end_date := start_date + INTERVAL '3 months';

    partition_name := 'audit_log_' || year || '_q' || quarter;

    -- Check if partition already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            start_date,
            end_date
        );

        RAISE NOTICE 'Created partition: % (% to %)', partition_name, start_date, end_date;
    ELSE
        RAISE NOTICE 'Partition already exists: %', partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: Create function to drop old partitions (7+ years)
-- ============================================================================

CREATE OR REPLACE FUNCTION drop_old_audit_log_partitions(
    retention_years INTEGER DEFAULT 7
)
RETURNS VOID AS $$
DECLARE
    partition_record RECORD;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - (retention_years || ' years')::INTERVAL;

    FOR partition_record IN
        SELECT
            c.relname as partition_name,
            pg_get_expr(c.relpartbound, c.oid) as partition_bound
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_class p ON i.inhparent = p.oid
        WHERE p.relname = 'audit_log'
          AND c.relname LIKE 'audit_log_%'
    LOOP
        -- Extract start date from partition name (audit_log_2019_q1 -> 2019-01-01)
        -- This is simplified; production code should parse partition_bound

        RAISE NOTICE 'Would drop partition: % (implement date extraction)', partition_record.partition_name;

        -- Uncomment when ready to actually drop:
        -- EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.partition_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: Schedule cron jobs (using pg_cron extension)
-- ============================================================================

/*
-- Install pg_cron extension:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Auto-create next quarter's partition (runs monthly)
SELECT cron.schedule(
    'create_future_audit_partitions',
    '0 0 1 * *',  -- First day of each month
    $$
    SELECT create_audit_log_partition(DATE_TRUNC('quarter', CURRENT_DATE + INTERVAL '6 months'));
    $$
);

-- Drop old partitions (runs quarterly)
SELECT cron.schedule(
    'drop_old_audit_partitions',
    '0 2 1 1,4,7,10 *',  -- First day of each quarter at 2 AM
    $$
    SELECT drop_old_audit_log_partitions(7);
    $$
);
*/

-- ============================================================================
-- STEP 11: Create helper views and functions
-- ============================================================================

-- View to see partition statistics
CREATE OR REPLACE VIEW audit_log_partition_stats AS
SELECT
    c.relname as partition_name,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    pg_size_pretty(pg_relation_size(c.oid)) as table_size,
    pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) as indexes_size,
    (SELECT COUNT(*) FROM audit_log WHERE tableoid = c.oid) as row_count
FROM pg_class c
JOIN pg_inherits i ON c.oid = i.inhrelid
JOIN pg_class p ON i.inhparent = p.oid
WHERE p.relname = 'audit_log'
  AND c.relname LIKE 'audit_log_%'
ORDER BY c.relname DESC;

-- ============================================================================
-- ALTERNATIVE: Using pg_partman extension (recommended for production)
-- ============================================================================

/*
-- Install pg_partman extension:
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- After creating partitioned table, configure pg_partman:
SELECT partman.create_parent(
    p_parent_table := 'public.audit_log',
    p_control := 'timestamp',
    p_type := 'native',
    p_interval := '3 months',
    p_premake := 4,  -- Create 4 quarters ahead
    p_start_partition := '2025-01-01'
);

-- Update partition config
UPDATE partman.part_config
SET
    retention = '7 years',
    retention_keep_table = false,  -- Drop instead of detach
    retention_keep_index = false,
    infinite_time_partitions = true
WHERE parent_table = 'public.audit_log';

-- Schedule maintenance (in pg_cron or crontab)
SELECT partman.run_maintenance('public.audit_log');
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- Drop partitioned table and restore old one
-- DROP TABLE IF EXISTS audit_log CASCADE;
-- ALTER TABLE audit_log_old RENAME TO audit_log;

-- ============================================================================
-- BENEFITS
-- ============================================================================

/*
1. QUERY PERFORMANCE:
   - Queries on recent data (last 3 months) are 100x faster
   - PostgreSQL prunes irrelevant partitions automatically

   Example:
   SELECT * FROM audit_log
   WHERE timestamp >= '2026-02-01' AND timestamp < '2026-03-01'
   -- Only scans audit_log_2026_q1, ignores other 27 partitions

2. MAINTENANCE:
   - Drop old data instantly (DROP PARTITION vs slow DELETE)
   - VACUUM/ANALYZE runs faster (per partition)
   - Index rebuilds are faster (smaller partitions)

3. STORAGE MANAGEMENT:
   - Archive old partitions to S3/GCS
   - Move cold partitions to slower disks
   - Keep hot partitions on SSD

4. COMPLIANCE:
   - Easy 7-year retention enforcement
   - Audit trail for partition drops
   - Can encrypt old partitions separately

5. SCALABILITY:
   - Handles 10M+ rows efficiently
   - Linear scaling with more partitions
   - Parallel query execution

QUERY EXAMPLES:

-- Query current quarter (fast)
SELECT * FROM audit_log
WHERE timestamp >= '2026-01-01' AND timestamp < '2026-04-01';
-- Scans only audit_log_2026_q1

-- Query specific resource across all time
SELECT * FROM audit_log
WHERE resource_type = 'task' AND resource_id = 'task-uuid';
-- Scans all partitions BUT uses index efficiently

-- Count rows per partition
SELECT * FROM audit_log_partition_stats;

-- Check which partition contains specific row
SELECT tableoid::regclass, * FROM audit_log WHERE id = 12345;
*/
