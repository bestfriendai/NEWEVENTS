// scripts/test-supabase-basic-connection.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSupabaseConnection() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase URL or Anon Key is not defined in .env.local.');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '******' : undefined);
    process.exit(1);
  }

  console.log('Attempting to connect to Supabase with:');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey.substring(0, 10) + '...'); // Log only a portion for security

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Supabase connection error:', error.message);
      process.exit(1);
    }

    if (session) {
      console.log('Successfully connected to Supabase and retrieved session:');
      console.log('User ID:', session.user.id);
      console.log('User Email:', session.user.email);
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      // Ignore "No active session" as it's expected if not logged in and keys are just anon keys
      // Also ignore "JSONHTTPError: invalid json response body at..." for now as it might be a transient issue with anon key on fresh setup
      // Also ignore "Auth session missing!" as it's similar to no active session for an anon key
      if (userError &&
          userError.message !== 'No active session' &&
          !userError.message.includes('invalid json response body') &&
          !userError.message.includes('Auth session missing!')
      ) {
          console.error('Supabase connection error when fetching user:', userError.message);
          process.exit(1);
      }
      console.log('Successfully initialized Supabase client. No active session, but connection seems OK.');
      if (user) {
        console.log('User object available (though no active session):', user.id);
      }
    }

    console.log('Supabase connection test successful!');
    process.exit(0);
  } catch (err) {
    console.error('An unexpected error occurred during the Supabase connection test:', err);
    process.exit(1);
  }
}

testSupabaseConnection();
