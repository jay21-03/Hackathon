import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppRouter } from "./app/AppRouter";
import { ToastProvider } from "./components/feedback/ToastProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { installExtensionConsoleGuard } from "./utils/extensionConsoleGuard";
import "./index.css";

installExtensionConsoleGuard();

// Monkey-patch localStorage.setItem to emit storage and custom events
// so in-window calls (e.g., test page.evaluate) are observed by app listeners.
try {
  const _setItem = Storage.prototype.setItem;
  const _removeItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    _setItem.apply(this, [key, value]);
    try {
      window.dispatchEvent(new StorageEvent("storage", { key, newValue: value }));
    } catch {
      /* ignore */
    }
    try {
      window.dispatchEvent(new Event("seal-session-change"));
    } catch {
      /* ignore */
    }
  };

  Storage.prototype.removeItem = function (key: string) {
    _removeItem.apply(this, [key]);
    try {
      window.dispatchEvent(new StorageEvent("storage", { key, newValue: null }));
    } catch {
      /* ignore */
    }
    try {
      window.dispatchEvent(new Event("seal-session-change"));
    } catch {
      /* ignore */
    }
  };
} catch {
  /* ignore */
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

const appTree = (
  <QueryProvider>
    <ToastProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppRouter />
      </BrowserRouter>
    </ToastProvider>
  </QueryProvider>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
  ) : (
    appTree
  )
);