import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { landingContent } from "@/db/schema";

export interface SpecItem {
  k: string;
  v: string;
  sub: string;
}

export interface LandingContent {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  specs_strip: SpecItem[];
  planner_heading: string;
  planner_description: string;
  biblioteca_heading: string;
  biblioteca_description: string;
  anatomia_heading: string;
  anatomia_description: string;
  alumnos_heading: string;
  alumnos_description: string;
  manifesto_heading: string;
  manifesto_sub: string;
  footer_tagline: string;
}

export const LANDING_DEFAULTS: LandingContent = {
  hero_title:
    "Planifica sesiones serias\nsin perder la cabeza\nentre pista y pista.",
  hero_subtitle:
    "TenPlanner junta biblioteca, alumnos, grupos, agenda y carga de trabajo en un sistema rápido para entrenadores de deportes de raqueta.",
  hero_cta_primary: "Empezar gratis",
  hero_cta_secondary: "Ver sistema",
  specs_strip: [
    { k: "Planificación", v: "3 min", sub: "de idea a sesión" },
    { k: "Biblioteca", v: "137+", sub: "drills y clases" },
    { k: "Pista", v: "75 min", sub: "guion por fases" },
    { k: "Historial", v: "1 lugar", sub: "alumnos y carga" },
  ],
  planner_heading: "Planificación guiada\ncon contexto real.",
  planner_description:
    "Objetivo, nivel, notas y biblioteca quedan ordenados antes de convertir una clase en sesión.",
  biblioteca_heading: "Tu biblioteca de ejercicios\ny clases de raqueta.",
  biblioteca_description:
    "Drills organizados por nivel, golpe, fase, duración y objetivo. Crea los tuyos, marca favoritos y conviértelos en sesiones completas.",
  anatomia_heading: "La sesión completa,\nordenada por fases.",
  anatomia_description:
    "Cada ejercicio tiene tiempo, intensidad y foco. La carga deja de ser una intuición perdida en una libreta.",
  alumnos_heading: "Cada alumno llega\ncon memoria propia.",
  alumnos_description:
    "Ficha, asistencia, notas y progreso se guardan juntos para que la siguiente clase empiece con contexto, no desde cero.",
  manifesto_heading:
    "Un entrenador con método\ngana tiempo antes\nde ganar partidos.",
  manifesto_sub: "TenPlanner te da la estructura.",
  footer_tagline:
    "Cuaderno digital para entrenadores de deportes de raqueta. Hecho para trabajar en pista o cancha.",
};

export type LandingStringKey = Exclude<keyof LandingContent, "specs_strip">;

export type LandingFieldGroup = "Hero" | "Secciones" | "Manifiesto" | "Footer";

export interface LandingFieldDefinition {
  key: LandingStringKey;
  label: string;
  group: LandingFieldGroup;
  multiline?: boolean;
  maxLength: number;
}

