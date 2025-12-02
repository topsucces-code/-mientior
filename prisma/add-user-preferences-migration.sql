-- Migration: Add user preferences column
-- Purpose: Store calculated user preferences for personalized search
-- Structure: JSONB containing favorite categories, brands, search patterns, and metadata
-- 
-- This migration adds a nullable JSONB column to store user preferences.
-- The column is populated by the personalization service and should not be manually edited.

-- Add preferences column to users table (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT NULL;
        
        -- Add comment explaining the column
        COMMENT ON COLUMN users.preferences IS 'Auto-calculated user preferences for personalized search. Contains favoriteCategories, favoriteBrands, searchPatterns, and lastCalculated timestamp.';
        
        RAISE NOTICE 'Added preferences column to users table';
    ELSE
        RAISE NOTICE 'preferences column already exists in users table';
    END IF;
END $$;

-- Create index for faster preference lookups (optional, for analytics queries)
CREATE INDEX IF NOT EXISTS idx_users_preferences_not_null 
ON users ((preferences IS NOT NULL)) 
WHERE preferences IS NOT NULL;

-- Verify migration
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferences'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Migration verified: preferences column exists';
    ELSE
        RAISE EXCEPTION 'Migration failed: preferences column not found';
    END IF;
END $$;
