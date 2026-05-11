import { getAppSettings } from "@/lib/app-settings";
import { ACCENT_COLORS } from "@/lib/accent-colors";
import { AdminPageHeader, adminPageShell } from "../_components/admin-ui";
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
    <div className={adminPageShell}>
      <AdminPageHeader
        eyebrow="Admin / Marca"
        title="Marca y personalización"
        description="Configura el nombre, colores y mensajes globales de la plataforma. Los cambios se aplican en tiempo real."
      />

      <AdminBrandingClient
        appName={String(values.get("brand.app_name") ?? "TenPlanner")}
        appTagline={String(
          values.get("brand.app_tagline") ??
          "Planificador de deportes de raqueta"
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
