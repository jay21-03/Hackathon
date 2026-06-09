import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../utils/apiError";

function logQueryFailure(error: unknown) {
  if (import.meta.env.DEV) {
    console.warn("[react-query]", getApiErrorMessage(error));
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: logQueryFailure }),
  mutationCache: new MutationCache({ onError: logQueryFailure }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
