"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cookie-consent";
const CURRENT_VERSION = "v1-essential-only";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

export function CookieBanner() {
  const stored = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [dismissed, setDismissed] = useState(false);

  let needsBanner = false;
  if (!dismissed) {
    if (!stored) {
      needsBanner = true;
    } else {
      try {
        const parsed = JSON.parse(stored) as { version?: string };
        needsBanner = parsed.version !== CURRENT_VERSION;
      } catch {
        needsBanner = true;
      }
    }
  }

  function acknowledge() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: CURRENT_VERSION,
          acknowledgedAt: new Date().toISOString(),
          level: "essential",
        })
      );
    } catch {
      // localStorage may be blocked; we still dismiss for the session.
    }
    setDismissed(true);
  }

  if (!needsBanner) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-foreground/15 bg-card/95 backdrop-blur shadow-[0_24px_70px_-30px_color-mix(in_oklab,var(--foreground)_40%,transparent)] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="size-9 shrink-0 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand">
            <Cookie className="size-4" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              id="cookie-banner-title"
              className="font-heading text-base text-foreground"
            >
              Solo cookies técnicas
            </p>
            <p className="text-[13px] leading-relaxed text-foreground/70 mt-1">
              Usamos cookies y almacenamiento local estrictamente necesarios
              (sesión y preferencias). No hay analíticas ni tracking. Más info
              en la{" "}
              <Link
                href="/cookies"
                className="underline underline-offset-4 decoration-foreground/30 hover:text-foreground"
              >
                política de cookies
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={acknowledge}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background text-[12px] font-semibold px-4 py-1.5 hover:bg-brand hover:text-brand-foreground transition-colors"
              >
                Entendido
              </button>
              <Link
                href="/privacidad"
                className="text-[12px] text-foreground/60 hover:text-foreground underline underline-offset-4 decoration-foreground/30"
              >
                Ver política de privacidad
              </Link>
            </div>
          </div>
          <button
            onClick={acknowledge}
            aria-label="Cerrar aviso"
            className="shrink-0 size-7 rounded-md text-foreground/50 hover:text-foreground hover:bg-foreground/5 flex items-center justify-center"
          >
            <X className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
