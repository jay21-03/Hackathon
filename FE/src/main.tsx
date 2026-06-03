import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./app/AppRouter";
import { ToastProvider } from "./components/feedback/ToastProvider";
import "./index.css";

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
      window.dispatchEvent(new Event("seal-demo-session-change"));
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
      window.dispatchEvent(new Event("seal-demo-session-change"));
    } catch {
      /* ignore */
    }
  };
} catch {
  /* ignore */
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ToastProvider>
  </React.StrictMode>
);
