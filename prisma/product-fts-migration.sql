-- PostgreSQL Full-Text Search Migration for Products
-- This migration adds tsvector columns, triggers, and GIN indexes for efficient product search
-- 
-- Configuration: French language (stemming, stop words)
-- Weight system: A (1.0) for product name, B (0.4) for description
--
-- How to run:
--   psql $PRISMA_DATABASE_URL -f prisma/product-fts-migration.sql
-- Or use the provided script:
--   bash scripts/apply-product-fts-migration.sh

-- Step 1: Add tsvector columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector_simple tsvector;

-- Step 2: Create function to update search vectors automatically
-- This function generates weighted tsvectors from product name and description
-- Name gets weight 'A' (highest priority), description gets weight 'B'
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Weighted search vector (name: A, description: B)
  NEW.search_vector := 
    setweight(to_tsvector('french', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.description, '')), 'B');
  
  -- Simple search vector (fallback, no weights)
  NEW.search_vector_simple := 
    to_tsvector('french', COALESCE(NEW.name || ' ' || NEW.description, ''));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to automatically update search vectors on INSERT/UPDATE
DROP TRIGGER IF EXISTS product_search_vector_update ON products;
CREATE TRIGGER product_search_vector_update
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_search_vector();

-- Step 4: Create GIN indexes for fast full-text search
-- GIN indexes are optimized for tsvector columns
CREATE INDEX IF NOT EXISTS idx_product_search_vector ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_product_search_vector_simple ON products USING GIN(search_vector_simple);

-- Step 5: Populate search vectors for existing products
-- This triggers the update function for all existing rows
UPDATE products SET name = name WHERE status = 'ACTIVE' OR status = 'DRAFT' OR status = 'ARCHIVED';

-- Step 6: Verify the migration
-- Check how many products have been indexed
DO $$
DECLARE
  total_products INTEGER;
  indexed_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO indexed_products FROM products WHERE search_vector IS NOT NULL;
  
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Indexed products: %', indexed_products;
  RAISE NOTICE 'Coverage: %%%', ROUND((indexed_products::NUMERIC / NULLIF(total_products, 0) * 100), 2);
END $$;

-- Notes:
-- - The trigger automatically updates search vectors on INSERT/UPDATE
-- - Use ts_rank() for relevance scoring in queries
-- - French configuration handles accents, stemming, and stop words
-- - To reindex all products: UPDATE products SET name = name;
-- - To check index usage: SELECT * FROM pg_stat_user_indexes WHERE indexrelname LIKE 'idx_product_search%';
