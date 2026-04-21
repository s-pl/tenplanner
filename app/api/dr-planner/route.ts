import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, sessions, sessionExercises, exercises, students, sessionStudents } from "@/db/schema";
import { eq, count, isNull, inArray, and, or, ilike, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";

export const maxDuration = 60;

const anthropic = createAnthropic({ apiKey: process.env.NEXT_ANTHROPIC_API_KEY });

const EXERCISE_FIELDS = {
  id: exercises.id,
  name: exercises.name,
  category: exercises.category,
  difficulty: exercises.difficulty,
  durationMinutes: exercises.durationMinutes,
  description: exercises.description,
  objectives: exercises.objectives,
  isAiGenerated: exercises.isAiGenerated,
};

function buildUserContext(profile: {
  name: string; role: string | null; playerLevel: string | null;
  yearsExperience: number | null; city: string | null; goals: string | null;
}, sessionCount: number) {
  const parts: string[] = [];
  if (profile.name) parts.push(`Nombre: ${profile.name}`);
  if (profile.role) parts.push(`Rol: ${profile.role}`);
  if (profile.playerLevel) parts.push(`Nivel propio: ${profile.playerLevel}`);
  if (profile.yearsExperience) parts.push(`Experiencia: ${profile.yearsExperience} años`);
  if (profile.city) parts.push(`Ciudad: ${profile.city}`);
  if (profile.goals) parts.push(`Objetivos: ${profile.goals}`);
  parts.push(`Sesiones planificadas: ${sessionCount}`);
  return parts.join(" | ");
}

function buildStudentContext(studentList: Array<{
  id: string; name: string; playerLevel: string | null; dominantHand: string | null;
}>) {
  if (!studentList.length) return "Ninguno todavía.";
  return studentList.map(s =>
    `  • [${s.id}] ${s.name} | Nivel: ${s.playerLevel ?? "no indicado"} | Mano: ${s.dominantHand ?? "no indicada"}`
  ).join("\n");
}

function formatExerciseLine(e: {
  id: string; name: string; category: string; difficulty: string;
  durationMinutes: number; description: string | null; isAiGenerated: boolean;
}) {
  const tag = e.isAiGenerated ? " [IA]" : "";
  return `  • [${e.id}] ${e.name}${tag} | ${e.category} | ${e.difficulty} | ${e.durationMinutes}min`;
}

type CoachStudent = {
  id: string;
  name: string;
  playerLevel: string | null;
  dominantHand: string | null;
  gender: string | null;
};

type SessionMetaDraft = {
  objective?: string;
  intensity?: number;
  location?: string;
  tags?: string[];
  scheduledAt?: string;
};

type ConversationState = {
  lastUserText: string;
  requestedDurationMinutes: number | null;
  objectiveFromHistory: string | null;
  selectedStudentIds: string[];
  selectedStudents: CoachStudent[];
  hasExplicitSessionConfirmation: boolean;
  confirmedSessionMeta: SessionMetaDraft;
  hasExerciseCreationConsent: boolean;
  hasDurationDeviationConsent: boolean;
};

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function isSimpleNegative(text: string): boolean {
  const normalized = normalizeText(text).replace(/[.!?]+$/g, "");
  return ["no", "nop", "negativo", "mejor no", "todavia no", "todavía no"].includes(normalized);
}

function getMessageText(message: UIMessage): string {
  const parts = (message.parts ?? []) as Array<{ type?: string; text?: string }>;
  return parts
    .map((part) => (part.type === "text" && typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function getUserTexts(messages: UIMessage[]): string[] {
  return messages
    .filter((message) => message.role === "user")
    .map(getMessageText)
    .filter((text) => text.length > 0);
}

function extractLastRequestedDurationMinutes(userTexts: string[]): number | null {
  let found: number | null = null;
  const patterns = [
    /(\d{2,3})\s*(?:min|mins|minuto|minutos)\b/gi,
    /duraci[oó]n(?:\s+de)?\s*(\d{2,3})\b/gi,
  ];

  for (const text of userTexts) {
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const value = Number(match[1]);
        if (Number.isFinite(value) && value >= 20 && value <= 240) {
          found = value;
        }
      }
    }
  }

  return found;
}

function extractObjectiveFromHistory(userTexts: string[]): string | null {
  for (const text of [...userTexts].reverse()) {
    const match = text.match(/objetivo(?:\s+principal)?(?:\s+de\s+la\s+sesi[oó]n)?\s*:\s*(.+)/i);
    if (match?.[1]) {
      const objective = match[1].trim();
      if (objective.length > 0) return objective;
    }
  }
  return null;
}

function normalizeHour(value: string): string {
  const [h = "", m = "00"] = value.split(":");
  return `${h.padStart(2, "0")}:${m}`;
}

function normalizeDateTimeInput(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return trimmed;

  const isoWithWords = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s*(?:a\s+las\s+)?(\d{1,2}:\d{2})$/i);
  if (isoWithWords) return `${isoWithWords[1]}T${normalizeHour(isoWithWords[2])}`;

  const esFormat = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s*(\d{1,2}:\d{2}))?$/);
  if (esFormat) {
    const [, day, month, year, hourRaw] = esFormat;
    if (!hourRaw) return undefined;
    return `${year}-${month}-${day}T${normalizeHour(hourRaw)}`;
  }

  return undefined;
}

