/**
 * Seeder de "fixtures de coach" — escena completa para demo.
 *
 * Para un coach concreto crea: lugares, alumnos, grupos, y sesiones (pasadas
 * y futuras) con sus ejercicios, asistencia y valoración.
 *
 * Uso:
 *   COACH_USER_ID=<uuid>  pnpm db:seed:fixtures
 *
 * Si no se pasa COACH_USER_ID, usa el primer admin (`users.is_admin = true`).
 * Si no hay admin, aborta con instrucciones.
 *
 * Es idempotente: detecta nombres ya existentes para ese coach y los salta.
 */

import { createSeederClient } from "./_db";
import {
  users,
  places,
  students,
  groups,
  groupStudents,
  sessions,
  sessionExercises,
  sessionStudents,
  exercises,
} from "../schema";
import { and, asc, eq, inArray } from "drizzle-orm";

interface PlaceSeed {
  name: string;
  description: string;
}

interface StudentSeed {
  name: string;
  email?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  birthDate?: string;
  dominantHand?: "left" | "right";
  playerLevel: string;
  yearsExperience?: number;
  yearStartedTennis?: number;
  preferredSchedule?: string;
  notes?: string;
}

interface GroupSeed {
  name: string;
  description?: string;
  studentNames: string[];
}

interface SessionSeed {
  title: string;
  description: string;
  /** Días desde hoy. Negativo = pasada. */
  offsetDays: number;
  hour: number;
  minute: number;
  durationMinutes: number;
  placeName?: string;
  status: "scheduled" | "completed" | "cancelled";
  statusNote?: string;
  exerciseNames: string[];
  /** Asignar alumnos del grupo X (por nombre). Vacío = sin alumnos. */
  groupName?: string;
  /** Asistencia simulada. Solo aplica si status === completed. */
  attendance?: {
    studentName: string;
    attended: boolean;
    rating?: number;
    feedback?: string;
  }[];
}

const PLACES: PlaceSeed[] = [
  { name: "Pista 1", description: "Pista central, tierra batida, iluminación nocturna." },
  { name: "Pista 2", description: "Pista lateral, dura, con pared de frontón." },
  { name: "Pista 3", description: "Pista cubierta, moqueta rápida." },
  { name: "Gimnasio", description: "Sala de fuerza y movilidad junto a vestuarios." },
  { name: "Pared", description: "Pared exterior para entrenamientos individuales." },
];

