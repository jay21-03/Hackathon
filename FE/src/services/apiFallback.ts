export async function withApiFallback<T>(
  request: () => Promise<T>,
  fallback: T
): Promise<{ data: T; usingFallback: boolean }> {
  try {
    const data = await request();
    const emptyArray = Array.isArray(data) && data.length === 0;
    return { data: emptyArray ? fallback : data, usingFallback: emptyArray };
  } catch {
    return { data: fallback, usingFallback: true };
  }
}
