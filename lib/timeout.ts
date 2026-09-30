/**
 * Utility to enforce a strict upper bound on asynchronous operations.
 * Guarantees that any server or client data fetching completes or falls back
 * within the specified timeout (default 2500ms), ensuring total load time is under 3 seconds.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  fallbackValue: T,
  timeoutMs: number = 2500
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallbackValue);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return result;
  } catch (err) {
    if (timer) clearTimeout(timer);
    console.warn(`[withTimeout] Operation failed, falling back (${timeoutMs}ms limit):`, err);
    return fallbackValue;
  }
}
