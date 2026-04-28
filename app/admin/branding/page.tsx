import { getAppSettings } from "@/lib/app-settings";
import { ACCENT_COLORS } from "@/lib/accent-colors";
import { AdminBrandingClient } from "./branding-client";

export default async function AdminBrandingPage() {
  const values = await getAppSettings([
    "brand.app_name",
    "brand.app_tagline",
    "brand.support_email",
    "brand.default_accent",
    "brand.og_image_url",
    "system.maintenance_banner",
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="border-b border-foreground/10 pb-5">
        <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          Administración
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Marca y personalización
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/55">
          Configura el nombre, colores y mensajes globales de la plataforma. Los
          cambios se aplican en tiempo real.
        </p>
      </div>

      <AdminBrandingClient
        appName={String(values.get("brand.app_name") ?? "TenPlanner")}
        appTagline={String(
          values.get("brand.app_tagline") ?? "Planificador de pádel"
        )}
        supportEmail={String(values.get("brand.support_email") ?? "")}
        defaultAccent={String(values.get("brand.default_accent") ?? "blue")}
        ogImageUrl={String(values.get("brand.og_image_url") ?? "")}
        maintenanceBanner={String(
          values.get("system.maintenance_banner") ?? ""
        )}
        accentColors={ACCENT_COLORS}
      />
    </div>
  );
}
