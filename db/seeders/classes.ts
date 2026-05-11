/**
 * Seeder de clases biblioteca (isLibrary=true).
 *
 * Crea 10 clases plantilla con sus 3 bloques completos (inicial / principal / final).
 * Cada bloque referencia ejercicios por NOMBRE — el seeder los resuelve a IDs en BD,
 * cayendo a "free text" si el ejercicio no existe.
 *
 * Uso:  pnpm db:seed:classes
 *
 * Requiere ejercicios biblioteca cargados (correr `pnpm db:seed:exercises` antes).
 */

import { createSeederClient } from "./_db";
import {
  classes,
  classBlocks,
  classBlockExercises,
  exercises,
} from "../schema";
import { eq, inArray } from "drizzle-orm";

interface BlockItem {
  exerciseName?: string;
  freeText?: string;
  durationMinutes?: number;
}

interface BlockSeed {
  orderIndex: 1 | 2 | 3;
  title: string;
  notes?: string;
  items: BlockItem[];
}

interface ClassSeed {
  name: string;
  duracionMinutes: number;
  alumnosTipo: "individual" | "grupal";
  objetivos: string;
  material: string;
  aspectosImportantes?: string;
  nivel: string;
  aspectoJuego: string;
  golpes?: string[];
  blocks: [BlockSeed, BlockSeed, BlockSeed];
}

