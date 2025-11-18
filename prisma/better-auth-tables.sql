-- Better Auth tables
-- Create these in the public schema (not the app schema used by Prisma)

-- Users table (for Better Auth)
CREATE TABLE IF NOT EXISTS public.user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    name TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Accounts table (for social providers)
CREATE TABLE IF NOT EXISTS public.account (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider_id, account_id)
);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS public.verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON public.session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON public.session(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON public.account(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON public.verification(identifier);
