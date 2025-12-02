-- ================================================================
-- TRIGRAM FUZZY SEARCH MIGRATION
-- ================================================================
-- This migration enables PostgreSQL's pg_trgm extension for fuzzy
-- text search and creates trigram indexes on search columns.
--
-- pg_trgm provides:
-- - Fuzzy text matching with similarity() function
-- - Tolerance for typos and spelling variations
-- - Word-level similarity with word_similarity()
-- - Fast autocomplete suggestions
--
-- Author: Mientior Team
-- Date: 2025-11-29
-- Version: 1.0
-- ================================================================

-- ================================================================
-- SECTION 1: Enable pg_trgm Extension
-- ================================================================

-- Create pg_trgm extension if not already exists
-- Requires PostgreSQL 9.1+ and contrib modules installed
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extension was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    RAISE NOTICE '✓ pg_trgm extension is active';
  ELSE
    RAISE EXCEPTION '✗ Failed to create pg_trgm extension. Ensure PostgreSQL contrib is installed.';
  END IF;
END $$;

-- ================================================================
-- SECTION 2: Create GIN Trigram Indexes
-- ================================================================
-- GIN indexes are optimized for similarity() and the % operator
-- They provide excellent performance for fuzzy text search
-- ================================================================

-- Index for Product.name - primary search field
CREATE INDEX IF NOT EXISTS idx_product_name_trgm
ON "Product" USING GIN (name gin_trgm_ops);

-- Index for Category.name - for category suggestions
CREATE INDEX IF NOT EXISTS idx_category_name_trgm
ON "Category" USING GIN (name gin_trgm_ops);

-- Index for Tag.name - for tag suggestions
CREATE INDEX IF NOT EXISTS idx_tag_name_trgm
ON "Tag" USING GIN (name gin_trgm_ops);

-- Log index creation
DO $$
BEGIN
  RAISE NOTICE '✓ Created GIN trigram indexes for similarity matching';
END $$;

-- ================================================================
-- SECTION 3: Create GIST Trigram Indexes
-- ================================================================
-- GIST indexes are required for word_similarity() function
-- They provide better performance for multi-word queries
-- and distance-based searches
-- ================================================================

-- GIST index for Product.name - for word similarity
CREATE INDEX IF NOT EXISTS idx_product_name_trgm_gist
ON "Product" USING GIST (name gist_trgm_ops);

-- GIST index for Category.name - for word similarity
CREATE INDEX IF NOT EXISTS idx_category_name_trgm_gist
ON "Category" USING GIST (name gist_trgm_ops);

-- GIST index for Tag.name - for word similarity
CREATE INDEX IF NOT EXISTS idx_tag_name_trgm_gist
ON "Tag" USING GIST (name gist_trgm_ops);

-- Log index creation
DO $$
BEGIN
  RAISE NOTICE '✓ Created GIST trigram indexes for word similarity matching';
END $$;

-- ================================================================
-- SECTION 4: Configure Similarity Thresholds
-- ================================================================
-- Default thresholds (can be overridden per session)
-- similarity_threshold: minimum score for similarity() (0.0-1.0)
-- word_similarity_threshold: minimum score for word_similarity()
--
-- Recommended values:
-- - 0.3: Good balance for autocomplete (default)
-- - 0.2: More permissive, catches more typos
-- - 0.4: Stricter, fewer false positives
-- ================================================================

-- Note: These are SESSION-level settings and must be set in application code
-- Example: SET pg_trgm.similarity_threshold = 0.3;
DO $$
BEGIN
  RAISE NOTICE '
  Similarity Threshold Configuration:
  -----------------------------------
  - Default similarity_threshold: 0.3 (configurable via SET command)
  - Default word_similarity_threshold: 0.3

  To change per session:
    SET pg_trgm.similarity_threshold = 0.3;
    SET pg_trgm.word_similarity_threshold = 0.3;
  ';
END $$;

-- ================================================================
-- SECTION 5: Verification and Statistics
-- ================================================================

DO $$
DECLARE
  product_count INTEGER;
  category_count INTEGER;
  tag_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Count indexed records
  SELECT COUNT(*) INTO product_count FROM "Product";
  SELECT COUNT(*) INTO category_count FROM "Category";
  SELECT COUNT(*) INTO tag_count FROM "Tag";

  -- Count trigram indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE indexname LIKE '%_trgm%';

  RAISE NOTICE '
  ================================================================
  TRIGRAM SEARCH MIGRATION COMPLETED SUCCESSFULLY
  ================================================================

  Statistics:
  -----------
  - Products indexed: %
  - Categories indexed: %
  - Tags indexed: %
  - Trigram indexes created: %

  Available Operators:
  -------------------
  - %% : Similarity operator (e.g., WHERE name %% ''search'')
  - <%% : Word similarity operator (e.g., WHERE ''search'' <%% name)
  - <<%% : Strict word similarity operator

  Available Functions:
  -------------------
  - similarity(text1, text2): Returns similarity score (0.0-1.0)
  - word_similarity(text1, text2): Returns word-level similarity
  - strict_word_similarity(text1, text2): Stricter word matching
  - show_trgm(text): Shows trigrams for debugging

  Next Steps:
  -----------
  1. Test similarity queries: npm run db:trigram-search:test
  2. Check performance: npm run db:trigram-search:analyze
  3. Monitor index usage: npm run db:trigram-search:status

  Example Queries:
  ---------------
  -- Find products similar to "smartphon" (typo)
  SELECT name, similarity(name, ''smartphon'') as score
  FROM "Product"
  WHERE similarity(name, ''smartphon'') > 0.3
  ORDER BY score DESC
  LIMIT 10;

  -- Find products with word similarity
  SELECT name, word_similarity(''portable gaming'', name) as score
  FROM "Product"
  WHERE ''portable gaming'' <%% name
  ORDER BY score DESC
  LIMIT 10;

  ================================================================
  ', product_count, category_count, tag_count, index_count;
END $$;

-- ================================================================
-- ROLLBACK INSTRUCTIONS
-- ================================================================
-- If you need to rollback this migration:
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_product_name_trgm;
-- DROP INDEX IF EXISTS idx_category_name_trgm;
-- DROP INDEX IF EXISTS idx_tag_name_trgm;
-- DROP INDEX IF EXISTS idx_product_name_trgm_gist;
-- DROP INDEX IF EXISTS idx_category_name_trgm_gist;
-- DROP INDEX IF EXISTS idx_tag_name_trgm_gist;
--
-- -- Drop extension (only if not used elsewhere)
-- DROP EXTENSION IF EXISTS pg_trgm;
-- ================================================================