const seedClasses: ClassSeed[] = [
  /* ─── 01 ─────────────────────────────────────────────────── */
  {
    name: "Iniciación al tenis · Primer mes",
    duracionMinutes: 60,
    alumnosTipo: "grupal",
    objetivos:
      "1) familiarizarse con la pala y la bola 2) aprender pasos básicos antes del bote 3) primer contacto con derecha",
    material:
      "Pelotas rojas, raquetas adaptadas a la edad, conos, escalera de coordinación, pista mini-tenis (12-18m)",
    aspectosImportantes:
      "Foco en la diversión y la repetición. No corregir más de un aspecto técnico por rebote. Usar muchos refuerzos positivos.",
    nivel: "descubrimiento",
    aspectoJuego: "tecnica",
    golpes: ["derecha"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial · activación",
        notes: "Activar sin pala primero, luego con pala.",
        items: [
          { exerciseName: "Movilidad articular y activación", durationMinutes: 5 },
          { exerciseName: "Escalera de coordinación", durationMinutes: 8 },
          { exerciseName: "Adultos · sensibilidad de bola", durationMinutes: 5 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · contacto con bola",
        notes: "Lanzamientos manuales del monitor desde el otro lado.",
        items: [
          { exerciseName: "Mini-tenis con bote y golpe", durationMinutes: 15 },
          {
            exerciseName: "Pelota roja: golpe controlado a media pista",
            durationMinutes: 15,
          },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · juego y vuelta a la calma",
        items: [
          {
            freeText:
              "Mini-juego: el rey de la pista en pista mini, 3 puntos por reto",
            durationMinutes: 8,
          },
          {
            freeText: "Estiramientos guiados con cuento corto",
            durationMinutes: 4,
          },
        ],
      },
    ],
  },

  /* ─── 02 ─────────────────────────────────────────────────── */
  {
    name: "Pelota roja · ritmo y juego",
    duracionMinutes: 60,
    alumnosTipo: "grupal",
    objetivos:
      "1) mantener el peloteo lento sin parar 2) trabajar la posición de raqueta antes del bote 3) pasarlo bien jugando",
    material: "Pelotas rojas, conos, chinos, pista de 18m",
    nivel: "desarrollo",
    aspectoJuego: "tecnica",
    golpes: ["derecha", "revés"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial",
        items: [
          { exerciseName: "Frontón cara a cara con la pared", durationMinutes: 6 },
          { exerciseName: "Splits step y split jump", durationMinutes: 6 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · derecha y revés",
        notes: "Alternar lados sin avisar para que decidan ellos.",
        items: [
          {
            exerciseName: "Pelota roja: golpe controlado a media pista",
            durationMinutes: 15,
          },
          { exerciseName: "Reto: 10 derechas seguidas", durationMinutes: 10 },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · juego competitivo",
        items: [
          { exerciseName: "Mini-tenis con globo final", durationMinutes: 15 },
          {
            freeText: "Estiramientos por parejas, dos minutos",
            durationMinutes: 4,
          },
        ],
      },
    ],
  },

  /* ─── 03 ─────────────────────────────────────────────────── */
  {
    name: "Pelota naranja · construir el punto",
    duracionMinutes: 75,
    alumnosTipo: "grupal",
    objetivos:
      "1) jugar mínimo tres golpes antes de buscar el punto 2) profundidad y control 3) decisiones simples",
    material: "Pelotas naranjas, conos, pista 3/4 (23m)",
    aspectosImportantes:
      "Penalizar la prisa. Recompensar al que encadene golpes profundos.",
    nivel: "consolidacion",
    aspectoJuego: "tactica",
    golpes: ["derecha", "revés"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial",
        items: [
          { exerciseName: "Mini-tenis con bote y golpe", durationMinutes: 8 },
          { exerciseName: "Sprints en estrella", durationMinutes: 8 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · construcción",
        notes: "Bloque clave de la sesión. 35 minutos de trabajo táctico.",
        items: [
          { exerciseName: "Punto a tres golpes obligados", durationMinutes: 18 },
          {
            exerciseName: "Diana puntuable: cuatro zonas",
            durationMinutes: 17,
          },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · juego libre",
        items: [
          {
            exerciseName: "Mini-tenis: el rey de la pista",
            durationMinutes: 18,
          },
          { freeText: "Reflexión: ¿qué patrón te ha funcionado?", durationMinutes: 5 },
        ],
      },
    ],
  },

  /* ─── 04 ─────────────────────────────────────────────────── */
  {
    name: "Pelota verde · técnica de derecha",
    duracionMinutes: 60,
    alumnosTipo: "individual",
    objetivos:
      "1) preparar la raqueta antes del bote para golpear de lado y delante, aprendiendo a colocarse a tiempo mientras juegan y se divierten, evitando pegar de frente 2) terminar el golpe por encima del hombro contrario manteniendo el gesto completo",
    material:
      "Pelotas verdes y rojas, 9 aros, 6 petos (3 petos de diferente color), 4 picas, 1 escalera de coordinación, 5 vallas, 9 conos, 4 chinos, 1 malla y 1 bosu",
    aspectosImportantes:
      "Si el alumno se enfada con un fallo, normalizar y pedir 10 derechas en mini-tenis para reconectar antes de continuar.",
    nivel: "especializacion",
    aspectoJuego: "tecnica",
    golpes: ["derecha", "revés"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial · preparación específica",
        items: [
          { exerciseName: "Movilidad articular y activación", durationMinutes: 5 },
          { exerciseName: "Escalera de coordinación", durationMinutes: 8 },
          { exerciseName: "Mini-tenis con bote y golpe", durationMinutes: 5 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · derecha técnica",
        notes:
          "Trabajar primero por carga (lanzamiento) y luego por progresión a peloteo libre.",
        items: [
          { exerciseName: "Derecha cruzada profunda", durationMinutes: 18 },
          { exerciseName: "Peloteo cruzado a tres cuartos", durationMinutes: 15 },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · aplicación al juego",
        items: [
          { exerciseName: "Diana puntuable: cuatro zonas", durationMinutes: 8 },
          {
            freeText:
              "Cierre · 3 puntos jugados con regla de derecha cruzada obligatoria",
            durationMinutes: 5,
          },
        ],
      },
    ],
  },

  /* ─── 05 ─────────────────────────────────────────────────── */
  {
    name: "Pelota verde · saque y resto",
    duracionMinutes: 75,
    alumnosTipo: "individual",
    objetivos:
      "1) lanzamiento estable del saque 2) pronación final 3) restar profundo y cruzado",
    material: "Pelotas verdes/amarillas, conos, 1 valla baja",
    nivel: "especializacion",
    aspectoJuego: "tecnica",
    golpes: ["saque"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial",
        items: [
          { exerciseName: "Movilidad articular y activación", durationMinutes: 5 },
          {
            freeText: "Lanzamientos del saque sin raqueta · 3 series de 8",
            durationMinutes: 8,
          },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · saque",
        items: [
          { exerciseName: "Saque plano al cuadro de derecha", durationMinutes: 20 },
          {
            freeText:
              "Saques a cuadro de revés con misma técnica · 15 saques por lado",
            durationMinutes: 15,
          },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · juego con saque",
        items: [
          { exerciseName: "Punto corto desde el resto", durationMinutes: 20 },
          {
            freeText: "Vuelta a la calma · 5 saques observando trayectoria",
            durationMinutes: 5,
          },
        ],
      },
    ],
  },

  /* ─── 06 ─────────────────────────────────────────────────── */
  {
    name: "Pelota amarilla · juego completo",
    duracionMinutes: 90,
    alumnosTipo: "individual",
    objetivos:
      "1) construir punto desde fondo 2) defender con globo y atacar con dejada disimulada 3) gestionar la presión",
    material: "Pelotas amarillas, conos, comba",
    nivel: "precompeticion",
    aspectoJuego: "tactica",
    golpes: ["derecha", "revés", "globo", "dejada"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial · activación física",
        items: [
          { exerciseName: "Comba doble salto", durationMinutes: 10 },
          { exerciseName: "Peloteo cruzado a tres cuartos", durationMinutes: 10 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · cambios de ritmo",
        items: [
          { exerciseName: "Globo defensivo profundo", durationMinutes: 12 },
          { exerciseName: "Dejada disimulada con cortado", durationMinutes: 12 },
          {
            exerciseName: "Defensa con globo y contraataque",
            durationMinutes: 18,
          },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · puntos competitivos",
        items: [
          { exerciseName: "Punto de oro con presión", durationMinutes: 20 },
          {
            freeText: "Vuelta a la calma + 3 minutos de reflexión y notas",
            durationMinutes: 8,
          },
        ],
      },
    ],
  },

  /* ─── 07 ─────────────────────────────────────────────────── */
  {
    name: "Competición · scouting y patrones",
    duracionMinutes: 90,
    alumnosTipo: "individual",
    objetivos:
      "1) reconocer patrones del rival 2) ataque sobre segundo saque 3) cierre de punto en red",
    material: "Pelotas amarillas, conos, vídeo opcional",
    aspectosImportantes:
      "Ideal hacerla la víspera de torneo. Si está cansado, sustituir bloque principal por revisión de vídeo.",
    nivel: "competicion",
    aspectoJuego: "tactica",
    golpes: ["saque", "derecha", "volea"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial",
        items: [
          { exerciseName: "Movilidad articular y activación", durationMinutes: 5 },
          { exerciseName: "Splits step y split jump", durationMinutes: 8 },
          { exerciseName: "Peloteo cruzado a tres cuartos", durationMinutes: 10 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · patrones tácticos",
        items: [
          { exerciseName: "Patrón 1+1: derecha cruzada y subida", durationMinutes: 18 },
          { exerciseName: "Ataque de segundo saque", durationMinutes: 18 },
          { exerciseName: "Volea de derecha cerca de la red", durationMinutes: 12 },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · simulación",
        items: [
          {
            freeText: "Set corto a 4 juegos con tie-break a 5",
            durationMinutes: 15,
          },
          {
            freeText: "Vuelta a la calma + tres puntos clave del partido",
            durationMinutes: 4,
          },
        ],
      },
    ],
  },

  /* ─── 08 ─────────────────────────────────────────────────── */
  {
    name: "Adultos iniciación · primer contacto",
    duracionMinutes: 60,
    alumnosTipo: "grupal",
    objetivos:
      "1) coger confianza con la raqueta 2) primer peloteo manual 3) divertirse",
    material: "Pelotas amarillas, raquetas adultos, pista entera",
    aspectosImportantes:
      "Adultos sin experiencia previa. Cuidar el lenguaje y celebrar pequeños logros.",
    nivel: "adultos_iniciacion",
    aspectoJuego: "tecnica",
    golpes: ["derecha"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial",
        items: [
          { exerciseName: "Movilidad articular y activación", durationMinutes: 5 },
          { exerciseName: "Adultos · sensibilidad de bola", durationMinutes: 8 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · primera derecha",
        items: [
          { exerciseName: "Adultos · primera derecha cruzada", durationMinutes: 20 },
          {
            freeText:
              "Mini-tenis 1v1 con bote obligatorio · 4 juegos a 4 puntos",
            durationMinutes: 18,
          },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final",
        items: [
          {
            freeText: "Estiramientos y ronda de feedback en círculo",
            durationMinutes: 9,
          },
        ],
      },
    ],
  },

  /* ─── 09 ─────────────────────────────────────────────────── */
  {
    name: "Adultos medio-alto · ritmo y dirección",
    duracionMinutes: 75,
    alumnosTipo: "grupal",
    objetivos:
      "1) sostener peloteo de calidad 2) variar dirección 3) jugar puntos sin precipitarse",
    material: "Pelotas amarillas, conos",
    nivel: "adultos_medio_alto",
    aspectoJuego: "tactica",
    golpes: ["derecha", "revés"],
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial",
        items: [
          { exerciseName: "Mini-tenis con bote y golpe", durationMinutes: 8 },
          { exerciseName: "Peloteo cruzado a tres cuartos", durationMinutes: 12 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal",
        items: [
          { exerciseName: "Adultos medio-alto · peloteo a 2 toques", durationMinutes: 18 },
          { exerciseName: "Diana puntuable: cuatro zonas", durationMinutes: 18 },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · puntos por rondas",
        items: [
          {
            freeText: "Mini-torneo americano · 3 minutos por pareja",
            durationMinutes: 15,
          },
          {
            freeText: "Vuelta a la calma y comentarios",
            durationMinutes: 4,
          },
        ],
      },
    ],
  },

  /* ─── 10 ─────────────────────────────────────────────────── */
  {
    name: "Físicas en pista · base de pretemporada",
    duracionMinutes: 60,
    alumnosTipo: "grupal",
    objetivos:
      "1) ganar resistencia específica 2) reforzar core 3) prevención de lesiones",
    material: "Conos, líneas de goma, comba, escalera, bosu",
    aspectosImportantes:
      "Sesión sin raqueta. Para grupo de 4-6 alumnos rotando entre estaciones.",
    nivel: "precompeticion",
    aspectoJuego: "fisico",
    blocks: [
      {
        orderIndex: 1,
        title: "Bloque inicial · activación",
        items: [
          { exerciseName: "Movilidad articular y activación", durationMinutes: 6 },
          { exerciseName: "Escalera de coordinación", durationMinutes: 10 },
        ],
      },
      {
        orderIndex: 2,
        title: "Bloque principal · capacidad y fuerza",
        items: [
          { exerciseName: "Sprints en estrella", durationMinutes: 12 },
          { exerciseName: "Circuito de fuerza con líneas de goma", durationMinutes: 18 },
        ],
      },
      {
        orderIndex: 3,
        title: "Bloque final · core y vuelta a la calma",
        items: [
          { exerciseName: "Core anti-rotación con goma", durationMinutes: 10 },
          { freeText: "Estiramientos guiados", durationMinutes: 4 },
        ],
      },
    ],
  },
];

async function seed() {
  const { client, db } = createSeederClient();

  console.log(`Seeding ${seedClasses.length} clases biblioteca…`);

  // 1. Resolver nombres de ejercicio → IDs (un único query)
  const allReferencedNames = Array.from(
    new Set(
      seedClasses.flatMap((c) =>
        c.blocks.flatMap((b) =>
          b.items
            .map((i) => i.exerciseName)
            .filter((n): n is string => typeof n === "string")
        )
      )
    )
  );

  const found =
    allReferencedNames.length > 0
      ? await db
          .select({ id: exercises.id, name: exercises.name })
          .from(exercises)
          .where(inArray(exercises.name, allReferencedNames))
      : [];
  const exerciseByName = new Map(found.map((r) => [r.name, r.id]));

  const missing = allReferencedNames.filter((n) => !exerciseByName.has(n));
  if (missing.length > 0) {
    console.warn(
      `  ⚠ ${missing.length} ejercicios referenciados no existen en BD; quedarán como texto libre:`
    );
    for (const m of missing) console.warn(`     · ${m}`);
  }

  let inserted = 0;
  let skipped = 0;
  for (const cls of seedClasses) {
    const existing = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.name, cls.name))
      .limit(1);
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(classes)
        .values({
          name: cls.name,
          duracionMinutes: cls.duracionMinutes,
          alumnosTipo: cls.alumnosTipo,
          objetivos: cls.objetivos,
          material: cls.material,
          aspectosImportantes: cls.aspectosImportantes ?? null,
          nivel: cls.nivel,
          aspectoJuego: cls.aspectoJuego,
          golpes: cls.golpes ?? null,
          isLibrary: true,
          createdBy: null,
        })
        .returning({ id: classes.id });

      for (const block of cls.blocks) {
        const [createdBlock] = await tx
          .insert(classBlocks)
          .values({
            classId: created.id,
            orderIndex: block.orderIndex,
            title: block.title,
            notes: block.notes ?? null,
          })
          .returning({ id: classBlocks.id });

        if (block.items.length > 0) {
          await tx.insert(classBlockExercises).values(
            block.items.map((item, idx) => {
              const exerciseId = item.exerciseName
                ? (exerciseByName.get(item.exerciseName) ?? null)
                : null;
              return {
                blockId: createdBlock.id,
                exerciseId,
                freeText:
                  exerciseId == null
                    ? (item.freeText ?? item.exerciseName ?? null)
                    : null,
                orderIndex: idx,
                durationMinutes: item.durationMinutes ?? null,
              };
            })
          );
        }
      }
    });

    inserted++;
  }

  console.log(
    `  · Insertadas: ${inserted}\n  · Ya existían: ${skipped}\n  · Total: ${seedClasses.length}`
  );

  await client.end();
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log("✓ Seed classes completado.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("✗ Seed classes falló:", error);
      process.exit(1);
    });
}

export { seed as seedClasses };
