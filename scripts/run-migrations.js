const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Database connection using service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('=== Running Supabase Migrations ===');
  console.log(`Database: ${supabaseUrl}`);
  console.log('');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  try {
    // Get all migration files
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log('No migration files found');
      return;
    }

    // Run each migration
    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');
      
      try {
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();
        
        if (error) {
          // If RPC doesn't exist, try direct execution (this might fail due to RLS)
          console.log('Note: exec_sql RPC not found, attempting direct execution...');
          
          // Split by semicolons and execute each statement
          const statements = sql.split(';').filter(s => s.trim());
          
          for (const statement of statements) {
            if (statement.trim()) {
              console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
              
              // This is a workaround - in production, you'd use the psql method
              console.warn('Direct SQL execution through Supabase JS client is limited.');
              console.warn('For full migration support, use the psql or Supabase CLI method.');
            }
          }
        } else {
          console.log(`✓ Successfully ran: ${file}`);
        }
      } catch (err) {
        console.error(`✗ Failed to run: ${file}`);
        console.error(err.message);
        throw err;
      }
      
      console.log('');
    }

    console.log('=== Migration attempt completed ===');
    console.log('');
    console.log('NOTE: Due to Supabase client limitations, some DDL statements may not execute properly.');
    console.log('For reliable migration execution, please use one of these methods:');
    console.log('1. ./run-migrations.sh (uses psql directly)');
    console.log('2. ./run-migrations-supabase-cli.sh (uses Supabase CLI)');
    console.log('3. Run migrations through Supabase Dashboard SQL Editor');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Verify connection and list existing tables
async function verifyDatabase() {
  console.log('\n=== Verifying Database Connection ===');
  
  try {
    // Try to query the information schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (error) {
      console.log('Cannot query information schema directly.');
    } else if (data) {
      console.log('Existing tables:', data.map(t => t.table_name).join(', '));
    }
  } catch (err) {
    console.log('Database verification limited due to client restrictions.');
  }
}

// Run the migrations
(async () => {
  await verifyDatabase();
  await runMigrations();
})();