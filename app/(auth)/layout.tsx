import Link from "next/link";
import { ThemeToggle } from "@/components/app/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — clean, no animation */}
      <div className="relative hidden overflow-hidden md:flex md:w-[44%] lg:w-[40%] flex-col bg-sidebar border-r border-sidebar-border">
        <div className="relative z-10 flex h-full flex-col p-10">
          <Link
            href="/"
            className="font-heading text-2xl font-semibold text-foreground"
          >
            ten<em className="italic text-brand not-italic">planner</em>
          </Link>

          <div className="flex flex-1 items-end">
            <div className="space-y-3">
              <h2 className="font-heading text-3xl leading-tight text-foreground">
                Planifica tus clases de tenis sin perder tiempo.
              </h2>
              <p className="text-sm text-foreground/65 max-w-sm leading-relaxed">
                Ejercicios, clases y sesiones organizados en un solo sitio.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 md:hidden">
          <Link
            href="/"
            className="font-heading text-lg font-semibold"
          >
            ten<em className="italic text-brand not-italic">planner</em>
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
