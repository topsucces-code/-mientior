# Better Auth Setup Guide

## Problem

Better Auth requires its own database tables but the CLI migration is failing. The app currently runs but authentication doesn't work.

## Solution Options

### Option 1: Use Docker PostgreSQL (Recommended)

If you're using Docker, the tables might not exist yet. Run:

```bash
# Connect to your PostgreSQL database
docker exec -i <postgres-container-name> psql -U mientior -d mientior_db < prisma/better-auth-tables.sql
```

### Option 2: Manual SQL Setup

If you have `psql` installed:

```bash
psql "$BETTER_AUTH_DATABASE_URL" -f prisma/better-auth-tables.sql
```

### Option 3: Use a Database GUI

Open your database with a GUI tool (pgAdmin, DBeaver, TablePlus, etc.) and run the SQL from `prisma/better-auth-tables.sql`.

### Option 4: Alternative - Use Only Prisma Auth (Bypass Better Auth)

If you don't need Better Auth features (OAuth, magic links, etc.), you can use only the Prisma `AdminUser` table:

1. Comment out Better Auth in `src/lib/auth.ts`
2. Create a simple session-based auth using JWT or cookies
3. Use the existing `AdminUser` model from Prisma

## Verification

After running the SQL, restart your dev server:

```bash
npm run dev
```

You should no longer see "Failed to initialize database adapter" errors.

## Current Status

✅ App runs (errors are silenced)  
✅ API endpoints work  
✅ Admin UI loads  
❌ Authentication doesn't work (returns 401)  

Once the Better Auth tables are created, authentication will work properly.

## Tables Created

The SQL script creates these tables in the `public` schema:

- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth provider accounts
- `verification` - Email verification tokens

## Environment Variables Required

Make sure these are set in your `.env`:

```bash
BETTER_AUTH_DATABASE_URL=postgresql://user:password@localhost:5432/database
BETTER_AUTH_SECRET=your-secret-key-min-32-characters
BETTER_AUTH_URL=http://localhost:3000
```