function hasSessionConfirmationPhrase(text: string): boolean {
  if (text.includes("[FORM_META_CONFIRMED]")) return true;

  const normalized = normalizeText(text);
  if (!normalized) return false;

  if (/(?:\bno\b|todavia no|todavía no).*(?:confirmo|confirmar|crea|crear).*(?:sesion|sesión)/.test(normalized)) {
    return false;
  }

  return (
    normalized.includes("confirmo los datos de la sesion")
    || normalized.includes("confirmo la creacion de la sesion")
    || /\bconfirmo\b.*\b(?:sesion|sesión)\b/.test(normalized)
    || /\b(?:crea|crear|creala|crealo|hazlo|adelante)\b.*\b(?:sesion|sesión)\b/.test(normalized)
    || /\b(?:puedes|podemos)\b.*\b(?:crear|crea)\b.*\b(?:sesion|sesión)\b/.test(normalized)
  );
}

function extractLastAssistantText(messages: UIMessage[]): string {
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  return lastAssistant ? normalizeText(getMessageText(lastAssistant)) : "";
}

function assistantAskedToCreateSession(messages: UIMessage[]): boolean {
  const assistantText = extractLastAssistantText(messages);
  if (!assistantText) return false;

  return (
    /necesito que confirmes.*(?:crear|creo|crea).*(?:sesion|sesión)/.test(assistantText)
    || /(?:puedo|puedes|quieres?(?: que)?).*(?:crear|creo|crea).*(?:sesion|sesión)/.test(assistantText)
    || /responde exactamente.*confirmo/.test(assistantText)
    || /revisa y pulsa.*confirmar.*crear la sesion/.test(assistantText)
    || /confirmar.*(?:crear|sesion)/.test(assistantText)
    || /falta confirmacion explicita/.test(assistantText)
  );
}

function hasSessionConfirmation(lastUserText: string, messages: UIMessage[]): boolean {
  if (hasSessionConfirmationPhrase(lastUserText)) return true;

  if (isSimpleAffirmation(lastUserText) && assistantAskedToCreateSession(messages)) {
    return true;
  }

  // Sticky: once the user has confirmed with the form marker or an explicit phrase,
  // keep confirmation valid even after follow-up messages (e.g. resolving a duration
  // mismatch with "sí"). Retraction only via explicit negation of creating the session.
  const userTexts = getUserTexts(messages);
  const hasPriorConfirmation = userTexts.some((text) => hasSessionConfirmationPhrase(text));

  // Simple negative ("no", "nop", etc.): without prior confirmation → no confirmation.
  // With prior confirmation → only retract if the AI was explicitly asking about creating/canceling the session.
  // Otherwise "no" is answering a different question and the prior confirmation must remain sticky.
  if (isSimpleNegative(lastUserText)) {
    if (!hasPriorConfirmation) return false;
    return !assistantAskedToCreateSession(messages);
  }

  if (!hasPriorConfirmation) return false;

  const normalizedLast = normalizeText(lastUserText);
  const retracted =
    /\b(?:no|cancela|cancelar|anula|anular|para|detente)\b.*\b(?:crear|crea|cree|cree?la|sesion|sesión)\b/.test(normalizedLast)
    || normalizedLast === "cancela"
    || normalizedLast === "cancelar";

  return !retracted;
}

function parseConfirmedSessionMeta(text: string): SessionMetaDraft {
  if (!hasSessionConfirmationPhrase(text)) return {};

  // Form marker format: [FORM_META_CONFIRMED] | objetivo=... | intensidad=3 | ubicacion=... | etiquetas=a,b | fecha=2026-04-26T22:52
  const kv = (key: string) => {
    const re = new RegExp(`${key}\\s*[:=]\\s*([^|]+?)(?=\\s*[|,]\\s*(?:objetivo|intensidad|ubicaci[oó]n|etiquetas?|fecha)\\s*[:=]|$)`, "i");
    return text.match(re)?.[1]?.trim();
  };

  const objective = kv("objetivo");
  const intensityRaw = text.match(/intensidad\s*[:=]\s*(\d)/i)?.[1];
  const location = kv("ubicaci[oó]n");
  const tagsRaw = kv("etiquetas?");
  const scheduledRaw = kv("fecha(?:\\s+y\\s+hora)?");
  const scheduledAt = normalizeDateTimeInput(scheduledRaw) ?? scheduledRaw;

  const intensity = intensityRaw ? Number(intensityRaw) : undefined;
  const tags = tagsRaw
    ?.split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return {
    ...(objective ? { objective } : {}),
    ...(intensity && intensity >= 1 && intensity <= 5 ? { intensity } : {}),
    ...(location ? { location } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
    ...(scheduledAt ? { scheduledAt } : {}),
  };
}

function mapStudentNameToId(name: string, coachStudents: CoachStudent[]): string | null {
  const target = normalizeText(name);
  const exact = coachStudents.find((student) => normalizeText(student.name) === target);
  if (exact) return exact.id;

  const partial = coachStudents.find((student) => normalizeText(student.name).includes(target) || target.includes(normalizeText(student.name)));
  return partial?.id ?? null;
}

function inferSelectedStudentIds(userTexts: string[], coachStudents: CoachStudent[]): string[] {
  for (const text of [...userTexts].reverse()) {
    const normalized = normalizeText(text);
    if (normalized.includes("continuar sin seleccionar alumnos")) {
      return [];
    }

    const match = text.match(/he seleccionado a:\s*(.+)$/i);
    if (!match?.[1]) continue;

    const names = match[1]
      .split(",")
      .map((chunk) => chunk.replace(/\([^)]*\)/g, "").trim())
      .filter((chunk) => chunk.length > 0);

    const ids = names
      .map((name) => mapStudentNameToId(name, coachStudents))
      .filter((id): id is string => Boolean(id));

    return Array.from(new Set(ids));
  }

  return [];
}

