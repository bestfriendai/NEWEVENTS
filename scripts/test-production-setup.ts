#!/usr/bin/env tsx
/**
 * Production Setup Verification Script
 * Tests database connection, authentication, and core functionality
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../lib/env'

async function testSupabaseConnection() {
  console.log('🔧 Testing Supabase connection...')
  
  try {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test basic connection
    const { data, error } = await supabase.from('events').select('count').limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }

    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Connection error:', error)
    return false
  }
}

async function testAuthentication() {
  console.log('🔐 Testing authentication...')
  
  try {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test anonymous sign-in
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) {
      console.error('❌ Anonymous authentication failed:', error.message)
      return false
    }

    if (data.user) {
      console.log('✅ Anonymous authentication successful')
      console.log('👤 User ID:', data.user.id)
      
      // Test sign out
      await supabase.auth.signOut()
      console.log('✅ Sign out successful')
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Authentication error:', error)
    return false
  }
}

async function testDatabaseTables() {
  console.log('📊 Testing database tables...')
  
  try {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test events table
    const { count: eventsCount, error: eventsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })

    if (eventsError) {
      console.error('❌ Events table error:', eventsError.message)
      return false
    }

    console.log(`✅ Events table accessible (${eventsCount} events)`)

    // Test user tables
    const { count: profilesCount, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    if (profilesError) {
      console.error('❌ User profiles table error:', profilesError.message)
      return false
    }

    console.log(`✅ User profiles table accessible (${profilesCount} profiles)`)

    // Test user favorites table
    const { count: favoritesCount, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })

    if (favoritesError) {
      console.error('❌ User favorites table error:', favoritesError.message)
      return false
    }

    console.log(`✅ User favorites table accessible (${favoritesCount} favorites)`)

    return true
  } catch (error) {
    console.error('❌ Database tables error:', error)
    return false
  }
}

async function testEnvironmentConfig() {
  console.log('⚙️  Testing environment configuration...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  let allGood = true

  for (const varName of requiredVars) {
    const value = env[varName as keyof typeof env]
    if (!value || value === '') {
      console.error(`❌ Missing required environment variable: ${varName}`)
      allGood = false
    } else {
      console.log(`✅ ${varName}: configured`)
    }
  }

  // Check optional API keys
  const optionalVars = [
    'MAPBOX_API_KEY',
    'TICKETMASTER_API_KEY',
    'RAPIDAPI_KEY'
  ]

  console.log('\n🔑 Optional API Keys:')
  for (const varName of optionalVars) {
    const value = env[varName as keyof typeof env]
    if (!value || value.includes('your-') || value === '') {
      console.log(`⚠️  ${varName}: not configured (external features may not work)`)
    } else {
      console.log(`✅ ${varName}: configured`)
    }
  }

  return allGood
}

async function main() {
  console.log('🚀 DateAI Production Setup Verification\n')
  
  const tests = [
    { name: 'Environment Configuration', test: testEnvironmentConfig },
    { name: 'Supabase Connection', test: testSupabaseConnection },
    { name: 'Authentication', test: testAuthentication },
    { name: 'Database Tables', test: testDatabaseTables }
  ]

  let allPassed = true

  for (const { name, test } of tests) {
    console.log(`\n--- ${name} ---`)
    const passed = await test()
    if (!passed) {
      allPassed = false
    }
  }

  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('🎉 All tests passed! Your app is production-ready.')
    console.log('\n📝 Next steps:')
    console.log('   1. Replace placeholder API keys in .env.local with real ones')
    console.log('   2. Test the authentication flow in your browser')
    console.log('   3. Deploy to your production environment')
    console.log('\n🌐 Access your app at: http://localhost:3001')
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { testSupabaseConnection, testAuthentication, testDatabaseTables, testEnvironmentConfig }