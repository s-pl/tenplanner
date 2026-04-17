import Link from "next/link";
import { Zap } from "lucide-react";
import { QuotesRotator } from "@/components/app/quotes-rotator";
import { ThemeToggle } from "@/components/app/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 relative bg-sidebar border-r border-sidebar-border flex-col p-12 overflow-hidden court-grid">
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-2.5 mb-auto">
            <div className="size-9 rounded-xl bg-brand flex items-center justify-center">
              <Zap className="size-5 text-brand-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-semibold text-xl tracking-tight">
              ten<span className="text-brand">planner</span>
            </span>
          </Link>

          <div className="mt-auto">
            <div className="mb-6">
              <div className="text-5xl text-brand/20 font-heading font-bold leading-none select-none mb-3">
                &ldquo;
              </div>
              <QuotesRotator />
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border md:border-0">
          {/* Mobile logo */}
          <div className="md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-brand flex items-center justify-center">
                <Zap className="size-3.5 text-brand-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-heading font-semibold text-lg">
                ten<span className="text-brand">planner</span>
              </span>
            </Link>
          </div>
          <div className="hidden md:block" />
          <ThemeToggle compact />
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">{children}</div>

          <p className="mt-8 text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
