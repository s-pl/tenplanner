import { createClient } from "@/lib/supabase/server";
import { getActiveSport } from "@/lib/sports";
import { getPublicSportCookie } from "@/lib/public-sport";
import { GuestAccessFlow } from "@/components/public/guest-access-flow";

/**
 * Puerta de entrada para "Accede sin registrarte": elegir deporte y luego
 * Ejercicios o Clases, sin pedir si eres club o monitor (eso solo se pide
 * al registrarse). Desde aquí se va a /exercises o /classes, que ya
 * encontrarán el deporte guardado (cookie o cuenta) y mostrarán la
 * biblioteca directamente.
 */
export default async function AccesoPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const sport = user
    ? await getActiveSport(user.id)
    : await getPublicSportCookie();

  return <GuestAccessFlow initialSport={sport} />;
}