function isSimpleAffirmation(text: string): boolean {
  const normalized = normalizeText(text).replace(/[.!?]+$/g, "");
  return ["si", "sí", "ok", "vale", "dale", "adelante", "hazlo", "de acuerdo", "perfecto"].includes(normalized);
}

function getPreviousAssistantText(messages: UIMessage[], userIndex: number): string {
  for (let i = userIndex - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "assistant") {
      return normalizeText(getMessageText(messages[i]));
    }
  }
  return "";
}

function assistantAskedToCreateExercises(messages: UIMessage[]): boolean {
  const assistantText = extractLastAssistantText(messages);
  return (
    /quieres que (?:cree|genere)/.test(assistantText)
    || /crear ejercicios?/.test(assistantText)
    || /generar ejercicios?/.test(assistantText)
    || /crear nuevos ejercicios?/.test(assistantText)
  );
}

function assistantTextAsksToAllowDurationDeviation(assistantText: string): boolean {
  if (!assistantText) return false;

  return (
    /(te (?:vale|va bien|parece bien)|aceptas|confirmas).*(?:\d{2,3}\s*(?:min|minutos)?|pasarnos|pasarse|mas|minutos|min)/.test(assistantText)
    || /(?:podemos|puedo).*(?:pasarnos|pasarse|irnos).*(?:min|minutos)/.test(assistantText)
    || /la propuesta suma.*objetivo era/.test(assistantText)
  );
}

function hasExerciseCreationConsent(lastUserText: string, messages: UIMessage[]): boolean {
  const normalized = normalizeText(lastUserText);
  if (!normalized) return false;
  if (/\bno\b.*\b(crea|crear|genera|generar)\b/.test(normalized)) return false;

  if (isSimpleAffirmation(lastUserText) && assistantAskedToCreateExercises(messages)) {
    return true;
  }

  return (
    /\b(crea|crear|genera|generar)\b.*\b(ejercicio|ejercicios)\b/.test(normalized) ||
    /\b(puedes|podemos|ok|vale|dale|si|sí)\b.*\b(crea|crear|genera|generar)\b/.test(normalized) ||
    /\b(autorizo|apruebo|acepto)\b.*\b(crear|generar)\b/.test(normalized)
  );
}

function extractLatestConfirmedSessionMeta(userTexts: string[]): SessionMetaDraft {
  for (const text of [...userTexts].reverse()) {
    if (!hasSessionConfirmationPhrase(text)) continue;
    return parseConfirmedSessionMeta(text);
  }

  return {};
}

function inferDurationDeviationConsentFromHistory(messages: UIMessage[]): boolean {
  let consent = false;

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (message.role !== "user") continue;

    const text = getMessageText(message);
    const normalized = normalizeText(text);
    if (!normalized) continue;

    if (/\bno\b.*\b(pasarse|pasar|mas|minutos|min|acepto|autorizo|permito)\b/.test(normalized)) {
      consent = false;
      continue;
    }

    if (
      /\b(acepto|autorizo|permito|me vale|esta bien|sin problema|puede ser|adelante)\b.*\b(pasarse|pasar|mas|minutos|min)\b/.test(normalized)
      || /\b(acepto|me vale|esta bien|ok|vale)\b.*\b\d{1,3}\s*(?:min|minutos)?\b/.test(normalized)
    ) {
      consent = true;
      continue;
    }

    if (isSimpleNegative(text)) {
      const previousAssistantText = getPreviousAssistantText(messages, i);
      if (assistantTextAsksToAllowDurationDeviation(previousAssistantText)) {
        consent = false;
      }
      continue;
    }

    if (isSimpleAffirmation(text)) {
      const previousAssistantText = getPreviousAssistantText(messages, i);
      if (assistantTextAsksToAllowDurationDeviation(previousAssistantText)) {
        consent = true;
      }
    }
  }

  return consent;
}

