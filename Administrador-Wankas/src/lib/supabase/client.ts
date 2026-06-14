import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Singleton instance - prevents multiple GoTrueClient warnings
let clientInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export const createClient = () => {
  // On the server side, always create a fresh instance
  if (typeof window === 'undefined') {
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // On the client side, reuse the same instance
  if (!clientInstance) {
    clientInstance = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return clientInstance;
};
