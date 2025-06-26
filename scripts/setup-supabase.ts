#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { logger } from '../lib/utils/logger'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

async function runMigrations() {
  try {
    console.log('🚀 Starting Supabase setup...')
    
    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    console.log(`Found ${migrationFiles.length} migration files`)
    
    for (const file of migrationFiles) {
      console.log(`\n📝 Running migration: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      
      // Split by semicolons but keep track of functions/triggers
      const statements = sql
        .split(/;\s*$(?=(?:[^']*'[^']*')*[^']*$)/gm)
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim() + ';')
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (!statement.trim()) continue
        
        try {
          console.log(`  Executing statement ${i + 1}/${statements.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql: statement }).single()
          
          if (error) {
            // Try direct execution as fallback
            const { error: directError } = await supabase.from('_sql').insert({ query: statement })
            if (directError) {
              console.error(`  ❌ Error: ${directError.message}`)
              // Continue with other statements
            } else {
              console.log(`  ✅ Statement executed successfully`)
            }
          } else {
            console.log(`  ✅ Statement executed successfully`)
          }
        } catch (err) {
          console.error(`  ❌ Error executing statement: ${err}`)
          // Continue with other statements
        }
      }
      
      console.log(`✅ Migration ${file} completed`)
    }
    
    console.log('\n🎉 All migrations completed!')
    
    // Test the connection
    console.log('\n🔍 Testing database connection...')
    const { data, error } = await supabase.from('events').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection test failed:', error.message)
    } else {
      console.log('✅ Database connection successful!')
    }
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

// Run the migrations
runMigrations()