import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { CookieBanner } from "@/components/app/cookie-banner";
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

export const metadata: Metadata = {
  title: "TenPlanner — Planificador de Entrenamiento de Pádel",
  description:
    "El planificador inteligente de entrenamiento para entrenadores y jugadores de pádel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakartaSans.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
          try {
            var t = localStorage.getItem('theme');
            var isDark = t ? t === 'dark' : true;
            document.documentElement.classList.toggle('dark', isDark);
            var A = { green: ['oklch(0.73 0.19 148)','oklch(0.48 0.18 148)'], blue: ['oklch(0.68 0.18 230)','oklch(0.48 0.18 230)'], violet: ['oklch(0.68 0.18 290)','oklch(0.50 0.18 290)'], amber: ['oklch(0.78 0.18 70)','oklch(0.58 0.18 70)'], rose: ['oklch(0.70 0.20 15)','oklch(0.52 0.20 15)'] };
            var ac = localStorage.getItem('accent') || 'green';
            var c = A[ac] || A.green;
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
      </body>
    </html>
  );
}
