"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "mac-safari" | "firefox" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !("MSStream" in window);
  if (isIOS) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/firefox/i.test(ua)) return "firefox";
  const isMac = /macintosh|mac os x/i.test(ua) && !("ontouchend" in document);
  const isSafari = /safari/i.test(ua) && !/chrome|chromium|edg/i.test(ua);
  if (isMac && isSafari) return "mac-safari";
  return "other";
}

const INSTRUCTIONS: Record<
  Exclude<Platform, "android">,
  { label: string; body: React.ReactNode }
> = {
  ios: {
    label: "Añadir a inicio",
    body: (
      <>
        Toca <span className="font-semibold">Compartir</span> en Safari y luego{" "}
        <span className="font-semibold">Añadir a pantalla de inicio</span>.
      </>
    ),
  },
  "mac-safari": {
    label: "Añadir al Dock",
    body: (
      <>
        En el menú <span className="font-semibold">Archivo</span> de Safari,
        elige <span className="font-semibold">Añadir al Dock</span>.
      </>
    ),
  },
  firefox: {
    label: "Instalar app",
    body: (
      <>
        Firefox de escritorio no permite instalar TenPlanner como app. Abre esta
        página con <span className="font-semibold">Chrome</span> o{" "}
        <span className="font-semibold">Edge</span> para instalarla.
      </>
    ),
  },
  other: {
    label: "Instalar app",
    body: (
      <>
        Busca el icono de instalación <span className="font-semibold">⊕</span>{" "}
        en la barra de direcciones, o el menú del navegador &rsaquo;{" "}
        <span className="font-semibold">Instalar TenPlanner</span>.
      </>
    ),
  },
};

/**
 * Always shows a way to add TenPlanner to the device: a native "Instalar
 * app" button wherever the browser offers `beforeinstallprompt` (Android
 * Chrome/Edge, and sometimes desktop Chrome/Edge), and otherwise a button
 * that reveals manual steps for the detected platform (iOS Safari, macOS
 * Safari, Firefox desktop, or a generic fallback). Renders nothing only
 * once the app is already installed.
 *
 * All browser checks start from safe SSR defaults (`other`, no prompt) and
 * are resolved on mount — reading them during the initializer instead
 * would make the client's first render disagree with the SSR'd HTML and
 * trigger a hydration mismatch.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Synchronizing with browser-only capabilities (display mode, user
    // agent, install events) has no equivalent outside an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true
    );
    setPlatform(detectPlatform());

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
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  const instructions = platform === "android" ? null : INSTRUCTIONS[platform];
  const label = deferredPrompt
    ? "Instalar app"
    : (instructions?.label ?? "Instalar app");

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowHelp((value) => !value);
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
        {label}
      </button>
      {showHelp && !deferredPrompt && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[#050505]/10 bg-white p-4 text-sm leading-6 text-[#050505] shadow-[0_24px_55px_rgba(5,5,5,0.12)]">
          {platform === "android"
            ? "Abre el menú del navegador y elige Instalar app o Añadir a pantalla de inicio."
            : instructions?.body}
        </div>
      )}
    </div>
  );
}
