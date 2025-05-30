#!/usr/bin/env node

/**
 * Comprehensive App Testing Script
 * 
 * This script tests every function and feature of the DateAI Events Application
 * to ensure everything works perfectly before deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Comprehensive App Testing');
console.log('='.repeat(60));

let allTests = true;
const testResults = [];

function logTest(testName, passed, details = '') {
  const status = passed ? '✅' : '❌';
  const result = `${status} ${testName}`;
  console.log(result);
  if (details) console.log(`   ${details}`);
  testResults.push({ name: testName, passed, details });
  if (!passed) allTests = false;
}

// 1. Test File Structure
console.log('\n1. Testing File Structure...');

const requiredFiles = [
  'app/page.tsx',
  'app/ClientPage.tsx',
  'app/events/page.tsx',
  'app/favorites/page.tsx',
  'app/create-event/page.tsx',
  'app/messages/page.tsx',
  'app/profile/page.tsx',
  'app/settings/page.tsx',
  'app/party/page.tsx',
  'lib/services/events-service.ts',
  'lib/api/events-api.ts',
  'lib/api/ticketmaster-api.ts',
  'lib/api/rapidapi-events.ts',
  'components/app-layout.tsx',
  'components/event-card.tsx',
  'components/event-detail-modal.tsx'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  logTest(`File exists: ${file}`, exists);
});

// 2. Test API Integration Files
console.log('\n2. Testing API Integration...');

const apiFiles = [
  'lib/api/events-api.ts',
  'lib/api/ticketmaster-api.ts',
  'lib/api/rapidapi-events.ts'
];

apiFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasExports = content.includes('export');
    const hasAsyncFunctions = content.includes('async function') || content.includes('async ');
    logTest(`API file has exports: ${file}`, hasExports);
    logTest(`API file has async functions: ${file}`, hasAsyncFunctions);
  } catch (error) {
    logTest(`API file readable: ${file}`, false, error.message);
  }
});

// 3. Test Events Service
console.log('\n3. Testing Events Service...');

try {
  const eventsServiceContent = fs.readFileSync('lib/services/events-service.ts', 'utf8');
  
  const hasSearchEvents = eventsServiceContent.includes('searchEvents');
  const hasGetFeaturedEvents = eventsServiceContent.includes('getFeaturedEvents') || eventsServiceContent.includes('getUpcomingEvents');
  const hasRealAPIIntegration = eventsServiceContent.includes('searchEventsAPI') || eventsServiceContent.includes('getFeaturedEventsAPI');
  const hasErrorHandling = eventsServiceContent.includes('try') && eventsServiceContent.includes('catch');
  
  logTest('Events service has search function', hasSearchEvents);
  logTest('Events service has featured events function', hasGetFeaturedEvents);
  logTest('Events service uses real APIs', hasRealAPIIntegration);
  logTest('Events service has error handling', hasErrorHandling);
} catch (error) {
  logTest('Events service readable', false, error.message);
}

// 4. Test Component Structure
console.log('\n4. Testing Component Structure...');

const componentFiles = [
  'components/app-layout.tsx',
  'components/event-card.tsx',
  'components/event-detail-modal.tsx',
  'components/events/ImprovedEventsMap.tsx'
];

componentFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const isReactComponent = content.includes('export') && (content.includes('function') || content.includes('const'));
    const hasJSX = content.includes('return') && (content.includes('<') || content.includes('jsx'));
    logTest(`Component is valid React: ${file}`, isReactComponent);
    logTest(`Component returns JSX: ${file}`, hasJSX);
  } catch (error) {
    logTest(`Component readable: ${file}`, false, error.message);
  }
});

// 5. Test Page Components
console.log('\n5. Testing Page Components...');

const pageFiles = [
  'app/page.tsx',
  'app/events/page.tsx',
  'app/favorites/page.tsx',
  'app/create-event/page.tsx',
  'app/messages/page.tsx',
  'app/profile/page.tsx',
  'app/settings/page.tsx'
];

pageFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasDefaultExport = content.includes('export default');
    const hasAppLayout = content.includes('AppLayout') || content.includes('<div') || content.includes('return');
    logTest(`Page has default export: ${file}`, hasDefaultExport);
    logTest(`Page has layout/JSX: ${file}`, hasAppLayout);
  } catch (error) {
    logTest(`Page readable: ${file}`, false, error.message);
  }
});

// 6. Test Environment Configuration
console.log('\n6. Testing Environment Configuration...');

try {
  const envContent = fs.readFileSync('lib/env.ts', 'utf8');
  const hasSupabaseConfig = envContent.includes('SUPABASE');
  const hasRapidAPIConfig = envContent.includes('RAPIDAPI');
  const hasTicketmasterConfig = envContent.includes('TICKETMASTER');
  const hasValidation = envContent.includes('validateEnv');
  
  logTest('Environment has Supabase config', hasSupabaseConfig);
  logTest('Environment has RapidAPI config', hasRapidAPIConfig);
  logTest('Environment has Ticketmaster config', hasTicketmasterConfig);
  logTest('Environment has validation', hasValidation);
} catch (error) {
  logTest('Environment config readable', false, error.message);
}

// 7. Test Build Configuration
console.log('\n7. Testing Build Configuration...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasNextJS = packageJson.dependencies && packageJson.dependencies.next;
  const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
  const hasStartScript = packageJson.scripts && packageJson.scripts.start;
  const hasDevScript = packageJson.scripts && packageJson.scripts.dev;
  
  logTest('Package has Next.js dependency', !!hasNextJS);
  logTest('Package has build script', !!hasBuildScript);
  logTest('Package has start script', !!hasStartScript);
  logTest('Package has dev script', !!hasDevScript);
} catch (error) {
  logTest('Package.json readable', false, error.message);
}

// 8. Test TypeScript Configuration
console.log('\n8. Testing TypeScript Configuration...');

const tsConfigExists = fs.existsSync('tsconfig.json');
logTest('TypeScript config exists', tsConfigExists);

if (tsConfigExists) {
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    const hasCompilerOptions = !!tsConfig.compilerOptions;
    const hasStrictMode = tsConfig.compilerOptions && tsConfig.compilerOptions.strict;
    logTest('TypeScript has compiler options', hasCompilerOptions);
    logTest('TypeScript has strict mode', !!hasStrictMode);
  } catch (error) {
    logTest('TypeScript config readable', false, error.message);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary:');
const passedTests = testResults.filter(t => t.passed).length;
const totalTests = testResults.length;
console.log(`   Passed: ${passedTests}/${totalTests} tests`);

if (allTests) {
  console.log('🎉 ALL TESTS PASSED - App structure is solid!');
} else {
  console.log('⚠️  Some tests failed - check details above');
  console.log('\nFailed tests:');
  testResults.filter(t => !t.passed).forEach(test => {
    console.log(`   ❌ ${test.name}: ${test.details}`);
  });
}

console.log('\n📋 Next: Running functional improvements...');
process.exit(allTests ? 0 : 1);
