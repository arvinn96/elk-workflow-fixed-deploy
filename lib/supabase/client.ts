import { createBrowserClient } from '@supabase/ssr'

// Module-level singleton: one Supabase client per browser tab.
// Previously every createClient() call spun up a fresh HTTP connection and
// initialised a new auth-state listener. With the singleton, all components
// share one connection — reducing cold-start latency and WebSocket churn.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (_client) return _client
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _client
}
