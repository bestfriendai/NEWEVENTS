#!/usr/bin/env tsx

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...')
  console.log('==============================')
  
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Try to access events table directly to see what columns exist
    console.log('\n📋 Checking Events Table:')
    const { data: testData, error: testError } = await supabase
      .from('events')
      .select('*')
      .limit(1)

    if (testError) {
      console.log('❌ Error accessing events table:', testError.message)
      return
    }

    console.log('✅ Events table accessible')
    if (testData && testData.length > 0) {
      console.log('Available columns in events table:')
      Object.keys(testData[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof testData[0][key]}`)
      })
    } else {
      console.log('Events table is empty, checking structure...')
    }

    // Try to insert a test record to see what columns are expected
    console.log('\n🧪 Testing Insert Structure:')
    const testRecord = {
      title: 'Test Event',
      description: 'Test Description'
    }

    const { data: insertTest, error: insertError } = await supabase
      .from('events')
      .insert(testRecord)
      .select()

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message)
      console.log('This tells us about the required schema')
    } else {
      console.log('✅ Test insert successful')
      console.log('Inserted record:', insertTest)

      // Clean up test record
      if (insertTest && insertTest.length > 0) {
        await supabase.from('events').delete().eq('id', insertTest[0].id)
        console.log('🗑️ Test record cleaned up')
      }
    }

    // Check if there's any sample data
    console.log('\n📄 Sample Data Check:')
    const { data: sampleData, error: sampleError } = await supabase
      .from('events')
      .select('*')
      .limit(3)

    if (sampleError) {
      console.log('❌ Error getting sample data:', sampleError.message)
    } else {
      console.log(`Found ${sampleData?.length || 0} sample records`)
      if (sampleData && sampleData.length > 0) {
        console.log('Sample record structure:')
        console.log(JSON.stringify(sampleData[0], null, 2))
      }
    }

  } catch (error) {
    console.log('❌ Schema check failed:', error)
  }
}

checkDatabaseSchema().catch(console.error)
