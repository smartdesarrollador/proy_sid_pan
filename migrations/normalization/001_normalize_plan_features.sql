-- ============================================================================
-- Migration: 001 - Normalize Plan Features
-- Description: Convert Plan.features JSONB to PlanFeature table
-- Priority: CRITICAL
-- Estimated Time: 1 sprint
-- Downtime: ZERO (dual-write pattern)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create new normalized table
-- ============================================================================

CREATE TABLE plan_feature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plan(id) ON DELETE CASCADE,
    feature_code VARCHAR(50) NOT NULL,  -- 'sharing', 'api_access', 'sso', 'webhooks', 'advanced_reporting', 'custom_fields', 'webhooks', 'audit_retention_years'
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB,  -- Solo para features que requieren config adicional
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_plan_feature UNIQUE(plan_id, feature_code),
    CONSTRAINT check_feature_code CHECK (
        feature_code IN (
            'sharing', 'api_access', 'sso', 'webhooks',
            'advanced_reporting', 'custom_fields',
            'audit_retention_years', 'priority_support',
            'white_label', 'custom_domain', 'ldap_integration',
            'multi_factor_auth', 'ip_whitelist', 'export_data'
        )
    )
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX idx_plan_feature_plan ON plan_feature(plan_id);
CREATE INDEX idx_plan_feature_code ON plan_feature(feature_code);
CREATE INDEX idx_plan_feature_enabled ON plan_feature(plan_id, is_enabled) WHERE is_enabled = TRUE;

-- ============================================================================
-- STEP 3: Backfill data from Plan.features JSONB
-- ============================================================================
-- Run Python script: scripts/backfill_plan_features.py
-- This will migrate existing JSONB data to new table

-- ============================================================================
-- STEP 4: Add trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_plan_feature_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_feature_update_timestamp
BEFORE UPDATE ON plan_feature
FOR EACH ROW EXECUTE FUNCTION update_plan_feature_timestamp();

-- ============================================================================
-- STEP 5: Grant permissions (adjust to your app user)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON plan_feature TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP TRIGGER IF EXISTS plan_feature_update_timestamp ON plan_feature;
-- DROP FUNCTION IF EXISTS update_plan_feature_timestamp();
-- DROP INDEX IF EXISTS idx_plan_feature_enabled;
-- DROP INDEX IF EXISTS idx_plan_feature_code;
-- DROP INDEX IF EXISTS idx_plan_feature_plan;
-- DROP TABLE IF EXISTS plan_feature CASCADE;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
DUAL-WRITE PATTERN IMPLEMENTATION:

1. After creating this table, update Django models:
   - Keep Plan.features JSONB temporarily
   - Create PlanFeature model
   - Override Plan.save() to dual-write

2. Run backfill script:
   - python scripts/backfill_plan_features.py

3. Validation:
   - python scripts/validate_plan_features_migration.py
   - Must show 100% match between JSONB and table

4. Switch reads (feature flag):
   - Use FeatureFlag to gradually switch queries to new table
   - Monitor latency and errors

5. Stop dual-writes:
   - Remove dual-write logic from Plan.save()

6. Drop old column:
   - ALTER TABLE plan DROP COLUMN features;

QUERIES BEFORE:
  SELECT * FROM plan WHERE features @> '{"sharing": true}';

QUERIES AFTER:
  SELECT p.* FROM plan p
  JOIN plan_feature pf ON p.id = pf.plan_id
  WHERE pf.feature_code = 'sharing' AND pf.is_enabled = TRUE;

BENEFITS:
  - Can filter plans by feature efficiently
  - Can query "which plans have feature X"
  - Can add feature-specific config (config JSONB)
  - Can track when feature was enabled (created_at)
*/
