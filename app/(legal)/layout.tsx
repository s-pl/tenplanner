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
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-foreground/10">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-brand flex items-center justify-center">
              <Zap className="size-3.5 text-brand-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-heading text-lg">
              ten<span className="italic text-brand">planner</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8 lg:gap-14 items-start">
          <aside className="lg:sticky lg:top-24">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50 mb-4">
              Información legal
            </p>
            <nav className="space-y-0 border-t border-foreground/15">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group grid grid-cols-[auto_1fr] gap-3 items-baseline py-3 border-b border-foreground/10 text-[13px] text-foreground/75 hover:text-brand transition-colors"
                >
                  <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-foreground/40 group-hover:text-brand">
                    {item.code}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40 mt-8">
              Jurisdicción
            </p>
            <p className="text-[12px] text-foreground/60 mt-2 leading-relaxed">
              Reino de España · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · LSSI-CE
              34/2002
            </p>
          </aside>

          <main className="prose-like">{children}</main>
        </div>
      </div>

      <footer className="border-t border-foreground/10 mt-16">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-8 text-[12px] text-foreground/55">
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