const STUDENTS: StudentSeed[] = [
  {
    name: "Lucas Fernández",
    email: "lucas.fernandez@example.com",
    phone: "+34 600 111 222",
    gender: "male",
    birthDate: "2017-03-12",
    dominantHand: "right",
    playerLevel: "desarrollo",
    yearsExperience: 1,
    yearStartedTennis: 2024,
    preferredSchedule: "Martes y jueves 17:00",
    notes: "Empezó hace un año. Muy motivado, aún coge mal el revés.",
  },
  {
    name: "Inés Roca",
    email: "ines.roca@example.com",
    phone: "+34 600 222 333",
    gender: "female",
    birthDate: "2015-09-04",
    dominantHand: "left",
    playerLevel: "consolidacion",
    yearsExperience: 3,
    yearStartedTennis: 2022,
    preferredSchedule: "Lunes y miércoles 18:00",
    notes: "Zurda. Buen revés cortado. Trabajar la primera de saque.",
  },
  {
    name: "Mateo Vidal",
    email: "mateo.vidal@example.com",
    phone: "+34 600 333 444",
    gender: "male",
    birthDate: "2013-01-21",
    dominantHand: "right",
    playerLevel: "especializacion",
    yearsExperience: 5,
    yearStartedTennis: 2020,
    preferredSchedule: "Sábados 10:00",
    notes: "Empieza a jugar torneos sub-12. Foco en táctica y patrones.",
  },
  {
    name: "Carla Núñez",
    email: "carla.nunez@example.com",
    phone: "+34 600 444 555",
    gender: "female",
    birthDate: "2011-06-15",
    dominantHand: "right",
    playerLevel: "precompeticion",
    yearsExperience: 6,
    yearStartedTennis: 2019,
    preferredSchedule: "Martes/jueves 18:30 + sábados 11:00",
    notes: "Categoría sub-14. Trabajar segundo saque y resto profundo.",
  },
  {
    name: "Diego Santos",
    email: "diego.santos@example.com",
    phone: "+34 600 555 666",
    gender: "male",
    birthDate: "2009-11-30",
    dominantHand: "right",
    playerLevel: "competicion",
    yearsExperience: 8,
    yearStartedTennis: 2017,
    preferredSchedule: "Lunes a viernes 18:00",
    notes: "Sub-16, ranking nacional. Sesiones largas, alta intensidad.",
  },
  {
    name: "Aitana Mora",
    email: "aitana.mora@example.com",
    phone: "+34 600 666 777",
    gender: "female",
    birthDate: "2010-04-08",
    dominantHand: "right",
    playerLevel: "competicion",
    yearsExperience: 7,
    yearStartedTennis: 2018,
    preferredSchedule: "Martes/jueves/sábado 17:30",
    notes: "Sub-16. Muy regular. Dejada y subida a red por mejorar.",
  },
  {
    name: "Hugo Pereira",
    email: "hugo.pereira@example.com",
    phone: "+34 600 777 888",
    gender: "male",
    birthDate: "2018-08-22",
    dominantHand: "right",
    playerLevel: "descubrimiento",
    yearsExperience: 0,
    yearStartedTennis: 2025,
    preferredSchedule: "Sábados 10:00",
    notes: "5 años. Primer año de tenis. Trabajar coordinación y disfrute.",
  },
  {
    name: "Marta Ríos",
    email: "marta.rios@example.com",
    phone: "+34 600 888 999",
    gender: "female",
    birthDate: "2018-02-14",
    dominantHand: "right",
    playerLevel: "descubrimiento",
    yearsExperience: 0,
    yearStartedTennis: 2025,
    preferredSchedule: "Sábados 10:00",
    notes: "5 años. Muy tímida, necesita refuerzo positivo constante.",
  },
  {
    name: "Pablo Cano",
    phone: "+34 600 999 000",
    gender: "male",
    birthDate: "1985-07-20",
    dominantHand: "right",
    playerLevel: "adultos_iniciacion",
    yearsExperience: 0,
    yearStartedTennis: 2025,
    preferredSchedule: "Lunes 20:30",
    notes: "Adulto debutante. Cuidar la espalda al servir.",
  },
  {
    name: "Lucía Bernal",
    email: "lucia.bernal@example.com",
    phone: "+34 611 000 111",
    gender: "female",
    birthDate: "1992-11-03",
    dominantHand: "right",
    playerLevel: "adultos_medio_alto",
    yearsExperience: 10,
    yearStartedTennis: 2015,
    preferredSchedule: "Miércoles 20:00",
    notes: "Jugó en juveniles. Vuelve tras pausa de 3 años. Disfruta peloteando.",
  },
  {
    name: "Sergio Lara",
    email: "sergio.lara@example.com",
    phone: "+34 611 111 222",
    gender: "male",
    birthDate: "1988-05-17",
    dominantHand: "right",
    playerLevel: "adultos_medio_alto",
    yearsExperience: 12,
    yearStartedTennis: 2013,
    preferredSchedule: "Viernes 19:30",
    notes: "Buen revés a una mano. Quiere mejorar la subida a la red.",
  },
  {
    name: "Noa Castro",
    email: "noa.castro@example.com",
    phone: "+34 611 222 333",
    gender: "female",
    birthDate: "2014-12-09",
    dominantHand: "left",
    playerLevel: "consolidacion",
    yearsExperience: 4,
    yearStartedTennis: 2021,
    preferredSchedule: "Lunes y miércoles 17:30",
    notes: "Zurda. Trabajar diagonal larga al lado del revés del rival.",
  },
];

const GROUPS: GroupSeed[] = [
  {
    name: "Mini-tenis · Sábados",
    description: "Iniciación 5-6 años, pista mini, pelotas rojas.",
    studentNames: ["Hugo Pereira", "Marta Ríos"],
  },
  {
    name: "Naranjas · L/X tarde",
    description: "Pelota naranja, pista 3/4. Construcción de punto.",
    studentNames: ["Lucas Fernández", "Inés Roca", "Noa Castro"],
  },
  {
    name: "Verdes · sábados",
    description: "Pelota verde. Técnica y primeros torneos.",
    studentNames: ["Mateo Vidal"],
  },
  {
    name: "Competición · sub-14/16",
    description: "Pista entera, alto rendimiento, doble sesión semanal.",
    studentNames: ["Carla Núñez", "Diego Santos", "Aitana Mora"],
  },
  {
    name: "Adultos · martes",
    description: "Adultos iniciación y medio-alto.",
    studentNames: ["Pablo Cano", "Lucía Bernal", "Sergio Lara"],
  },
];

