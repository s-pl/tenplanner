import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { landingContent } from "@/db/schema";

export interface SpecItem { k: string; v: string; sub: string }

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
  hero_title: "Diseña la sesión mientras piensas en el próximo partido.",
  hero_subtitle:
    "TenPlanner es el cuaderno digital del entrenador de pádel profesional: biblioteca de drills, historial por alumno, curva de intensidad por sesión y un asistente — Dr. Planner — que conoce tu plantilla.",
  hero_cta_primary: "Empezar",
  hero_cta_secondary: "Ver cómo funciona",
  specs_strip: [
    { k: "Usado por", v: "Entrenadores", sub: "Club · Academia · Pro" },
    { k: "Diseñar sesión", v: "≈ 3 min", sub: "vs. 20 min en papel" },
    { k: "Drills incluidos", v: "137", sub: "+ los tuyos propios" },
    { k: "IA razonando", v: "Claude 4.5", sub: "Pensamiento visible" },
  ],
  planner_heading: "Un asistente que piensa antes de proponer.",
  planner_description:
    "Dr. Planner no es un formulario. Es un agente que lee el perfil de tu alumno, analiza su historial y razona en voz alta antes de sugerirte ejercicios y configurar la sesión.",
  biblioteca_heading: "Tu biblioteca de ejercicios de pádel.",
  biblioteca_description:
    "Más de 137 drills organizados por categoría, dificultad y fase de sesión. Crea los tuyos, marca favoritos y agrúpalos en listas.",
  anatomia_heading: "Anatomía de una sesión perfecta.",
  anatomia_description:
    "Diseña por fases. Cada ejercicio lleva su intensidad. La curva de carga se dibuja sola y te dice si la sesión está desequilibrada.",
  alumnos_heading: "Cada alumno, su propio plan.",
  alumnos_description:
    "Ficha por alumno con nivel, historial y notas. Dr. Planner lo consulta automáticamente para ajustar la carga y los objetivos.",
  manifesto_heading:
    "Un entrenador con método gana más que un entrenador con talento.",
  manifesto_sub: "TenPlanner te da el sistema.",
  footer_tagline:
    "Cuaderno digital del entrenador de pádel. Hecho para la pista, no para la demo.",
};

async function fetchLandingContent(): Promise<LandingContent> {
  try {
    const rows = await db.select().from(landingContent);
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return {
      hero_title: typeof map.hero_title === "string" ? map.hero_title : LANDING_DEFAULTS.hero_title,
      hero_subtitle: typeof map.hero_subtitle === "string" ? map.hero_subtitle : LANDING_DEFAULTS.hero_subtitle,
      hero_cta_primary: typeof map.hero_cta_primary === "string" ? map.hero_cta_primary : LANDING_DEFAULTS.hero_cta_primary,
      hero_cta_secondary: typeof map.hero_cta_secondary === "string" ? map.hero_cta_secondary : LANDING_DEFAULTS.hero_cta_secondary,
      specs_strip: Array.isArray(map.specs_strip) ? (map.specs_strip as SpecItem[]) : LANDING_DEFAULTS.specs_strip,
      planner_heading: typeof map.planner_heading === "string" ? map.planner_heading : LANDING_DEFAULTS.planner_heading,
      planner_description: typeof map.planner_description === "string" ? map.planner_description : LANDING_DEFAULTS.planner_description,
      biblioteca_heading: typeof map.biblioteca_heading === "string" ? map.biblioteca_heading : LANDING_DEFAULTS.biblioteca_heading,
      biblioteca_description: typeof map.biblioteca_description === "string" ? map.biblioteca_description : LANDING_DEFAULTS.biblioteca_description,
      anatomia_heading: typeof map.anatomia_heading === "string" ? map.anatomia_heading : LANDING_DEFAULTS.anatomia_heading,
      anatomia_description: typeof map.anatomia_description === "string" ? map.anatomia_description : LANDING_DEFAULTS.anatomia_description,
      alumnos_heading: typeof map.alumnos_heading === "string" ? map.alumnos_heading : LANDING_DEFAULTS.alumnos_heading,
      alumnos_description: typeof map.alumnos_description === "string" ? map.alumnos_description : LANDING_DEFAULTS.alumnos_description,
      manifesto_heading: typeof map.manifesto_heading === "string" ? map.manifesto_heading : LANDING_DEFAULTS.manifesto_heading,
      manifesto_sub: typeof map.manifesto_sub === "string" ? map.manifesto_sub : LANDING_DEFAULTS.manifesto_sub,
      footer_tagline: typeof map.footer_tagline === "string" ? map.footer_tagline : LANDING_DEFAULTS.footer_tagline,
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
