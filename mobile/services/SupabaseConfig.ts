/**
 * Supabase Mobile Client Configuration
 * Configure your Supabase project URL and anon key here or via environment variables.
 */
export const SupabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // Headers helper for direct REST calls to Supabase PostgREST endpoints
  getHeaders(authToken?: string) {
    return {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${authToken || this.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  },
};
