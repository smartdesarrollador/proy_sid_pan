-- ============================================================================
-- Migration: 006 - Add Invoice Line Items
-- Description: Create InvoiceLineItem table for detailed invoice breakdown
-- Priority: HIGH
-- Estimated Time: 1 sprint
-- Downtime: ZERO (additive migration)
-- ============================================================================

/*
PROBLEM:
  Invoice table only has aggregated totals (subtotal, tax, total)
  Cannot answer:
  - "What was billed on this invoice?"
  - "How many users were billed?"
  - "What add-ons were included?"
  - "What was the breakdown of charges?"

SOLUTION:
  Add InvoiceLineItem table to store detailed line items
  Keep calculated totals in Invoice but derive from line items
*/

-- ============================================================================
-- STEP 1: Create InvoiceLineItem table
-- ============================================================================

CREATE TABLE invoice_line_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,

    -- Line item details
    line_number INTEGER NOT NULL,  -- Order: 1, 2, 3, ...
    description VARCHAR(500) NOT NULL,
    item_type VARCHAR(50) NOT NULL,  -- 'subscription', 'user', 'addon', 'overage', 'discount', 'credit'

    -- Pricing
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,  -- quantity * unit_price (before tax)

    -- Tax (optional, if line-item level tax needed)
    tax_rate DECIMAL(5,2) DEFAULT 0.00,  -- e.g., 21.00 for 21%
    tax_amount DECIMAL(10,2) DEFAULT 0.00,

    -- Metadata for traceability
    metadata JSONB,  -- {plan_id, user_count, addon_id, usage_metric, etc.}

    -- Period (useful for prorations)
    period_start DATE,
    period_end DATE,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_invoice_line_number UNIQUE(invoice_id, line_number),
    CONSTRAINT check_item_type CHECK (
        item_type IN ('subscription', 'user', 'addon', 'overage', 'discount', 'credit', 'tax', 'proration')
    ),
    CONSTRAINT check_amount_calculation CHECK (
        amount = ROUND(quantity * unit_price, 2)
    )
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX idx_line_item_invoice ON invoice_line_item(invoice_id);
CREATE INDEX idx_line_item_type ON invoice_line_item(item_type);
CREATE INDEX idx_line_item_invoice_line ON invoice_line_item(invoice_id, line_number);

