import { sportEnum } from "@/db/schema";

/**
 * Constantes de deporte seguras para cliente y servidor (sin tocar @/db,
 * que arrastra el driver de postgres). Los helpers que sí consultan la
 * base de datos (getActiveSport, setActiveSport) viven en lib/sports.ts,
 * server-only.
 */
export const SPORTS = sportEnum.enumValues;
export type Sport = (typeof SPORTS)[number];

export const DEFAULT_SPORT: Sport = "tenis";

export const SPORT_LABELS: Record<Sport, string> = {
  tenis: "Tenis",
  padel: "Pádel",
  pickleball: "Pickleball",
  tenis_playa: "Tenis playa",
};

export const SPORT_OPTIONS: { id: Sport; label: string }[] = SPORTS.map(
  (id) => ({ id, label: SPORT_LABELS[id] })
);

export function isSport(value: string): value is Sport {
  return (SPORTS as readonly string[]).includes(value);
}