export const LANDING_FIELD_DEFINITIONS: LandingFieldDefinition[] = [
  {
    key: "hero_title",
    label: "Hero - Título",
    group: "Hero",
    multiline: true,
    maxLength: 180,
  },
  {
    key: "hero_subtitle",
    label: "Hero - Subtítulo",
    group: "Hero",
    multiline: true,
    maxLength: 420,
  },
  {
    key: "hero_cta_primary",
    label: "Hero - CTA primario",
    group: "Hero",
    maxLength: 40,
  },
  {
    key: "hero_cta_secondary",
    label: "Hero - CTA secundario",
    group: "Hero",
    maxLength: 60,
  },
  {
    key: "planner_heading",
    label: "Planificación - Título",
    group: "Secciones",
    multiline: true,
    maxLength: 160,
  },
  {
    key: "planner_description",
    label: "Planificación - Descripción",
    group: "Secciones",
    multiline: true,
    maxLength: 360,
  },
  {
    key: "biblioteca_heading",
    label: "Biblioteca - Título",
    group: "Secciones",
    multiline: true,
    maxLength: 160,
  },
  {
    key: "biblioteca_description",
    label: "Biblioteca - Descripción",
    group: "Secciones",
    multiline: true,
    maxLength: 360,
  },
  {
    key: "anatomia_heading",
    label: "Anatomía - Título",
    group: "Secciones",
    multiline: true,
    maxLength: 160,
  },
  {
    key: "anatomia_description",
    label: "Anatomía - Descripción",
    group: "Secciones",
    multiline: true,
    maxLength: 360,
  },
  {
    key: "alumnos_heading",
    label: "Alumnos - Título",
    group: "Secciones",
    multiline: true,
    maxLength: 160,
  },
  {
    key: "alumnos_description",
    label: "Alumnos - Descripción",
    group: "Secciones",
    multiline: true,
    maxLength: 360,
  },
  {
    key: "manifesto_heading",
    label: "Manifiesto - Título",
    group: "Manifiesto",
    multiline: true,
    maxLength: 160,
  },
  {
    key: "manifesto_sub",
    label: "Manifiesto - Subtítulo",
    group: "Manifiesto",
    multiline: true,
    maxLength: 120,
  },
  {
    key: "footer_tagline",
    label: "Footer - Tagline",
    group: "Footer",
    multiline: true,
    maxLength: 180,
  },
];

export const LANDING_STRING_KEYS = LANDING_FIELD_DEFINITIONS.map(
  (field) => field.key
) as LandingStringKey[];

function isSpecItem(value: unknown): value is SpecItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.k === "string" &&
    typeof item.v === "string" &&
    typeof item.sub === "string"
  );
}

function parseSpecs(value: unknown): SpecItem[] {
  if (!Array.isArray(value) || value.length !== 4 || !value.every(isSpecItem)) {
    return LANDING_DEFAULTS.specs_strip;
  }
  if (value.some((item) => /[ÃÂâ]/.test(`${item.k} ${item.v} ${item.sub}`))) {
    return LANDING_DEFAULTS.specs_strip;
  }
  return value;
}

function landingString(
  map: Record<string, unknown>,
  key: LandingStringKey
): string {
  const value = map[key];
  if (typeof value !== "string" || /[ÃÂâ]/.test(value)) {
    return LANDING_DEFAULTS[key];
  }
  return value;
}

function hasLegacyLandingContent(map: Record<string, unknown>): boolean {
  const legacyPattern =
    /Claude|La clase la piensas|Ten Planner te ayuda|Usado por|IA razonando/;

  return Object.values(map).some((value) => {
    if (typeof value === "string") return legacyPattern.test(value);
    if (Array.isArray(value)) return legacyPattern.test(JSON.stringify(value));
    return false;
  });
}

async function fetchLandingContent(): Promise<LandingContent> {
  try {
    const rows = await db.select().from(landingContent);
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    if (hasLegacyLandingContent(map)) return LANDING_DEFAULTS;

    return {
      hero_title: landingString(map, "hero_title"),
      hero_subtitle: landingString(map, "hero_subtitle"),
      hero_cta_primary: landingString(map, "hero_cta_primary"),
      hero_cta_secondary: landingString(map, "hero_cta_secondary"),
      specs_strip: parseSpecs(map.specs_strip),
      planner_heading: landingString(map, "planner_heading"),
      planner_description: landingString(map, "planner_description"),
      biblioteca_heading: landingString(map, "biblioteca_heading"),
      biblioteca_description: landingString(map, "biblioteca_description"),
      anatomia_heading: landingString(map, "anatomia_heading"),
      anatomia_description: landingString(map, "anatomia_description"),
      alumnos_heading: landingString(map, "alumnos_heading"),
      alumnos_description: landingString(map, "alumnos_description"),
      manifesto_heading: landingString(map, "manifesto_heading"),
      manifesto_sub: landingString(map, "manifesto_sub"),
      footer_tagline: landingString(map, "footer_tagline"),
    };
  } catch {
    return LANDING_DEFAULTS;
  }
}

export const getLandingContent = unstable_cache(
  fetchLandingContent,
  ["landing-content"],
  { tags: ["landing"], revalidate: 3600 }
);
