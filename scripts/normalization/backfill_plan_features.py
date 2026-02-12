#!/usr/bin/env python3
"""
Backfill script: Migrate Plan.features JSONB to PlanFeature table

Usage:
    python scripts/normalization/backfill_plan_features.py [--dry-run] [--batch-size=100]
"""

import argparse
import json
import sys
from typing import Dict, List
import psycopg2
from psycopg2.extras import execute_batch


def parse_args():
    parser = argparse.ArgumentParser(description='Backfill Plan features from JSONB to table')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without committing')
    parser.add_argument('--batch-size', type=int, default=100, help='Batch size for inserts')
    parser.add_argument('--db-url', type=str, help='PostgreSQL connection URL',
                       default='postgresql://localhost/your_db')
    return parser.args()


def get_plans_with_features(conn):
    """Fetch all plans with JSONB features"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, code, name, features
            FROM plan
            WHERE features IS NOT NULL AND features != '{}'::jsonb
            ORDER BY created_at
        """)
        return cur.fetchall()


def migrate_plan_features(conn, dry_run=False, batch_size=100):
    """Migrate features from JSONB to PlanFeature table"""

    plans = get_plans_with_features(conn)
    total_plans = len(plans)
    total_features = 0

    print(f"Found {total_plans} plans with features")

    if not plans:
        print("No plans to migrate")
        return 0, 0

    # Prepare insert statement
    insert_sql = """
        INSERT INTO plan_feature (plan_id, feature_code, is_enabled, config)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (plan_id, feature_code) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            config = EXCLUDED.config,
            updated_at = NOW()
    """

    # Process each plan
    batch_data = []

    for plan_id, code, name, features_json in plans:
        features = json.loads(features_json) if isinstance(features_json, str) else features_json

        print(f"\nProcessing plan: {code} ({name})")
        print(f"  Features: {features}")

        # Parse features JSONB
        # Assuming structure: {"sharing": true, "api_access": false, "sso": {"enabled": true, "provider": "okta"}}
        for feature_code, feature_value in features.items():
            if isinstance(feature_value, bool):
                # Simple boolean feature
                is_enabled = feature_value
                config = None
            elif isinstance(feature_value, dict):
                # Feature with config
                is_enabled = feature_value.get('enabled', True)
                config = json.dumps({k: v for k, v in feature_value.items() if k != 'enabled'})
            elif isinstance(feature_value, (int, str)):
                # Numeric/string value (e.g., "audit_retention_years": 7)
                is_enabled = True
                config = json.dumps({"value": feature_value})
            else:
                print(f"  WARNING: Unknown feature value type: {type(feature_value)}")
                continue

            batch_data.append((plan_id, feature_code, is_enabled, config))
            total_features += 1

            if len(batch_data) >= batch_size:
                if not dry_run:
                    with conn.cursor() as cur:
                        execute_batch(cur, insert_sql, batch_data)
                    conn.commit()
                    print(f"  Inserted batch of {len(batch_data)} features")
                else:
                    print(f"  [DRY-RUN] Would insert batch of {len(batch_data)} features")
                batch_data = []

    # Insert remaining batch
    if batch_data:
        if not dry_run:
            with conn.cursor() as cur:
                execute_batch(cur, insert_sql, batch_data)
            conn.commit()
            print(f"  Inserted final batch of {len(batch_data)} features")
        else:
            print(f"  [DRY-RUN] Would insert final batch of {len(batch_data)} features")

    return total_plans, total_features


def validate_migration(conn):
    """Validate that migration was successful"""

    with conn.cursor() as cur:
        # Count plans with features in JSONB
        cur.execute("""
            SELECT COUNT(*)
            FROM plan
            WHERE features IS NOT NULL AND features != '{}'::jsonb
        """)
        plans_with_jsonb = cur.fetchone()[0]

        # Count plans with features in table
        cur.execute("""
            SELECT COUNT(DISTINCT plan_id)
            FROM plan_feature
        """)
        plans_with_table = cur.fetchone()[0]

        # Count total features in table
        cur.execute("""
            SELECT COUNT(*)
            FROM plan_feature
        """)
        total_features = cur.fetchone()[0]

        print("\n=== VALIDATION RESULTS ===")
        print(f"Plans with JSONB features: {plans_with_jsonb}")
        print(f"Plans with table features: {plans_with_table}")
        print(f"Total features in table:   {total_features}")

        if plans_with_jsonb != plans_with_table:
            print("\n⚠️  WARNING: Mismatch detected!")
            return False
        else:
            print("\n✅ Validation passed!")
            return True


def main():
    args = parse_args()

    try:
        # Connect to database
        conn = psycopg2.connect(args.db_url)
        print(f"Connected to database: {args.db_url}\n")

        # Run migration
        total_plans, total_features = migrate_plan_features(
            conn,
            dry_run=args.dry_run,
            batch_size=args.batch_size
        )

        print(f"\n=== MIGRATION SUMMARY ===")
        print(f"Plans processed:     {total_plans}")
        print(f"Features migrated:   {total_features}")

        if args.dry_run:
            print("\n🔵 DRY-RUN MODE: No changes committed")
        else:
            print("\n✅ Migration completed successfully")

            # Validate
            if validate_migration(conn):
                print("\n🎉 Migration validated successfully!")
            else:
                print("\n⚠️  Validation failed - please review manually")
                sys.exit(1)

        conn.close()

    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
