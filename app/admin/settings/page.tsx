import { getAppSettings, SETTING_DEFINITIONS } from "@/lib/app-settings";
import { AdminSettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const values = await getAppSettings();
  const settings = SETTING_DEFINITIONS.map((definition) => ({
    ...definition,
    value: values.get(definition.key) ?? definition.defaultValue,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="border-b border-foreground/10 pb-5">
        <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          Administración
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Ajustes de plataforma
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/55">
          Activa, desactiva y prepara funciones sin desplegar código. Los
          ajustes públicos se usan en la navegación y en los endpoints críticos.
        </p>
      </div>

      <AdminSettingsClient settings={settings} />
    </div>
  );
}
