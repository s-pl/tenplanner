import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { CookieBanner } from "@/components/app/cookie-banner";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://tenplanner.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TenPlanner — Planificador de Entrenamiento de Pádel",
    template: "%s · TenPlanner",
  },
  description:
    "El planificador inteligente de entrenamiento para entrenadores y jugadores de pádel. Diseña sesiones, gestiona alumnos y mide progreso.",
  keywords: [
    "pádel",
    "entrenamiento",
    "planificador",
    "entrenador",
    "sesiones",
    "TenPlanner",
  ],
  applicationName: "TenPlanner",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TenPlanner",
    title: "TenPlanner — Planificador de Entrenamiento de Pádel",
    description:
      "Diseña sesiones, gestiona alumnos y mide el progreso de tu pádel.",
    url: "/",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "TenPlanner",
    description:
      "Planificador inteligente de entrenamiento de pádel para entrenadores.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/favicon.ico" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="es"
      className={`${plusJakartaSans.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-brand focus:outline-none"
        >
          Ir al contenido principal
        </a>
        <Script
          id="theme-init"
          nonce={nonce}
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
          try {
            var autoTheme = localStorage.getItem('theme-auto') !== 'false';
            var h = new Date().getHours();
            var timeDark = h < 7 || h >= 21;
            var t = localStorage.getItem('theme');
            var isDark = autoTheme ? timeDark : (t ? t === 'dark' : timeDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', isDark);
            var A = { blue: ['oklch(0.78 0.17 148)','oklch(0.43 0.145 150)'], green: ['oklch(0.82 0.18 132)','oklch(0.49 0.16 132)'], violet: ['oklch(0.72 0.11 205)','oklch(0.46 0.10 205)'], amber: ['oklch(0.78 0.14 58)','oklch(0.55 0.13 55)'], rose: ['oklch(0.70 0.18 28)','oklch(0.52 0.17 28)'] };
            var ac = localStorage.getItem('accent') || 'blue';
            var c = A[ac] || A.blue;
            var v = isDark ? c[0] : c[1];
            var el = document.documentElement;
            el.style.setProperty('--brand', v); el.style.setProperty('--primary', v); el.style.setProperty('--ring', v); el.style.setProperty('--sidebar-primary', v); el.style.setProperty('--sidebar-ring', v);
            var fs = localStorage.getItem('font-size') || 'md';
            var fm = { sm: '13px', md: '15px', lg: '17px' };
            el.style.fontSize = fm[fs] || '15px';
          } catch(e) {}
        `,
          }}
        />
        {children}
        <CookieBanner />
        <Toaster />
      </body>
    </html>
  );
}
