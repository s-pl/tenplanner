import { getAppSettings, SETTING_DEFINITIONS } from "@/lib/app-settings";
import { AdminPageHeader, adminPageShell } from "../_components/admin-ui";
import { AdminSettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const values = await getAppSettings();
  const settings = SETTING_DEFINITIONS.map((definition) => ({
    ...definition,
    value: values.get(definition.key) ?? definition.defaultValue,
  }));

  return (
    <div className={adminPageShell}>
      <AdminPageHeader
        eyebrow="Admin / Sistema"
        title="Ajustes de plataforma"
        description="Activa, desactiva y prepara funciones sin desplegar código. Los ajustes públicos se usan en la navegación y en los endpoints críticos."
      />

      <AdminSettingsClient settings={settings} />
    </div>
  );
}
