#!/usr/bin/env node

/**
 * Initialize Better Auth database tables
 * Run with: node scripts/init-better-auth.js
 */

const { Client } = require('pg')
require('dotenv').config({ path: '.env' })

const client = new Client({
  connectionString: process.env.BETTER_AUTH_DATABASE_URL || process.env.DATABASE_URL
})

async function initBetterAuth() {
  try {
    console.log('🔌 Connecting to PostgreSQL...')
    await client.connect()
    console.log('✅ Connected to database')

    console.log('\n📦 Creating Better Auth tables...')

    // Create user table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "emailVerified" BOOLEAN DEFAULT FALSE,
        "name" TEXT,
        "image" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✅ Created "user" table')

    // Create session table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      );
    `)
    console.log('✅ Created "session" table')

    // Create account table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "expiresAt" TIMESTAMP,
        "password" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
        UNIQUE ("providerId", "accountId")
      );
    `)
    console.log('✅ Created "account" table')

    // Create verification table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✅ Created "verification" table')

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "session"("userId");`)
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_account_userId" ON "account"("userId");`)
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_verification_identifier" ON "verification"("identifier");`)
    console.log('✅ Created indexes')

    console.log('\n🎉 Better Auth tables initialized successfully!')
    
    // List all tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)
    
    console.log('\n📋 Tables in database:')
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n👋 Disconnected from database')
  }
}

initBetterAuth()