const SESSIONS: SessionSeed[] = [
  /* ─── Pasadas (con asistencia y valoración) ──────────────── */
  {
    title: "Lucas e Inés · ritmo de fondo",
    description: "Trabajo de profundidad y alternancia derecha/revés.",
    offsetDays: -7,
    hour: 17,
    minute: 30,
    durationMinutes: 60,
    placeName: "Pista 2",
    status: "completed",
    statusNote:
      "Buena sesión. Lucas mejoró el revés cortado. Inés algo cansada al final.",
    exerciseNames: [
      "Movilidad articular y activación",
      "Mini-tenis con bote y golpe",
      "Punto a tres golpes obligados",
      "Diana puntuable: cuatro zonas",
    ],
    groupName: "Naranjas · L/X tarde",
    attendance: [
      {
        studentName: "Lucas Fernández",
        attended: true,
        rating: 4,
        feedback: "Muy implicado. El cortado va saliendo.",
      },
      {
        studentName: "Inés Roca",
        attended: true,
        rating: 3,
        feedback: "Cansada el último tercio. Revisar carga de la semana.",
      },
      { studentName: "Noa Castro", attended: false },
    ],
  },
  {
    title: "Diego · saque y resto",
    description: "Sesión individual previa al torneo del fin de semana.",
    offsetDays: -5,
    hour: 18,
    minute: 0,
    durationMinutes: 90,
    placeName: "Pista 1",
    status: "completed",
    statusNote: "Listo para el torneo. Saque al 75% de aciertos.",
    exerciseNames: [
      "Movilidad articular y activación",
      "Saque plano al cuadro de derecha",
      "Saque liftado segundo servicio",
      "Punto corto desde el resto",
      "Punto de oro con presión",
    ],
    attendance: [
      {
        studentName: "Diego Santos",
        attended: true,
        rating: 5,
        feedback: "Foco impecable. Confiar en el segundo saque.",
      },
    ],
  },
  {
    title: "Mini-tenis · sábado",
    description: "Sesión de iniciación con Hugo y Marta.",
    offsetDays: -3,
    hour: 10,
    minute: 0,
    durationMinutes: 45,
    placeName: "Pista 3",
    status: "completed",
    statusNote: "Marta sonrió al final. Hugo aún se distrae con la red.",
    exerciseNames: [
      "Movilidad articular y activación",
      "Adultos · sensibilidad de bola",
      "Pelota roja: golpe controlado a media pista",
      "Mini-tenis con globo final",
    ],
    groupName: "Mini-tenis · Sábados",
    attendance: [
      {
        studentName: "Hugo Pereira",
        attended: true,
        rating: 3,
        feedback: "Mucha energía. Mantener el reto corto.",
      },
      {
        studentName: "Marta Ríos",
        attended: true,
        rating: 4,
        feedback: "Cogió confianza. La próxima, más repeticiones de derecha.",
      },
    ],
  },
  {
    title: "Carla · construcción y patrones",
    description: "Trabajo de patrón cruzado-paralelo.",
    offsetDays: -2,
    hour: 18,
    minute: 30,
    durationMinutes: 75,
    placeName: "Pista 1",
    status: "cancelled",
    statusNote: "Cancelada por lluvia. Recuperar el viernes.",
    exerciseNames: [],
  },

  /* ─── Próximas ───────────────────────────────────────────── */
  {
    title: "Adultos martes · ritmo y dirección",
    description: "Sesión semanal del grupo de adultos.",
    offsetDays: 1,
    hour: 20,
    minute: 0,
    durationMinutes: 75,
    placeName: "Pista 2",
    status: "scheduled",
    exerciseNames: [
      "Movilidad articular y activación",
      "Mini-tenis con bote y golpe",
      "Adultos medio-alto · peloteo a 2 toques",
      "Diana puntuable: cuatro zonas",
    ],
    groupName: "Adultos · martes",
  },
  {
    title: "Naranjas · construir el punto",
    description: "Plantilla pelota naranja construir el punto.",
    offsetDays: 2,
    hour: 17,
    minute: 30,
    durationMinutes: 75,
    placeName: "Pista 3",
    status: "scheduled",
    exerciseNames: [
      "Movilidad articular y activación",
      "Sprints en estrella",
      "Punto a tres golpes obligados",
      "Mini-tenis: el rey de la pista",
    ],
    groupName: "Naranjas · L/X tarde",
  },
  {
    title: "Mateo · técnica de derecha",
    description: "Sesión individual centrada en la derecha cruzada.",
    offsetDays: 3,
    hour: 16,
    minute: 0,
    durationMinutes: 60,
    placeName: "Pista 1",
    status: "scheduled",
    exerciseNames: [
      "Movilidad articular y activación",
      "Derecha cruzada profunda",
      "Peloteo cruzado a tres cuartos",
      "Diana puntuable: cuatro zonas",
    ],
    groupName: "Verdes · sábados",
  },
  {
    title: "Mini-tenis · sábado",
    description: "Sesión semanal de mini-tenis.",
    offsetDays: 5,
    hour: 10,
    minute: 0,
    durationMinutes: 45,
    placeName: "Pista 3",
    status: "scheduled",
    exerciseNames: [
      "Adultos · sensibilidad de bola",
      "Pelota roja: golpe controlado a media pista",
      "Mini-tenis con globo final",
    ],
    groupName: "Mini-tenis · Sábados",
  },
  {
    title: "Diego y Aitana · scouting",
    description: "Patrones tácticos previos al torneo.",
    offsetDays: 6,
    hour: 18,
    minute: 0,
    durationMinutes: 90,
    placeName: "Pista 1",
    status: "scheduled",
    exerciseNames: [
      "Movilidad articular y activación",
      "Patrón 1+1: derecha cruzada y subida",
      "Ataque de segundo saque",
      "Volea de derecha cerca de la red",
    ],
    groupName: "Competición · sub-14/16",
  },
  {
    title: "Pretemporada física",
    description: "Sesión sin raqueta, gimnasio.",
    offsetDays: 8,
    hour: 19,
    minute: 0,
    durationMinutes: 60,
    placeName: "Gimnasio",
    status: "scheduled",
    exerciseNames: [
      "Movilidad articular y activación",
      "Sprints en estrella",
      "Circuito de fuerza con líneas de goma",
      "Core anti-rotación con goma",
    ],
    groupName: "Competición · sub-14/16",
  },
];

