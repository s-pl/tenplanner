import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

const NAV = [
  { href: "/privacidad", label: "Privacidad", code: "01" },
  { href: "/aviso-legal", label: "Aviso legal", code: "02" },
  { href: "/cookies", label: "Cookies", code: "03" },
  { href: "/terminos", label: "Términos", code: "04" },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#050505] dark:bg-[#050505] dark:text-[#F4F4F1]">
      <header className="sticky top-0 z-40 border-b border-[#050505]/10 bg-[#F4F4F1]/90 backdrop-blur dark:border-white/10 dark:bg-[#050505]/90">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#050505] text-[#D6FF38] dark:bg-[#D6FF38] dark:text-[#050505]">
              <Zap className="size-3.5" strokeWidth={2.5} />
            </div>
            <span className="font-heading text-lg font-semibold">
              ten
              <span className="italic text-[#6D7F00] dark:text-[#D6FF38]">
                planner
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#050505]/12 bg-white/70 px-3 py-2 text-[12px] font-semibold text-foreground/60 transition-colors hover:border-[#D6FF38] hover:text-foreground dark:border-white/10 dark:bg-white/[0.04]"
          >
            <ArrowLeft className="size-3.5" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_80%_8%,rgba(214,255,56,0.24),transparent_34%)]" />
        <div className="relative mx-auto max-w-[1180px] px-5 py-8 lg:px-10 lg:py-12">
          <div className="mb-8 overflow-hidden rounded-lg bg-[#050505] text-white shadow-[0_24px_80px_rgba(5,5,5,0.18)]">
            <div className="p-6 lg:p-8">
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#D6FF38]">
                TenPlanner legal
              </p>
              <h1 className="mt-3 max-w-3xl font-heading text-4xl font-semibold leading-none tracking-normal text-white sm:text-5xl">
                Documentacion legal del servicio
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/62">
                Privacidad, condiciones, cookies y datos del prestador para
                entrenadores que trabajan con alumnos y grupos.
              </p>
            </div>
            <div className="h-2 bg-[#D6FF38]" />
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[240px_1fr] lg:gap-14">
            <aside className="lg:sticky lg:top-24">
              <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Información legal
              </p>
              <nav className="space-y-2">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group grid grid-cols-[auto_1fr] items-baseline gap-3 rounded-lg border border-[#050505]/10 bg-white/60 px-3 py-3 text-[13px] text-foreground/75 transition-colors hover:border-[#D6FF38] hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-foreground/40 group-hover:text-[#6D7F00] dark:group-hover:text-[#D6FF38]">
                      {item.code}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <p className="mt-8 font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                Jurisdicción
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-foreground/60">
                Reino de España · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · LSSI-CE
                34/2002
              </p>
            </aside>

            <main className="rounded-lg border border-[#050505]/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t border-[#050505]/10 dark:border-white/10">
        <div className="mx-auto max-w-[1180px] px-5 py-8 text-[12px] text-foreground/55 lg:px-10">
          © {new Date().getFullYear()} TenPlanner · Autoridad de control:{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-foreground/30 hover:text-foreground"
          >
            Agencia Española de Protección de Datos (AEPD)
          </a>
        </div>
      </footer>
    </div>
  );
}
