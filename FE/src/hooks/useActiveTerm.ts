import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { enableAcademicTerms } from "../config/features";
import { queryKeys } from "../lib/queryKeys";
import { fetchAcademicTerms } from "../services/academicTermService";
import { resolveApiError } from "../utils/apiError";
import { useApiRoles } from "./useApiRoles";

const STORAGE_KEY = "seal.activeTermId";

export const ACTIVE_TERM_CHANGE_EVENT = "seal-active-term-change";

function readStoredTermId(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? Number(stored) : null;
}

export function setStoredActiveTermId(id: number) {
  localStorage.setItem(STORAGE_KEY, String(id));
  window.dispatchEvent(new Event(ACTIVE_TERM_CHANGE_EVENT));
}

export function useActiveTerm() {
  const { hasOrganizer, loading: rolesLoading } = useApiRoles();
  const canManageTerms = enableAcademicTerms && hasOrganizer;
  const [manualTermId, setManualTermId] = useState<number | null>(readStoredTermId);

  useEffect(() => {
    const sync = () => setManualTermId(readStoredTermId());
    window.addEventListener(ACTIVE_TERM_CHANGE_EVENT, sync);
    return () => window.removeEventListener(ACTIVE_TERM_CHANGE_EVENT, sync);
  }, []);

  const termsQuery = useQuery({
    queryKey: queryKeys.academicTerms.list("ACTIVE"),
    queryFn: () => fetchAcademicTerms("ACTIVE"),
    enabled: canManageTerms && !rolesLoading
  });

  const terms = termsQuery.data ?? [];

  const termId = useMemo(() => {
    if (!canManageTerms) return null;
    if (manualTermId != null) {
      if (!terms.length) return manualTermId;
      return terms.some((item) => item.id === manualTermId) ? manualTermId : null;
    }
    const firstActive = terms.find((t) => t.status === "ACTIVE") ?? terms[0];
    return firstActive?.id ?? null;
  }, [terms, manualTermId, canManageTerms]);

  const setTermId = useCallback((id: number) => {
    setManualTermId(id);
    setStoredActiveTermId(id);
  }, []);

  const term = terms.find((item) => item.id === termId) ?? null;

  return {
    termId,
    term,
    terms,
    setTermId,
    enabled: canManageTerms,
    loading: canManageTerms && (rolesLoading || termsQuery.isLoading),
    error: termsQuery.isError
      ? resolveApiError(termsQuery.error, "Không tải được danh sách học kỳ.")
      : null,
    refetch: termsQuery.refetch
  };
}
