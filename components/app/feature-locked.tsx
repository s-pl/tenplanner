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
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[#F4F4F1] px-4 py-12 text-center text-[#050505] dark:bg-[#050505] dark:text-[#F4F4F1]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_50%_0%,rgba(214,255,56,0.24),transparent_38%)]" />
      <div className="relative max-w-xl overflow-hidden rounded-lg bg-[#050505] text-white shadow-[0_24px_80px_rgba(5,5,5,0.18)]">
        <div className="flex flex-col items-center gap-5 p-6 sm:p-8">
          <div className="flex size-14 items-center justify-center rounded-lg bg-[#D6FF38] text-[#050505]">
            <Lock className="size-6" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#D6FF38]">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-white">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/62">
              {description}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex min-h-10 items-center rounded-full bg-[#D6FF38] px-5 text-sm font-black text-[#050505] transition hover:bg-white"
          >
            {cta}
          </Link>
        </div>
        <div className="h-2 bg-[#D6FF38]" />
      </div>
    </div>
  );
}
