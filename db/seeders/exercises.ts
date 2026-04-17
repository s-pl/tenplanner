import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { exercises } from "../schema";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  const seedExercises: (typeof exercises.$inferInsert)[] = [
    // Warm-up (5)
    {
      name: "Movilidad articular general",
      description:
        "Rotaciones de tobillos, rodillas, caderas, hombros y muñecas. Preparación general del cuerpo.",
      category: "warm-up",
      difficulty: "beginner",
      durationMinutes: 5,
    },
    {
      name: "Trote suave con pala",
      description:
        "Trote alrededor de la pista sosteniendo la pala, alternando golpes al aire.",
      category: "warm-up",
      difficulty: "beginner",
      durationMinutes: 5,
    },
    {
      name: "Juego de pies en escalera",
      description:
        "Ejercicio de coordinación con escalera de agilidad. Pies rápidos hacia adelante, lateral y cruzados.",
      category: "warm-up",
      difficulty: "intermediate",
      durationMinutes: 8,
    },
    {
      name: "Mini-partidos a media pista",
      description:
        "Peloteo suave en media pista para activar reflejos y entrada en calor con bola.",
      category: "warm-up",
      difficulty: "beginner",
      durationMinutes: 10,
    },
    {
      name: "Estiramientos dinámicos",
      description:
        "Zancadas con rotación, balanceos de pierna, aperturas de cadera. Preparar músculos para el esfuerzo.",
      category: "warm-up",
      difficulty: "beginner",
      durationMinutes: 7,
    },

    // Technique (5)
    {
      name: "Bandeja desde fondo",
      description:
        "Práctica de golpe de bandeja desde el fondo de pista. Foco en posición de perfilado y punto de impacto.",
      category: "technique",
      difficulty: "intermediate",
      durationMinutes: 15,
    },
    {
      name: "Volea de derecha y revés",
      description:
        "Series alternas de volea de derecha y revés desde la red. Énfasis en muñeca firme y colocación.",
      category: "technique",
      difficulty: "beginner",
      durationMinutes: 12,
    },
    {
      name: "Víbora",
      description:
        "Golpe de víbora con efecto cortado. Trabajar la pronación de muñeca y la salida de bola baja.",
      category: "technique",
      difficulty: "advanced",
      durationMinutes: 15,
    },
    {
      name: "Globo defensivo",
      description:
        "Práctica del globo alto y profundo desde posiciones defensivas. Control de altura y profundidad.",
      category: "technique",
      difficulty: "beginner",
      durationMinutes: 10,
    },
    {
      name: "Remate por 3 / por 4",
      description:
        "Remates potentes buscando la salida por la pared lateral (por 3) o por el fondo (por 4).",
      category: "technique",
      difficulty: "advanced",
      durationMinutes: 15,
    },

    // Tactics (5)
    {
      name: "Juego de posiciones 2v2",
      description:
        "Situación real de juego enfocada en la ocupación correcta del espacio en pareja. Rotaciones y coberturas.",
      category: "tactics",
      difficulty: "intermediate",
      durationMinutes: 20,
    },
    {
      name: "Subida a red tras servicio",
      description:
        "Practicar la transición del fondo a la red después del saque. Lectura de respuesta del rival.",
      category: "tactics",
      difficulty: "intermediate",
      durationMinutes: 15,
    },
    {
      name: "Puntos con saque dirigido",
      description:
        "Jugar puntos donde el saque va siempre al mismo lado para trabajar patrones tácticos específicos.",
      category: "tactics",
      difficulty: "advanced",
      durationMinutes: 15,
    },
    {
      name: "Defensa de globo en pareja",
      description:
        "Situación donde una pareja defiende globos continuos. Trabajar comunicación y cambios de lado.",
      category: "tactics",
      difficulty: "intermediate",
      durationMinutes: 15,
    },
    {
      name: "Contraataque desde fondo",
      description:
        "Transición de defensa a ataque. Leer la bola corta del rival y decidir entre globo, chiquita o passing.",
      category: "tactics",
      difficulty: "advanced",
      durationMinutes: 20,
    },

    // Fitness (5)
    {
      name: "Sprints laterales",
      description:
        "Series de desplazamientos laterales rápidos de pared a pared. 6 repeticiones con 30s de descanso.",
      category: "fitness",
      difficulty: "intermediate",
      durationMinutes: 10,
    },
    {
      name: "Circuito de fuerza con pala",
      description:
        "Sentadillas, lunges, planchas y press de hombro con la pala como peso. 3 rondas.",
      category: "fitness",
      difficulty: "intermediate",
      durationMinutes: 15,
    },
    {
      name: "Resistencia aeróbica en pista",
      description:
        "Peloteo continuo sin parar durante periodos de 3 minutos. Foco en mantener intensidad constante.",
      category: "fitness",
      difficulty: "advanced",
      durationMinutes: 20,
    },
    {
      name: "Agilidad con conos",
      description:
        "Circuito de conos en pista simulando movimientos de partido: split step, carrera lateral, retroceso.",
      category: "fitness",
      difficulty: "beginner",
      durationMinutes: 10,
    },
    {
      name: "Core y estabilidad",
      description:
        "Planchas frontales y laterales, russian twists y bird-dogs. Foco en estabilidad del tronco para los golpes.",
      category: "fitness",
      difficulty: "beginner",
      durationMinutes: 12,
    },
  ];

  console.log("Seeding exercises...");
  await db.insert(exercises).values(seedExercises);
  console.log(`Seeded ${seedExercises.length} exercises.`);

  await client.end();
}

seed()
  .then(() => {
    console.log("Seed completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
