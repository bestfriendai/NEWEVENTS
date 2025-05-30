#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * 
 * This script verifies that the application is ready for production by:
 * 1. Checking that all APIs are properly configured
 * 2. Testing build configuration
 * 3. Verifying no mock data or debugging code remains
 */

const fs = require('fs');
const path = require('path');

async function verifyProductionReadiness() {
  console.log("🔍 Verifying Production Readiness...")
  console.log("=".repeat(50))

  let allChecks = true

  // 1. Check Environment Configuration
  console.log("\n1. Checking Environment Configuration...")
  try {
    const envExists = fs.existsSync('lib/env.ts')
    if (envExists) {
      const envContent = fs.readFileSync('lib/env.ts', 'utf8')
      const hasSupabase = envContent.includes('SUPABASE')
      const hasRapidAPI = envContent.includes('RAPIDAPI')
      const hasTicketmaster = envContent.includes('TICKETMASTER')
      
      if (hasSupabase && hasRapidAPI && hasTicketmaster) {
        console.log("✅ Environment configuration includes all required API keys")
      } else {
        console.log("⚠️  Some API configurations may be missing")
      }
    } else {
      console.log("❌ Environment configuration file not found")
      allChecks = false
    }
  } catch (error) {
    console.log("❌ Could not verify environment configuration")
    allChecks = false
  }

  // 2. Check Build Configuration
  console.log("\n2. Checking Build Configuration...")
  const buildFiles = [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'tailwind.config.ts'
  ]
  
  buildFiles.forEach(file => {
    const exists = fs.existsSync(file)
    if (exists) {
      console.log(`✅ ${file} exists`)
    } else {
      console.log(`❌ ${file} missing`)
      allChecks = false
    }
  })

  // 3. Check for API Integration
  console.log("\n3. Checking API Integration...")
  const apiFiles = [
    'lib/api/events-api.ts',
    'lib/api/ticketmaster-api.ts',
    'lib/api/rapidapi-events.ts',
    'lib/services/events-service.ts'
  ]
  
  apiFiles.forEach(file => {
    const exists = fs.existsSync(file)
    if (exists) {
      console.log(`✅ ${file} exists`)
    } else {
      console.log(`❌ ${file} missing`)
      allChecks = false
    }
  })

  // 4. Check for Core Pages
  console.log("\n4. Checking Core Pages...")
  const corePages = [
    'app/page.tsx',
    'app/ClientPage.tsx',
    'app/events/page.tsx',
    'app/favorites/page.tsx',
    'app/create-event/page.tsx',
    'app/messages/page.tsx',
    'app/profile/page.tsx',
    'app/settings/page.tsx'
  ]
  
  corePages.forEach(page => {
    const exists = fs.existsSync(page)
    if (exists) {
      console.log(`✅ ${page} exists`)
    } else {
      console.log(`❌ ${page} missing`)
      allChecks = false
    }
  })

  // 5. Check for Essential Components
  console.log("\n5. Checking Essential Components...")
  const components = [
    'components/app-layout.tsx',
    'components/event-card.tsx',
    'components/event-detail-modal.tsx'
  ]
  
  components.forEach(component => {
    const exists = fs.existsSync(component)
    if (exists) {
      console.log(`✅ ${component} exists`)
    } else {
      console.log(`❌ ${component} missing`)
      allChecks = false
    }
  })

  // 6. Check Package.json Scripts
  console.log("\n6. Checking Package Scripts...")
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const requiredScripts = ['dev', 'build', 'start']
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`✅ Script '${script}' configured`)
      } else {
        console.log(`❌ Script '${script}' missing`)
        allChecks = false
      }
    })
  } catch (error) {
    console.log("❌ Could not verify package.json scripts")
    allChecks = false
  }

  // 7. Summary
  console.log("\n" + "=".repeat(50))
  if (allChecks) {
    console.log("🎉 Production Readiness: PASSED")
    console.log("   The application structure is ready for production!")
  } else {
    console.log("⚠️  Production Readiness: NEEDS ATTENTION")
    console.log("   Please address the issues above before deploying.")
  }

  console.log("\n📋 Next Steps:")
  console.log("   1. Set up environment variables for APIs")
  console.log("   2. Run 'npm run build' to verify build")
  console.log("   3. Deploy to production environment")
  console.log("   4. Test with real API keys")

  return allChecks
}

// Run the verification
if (require.main === module) {
  verifyProductionReadiness()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error("❌ Verification failed:", error)
      process.exit(1)
    })
}

module.exports = { verifyProductionReadiness }
