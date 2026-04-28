import Link from "next/link";
import { QuotesRotator } from "@/components/app/quotes-rotator";
import { ThemeToggle } from "@/components/app/theme-toggle";

function PadelCourt() {
  return (
    <div className="auth-court-wrap flex items-center justify-center">
      <div className="relative">
        <div className="auth-court-glow" />
        <div className="auth-court">
          <div className="auth-court__service-left" />
          <div className="auth-court__service-right" />
          <div className="auth-court__center-line" />
          <div className="auth-ball auth-ball--a" />
          <div className="auth-ball auth-ball--b" />
          <div className="auth-ball auth-ball--c" />
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden md:flex md:w-[46%] lg:w-[42%] xl:w-[38%] flex-col bg-sidebar border-r border-sidebar-border">
        {/* Top gradient accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-brand"
        />
        {/* Subtle radial glow center */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_55%,color-mix(in_oklab,var(--brand)_8%,transparent)_0%,transparent_70%)]"
        />

        <div className="relative z-10 flex h-full flex-col p-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="flex size-8 items-center justify-center rounded-sm bg-brand">
              <svg
                className="size-4 text-brand-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-heading text-lg font-semibold text-foreground">
              ten<em className="italic text-brand not-italic">planner</em>
            </span>
          </Link>

          {/* Court */}
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-xs">
              <PadelCourt />
            </div>
          </div>

          {/* Quote */}
          <div className="space-y-4">
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
            <div className="space-y-1">
              <div className="select-none font-heading text-4xl font-bold leading-none text-brand/20">
                &ldquo;
              </div>
              <QuotesRotator />
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-sm bg-brand">
              <svg
                className="size-3.5 text-brand-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-heading text-lg font-semibold">
              ten<em className="italic text-brand not-italic">planner</em>
            </span>
          </Link>
          <ThemeToggle compact />
        </div>

        {/* Desktop theme toggle */}
        <div className="hidden md:flex justify-end px-6 pt-5 pb-0">
          <ThemeToggle compact />
        </div>

        {/* Form */}
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">{children}</div>

          <p className="mt-8 text-xs text-muted-foreground">
            Al continuar, aceptas nuestros{" "}
            <Link
              href="/"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Términos de Servicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
