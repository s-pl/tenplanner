import Link from "next/link";
import { Lock } from "lucide-react";

export function FeatureLocked({
  eyebrow = "Función desactivada",
  title,
  description,
  href = "/dashboard",
  cta = "Volver",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12 text-center">
      <div className="flex max-w-md flex-col items-center gap-5">
        <div className="flex size-14 items-center justify-center rounded-xl border border-foreground/12 bg-card text-foreground/45">
          <Lock className="size-6" strokeWidth={1.6} />
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-foreground/40">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/58">
            {description}
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex h-10 items-center rounded-lg border border-foreground/15 px-4 text-sm font-medium text-foreground/65 transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