-- ============================================================================
-- STEP 3: Create trigger to auto-calculate invoice totals
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate invoice totals from line items
    UPDATE invoice SET
        subtotal = (
            SELECT COALESCE(SUM(amount), 0)
            FROM invoice_line_item
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
              AND item_type NOT IN ('tax', 'discount')  -- Exclude tax and discounts from subtotal
        ),
        tax = (
            SELECT COALESCE(SUM(tax_amount), 0)
            FROM invoice_line_item
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        total = (
            SELECT COALESCE(SUM(amount + tax_amount), 0)
            FROM invoice_line_item
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        )
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_line_item_calculate_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_line_item
FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

-- ============================================================================
-- STEP 4: Create helper functions for invoice generation
-- ============================================================================

-- Function to add line item (validates and auto-calculates amount)
CREATE OR REPLACE FUNCTION add_invoice_line_item(
    p_invoice_id UUID,
    p_description VARCHAR,
    p_item_type VARCHAR,
    p_quantity INTEGER,
    p_unit_price DECIMAL,
    p_tax_rate DECIMAL DEFAULT 0.00,
    p_metadata JSONB DEFAULT NULL,
    p_period_start DATE DEFAULT NULL,
    p_period_end DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_line_number INTEGER;
    v_amount DECIMAL(10,2);
    v_tax_amount DECIMAL(10,2);
    v_new_id UUID;
BEGIN
    -- Get next line number
    SELECT COALESCE(MAX(line_number), 0) + 1
    INTO v_line_number
    FROM invoice_line_item
    WHERE invoice_id = p_invoice_id;

    -- Calculate amounts
    v_amount := ROUND(p_quantity * p_unit_price, 2);
    v_tax_amount := ROUND(v_amount * p_tax_rate / 100, 2);

    -- Insert line item
    INSERT INTO invoice_line_item (
        invoice_id,
        line_number,
        description,
        item_type,
        quantity,
        unit_price,
        amount,
        tax_rate,
        tax_amount,
        metadata,
        period_start,
        period_end
    ) VALUES (
        p_invoice_id,
        v_line_number,
        p_description,
        p_item_type,
        p_quantity,
        p_unit_price,
        v_amount,
        p_tax_rate,
        v_tax_amount,
        p_metadata,
        p_period_start,
        p_period_end
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Example invoice generation workflow
-- ============================================================================

/*
-- Example: Create invoice with line items

BEGIN;

-- 1. Create invoice
INSERT INTO invoice (
    tenant_id,
    subscription_id,
    invoice_number,
    status,
    invoice_date,
    due_date,
    currency
) VALUES (
    'tenant-uuid',
    'subscription-uuid',
    'INV-2026-001',
    'draft',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'USD'
) RETURNING id INTO invoice_id;

-- 2. Add line items
SELECT add_invoice_line_item(
    invoice_id,
    'Professional Plan - Monthly',
    'subscription',
    1,
    49.99,
    21.00,  -- 21% tax
    '{"plan_id": "plan-uuid", "plan_code": "professional"}',
    '2026-02-01',
    '2026-02-28'
);

SELECT add_invoice_line_item(
    invoice_id,
    'Additional Users (5 users)',
    'user',
    5,
    9.99,
    21.00,
    '{"user_ids": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]}',
    '2026-02-01',
    '2026-02-28'
);

SELECT add_invoice_line_item(
    invoice_id,
    'API Calls Overage (10,000 calls)',
    'overage',
    10000,
    0.001,  -- $0.001 per call
    21.00,
    '{"metric": "api_calls", "included": 100000, "actual": 110000, "overage": 10000}',
    '2026-02-01',
    '2026-02-28'
);

SELECT add_invoice_line_item(
    invoice_id,
    'Early Bird Discount',
    'discount',
    1,
    -10.00,
    0.00,
    '{"discount_code": "EARLY2026", "discount_percent": 10}',
    NULL,
    NULL
);

-- 3. Totals are auto-calculated by trigger
-- subtotal = 49.99 + (5 * 9.99) + (10000 * 0.001) - 10 = 99.94
-- tax = (49.99 + 49.95 + 10) * 0.21 = 23.09
-- total = 99.94 + 23.09 = 123.03

-- 4. Mark as issued
UPDATE invoice SET status = 'issued' WHERE id = invoice_id;

COMMIT;
*/

-- ============================================================================
-- STEP 6: Create view for invoice with line items
-- ============================================================================

CREATE OR REPLACE VIEW invoice_with_details AS
SELECT
    i.id as invoice_id,
    i.invoice_number,
    i.tenant_id,
    i.status,
    i.invoice_date,
    i.due_date,
    i.subtotal,
    i.tax,
    i.total,
    i.currency,
    json_agg(
        json_build_object(
            'line_number', ili.line_number,
            'description', ili.description,
            'item_type', ili.item_type,
            'quantity', ili.quantity,
            'unit_price', ili.unit_price,
            'amount', ili.amount,
            'tax_rate', ili.tax_rate,
            'tax_amount', ili.tax_amount,
            'metadata', ili.metadata,
            'period_start', ili.period_start,
            'period_end', ili.period_end
        ) ORDER BY ili.line_number
    ) as line_items
FROM invoice i
LEFT JOIN invoice_line_item ili ON i.id = ili.invoice_id
GROUP BY i.id, i.invoice_number, i.tenant_id, i.status, i.invoice_date,
         i.due_date, i.subtotal, i.tax, i.total, i.currency;

-- ============================================================================
-- STEP 7: Grant permissions (adjust to your app user)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_line_item TO your_app_user;
-- GRANT EXECUTE ON FUNCTION add_invoice_line_item TO your_app_user;
-- GRANT SELECT ON invoice_with_details TO your_app_user;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP VIEW IF EXISTS invoice_with_details;
-- DROP FUNCTION IF EXISTS add_invoice_line_item;
-- DROP TRIGGER IF EXISTS invoice_line_item_calculate_totals ON invoice_line_item;
-- DROP FUNCTION IF EXISTS calculate_invoice_totals();
-- DROP INDEX IF EXISTS idx_line_item_invoice_line;
-- DROP INDEX IF EXISTS idx_line_item_type;
-- DROP INDEX IF EXISTS idx_line_item_invoice;
-- DROP TABLE IF EXISTS invoice_line_item CASCADE;

-- ============================================================================
-- BENEFITS
-- ============================================================================

/*
1. DETAILED INVOICE BREAKDOWN:
   - Know exactly what was billed
   - Support for discounts, credits, overages, prorations

2. COMPLIANCE & AUDITING:
   - Tax authorities require line-item detail
   - SOX compliance for financial records

3. CUSTOMER TRANSPARENCY:
   - Customers see detailed breakdown
   - Support can explain charges easily

4. REPORTING & ANALYTICS:
   - "How much revenue from add-ons last quarter?"
   - "Average invoice line items per customer"
   - "Most common overage charges"

5. FLEXIBLE BILLING:
   - Support complex pricing models
   - Mid-cycle upgrades with prorations
   - Usage-based billing

EXAMPLE QUERIES:

-- Total revenue from add-ons last month
SELECT SUM(amount)
FROM invoice_line_item
WHERE item_type = 'addon'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  AND created_at < DATE_TRUNC('month', CURRENT_DATE);

-- Invoices with overage charges
SELECT i.invoice_number, t.name, SUM(ili.amount) as overage_amount
FROM invoice i
JOIN tenant t ON i.tenant_id = t.id
JOIN invoice_line_item ili ON i.id = ili.invoice_id
WHERE ili.item_type = 'overage'
GROUP BY i.invoice_number, t.name
ORDER BY overage_amount DESC;

-- Average number of line items per invoice
SELECT AVG(line_count)
FROM (
    SELECT COUNT(*) as line_count
    FROM invoice_line_item
    GROUP BY invoice_id
) subquery;
*/
