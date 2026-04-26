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
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-xl focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-brand focus:outline-none"
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
            var t = localStorage.getItem('theme');
            var isDark = t ? t === 'dark' : true;
            document.documentElement.classList.toggle('dark', isDark);
            var A = { blue: ['oklch(0.70 0.18 255)','oklch(0.50 0.20 255)'], green: ['oklch(0.73 0.19 148)','oklch(0.48 0.18 148)'], violet: ['oklch(0.68 0.18 290)','oklch(0.50 0.18 290)'], amber: ['oklch(0.78 0.18 70)','oklch(0.58 0.18 70)'], rose: ['oklch(0.70 0.20 15)','oklch(0.52 0.20 15)'] };
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
