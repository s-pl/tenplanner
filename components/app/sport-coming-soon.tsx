import { Droplets } from "lucide-react";
import { SportSwitcher } from "@/components/app/sport-switcher";
import type { Sport } from "@/lib/sports";

/**
 * Pantalla mostrada en vez de la biblioteca cuando el deporte activo del
 * usuario (pádel, pickleball) todavía no tiene contenido validado propio.
 */
export function SportComingSoon({ sport, label }: { sport: Sport; label: string }) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#F4F4F1] text-[#050505] dark:bg-[#050505] dark:text-[#F4F4F1]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_82%_20%,rgba(214,255,56,0.22),transparent_34%),linear-gradient(180deg,rgba(5,5,5,0.06),transparent)] dark:bg-[radial-gradient(circle_at_82%_20%,rgba(214,255,56,0.18),transparent_34%)]" />
      <div className="relative flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="max-w-xl overflow-hidden rounded-lg bg-[#050505] text-center text-white shadow-[0_24px_80px_rgba(5,5,5,0.18)]">
          <div className="flex flex-col items-center gap-5 p-6 sm:p-8">
            <div className="flex size-14 items-center justify-center rounded-lg bg-[#D6FF38] text-[#050505]">
              <Droplets className="size-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-[#D6FF38]">
                {label} · en construcción
              </p>
              <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-white">
                Estamos sudando la camiseta
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/62">
                Todavía no tenemos biblioteca de {label.toLowerCase()}{" "}
                validada. Estamos trabajando en traértela cuanto antes —
                mientras tanto, cambia a Tenis para ver contenido ya
                disponible.
              </p>
            </div>
          </div>
          <div className="h-2 bg-[#D6FF38]" />
        </div>
      </div>
      <div className="relative mx-auto max-w-xl px-4 pb-12">
        <SportSwitcher activeSport={sport} />
      </div>
    </div>
  );
}
