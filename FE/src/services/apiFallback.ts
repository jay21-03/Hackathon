export async function withApiFallback<T>(
  request: () => Promise<T>,
  fallback: T
): Promise<{ data: T; usingFallback: boolean }> {
  try {
    const data = await request();
    return { data, usingFallback: false };
  } catch {
    return { data: fallback, usingFallback: true };
  }
}
