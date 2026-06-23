import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/feedback/ToastProvider";

/** Hiện toast một lần khi redirect kèm `location.state.message`, rồi xóa message khỏi history. */
export function useRouteFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useToast();

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    const message = state?.message?.trim();
    if (!message) return;

    notify(message, "warning");

    const nextState = state ? { ...state } : {};
    delete nextState.message;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: Object.keys(nextState).length > 0 ? nextState : null
    });
  }, [location.key, location.pathname, location.search, location.state, navigate, notify]);
}
