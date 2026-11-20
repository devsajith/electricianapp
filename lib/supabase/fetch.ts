/**
 * Custom fetch wrapper for Supabase client.
 * 
 * Handles Supabase infrastructure clock skew (PGRST303: "JWT issued at future").
 * This occurs when Supabase Auth (GoTrue) issues a JWT whose `iat` timestamp
 * is slightly ahead of the PostgREST container's clock.
 * Retrying with backoff allows PostgREST's clock to catch up.
 */
export async function fetchWithClockSkewRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let response = await fetch(input, init);

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (response.status !== 401) break;

    try {
      const cloned = response.clone();
      const text = await cloned.text();
      if (text.includes("JWT issued at future") || text.includes("PGRST303")) {
        console.warn(
          `[Supabase] Clock skew detected (JWT issued at future, attempt ${attempt}/3). Retrying in 1.5s...`
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));
        response = await fetch(input, init);
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return response;
}
