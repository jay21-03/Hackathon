const EXTENSION_SOURCE =
  /(?:chrome-extension|moz-extension):\/\/|onboarding\.js|index\.ts\.js|contentInt\.js|requests\.js|200\.js/i;

function isExtensionSource(source: string | null | undefined) {
  return Boolean(source && EXTENSION_SOURCE.test(source));
}

function stackLooksLikeExtension() {
  return isExtensionSource(new Error().stack);
}

/**
 * Dev-only: hide console noise injected by browser extensions (e.g. Cursor onboarding).
 * App errors from src/ are untouched; guard is not installed in production builds.
 */
export function installExtensionConsoleGuard() {
  if (!import.meta.env.DEV) {
    return;
  }

  window.addEventListener(
    "error",
    (event) => {
      if (isExtensionSource(event.filename) || /getImageNode/i.test(String(event.message))) {
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const stack =
      reason instanceof Error
        ? reason.stack ?? reason.message
        : typeof reason === "string"
          ? reason
          : String(reason);
    if (isExtensionSource(stack) || /getImageNode/i.test(stack)) {
      event.preventDefault();
    }
  });

  (["log", "info", "warn", "error", "debug"] as const).forEach((method) => {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      if (stackLooksLikeExtension()) {
        return;
      }
      original(...args);
    };
  });
}
