import { useEffect, useState } from "react";

export function useAsyncResource<T>(loader: () => Promise<{ data: T; usingFallback: boolean }>) {
  const [data, setData] = useState<T | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    loader()
      .then((result) => {
        if (!active) return;
        setData(result.data);
        setUsingFallback(result.usingFallback);
        setError("");
      })
      .catch((unknownError) => {
        if (!active) return;
        setError(unknownError instanceof Error ? unknownError.message : "Không tải được dữ liệu.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loader]);

  return { data, usingFallback, loading, error };
}
