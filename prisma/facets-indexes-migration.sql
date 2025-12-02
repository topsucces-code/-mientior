-- Facets Indexes Migration
-- Adds indexes to optimize facet aggregation queries
-- Run with: psql $DATABASE_URL -f prisma/facets-indexes-migration.sql
-- Safe to run multiple times (idempotent)

-- 1. Index on products.price for price range aggregations (MIN/MAX)
--    Partial index for active and approved products only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price
ON products(price)
WHERE status = 'ACTIVE' AND approval_status = 'APPROVED';

-- 2. Index on product_variants.color for color facet GROUP BY queries
--    Partial index excluding NULL colors
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_color
ON product_variants(color)
WHERE color IS NOT NULL;

-- 3. Index on product_variants.size for size facet GROUP BY queries
--    Partial index excluding NULL sizes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_size
ON product_variants(size)
WHERE size IS NOT NULL;

-- 4. Composite index for color facets with product filtering (JOIN + GROUP BY)
--    Optimizes queries that join variants with filtered products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_product_color
ON product_variants(product_id, color)
WHERE color IS NOT NULL;

-- 5. Composite index for size facets with product filtering (JOIN + GROUP BY)
--    Optimizes queries that join variants with filtered products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_product_size
ON product_variants(product_id, size)
WHERE size IS NOT NULL;

-- Verification query - run this to confirm indexes were created
-- SELECT indexname, indexdef FROM pg_indexes
-- WHERE tablename IN ('products', 'product_variants')
-- AND indexname LIKE 'idx_%'
-- ORDER BY indexname;

-- Rollback (if needed) - DROP indexes
-- DROP INDEX CONCURRENTLY IF EXISTS idx_products_price;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_product_variants_color;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_product_variants_size;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_product_variants_product_color;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_product_variants_product_size;
