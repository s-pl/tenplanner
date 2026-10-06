"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shows an "Instalar app" button once the browser has signaled the PWA is
 * installable (Android/Chrome/Edge via `beforeinstallprompt`), or an
 * "Añadir a inicio" button with manual instructions on iOS Safari, which
 * never fires that event. Renders nothing once the app is already
 * installed, or on browsers that give us neither signal.
 *
 * All browser checks start `false` to match the server-rendered output
 * (there is no `window` on the server) and are resolved on mount. Reading
 * them into state during the initializer instead would make the client's
 * first render disagree with the SSR'd HTML and trigger a hydration
 * mismatch, most noticeably on iOS where `isIOS` would flip from false to
 * true the instant the component mounts.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    // Synchronizing with browser-only capabilities (display mode, user
    // agent, install events) has no equivalent outside an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true
    );

    const ua = window.navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua) && !("MSStream" in window));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (isStandalone || (!deferredPrompt && !isIOS)) {
    return null;
  }

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowIOSHelp((value) => !value);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border border-[#050505]/12 bg-white px-5 text-sm font-semibold text-[#050505] transition hover:border-[#5f7000] hover:text-[#5f7000]",
          className
        )}
      >
        <Download className="size-4" />
        {deferredPrompt ? "Instalar app" : "Añadir a inicio"}
      </button>
      {showIOSHelp && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[#050505]/10 bg-white p-4 text-sm leading-6 text-[#050505] shadow-[0_24px_55px_rgba(5,5,5,0.12)]">
          Toca <span className="font-semibold">Compartir</span> en Safari y
          luego <span className="font-semibold">Añadir a pantalla de
          inicio</span>.
        </div>
      )}
    </div>
  );
}
