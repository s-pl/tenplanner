import { cookies } from "next/headers";
import { isSport, type Sport } from "@/lib/sport-constants";

export const PUBLIC_SPORT_COOKIE = "tp_sport";

/**
 * Deporte elegido por un visitante anónimo en la biblioteca pública,
 * leído de la cookie `tp_sport`. Devuelve null si no ha elegido todavía
 * (o si el valor guardado ya no es válido), para que la página pueda
 * mostrar la pantalla de elección antes de listar nada.
 */
export async function getPublicSportCookie(): Promise<Sport | null> {
  const store = await cookies();
  const value = store.get(PUBLIC_SPORT_COOKIE)?.value;
  return value && isSport(value) ? value : null;
}