function buildScheduledAt(offsetDays: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seed() {
  const { client, db } = createSeederClient();

  // 1. Resolver coachId
  let coachId = process.env.COACH_USER_ID?.trim() || null;
  if (!coachId) {
    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isAdmin, true))
      .orderBy(asc(users.createdAt))
      .limit(1);
    if (!admin) {
      console.error(
        "✗ No hay COACH_USER_ID en env y no encontré ningún usuario con is_admin=true.\n  Pasa COACH_USER_ID=<uuid> o marca un usuario como admin antes de seedear fixtures."
      );
      await client.end();
      process.exit(1);
    }
    coachId = admin.id;
    console.log(`Usando primer admin como coach: ${coachId}`);
  } else {
    console.log(`Coach: ${coachId}`);
  }

  /* ─── Lugares ────────────────────────────────────────────── */
  console.log("\nSeeding lugares…");
  const existingPlaces = await db
    .select({ id: places.id, name: places.name })
    .from(places)
    .where(eq(places.coachId, coachId));
  const placesByName = new Map(existingPlaces.map((p) => [p.name, p.id]));

  for (const p of PLACES) {
    if (placesByName.has(p.name)) continue;
    const [created] = await db
      .insert(places)
      .values({ coachId, name: p.name, description: p.description })
      .returning({ id: places.id });
    placesByName.set(p.name, created.id);
  }
  console.log(`  · Lugares: ${placesByName.size}`);

  /* ─── Alumnos ────────────────────────────────────────────── */
  console.log("\nSeeding alumnos…");
  const existingStudents = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.coachId, coachId));
  const studentByName = new Map(existingStudents.map((s) => [s.name, s.id]));

  for (const s of STUDENTS) {
    if (studentByName.has(s.name)) continue;
    const [created] = await db
      .insert(students)
      .values({
        coachId,
        name: s.name,
        email: s.email ?? null,
        phone: s.phone ?? null,
        gender: s.gender ?? null,
        birthDate: s.birthDate ?? null,
        dominantHand: s.dominantHand ?? null,
        playerLevel: s.playerLevel,
        yearsExperience: s.yearsExperience ?? null,
        yearStartedTennis: s.yearStartedTennis ?? null,
        preferredSchedule: s.preferredSchedule ?? null,
        notes: s.notes ?? null,
      })
      .returning({ id: students.id });
    studentByName.set(s.name, created.id);
  }
  console.log(`  · Alumnos: ${studentByName.size}`);

  /* ─── Grupos ─────────────────────────────────────────────── */
  console.log("\nSeeding grupos…");
  const existingGroups = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.coachId, coachId));
  const groupByName = new Map(existingGroups.map((g) => [g.name, g.id]));

  for (const g of GROUPS) {
    if (groupByName.has(g.name)) {
      continue;
    }
    const [createdGroup] = await db
      .insert(groups)
      .values({
        coachId,
        name: g.name,
        description: g.description ?? null,
      })
      .returning({ id: groups.id });
    groupByName.set(g.name, createdGroup.id);

    const memberIds = g.studentNames
      .map((n) => studentByName.get(n))
      .filter((id): id is string => !!id);
    if (memberIds.length > 0) {
      await db
        .insert(groupStudents)
        .values(
          memberIds.map((studentId) => ({ groupId: createdGroup.id, studentId }))
        )
        .onConflictDoNothing();
    }
  }
  console.log(`  · Grupos: ${groupByName.size}`);

  /* ─── Sesiones ───────────────────────────────────────────── */
  console.log("\nSeeding sesiones…");
  const allReferencedExerciseNames = Array.from(
    new Set(SESSIONS.flatMap((s) => s.exerciseNames))
  );
  const exerciseRows =
    allReferencedExerciseNames.length > 0
      ? await db
          .select({
            id: exercises.id,
            name: exercises.name,
            durationMinutes: exercises.durationMinutes,
          })
          .from(exercises)
          .where(inArray(exercises.name, allReferencedExerciseNames))
      : [];
  const exerciseByName = new Map(
    exerciseRows.map((r) => [r.name, { id: r.id, durationMinutes: r.durationMinutes }])
  );

  let createdSessions = 0;
  let skippedSessions = 0;
  for (const sess of SESSIONS) {
    const scheduledAt = buildScheduledAt(sess.offsetDays, sess.hour, sess.minute);

    // Idempotencia: mismo title + scheduledAt + coach
    const [existing] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, coachId),
          eq(sessions.title, sess.title),
          eq(sessions.scheduledAt, scheduledAt)
        )
      )
      .limit(1);
    if (existing) {
      skippedSessions++;
      continue;
    }

    const placeId = sess.placeName
      ? (placesByName.get(sess.placeName) ?? null)
      : null;

    await db.transaction(async (tx) => {
      const [createdSession] = await tx
        .insert(sessions)
        .values({
          title: sess.title,
          description: sess.description,
          scheduledAt,
          durationMinutes: sess.durationMinutes,
          userId: coachId!,
          placeId,
          status: sess.status,
          statusNote: sess.statusNote ?? null,
        })
        .returning({ id: sessions.id });

      // Ejercicios
      const sessionExerciseRows = sess.exerciseNames
        .map((n, idx) => {
          const ex = exerciseByName.get(n);
          if (!ex) return null;
          return {
            sessionId: createdSession.id,
            exerciseId: ex.id,
            orderIndex: idx,
            durationMinutes: ex.durationMinutes,
            phase:
              idx === 0
                ? ("activation" as const)
                : idx === sess.exerciseNames.length - 1
                  ? ("cooldown" as const)
                  : ("main" as const),
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
      if (sessionExerciseRows.length > 0) {
        await tx.insert(sessionExercises).values(sessionExerciseRows);
      }

      // Asistencia (sólo en sesiones completadas)
      if (sess.status === "completed" && sess.attendance) {
        const rows = sess.attendance
          .map((a) => {
            const studentId = studentByName.get(a.studentName);
            if (!studentId) return null;
            return {
              sessionId: createdSession.id,
              studentId,
              attended: a.attended,
              rating: a.rating ?? null,
              feedback: a.feedback ?? null,
              feedbackAt: a.feedback ? new Date() : null,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (rows.length > 0) {
          await tx.insert(sessionStudents).values(rows);
        }
      }
    });

    createdSessions++;
  }
  console.log(
    `  · Sesiones nuevas: ${createdSessions}\n  · Sesiones existentes: ${skippedSessions}`
  );

  await client.end();
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log("\n✓ Seed coach-fixtures completado.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Seed coach-fixtures falló:", error);
      process.exit(1);
    });
}

export { seed as seedCoachFixtures };
