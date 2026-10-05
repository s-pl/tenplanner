"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker. Silent by design: no UI, no install
 * prompt — just makes the app shell and last-viewed pages available
 * offline. Mount once near the root layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => {
        console.error("Service worker registration failed", error);
      });
  }, []);

  return null;
}
