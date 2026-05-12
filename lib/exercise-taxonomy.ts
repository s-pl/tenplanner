export const DURACION_RANGO_MINUTES = {
  "1-5": 5,
  "5-10": 10,
  "10-15": 15,
  "15-20": 20,
  "+20": 25,
} as const;

export type DuracionRango = keyof typeof DURACION_RANGO_MINUTES;

export function deriveDurationMinutesFromRange(
  range: string | null | undefined
) {
  return range && range in DURACION_RANGO_MINUTES
    ? DURACION_RANGO_MINUTES[range as DuracionRango]
    : null;
}

export const NUEVOS_TIPOS_ACTIVIDAD = [
  "juego",
  "reto",
  "cognitivo",
  "otros_deportes",
] as const;

export const TIPO_ACTIVIDAD_LABELS: Record<
  (typeof NUEVOS_TIPOS_ACTIVIDAD)[number],
  string
> = {
  juego: "Juego",
  reto: "Reto",
  cognitivo: "Cognitivo",
  otros_deportes: "Otros deportes",
};

export function normalizeMultiValue<T extends string>(
  values: T[] | null | undefined
) {
  return values && values.length > 0 ? Array.from(new Set(values)) : null;
}
