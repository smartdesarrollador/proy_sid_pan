-- ============================================================================
-- Migration: 005 - Remove Tenant Subscription Redundancy
-- Description: Remove duplicated subscription fields from Tenant table
-- Priority: CRITICAL
-- Estimated Time: 1 sprint
-- Downtime: ZERO (gradual migration)
-- ============================================================================

/*
PROBLEM:
  Tenant table has 5 fields duplicated from Subscription table:
  - subscription_plan
  - subscription_status
  - trial_ends_at
  - subscription_current_period_end
  - stripe_customer_id

  This causes:
  1. Data inconsistency (must update 2 tables on subscription change)
  2. No subscription history (only current state)
  3. Violation of 2NF/3NF (transitive dependency)

SOLUTION:
  Remove these fields from Tenant, always JOIN with Subscription table
  Optional: Add Redis cache in app layer for hot path queries
*/

-- ============================================================================
-- STEP 1: Verify data consistency BEFORE migration
-- ============================================================================

-- Check if there are inconsistencies between Tenant and Subscription
-- Run this query and fix any mismatches before proceeding
DO $$
DECLARE
    inconsistency_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inconsistency_count
    FROM tenant t
    LEFT JOIN subscription s ON t.id = s.tenant_id AND s.status = 'active'
    LEFT JOIN plan p ON s.plan_id = p.id
    WHERE
        -- Check if tenant fields match subscription
        (t.subscription_status != s.status) OR
        (t.subscription_plan != p.code) OR
        (t.trial_ends_at != s.trial_ends_at) OR
        (t.subscription_current_period_end != s.current_period_end);

    IF inconsistency_count > 0 THEN
        RAISE WARNING 'Found % inconsistencies between Tenant and Subscription. Please fix before proceeding.', inconsistency_count;
    ELSE
        RAISE NOTICE 'Data consistency check passed. Safe to proceed with migration.';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Create helper view for app queries (backward compatibility)
-- ============================================================================

-- This view provides the same data structure as before
-- App code can query this view during transition period
CREATE OR REPLACE VIEW tenant_with_subscription AS
SELECT
    t.id,
    t.subdomain,
    t.name,
    t.logo,
    t.primary_color,
    t.settings,
    t.created_at,
    t.updated_at,
    -- Subscription fields (from JOIN)
    p.code as subscription_plan,
    s.status as subscription_status,
    s.trial_ends_at,
    s.current_period_end as subscription_current_period_end,
    s.stripe_subscription_id as stripe_customer_id,
    -- Additional useful fields
    s.id as subscription_id,
    p.id as plan_id,
    p.name as plan_name,
    s.billing_cycle
FROM tenant t
LEFT JOIN subscription s ON t.id = s.tenant_id
    AND s.status IN ('active', 'trialing', 'past_due')  -- Only active subscriptions
LEFT JOIN plan p ON s.plan_id = p.id
ORDER BY t.created_at DESC;

-- ============================================================================
-- STEP 3: Update app code to use new view/query pattern
-- ============================================================================

/*
DJANGO MODEL CHANGES:

Before:
  class Tenant(models.Model):
      subscription_plan = models.CharField(max_length=50)
      subscription_status = models.CharField(max_length=20)
      # ... other fields

  # Query:
  tenant = Tenant.objects.get(id=tenant_id)
  if tenant.subscription_status == 'active':
      ...

After:
  class Tenant(models.Model):
      # Fields removed

      @property
      def subscription(self):
          return self.subscriptions.filter(status='active').first()

      @property
      def subscription_plan(self):
          sub = self.subscription
          return sub.plan.code if sub else None

      @property
      def subscription_status(self):
          sub = self.subscription
          return sub.status if sub else 'free'

  # Query (with select_related for performance):
  tenant = Tenant.objects.select_related(
      'subscriptions__plan'
  ).get(id=tenant_id)
  if tenant.subscription_status == 'active':
      ...

ALTERNATIVE (use view):
  # Create unmanaged Django model for the view
  class TenantWithSubscription(models.Model):
      subscription_plan = models.CharField(max_length=50)
      subscription_status = models.CharField(max_length=20)
      # ... other fields

      class Meta:
          managed = False
          db_table = 'tenant_with_subscription'
*/

-- ============================================================================
-- STEP 4: Drop redundant columns (after app migration complete)
-- ============================================================================

-- IMPORTANT: Only run this AFTER:
-- 1. App code updated to use JOIN or view
-- 2. Tested in staging for 1+ week
-- 3. Verified no queries use old columns (check slow query logs)

