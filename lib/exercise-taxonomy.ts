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

// Tipos de ejercicio que se ofrecen al crear/editar y al filtrar.
export const TIPOS_EJERCICIO = [
  "calentamiento",
  "tecnico_cerrado",
  "peloteo",
  "situacion_juego",
  "juego_puntos",
  "juego_ludico",
  "fisico_movilidad",
  "otros_deportes",
] as const;

// Valores antiguos: se siguen aceptando para no romper los ejercicios ya
// etiquetados, pero ya no se ofrecen para ejercicios nuevos.
export const TIPOS_EJERCICIO_LEGACY = ["juego", "reto", "cognitivo"] as const;

export const NUEVOS_TIPOS_ACTIVIDAD = [
  ...TIPOS_EJERCICIO,
  ...TIPOS_EJERCICIO_LEGACY,
] as const;

export type TipoEjercicio = (typeof NUEVOS_TIPOS_ACTIVIDAD)[number];

export const TIPO_ACTIVIDAD_LABELS: Record<TipoEjercicio, string> = {
  calentamiento: "Calentamiento / activación",
  tecnico_cerrado: "Técnico cerrado",
  peloteo: "Peloteo",
  situacion_juego: "Situación de juego",
  juego_puntos: "Juego de puntos",
  juego_ludico: "Juego lúdico",
  fisico_movilidad: "Físico / movilidad",
  otros_deportes: "Otros deportes",
  // Antiguos
  juego: "Juego",
  reto: "Reto",
  cognitivo: "Cognitivo",
};

export function isLegacyTipoEjercicio(value: string) {
  return (TIPOS_EJERCICIO_LEGACY as readonly string[]).includes(value);
}

// Etiqueta para formularios y filtros: marca los tipos antiguos para que se
// distingan de los nuevos mientras se re-etiqueta la biblioteca.
export function tipoEjercicioOptionLabel(value: string) {
  const label =
    TIPO_ACTIVIDAD_LABELS[value as TipoEjercicio] ?? value.replace(/_/g, " ");
  return isLegacyTipoEjercicio(value) ? `${label} (antiguo)` : label;
}

export const ASPECTO_JUEGO_LABELS: Record<
  "tecnica" | "tactica" | "mental" | "fisico",
  string
> = {
  tecnica: "Técnica",
  tactica: "Táctica",
  mental: "Mental / cognitivo",
  fisico: "Físico / movilidad",
};

export function normalizeMultiValue<T extends string>(
  values: T[] | null | undefined
) {
  return values && values.length > 0 ? Array.from(new Set(values)) : null;
}

// La columna antigua `tipologia` solo admite juego|reto|otros_deportes.
export function legacyTipologiaFrom(values: string[] | null | undefined) {
  const allowed = ["juego", "reto", "otros_deportes"] as const;
  return (
    (values?.find((value) => (allowed as readonly string[]).includes(value)) as
      | (typeof allowed)[number]
      | undefined) ?? null
  );
}
