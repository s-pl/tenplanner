import {
  getLandingContent,
  LANDING_DEFAULTS,
  LANDING_FIELD_DEFINITIONS,
} from "@/lib/landing-content";
import { AdminLandingClient } from "./landing-client";

export default async function AdminLandingPage() {
  const content = await getLandingContent();

  const fields = LANDING_FIELD_DEFINITIONS.map((field) => ({
    ...field,
    currentValue: content[field.key],
    defaultValue: LANDING_DEFAULTS[field.key],
  }));

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

      <AdminLandingClient
        fields={fields}
        specs={content.specs_strip}
        defaultSpecs={LANDING_DEFAULTS.specs_strip}
      />
    </div>
  );
}
