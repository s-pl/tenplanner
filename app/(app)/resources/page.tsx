import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResourcesPanel } from "@/components/app/resources-panel";
import { BookMarked } from "lucide-react";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="tp-page">
      <div className="tp-page-pad space-y-6">
        <header className="tp-hero-panel p-6 text-white sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#D6FF38] px-3 py-1 text-[11px] font-black uppercase text-[#050505]">
            <BookMarked className="size-3.5" />
            Zona personal
          </div>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            Mis recursos
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/62">
            Enlaces, documentos e imágenes que te sirven para tu labor como
            monitor, organizados en Todos y Favoritos.
          </p>
        </header>

        <div className="tp-panel p-5 sm:p-6">
          <ResourcesPanel userId={user.id} />
        </div>
      </div>
    </div>
  );
}
