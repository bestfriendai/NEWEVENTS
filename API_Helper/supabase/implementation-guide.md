# Supabase Implementation Guide for NEWEVENTS

Supabase provides a comprehensive backend-as-a-service (BaaS) solution, leveraging PostgreSQL for its database, along with authentication, realtime subscriptions, and auto-generated APIs. For the NEWEVENTS platform, Supabase will serve as the primary backend for storing event data, user profiles, user favorites, and managing authentication.

---

## 1. Authentication

Supabase offers multiple ways to manage access: API keys for server-to-server communication and JWTs for user-specific client-side operations.

### API Keys
-   **`anon` key (public):** Used for client-side requests. It's safe to expose this in browser code because Row Level Security (RLS) should be used to control data access.
-   **`service_role` key (secret):** Used for server-side operations that require bypassing RLS (e.g., administrative tasks, cron jobs). **Never expose this key in client-side code.**

These keys are found in your Supabase project dashboard under **Project Settings > API**.

### User Authentication (JWTs)
Supabase Auth handles user sign-up, sign-in, and management, issuing JWTs to authenticated users.
-   **Email/Password:**
    \`\`\`javascript
    // Sign up
    const { data, error } = await supabase.auth.signUp({
      email: 'user@example.com',
      password: 'securepassword123'
    });

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'securepassword123'
    });
    \`\`\`
-   **OAuth Providers (Google, GitHub, etc.):**
    \`\`\`javascript
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google' // or 'github', 'facebook', etc.
    });
    \`\`\`
-   **Magic Links (Passwordless):**
    \`\`\`javascript
    const { data, error } = await supabase.auth.signInWithOtp({
      email: 'user@example.com'
    });
    \`\`\`
-   **Session Management:** The Supabase client library automatically manages JWTs and session refresh.
    \`\`\`javascript
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session) {
      // const user = session.user;
    }

    // Listen to auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);
      // Handle sign-in, sign-out, token refresh
    });
    \`\`\`
[Source: Supabase Auth Docs][2][3][5]

---

## 2. Key Functionalities for NEWEVENTS Backend

### Database (PostgreSQL via Supabase Client)
Supabase auto-generates a RESTful API from your PostgreSQL schema using PostgREST [1]. You interact with it using the `supabase-js` client library.

**Initializing the Client:**
\`\`\`javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // From your project settings
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // From your project settings

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
\`\`\`

**CRUD Operations for Events, Users, Favorites:**

*   **Example Table Structures (SQL):**
    \`\`\`sql
    -- Users table (Supabase Auth manages its own 'auth.users' table, this might be for public profiles)
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Events table
    CREATE TABLE public.events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ,
      venue_name TEXT,
      address TEXT,
      latitude FLOAT,
      longitude FLOAT,
      category TEXT,
      image_url TEXT,
      organizer_id UUID REFERENCES public.profiles(id), -- Optional: if users can create events
      created_at TIMESTAMPTZ DEFAULT NOW(),
      source_api TEXT, -- e.g., 'Ticketmaster', 'Eventbrite'
      source_event_id TEXT -- ID from the original API
    );
    -- Consider a PostGIS extension for advanced geospatial queries on latitude/longitude
    -- CREATE EXTENSION postgis;
    -- ALTER TABLE public.events ADD COLUMN location GEOGRAPHY(Point, 4326);
    -- CREATE INDEX events_location_idx ON public.events USING GIST (location);


    -- User Favorites (join table)
    CREATE TABLE public.user_favorites (
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, event_id)
    );
    \`\`\`

*   **Creating Records:**
    \`\`\`javascript
    // Add a new event
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert({
        title: 'Tech Conference 2025',
        description: 'Annual tech conference.',
        start_time: '2025-10-20T09:00:00Z',
        venue_name: 'Convention Center',
        address: '123 Main St, Anytown, USA',
        latitude: 34.0522,
        longitude: -118.2437
      })
      .select() // To get the inserted record back
      .single(); // If inserting one record
    \`\`\`

*   **Reading Records:**
    \`\`\`javascript
    // Get all upcoming events
    const { data: upcomingEvents, error: selectError } = await supabase
      .from('events')
      .select('*') // Select specific columns for performance: 'id, title, start_time, venue_name'
      .gte('start_time', new Date().toISOString()) // Greater than or equal to current time
      .order('start_time', { ascending: true });

    // Get a user's favorite events
    const userId = supabase.auth.getUser().id; // Assuming user is logged in
    const { data: favoriteEvents, error: favError } = await supabase
      .from('user_favorites')
      .select('event_id, events (*)') // Fetch event details along with favorite
      .eq('user_id', userId);
    \`\`\`

*   **Updating Records:**
    \`\`\`javascript
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ description: 'Updated description for the tech conference.' })
      .eq('id', 'event_uuid_to_update')
      .select()
      .single();
    \`\`\`

*   **Deleting Records:**
    \`\`\`javascript
    // Remove an event from favorites
    const { error: deleteError } = await supabase
      .from('user_favorites')
      .delete()
      .match({ user_id: 'user_uuid', event_id: 'event_uuid_to_unfavorite' });
    \`\`\`

### Realtime Subscriptions
Listen to database changes in real time (e.g., new events added, favorites updated).
\`\`\`javascript
const eventsChannel = supabase
  .channel('public-events-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'events' }, // Listen to all changes (INSERT, UPDATE, DELETE) on 'events' table
    (payload) => {
      console.log('Change received!', payload);
      // Update UI based on payload.eventType and payload.new or payload.old
      if (payload.eventType === 'INSERT') {
        // Add payload.new to your events list
      }
    }
  )
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('Subscribed to events changes!');
    }
    if (err) {
      console.error('Subscription error:', err);
    }
  });

// Don't forget to unsubscribe when the component unmounts or is no longer needed
// eventsChannel.unsubscribe();
\`\`\`
[Source: Supabase Database Docs, Realtime Docs][1][3][5]

---

## 3. Row Level Security (RLS)

RLS is crucial for securing your data by defining policies on who can access or modify rows in your tables. **Always enable RLS for tables containing sensitive or user-specific data.**

**Example RLS Policies:**

*   **Profiles Table:**
    \`\`\`sql
    -- Enable RLS on profiles table
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Users can view all profiles (publicly readable)
    CREATE POLICY "Public profiles are viewable by everyone."
      ON public.profiles FOR SELECT USING (true);

    -- Users can update their own profile
    CREATE POLICY "Users can update their own profile."
      ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    \`\`\`

*   **Events Table:**
    \`\`\`sql
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

    -- Anyone can read events
    CREATE POLICY "Events are publicly viewable."
      ON public.events FOR SELECT USING (true);

    -- Authenticated users can insert events (if your app allows this)
    -- CREATE POLICY "Authenticated users can create events."
    --   ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    -- Or, only specific roles/admin can insert/update/delete events (manage this via service_role key on backend)
    \`\`\`

*   **User Favorites Table:**
    \`\`\`sql
    ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

    -- Users can view their own favorites
    CREATE POLICY "Users can view their own favorites."
      ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);

    -- Users can insert/delete their own favorites
    CREATE POLICY "Users can manage their own favorites."
      ON public.user_favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    \`\`\`
Policies are managed via SQL in the Supabase dashboard (Database > Policies).
[Source: Supabase RLS Docs][1][3]

---

## 4. Error Handling

The `supabase-js` client returns an `error` object alongside `data`. Always check for errors.
\`\`\`javascript
const { data, error } = await supabase.from('events').select('*');

if (error) {
  console.error('Supabase Error:', error.message);
  console.error('Details:', error.details); // More specific info
  console.error('Hint:', error.hint);     // Potential solution
  console.error('Code:', error.code);     // PostgreSQL error code

  // Handle specific error codes or messages
  if (error.code === 'PGRST116') { // Example: JWT expired
    // Attempt to refresh session or prompt user to log in
  }
  // Display user-friendly message
  return;
}
// Process data if no error
console.log(data);
\`\`\`

---

## 5. Rate Limiting & Resource Limits

-   Supabase has generous free tier limits, but be aware of them for production applications.
-   **API Requests:** Default is around 500 requests/second per project, but this is a soft limit and depends on instance resources [1].
-   **Realtime Connections:** Free tier typically allows ~50 concurrent connections.
-   **Database Resources:** CPU, RAM, disk I/O depend on your chosen instance size.
-   **Strategies:**
    -   Optimize queries: Use `select()` to fetch only needed columns, apply filters (`eq`, `gte`, `lt`, `in`, etc.), and use `limit()` for pagination.
    -   Use database indexes on frequently queried columns.
    -   Cache data on the client-side or via a CDN for static assets in Supabase Storage.
    -   For high-traffic applications, upgrade your Supabase project plan.
    -   Monitor project usage in the Supabase dashboard.

---

## 6. Best Practices

1.  **Always Enable RLS**: For any table that isn't meant to be fully public.
2.  **Select Specific Columns**: Avoid `select('*')` in production; fetch only the columns you need to reduce data transfer and improve query performance.
3.  **Indexing**: Create indexes on columns used in `WHERE` clauses, `JOIN` conditions, and `ORDER BY` clauses. For geospatial queries on `latitude`/`longitude`, consider using the PostGIS extension and GIST indexes.
4.  **Server-Side Logic with Edge Functions**: For complex operations, data validation, or integrating with third-party services securely, use Supabase Edge Functions (Deno-based serverless functions).
5.  **Connection Pooling**: Supabase handles connection pooling by default when using its APIs. If connecting directly to PostgreSQL from a serverless environment, ensure you use a connection pooler like PgBouncer (Supabase provides one).
6.  **Data Validation**: Implement data validation both client-side and server-side (e.g., using database constraints or Edge Functions).
7.  **Backup and Restore**: Regularly back up your database. Supabase provides automated backups on paid plans.
8.  **Environment Variables**: Store Supabase URL and keys in environment variables, not hardcoded.

---

## 7. Common Pitfalls

-   **Forgetting RLS**: Leaving tables unprotected, especially `auth.users` or custom profile tables.
-   **Exposing `service_role` Key**: This key bypasses RLS and should never be in client-side code.
-   **Inefficient Queries**: Not using indexes, fetching too much data, or performing N+1 queries.
-   **Not Handling Realtime Subscription Errors**: Subscriptions can drop; implement logic to resubscribe or handle disconnections.
-   **Ignoring Auth State Changes**: Not updating UI or data access based on user sign-in/sign-out events.
-   **Large Joins on Client-Side**: While Supabase client allows joins, very large or complex joins might be better handled by database views or Edge Functions for performance.

---

## 8. Official Resources

-   **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)[1][2][3]
-   **Supabase JavaScript Client (supabase-js)**: [https://supabase.com/docs/reference/javascript/introduction](https://supabase.com/docs/reference/javascript/introduction)[5]
-   **Supabase SQL (PostgreSQL)**: [https://supabase.com/docs/guides/database/sql](https://supabase.com/docs/guides/database/sql)
-   **Supabase Auth**: [https://supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
-   **Supabase Realtime**: [https://supabase.com/docs/guides/realtime](https://supabase.com/docs/guides/realtime)
-   **Supabase Management API (for programmatic project management)**: [https://supabase.com/docs/reference/api/introduction](https://supabase.com/docs/reference/api/introduction)[4]

By following these guidelines, NEWEVENTS can effectively use Supabase as a robust and scalable backend.