-- Uncomment when ready:
-- ALTER TABLE tenant DROP COLUMN IF EXISTS subscription_plan;
-- ALTER TABLE tenant DROP COLUMN IF EXISTS subscription_status;
-- ALTER TABLE tenant DROP COLUMN IF EXISTS trial_ends_at;
-- ALTER TABLE tenant DROP COLUMN IF EXISTS subscription_current_period_end;
-- ALTER TABLE tenant DROP COLUMN IF EXISTS stripe_customer_id;

-- ============================================================================
-- STEP 5: Create indexes for optimal JOIN performance
-- ============================================================================

-- Subscription table should already have these, but verify:
CREATE INDEX IF NOT EXISTS idx_subscription_tenant_status
    ON subscription(tenant_id, status)
    WHERE status IN ('active', 'trialing', 'past_due');

CREATE INDEX IF NOT EXISTS idx_subscription_plan
    ON subscription(plan_id);

-- ============================================================================
-- STEP 6: Add Redis cache (optional, in app layer)
-- ============================================================================

/*
PYTHON/DJANGO CACHING STRATEGY:

import redis
from django.conf import settings

class TenantSubscriptionCache:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL)
        self.ttl = 300  # 5 minutes

    def get_tenant_subscription(self, tenant_id):
        cache_key = f"tenant:{tenant_id}:subscription"
        cached = self.redis.get(cache_key)

        if cached:
            return json.loads(cached)

        # Cache miss: query database
        tenant = Tenant.objects.select_related(
            'subscription__plan'
        ).get(id=tenant_id)

        data = {
            'plan_code': tenant.subscription.plan.code if tenant.subscription else 'free',
            'status': tenant.subscription.status if tenant.subscription else 'inactive',
            'trial_ends_at': tenant.subscription.trial_ends_at.isoformat() if tenant.subscription else None,
        }

        self.redis.setex(cache_key, self.ttl, json.dumps(data))
        return data

    def invalidate(self, tenant_id):
        cache_key = f"tenant:{tenant_id}:subscription"
        self.redis.delete(cache_key)

# Usage in views:
cache = TenantSubscriptionCache()
subscription_data = cache.get_tenant_subscription(request.tenant_id)

# Invalidate on subscription change (in Subscription.save signal):
@receiver(post_save, sender=Subscription)
def invalidate_tenant_cache(sender, instance, **kwargs):
    cache = TenantSubscriptionCache()
    cache.invalidate(instance.tenant_id)
*/

-- ============================================================================
-- STEP 7: Performance comparison queries
-- ============================================================================

-- BEFORE (direct column access):
-- SELECT * FROM tenant WHERE subscription_status = 'active';
-- Execution time: ~10ms (index scan on tenant)

-- AFTER (with JOIN):
EXPLAIN ANALYZE
SELECT t.*
FROM tenant t
JOIN subscription s ON t.id = s.tenant_id
WHERE s.status = 'active'
  AND s.status IN ('active', 'trialing', 'past_due');
-- Expected execution time: ~15-20ms (with proper indexes)

-- AFTER (with view):
EXPLAIN ANALYZE
SELECT * FROM tenant_with_subscription WHERE subscription_status = 'active';
-- Expected execution time: ~15-20ms

-- AFTER (with Redis cache for hot tenants):
-- App layer: ~1-2ms (Redis lookup)
-- Only cache miss hits DB: ~15-20ms

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP VIEW IF EXISTS tenant_with_subscription;
-- DROP INDEX IF EXISTS idx_subscription_tenant_status;

-- Re-add columns (if migration failed):
-- ALTER TABLE tenant ADD COLUMN subscription_plan VARCHAR(50);
-- ALTER TABLE tenant ADD COLUMN subscription_status VARCHAR(20);
-- ALTER TABLE tenant ADD COLUMN trial_ends_at TIMESTAMP;
-- ALTER TABLE tenant ADD COLUMN subscription_current_period_end TIMESTAMP;
-- ALTER TABLE tenant ADD COLUMN stripe_customer_id VARCHAR(255);

-- ============================================================================
-- BENEFITS
-- ============================================================================

/*
1. SINGLE SOURCE OF TRUTH:
   - Subscription data only in Subscription table
   - No risk of inconsistency

2. SUBSCRIPTION HISTORY:
   - Can track subscription changes over time
   - Add status_changed_at, plan_changed_at columns to Subscription

3. COMPLIANCE WITH 3NF:
   - No transitive dependencies
   - Tenant → Subscription → Plan (proper relations)

4. EASIER UPGRADES/DOWNGRADES:
   - Only update Subscription table
   - Cache invalidation handles propagation

5. BETTER REPORTING:
   - Can query "all tenants who upgraded from Starter to Pro last month"
   - Can track subscription lifecycle events

TRADEOFFS:
- Slightly slower queries (JOIN overhead) - mitigated by Redis cache
- App code needs refactoring - one-time cost
- Requires cache invalidation strategy - straightforward implementation
*/
