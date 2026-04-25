import { getLandingContent, LANDING_DEFAULTS } from "@/lib/landing-content";
import { AdminLandingClient } from "./landing-client";

export default async function AdminLandingPage() {
  const content = await getLandingContent();

  const fields = [
    { key: "hero_title", label: LANDING_DEFAULTS.hero_title, type: "textarea" as const, currentValue: content.hero_title },
    { key: "hero_subtitle", label: "Hero — Subtítulo", type: "textarea" as const, currentValue: content.hero_subtitle },
    { key: "hero_cta_primary", label: "Hero — CTA primario", type: "text" as const, currentValue: content.hero_cta_primary },
    { key: "hero_cta_secondary", label: "Hero — CTA secundario", type: "text" as const, currentValue: content.hero_cta_secondary },
    { key: "planner_description", label: "Dr. Planner — Descripción", type: "textarea" as const, currentValue: content.planner_description },
    { key: "biblioteca_description", label: "Biblioteca — Descripción", type: "textarea" as const, currentValue: content.biblioteca_description },
    { key: "anatomia_description", label: "Anatomía — Descripción", type: "textarea" as const, currentValue: content.anatomia_description },
    { key: "alumnos_description", label: "Alumnos — Descripción", type: "textarea" as const, currentValue: content.alumnos_description },
    { key: "manifesto_sub", label: "Manifiesto — Subtítulo", type: "textarea" as const, currentValue: content.manifesto_sub },
    { key: "footer_tagline", label: "Footer — Tagline", type: "textarea" as const, currentValue: content.footer_tagline },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Editor de landing
          </h1>
          <p className="text-sm text-foreground/50 mt-1">
            Los cambios se reflejan en la web pública en segundos.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-foreground/50 hover:text-brand transition-colors underline underline-offset-4"
        >
          Ver landing ↗
        </a>
      </div>

      <AdminLandingClient fields={fields} />
    </div>
  );
}
