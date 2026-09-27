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
  "preparacion_fisica",
] as const;

// Valores antiguos: se siguen aceptando para no romper los ejercicios ya
// etiquetados, pero ya no se ofrecen para ejercicios nuevos.
export const TIPOS_EJERCICIO_LEGACY = [
  "juego",
  "reto",
  "cognitivo",
  "otros_deportes",
  "fisico_movilidad",
] as const;

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
  preparacion_fisica: "Preparación física",
  // Antiguos
  fisico_movilidad: "Físico / movilidad",
  otros_deportes: "Otros deportes",
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

// Niveles (etapas) con edad y color para que se identifiquen de un vistazo.
export const NIVELES = [
  {
    id: "descubrimiento",
    label: "Descubrimiento",
    edad: "4-6 años",
    color: "#E53935",
  },
  { id: "desarrollo", label: "Desarrollo", edad: "6-8 años", color: "#FB8C00" },
  {
    id: "consolidacion",
    label: "Consolidación",
    edad: "8-10 años",
    color: "#43A047",
  },
  {
    id: "especializacion",
    label: "Especialización",
    edad: "10-12 años",
    color: "#FFE600",
  },
  {
    id: "precompeticion",
    label: "Precompetición",
    edad: "12-14 años",
    color: "#FFC400",
  },
  {
    id: "competicion",
    label: "Competición",
    edad: "14-16 años",
    color: "#FFA000",
  },
  {
    id: "rendimiento",
    label: "Rendimiento",
    edad: "14-18 años",
    color: "#E68A00",
  },
  {
    id: "adultos_iniciacion",
    label: "Adultos iniciación",
    edad: "Adultos",
    color: "#64B5F6",
  },
  {
    id: "adultos_medio_alto",
    label: "Adultos medio-alto",
    edad: "Adultos",
    color: "#1565C0",
  },
] as const;

export type NivelId = (typeof NIVELES)[number]["id"];

export const NIVEL_IDS = NIVELES.map((n) => n.id) as unknown as readonly [
  NivelId,
  ...NivelId[],
];

export function nivelLabel(id: string) {
  return NIVELES.find((n) => n.id === id)?.label ?? id.replace(/_/g, " ");
}

// Fase de la sesión (columna `phase`).
export const FASES = [
  { id: "activation", label: "Calentamiento" },
  { id: "main", label: "Parte principal" },
  { id: "cooldown", label: "Vuelta a la calma" },
] as const;