function inferConversationState(messages: UIMessage[], coachStudents: CoachStudent[]): ConversationState {
  const userTexts = getUserTexts(messages);
  const lastUserText = userTexts[userTexts.length - 1] ?? "";
  const selectedStudentIds = inferSelectedStudentIds(userTexts, coachStudents);
  const selectedStudents = coachStudents.filter((student) => selectedStudentIds.includes(student.id));

  return {
    lastUserText,
    requestedDurationMinutes: extractLastRequestedDurationMinutes(userTexts),
    objectiveFromHistory: extractObjectiveFromHistory(userTexts),
    selectedStudentIds,
    selectedStudents,
    hasExplicitSessionConfirmation: hasSessionConfirmation(lastUserText, messages),
    confirmedSessionMeta: extractLatestConfirmedSessionMeta(userTexts),
    hasExerciseCreationConsent: hasExerciseCreationConsent(lastUserText, messages),
    hasDurationDeviationConsent: inferDurationDeviationConsentFromHistory(messages),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileRows, countRows, personalExercises, globalExercises, coachStudents] = await Promise.all([
    db.select().from(users).where(eq(users.id, user.id)).limit(1),
    db.select({ total: count() }).from(sessions).where(eq(sessions.userId, user.id)),
    db.select(EXERCISE_FIELDS).from(exercises).where(eq(exercises.createdBy, user.id)),
    db.select(EXERCISE_FIELDS).from(exercises).where(or(eq(exercises.isGlobal, true), isNull(exercises.createdBy))).limit(60),
    db.select({
      id: students.id,
      name: students.name,
      playerLevel: students.playerLevel,
      dominantHand: students.dominantHand,
      gender: students.gender,
    }).from(students).where(eq(students.coachId, user.id)),
  ]);

  const profile = profileRows[0];
  const sessionCount = Number(countRows[0]?.total ?? 0);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrowISO = tomorrow.toISOString().slice(0, 16);
  const todayStr = today.toISOString().slice(0, 10);

  const hasStudents = coachStudents.length > 0;
  const { messages }: { messages: UIMessage[] } = await request.json();
  const conversationState = inferConversationState(messages, coachStudents as CoachStudent[]);

  const selectedStudentsSummary = conversationState.selectedStudents.length > 0
    ? conversationState.selectedStudents
        .map((student) => `${student.name}${student.playerLevel ? ` (${student.playerLevel})` : ""}`)
        .join(", ")
    : "No confirmados todavía";

  const confirmedObjective = conversationState.confirmedSessionMeta.objective ?? conversationState.objectiveFromHistory;

  const systemPrompt = `Eres Dr. Planner, asistente experto en diseño de sesiones de pádel. Hablas español, directo y breve. Sin emojis.

## Estilo
- Máximo 3-4 frases por turno. El plan va en mostrar_ejercicios + configurar_sesion_meta, NO en texto.
- Markdown ligero: **negrita** para énfasis. Nada de recuentos ni resúmenes de lo hecho.
- Si no hace falta escribir, no escribas.

## Flujo (una sola ruta)
1. Si hay alumnos y aún no se han seleccionado → llama YA a \`seleccionar_alumnos\`. No preguntes en texto.
2. Recopila lo que falte (nivel, duración, objetivo) con \`<preguntas>\`. Nada de preguntas repetidas.
3. Diseña el plan. Muéstralo con \`mostrar_ejercicios\`. Si necesitas algo que no existe, pide permiso para crearlo con \`crear_ejercicio\`.
4. Llama a \`configurar_sesion_meta\` SIEMPRE con TODOS los campos ya conocidos prellenados: \`objective\` (del historial o del estado), \`intensity\` (estima según ejercicios si no se dijo), \`scheduledAt\` (usa la fecha por defecto si no se dijo), \`location\` y \`tags\` si se mencionaron, \`durationMinutes\` (suma del plan). NO llames a esta tool con campos vacíos — si ya tienes el dato, pásalo. Escribe solo: "Revisa y pulsa **Confirmar** para crear la sesión." Y PARA.
5. Cuando el usuario envíe \`[FORM_META_CONFIRMED]\` o confirme con texto ("sí, crea la sesión", "confirmo", etc.) llama INMEDIATAMENTE a \`crear_sesion\` sin volver a preguntar nada. El marcador \`[FORM_META_CONFIRMED]\` YA es confirmación final — nunca pidas confirmación adicional después de verlo.

## Reglas estrictas (no negociables)
- NO llames a \`crear_sesion\` sin confirmación explícita del usuario en su último mensaje.
- \`[FORM_META_CONFIRMED]\` ES confirmación explícita. Procede a crear la sesión sin más preguntas.
- Un "sí" breve cuenta solo si acabas de preguntar de forma directa si quieres crear la sesión.
- NO llames a \`crear_ejercicio\` sin permiso explícito en su último mensaje.
- NO vuelvas a llamar a \`seleccionar_alumnos\` si ya hay alumnos seleccionados.
- Si la duración del plan difiere de la pedida y no hay permiso → no crees, ajusta o pregunta.
- Máx. 3 \`crear_ejercicio\` por turno.
- Para alumnos: usa \`<preguntas>\` (nombre, nivel) antes de \`crear_alumno\`. Nunca inventes nombres.
- En \`crear_sesion\`: cada ejercicio DEBE llevar \`phase\` (activation/main/cooldown) e \`intensity\` (1-5). Sin intensidades la curva de la sesión queda vacía. Guía: calentamiento 1-2, principal 3-5 (subir y mantener pico antes de bajar), vuelta a la calma 1-2.

## Preguntas interactivas
Cuando necesites datos, añade al FINAL del mensaje:
\`<preguntas>[{"id":"duracion","label":"Duración (min)","tipo":"numero"},{"id":"nivel","label":"Nivel","tipo":"select","opciones":["principiante","amateur","intermedio","avanzado","competición"]}]</preguntas>\`
Tipos: "texto", "numero", "select" (con "opciones"). No repitas datos que ya tengas.

## Herramientas disponibles
- \`seleccionar_alumnos\`, \`crear_alumno\`, \`analizar_alumno\`
- \`mostrar_ejercicios\`, \`crear_ejercicio\`, \`buscar_ejercicios_avanzado\`
- \`buscar_sesiones_similares\`, \`buscar_contexto\` (para menciones @)
- \`configurar_sesion_meta\`, \`crear_sesion\`

## Estado actual (léelo antes de actuar)
- Duración objetivo: ${conversationState.requestedDurationMinutes ?? "—"}
- Objetivo: ${confirmedObjective ?? "—"}
- Alumnos seleccionados: ${selectedStudentsSummary}
- Confirmación crear sesión: ${conversationState.hasExplicitSessionConfirmation ? "SÍ → LLAMA YA a crear_sesion. No preguntes más." : "NO"}
- Permiso crear ejercicios: ${conversationState.hasExerciseCreationConsent ? "SÍ" : "NO"}
- Permiso desviar duración: ${conversationState.hasDurationDeviationConsent ? "SÍ" : "NO"}
- Fecha de hoy: ${todayStr} · Fecha por defecto para sesiones: ${tomorrowISO}
- Meta ya confirmada del formulario: ${JSON.stringify(conversationState.confirmedSessionMeta)}

## Perfil del entrenador
${profile ? buildUserContext(profile, sessionCount) : "Sin datos"}

## Alumnos (${coachStudents.length})
${buildStudentContext(coachStudents)}${hasStudents ? "" : "\nSin alumnos. Puedes ofrecer crear uno."}

## Biblioteca personal (${personalExercises.length})
${personalExercises.length > 0 ? personalExercises.map(formatExerciseLine).join("\n") : "  (vacía)"}

## Biblioteca global (${globalExercises.length})
${globalExercises.map(formatExerciseLine).join("\n")}`;

  let createExerciseCalls = 0;

  const result = streamText({
    model: anthropic("claude-haiku-4-5"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1800,
    temperature: 0.4,
    stopWhen: stepCountIs(12),
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 1500 },
        disableParallelToolUse: true,
      },
    },
    tools: {
      mostrar_ejercicios: {
        description: "Presenta ejercicios como tarjetas interactivas. Usar siempre en lugar de listar ejercicios en texto.",
        inputSchema: z.object({
          ejercicios: z.array(z.object({
            id: z.string(),
            name: z.string(),
            category: z.enum(["technique", "tactics", "fitness", "warm-up"]),
            difficulty: z.enum(["beginner", "intermediate", "advanced"]),
            durationMinutes: z.number(),
            description: z.string().optional(),
            objectives: z.string().optional(),
            isAiGenerated: z.boolean().optional(),
            isPersonal: z.boolean().optional(),
          })),
        }),
        execute: async (input) => input,
      },
      crear_ejercicio: {
        description: "Crea y guarda un ejercicio nuevo en la biblioteca personal del entrenador, marcado como generado por IA.",
        inputSchema: z.object({
          name: z.string(),
          description: z.string(),
          category: z.enum(["technique", "tactics", "fitness", "warm-up"]),
          difficulty: z.enum(["beginner", "intermediate", "advanced"]),
          durationMinutes: z.number().int().min(1),
          objectives: z.string().optional(),
          tips: z.string().optional(),
          materials: z.array(z.string()).optional(),
        }),
        execute: async ({ name, description, category, difficulty, durationMinutes, objectives, tips, materials }) => {
          if (!conversationState.hasExerciseCreationConsent) {
            return {
              ok: false,
              error: "Falta permiso explícito para crear ejercicios nuevos. Pide confirmación antes de crear.",
            };
          }

          if (createExerciseCalls >= 3) {
            return {
              ok: false,
              error: "Máximo de 3 ejercicios creados por turno. Continúa en el siguiente mensaje.",
            };
          }

          createExerciseCalls += 1;

          try {
            const [created] = await db.insert(exercises).values({
              name, description, category, difficulty, durationMinutes,
              objectives: objectives ?? null,
              tips: tips ?? null,
              materials: materials ?? null,
              isAiGenerated: true,
              createdBy: user.id,
            }).returning({ id: exercises.id, name: exercises.name });
            return { ok: true, id: created.id, name: created.name };
          } catch (err) {
            console.error("[Dr. Planner] crear_ejercicio:", err);
            return { ok: false, error: "No se pudo guardar el ejercicio" };
          }
        },
      },
      crear_sesion: {
        description: "Crea la sesión de entrenamiento completa en el sistema con título, fecha, hora y ejercicios.",
        inputSchema: z.object({
          title: z.string().describe("Título descriptivo de la sesión"),
          description: z.string().optional().describe("Descripción breve del objetivo de la sesión"),
          scheduledAt: z.string().describe(`Fecha y hora en formato ISO, por defecto ${tomorrowISO}`),
          objective: z.string().optional().describe("Objetivo principal de la sesión"),
          intensity: z.number().int().min(1).max(5).optional().describe("Intensidad global 1-5"),
          tags: z.array(z.string()).optional().describe("Etiquetas de la sesión"),
          location: z.string().optional().describe("Ubicación de la sesión"),
          studentIds: z.array(z.string()).optional().describe("IDs de los alumnos asignados a esta sesión"),
          exercises: z.array(z.object({
            id: z.string().describe("ID del ejercicio de la biblioteca"),
            notes: z.string().optional().describe("Notas específicas para este ejercicio en la sesión"),
            phase: z.enum(["activation", "main", "cooldown"]).optional().describe("Fase del entrenamiento"),
            intensity: z.number().int().min(1).max(5).optional().describe("Intensidad específica del ejercicio"),
          })).describe("Ejercicios en orden con sus IDs"),
        }),
        execute: async ({ title, description, scheduledAt, objective, intensity, tags, location, studentIds, exercises: exerciseList }) => {
          type ExerciseEntry = { id: string; notes?: string; phase?: "activation" | "main" | "cooldown"; intensity?: number };
          const typedList = exerciseList as ExerciseEntry[];

          if (!conversationState.hasExplicitSessionConfirmation) {
            return {
              ok: false,
              error: "Falta confirmación explícita del entrenador para crear la sesión.",
            };
          }

          if (typedList.length === 0) {
            return { ok: false, error: "La sesión debe incluir al menos un ejercicio." };
          }

          try {
            const ids = typedList.map((e) => e.id);
            const exerciseData = ids.length > 0
              ? await db.select({ id: exercises.id, durationMinutes: exercises.durationMinutes })
                  .from(exercises).where(inArray(exercises.id, ids))
              : [];
            const durMap = new Map(exerciseData.map((e) => [e.id, e.durationMinutes]));
            const missingIds = ids.filter((id) => !durMap.has(id));
            if (missingIds.length > 0) {
              return { ok: false, error: "Hay ejercicios no válidos en el plan. Revisa los ejercicios seleccionados." };
            }

            const totalDuration = ids.reduce((sum: number, id: string) => sum + (durMap.get(id) ?? 0), 0);

            if (
              conversationState.requestedDurationMinutes !== null
              && totalDuration !== conversationState.requestedDurationMinutes
              && !conversationState.hasDurationDeviationConsent
            ) {
              const delta = totalDuration - conversationState.requestedDurationMinutes;
              const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;
              return {
                ok: false,
                error: `La propuesta suma ${totalDuration} min y el objetivo era ${conversationState.requestedDurationMinutes} min (${deltaLabel} min). Pregunta al entrenador si acepta esta diferencia o ajusta ejercicios para cuadrar la duración.`,
              };
            }

            const finalStudentIds = conversationState.selectedStudentIds.length > 0
              ? conversationState.selectedStudentIds
              : (studentIds ?? []);

            const finalObjective = conversationState.confirmedSessionMeta.objective
              ?? conversationState.objectiveFromHistory
              ?? objective
              ?? null;
            const finalIntensity = conversationState.confirmedSessionMeta.intensity ?? intensity ?? null;
            const finalTags = conversationState.confirmedSessionMeta.tags ?? tags ?? null;
            const finalLocation = conversationState.confirmedSessionMeta.location ?? location ?? null;
            const finalScheduledAt = conversationState.confirmedSessionMeta.scheduledAt ?? scheduledAt;
            const parsedScheduledAt = new Date(finalScheduledAt);

            if (Number.isNaN(parsedScheduledAt.getTime())) {
              return { ok: false, error: "La fecha/hora de la sesión no es válida. Revisa el formulario y confirma de nuevo." };
            }

            const [session] = await db.insert(sessions).values({
              title,
              description: description ?? null,
              scheduledAt: parsedScheduledAt,
              durationMinutes: totalDuration,
              userId: user.id,
              objective: finalObjective,
              intensity: finalIntensity,
              tags: finalTags,
              location: finalLocation,
            }).returning({ id: sessions.id, title: sessions.title });

            if (typedList.length > 0) {
              const phaseDefault = (phase?: "activation" | "main" | "cooldown") => {
                if (phase === "activation") return 2;
                if (phase === "cooldown") return 1;
                return finalIntensity ?? 3;
              };
              await db.insert(sessionExercises).values(
                typedList.map((e, i) => ({
                  sessionId: session.id,
                  exerciseId: e.id,
                  orderIndex: i,
                  durationMinutes: durMap.get(e.id) ?? null,
                  notes: e.notes ?? null,
                  phase: e.phase ?? null,
                  intensity: e.intensity ?? phaseDefault(e.phase),
                }))
              );
            }

            if (finalStudentIds.length > 0) {
              const validStudents = await db
                .select({ id: students.id })
                .from(students)
                .where(and(inArray(students.id, finalStudentIds), eq(students.coachId, user.id)));
              const validIds = validStudents.map((s) => s.id);
              if (validIds.length > 0) {
                await db.insert(sessionStudents).values(
                  validIds.map((studentId) => ({ sessionId: session.id, studentId }))
                );
              }
            }

            return { ok: true, sessionId: session.id, title: session.title, totalDuration };
          } catch (err) {
            console.error("[Dr. Planner] crear_sesion:", err);
            return { ok: false, error: "No se pudo crear la sesión" };
          }
        },
      },
      seleccionar_alumnos: {
        description: "Muestra un selector interactivo de alumnos en la UI. Llamar al inicio de una conversación de diseño de sesión cuando hay alumnos disponibles.",
        inputSchema: z.object({
          estudiantes: z.array(z.object({
            id: z.string(),
            name: z.string(),
            playerLevel: z.string().nullable().optional(),
            gender: z.string().nullable().optional(),
            dominantHand: z.string().nullable().optional(),
          })),
          pregunta: z.string().optional().describe("Pregunta opcional para mostrar encima del selector"),
        }),
        execute: async (input) => input,
      },
      crear_alumno: {
        description: "Crea un perfil de alumno rápido con nombre y nivel. Usar solo cuando el entrenador confirme que quiere crear un alumno.",
        inputSchema: z.object({
          name: z.string().describe("Nombre del alumno"),
          playerLevel: z.enum(["beginner", "amateur", "intermediate", "advanced", "competitive"]).optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ name, playerLevel, notes }) => {
          try {
            const [created] = await db.insert(students).values({
              coachId: user.id,
              name,
              playerLevel: playerLevel ?? null,
              notes: notes ?? null,
            }).returning({ id: students.id, name: students.name });
            return { ok: true, id: created.id, name: created.name };
          } catch (err) {
            console.error("[Dr. Planner] crear_alumno:", err);
            return { ok: false, error: "No se pudo crear el alumno" };
          }
        },
      },
      configurar_sesion_meta: {
        description: "Muestra un formulario interactivo con los metadatos de la sesión para que el entrenador los revise antes de crear la sesión. Llamar ANTES de crear_sesion.",
        inputSchema: z.object({
          objective: z.string().optional().describe("Objetivo principal de la sesión"),
          intensity: z.number().int().min(1).max(5).optional().describe("Intensidad global 1-5"),
          tags: z.array(z.string()).optional().describe("Etiquetas"),
          location: z.string().optional().describe("Ubicación"),
          scheduledAt: z.string().optional().describe("Fecha y hora ISO"),
          durationMinutes: z.number().optional().describe("Duración estimada en minutos"),
        }),
        execute: async (input) => input,
      },
      buscar_contexto: {
        description: "Busca en la biblioteca de ejercicios, sesiones pasadas o alumnos del entrenador para referenciarlos. Llamar cuando el entrenador mencione algo con @ o cuando necesites datos de una sesión o alumno específico.",
        inputSchema: z.object({
          tipo: z.enum(["ejercicio", "sesion", "alumno", "todos"]).default("todos"),
          query: z.string().describe("Nombre o texto de búsqueda"),
        }),
        execute: async ({ tipo, query }) => {
          const q = query.toLowerCase();
          if (tipo === "todos") {
            const [exResults, sesResults] = await Promise.all([
              db.select({ id: exercises.id, name: exercises.name, category: exercises.category, difficulty: exercises.difficulty, durationMinutes: exercises.durationMinutes, isAiGenerated: exercises.isAiGenerated })
                .from(exercises).where(or(eq(exercises.createdBy, user.id), eq(exercises.isGlobal, true), isNull(exercises.createdBy))).limit(20),
              db.select({ id: sessions.id, title: sessions.title, scheduledAt: sessions.scheduledAt, durationMinutes: sessions.durationMinutes, objective: sessions.objective })
                .from(sessions).where(and(eq(sessions.userId, user.id), ilike(sessions.title, `%${query}%`))).orderBy(desc(sessions.scheduledAt)).limit(5),
            ]);
            const ejercicios = exResults.filter(e => e.name.toLowerCase().includes(q)).slice(0, 3);
            const alumnos = coachStudents.filter(s => s.name.toLowerCase().includes(q)).slice(0, 3);
            return { resultados: [...ejercicios.map(e => ({ tipo: "ejercicio", ...e })), ...sesResults.map(s => ({ tipo: "sesion", ...s })), ...alumnos.map(a => ({ tipo: "alumno", ...a })) ] };
          }
          if (tipo === "ejercicio") {
            const results = await db.select({
              id: exercises.id, name: exercises.name, category: exercises.category,
              difficulty: exercises.difficulty, durationMinutes: exercises.durationMinutes,
              description: exercises.description, objectives: exercises.objectives,
              isAiGenerated: exercises.isAiGenerated,
            }).from(exercises)
              .where(or(eq(exercises.createdBy, user.id), eq(exercises.isGlobal, true), isNull(exercises.createdBy)))
              .limit(20);
            const filtered = results.filter(e => e.name.toLowerCase().includes(q));
            return { tipo: "ejercicio", resultados: filtered.slice(0, 5) };
          } else if (tipo === "sesion") {
            const results = await db.select({
              id: sessions.id, title: sessions.title, scheduledAt: sessions.scheduledAt,
              durationMinutes: sessions.durationMinutes, objective: sessions.objective,
            }).from(sessions)
              .where(and(eq(sessions.userId, user.id), ilike(sessions.title, `%${query}%`)))
              .orderBy(desc(sessions.scheduledAt))
              .limit(5);
            return { tipo: "sesion", resultados: results };
          } else {
            const filtered = coachStudents.filter(s => s.name.toLowerCase().includes(q)).slice(0, 5);
            return { tipo: "alumno", resultados: filtered };
          }
        },
      },
      analizar_alumno: {
        description: "Muestra perfil completo de un alumno con su historial de sesiones y estadísticas. Usar cuando el entrenador pregunte por un alumno o quiera adaptar una sesión a su historial.",
        inputSchema: z.object({
          studentId: z.string().describe("ID del alumno a analizar"),
        }),
        execute: async ({ studentId }) => {
          const [student] = await db.select().from(students)
            .where(and(eq(students.id, studentId), eq(students.coachId, user.id))).limit(1);
          if (!student) return { ok: false, error: "Alumno no encontrado" };

          const recentSessions = await db.select({
            id: sessions.id, title: sessions.title, scheduledAt: sessions.scheduledAt,
            durationMinutes: sessions.durationMinutes, objective: sessions.objective,
            intensity: sessions.intensity,
          })
            .from(sessionStudents)
            .innerJoin(sessions, eq(sessionStudents.sessionId, sessions.id))
            .where(eq(sessionStudents.studentId, studentId))
            .orderBy(desc(sessions.scheduledAt))
            .limit(8);

          return { ok: true, student, totalSessions: recentSessions.length, recentSessions };
        },
      },
      buscar_sesiones_similares: {
        description: "Busca sesiones pasadas del entrenador para usar como referencia o inspiración. Usar cuando el entrenador quiera basar una nueva sesión en algo previo.",
        inputSchema: z.object({
          query: z.string().optional().describe("Búsqueda por título u objetivo"),
          duracionMinutos: z.number().optional().describe("Duración aproximada para filtrar (±15 min)"),
          limit: z.number().int().min(1).max(8).optional().describe("Máx resultados"),
        }),
        execute: async ({ query, duracionMinutos, limit = 6 }) => {
          const conditions = [eq(sessions.userId, user.id)];
          if (query) conditions.push(ilike(sessions.title, `%${query}%`));
          if (duracionMinutos !== undefined) {
            conditions.push(gte(sessions.durationMinutes, duracionMinutos - 15));
            conditions.push(lte(sessions.durationMinutes, duracionMinutos + 15));
          }

          const results = await db.select({
            id: sessions.id, title: sessions.title, scheduledAt: sessions.scheduledAt,
            durationMinutes: sessions.durationMinutes, objective: sessions.objective,
            intensity: sessions.intensity, tags: sessions.tags,
          }).from(sessions).where(and(...conditions)).orderBy(desc(sessions.scheduledAt)).limit(limit);

          return { sesiones: results };
        },
      },
      buscar_ejercicios_avanzado: {
        description: "Búsqueda avanzada de ejercicios con filtros por categoría, dificultad y duración. Presentar siempre el resultado con mostrar_ejercicios, nunca en texto.",
        inputSchema: z.object({
          query: z.string().optional().describe("Texto libre en el nombre del ejercicio"),
          categoria: z.enum(["technique", "tactics", "fitness", "warm-up"]).optional(),
          dificultad: z.enum(["beginner", "intermediate", "advanced"]).optional(),
          duracionMin: z.number().optional().describe("Duración mínima en minutos"),
          duracionMax: z.number().optional().describe("Duración máxima en minutos"),
          soloPersonales: z.boolean().optional().describe("Solo ejercicios propios del entrenador"),
        }),
        execute: async ({ query, categoria, dificultad, duracionMin, duracionMax, soloPersonales }) => {
          const baseCondition = soloPersonales
            ? eq(exercises.createdBy, user.id)
            : or(eq(exercises.createdBy, user.id), eq(exercises.isGlobal, true), isNull(exercises.createdBy));

          const conditions = [baseCondition!];
          if (categoria) conditions.push(eq(exercises.category, categoria));
          if (dificultad) conditions.push(eq(exercises.difficulty, dificultad));
          if (query) conditions.push(ilike(exercises.name, `%${query}%`));
          if (duracionMin !== undefined) conditions.push(gte(exercises.durationMinutes, duracionMin));
          if (duracionMax !== undefined) conditions.push(lte(exercises.durationMinutes, duracionMax));

          const results = await db.select(EXERCISE_FIELDS).from(exercises)
            .where(and(...conditions)).limit(20);

          return { ejercicios: results };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
