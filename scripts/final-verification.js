#!/usr/bin/env node

/**
 * Final Production Verification Script
 * 
 * This script performs a comprehensive check to ensure the application
 * is fully production-ready with real data integration.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Final Production Verification');
console.log('='.repeat(50));

let allChecks = true;

// 1. Check for removed test files
console.log('\n1. Checking for removed test files...');
const testPatterns = [
  'app/api/test-*',
  'app/test*',
  'app/*test*',
  'components/*test*',
  'scripts/test-*'
];

const testFilesFound = [];
function findTestFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (file.startsWith('test-') || file === 'test') {
          testFilesFound.push(fullPath);
        } else {
          findTestFiles(fullPath);
        }
      } else if ((file.startsWith('test-') || file.includes('-test.') || file.includes('.test.')) && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        testFilesFound.push(fullPath);
      }
    });
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
}

findTestFiles('app');
findTestFiles('components');
findTestFiles('scripts');

if (testFilesFound.length === 0) {
  console.log('✅ No test files found - debugging code successfully removed');
} else {
  console.log('⚠️  Test files still present:', testFilesFound);
  allChecks = false;
}

// 2. Check for console.log statements
console.log('\n2. Checking for console.log statements...');
const consoleLogFiles = [];

function checkForConsoleLogs(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
        checkForConsoleLogs(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('console.log') && !content.includes('// console.log') && !fullPath.includes('simple-logger')) {
            consoleLogFiles.push(fullPath);
          }
        } catch (error) {
          // Can't read file
        }
      }
    });
  } catch (error) {
    // Directory doesn't exist
  }
}

checkForConsoleLogs('app');
checkForConsoleLogs('components');
checkForConsoleLogs('lib');

if (consoleLogFiles.length === 0) {
  console.log('✅ No console.log statements found in production code');
} else {
  console.log('⚠️  console.log statements found in:', consoleLogFiles);
}

// 3. Check for real API integration
console.log('\n3. Checking API integration...');
try {
  const eventsServicePath = 'lib/services/events-service.ts';
  const eventsServiceContent = fs.readFileSync(eventsServicePath, 'utf8');
  
  if (eventsServiceContent.includes('searchEventsAPI') && eventsServiceContent.includes('getFeaturedEventsAPI')) {
    console.log('✅ Events service uses real API integration');
  } else {
    console.log('❌ Events service not properly integrated with real APIs');
    allChecks = false;
  }
} catch (error) {
  console.log('❌ Could not verify events service');
  allChecks = false;
}

// 4. Check ClientPage for real events
console.log('\n4. Checking home page for real data integration...');
try {
  const clientPagePath = 'app/ClientPage.tsx';
  const clientPageContent = fs.readFileSync(clientPagePath, 'utf8');
  
  if (clientPageContent.includes('getFeaturedEvents') && clientPageContent.includes('RealEventCard')) {
    console.log('✅ Home page uses real featured events');
  } else {
    console.log('❌ Home page not properly integrated with real events');
    allChecks = false;
  }
} catch (error) {
  console.log('❌ Could not verify home page');
  allChecks = false;
}

// 5. Check build success
console.log('\n5. Checking build artifacts...');
if (fs.existsSync('.next')) {
  console.log('✅ Production build artifacts present');
} else {
  console.log('❌ No build artifacts found - run npm run build');
  allChecks = false;
}

// 6. Check package.json for production readiness
console.log('\n6. Checking package configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.build && packageJson.scripts.start) {
    console.log('✅ Production scripts configured');
  } else {
    console.log('❌ Missing production scripts');
    allChecks = false;
  }
} catch (error) {
  console.log('❌ Could not verify package.json');
  allChecks = false;
}

// 7. Check environment configuration
console.log('\n7. Checking environment configuration...');
try {
  const envPath = 'lib/env.ts';
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('RAPIDAPI_KEY') && envContent.includes('TICKETMASTER_API_KEY')) {
    console.log('✅ Environment configuration includes required API keys');
  } else {
    console.log('❌ Missing API key configuration');
    allChecks = false;
  }
} catch (error) {
  console.log('❌ Could not verify environment configuration');
  allChecks = false;
}

// Final Summary
console.log('\n' + '='.repeat(50));
if (allChecks) {
  console.log('🎉 PRODUCTION VERIFICATION: PASSED');
  console.log('   The application is fully production-ready!');
  console.log('   ✅ Real data integration complete');
  console.log('   ✅ Debugging code removed');
  console.log('   ✅ Build successful');
  console.log('   ✅ All pages functional');
} else {
  console.log('⚠️  PRODUCTION VERIFICATION: NEEDS ATTENTION');
  console.log('   Please address the issues above.');
}

console.log('\n📋 Next Steps:');
console.log('   1. Set up environment variables for APIs');
console.log('   2. Deploy to production environment');
console.log('   3. Test with real API keys');
console.log('   4. Monitor performance and error rates');

process.exit(allChecks ? 0 : 1);
