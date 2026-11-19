/**
 * Supabase Environment Configuration
 * 
 * Automatically selects the appropriate credentials:
 * - In Development (next dev): uses NEXT_PUBLIC_DEV_SUPABASE_*
 * - In Production (next build / next start): uses NEXT_PUBLIC_PROD_SUPABASE_*
 * 
 * Fallbacks to standard NEXT_PUBLIC_SUPABASE_* if environment-specific keys are not set.
 */

export function getSupabaseConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  const url = isProduction
    ? (process.env.NEXT_PUBLIC_PROD_SUPABASE_URL || process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    : (process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_PROD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");

  const anonKey = isProduction
    ? (process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")
    : (process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

  return { url, anonKey };
}
