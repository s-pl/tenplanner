/**
 * Seeder de ejercicios — biblioteca pública (isGlobal=true).
 *
 * Dataset realista de tenis con taxonomía PMV completa (260506):
 *   - nivel               · 8 niveles por edad
 *   - aspectoJuego        · técnica / táctica / mental / físico
 *   - golpes              · derecha, revés, saque, volea, remate, dejada, globo
 *   - efecto              · plano / cortado / liftado
 *   - parametro           · altura / profundidad / velocidad / dirección
 *   - tipologia           · juego / reto / otros_deportes
 *   - location            · pista_tenis / pared / playa / casa
 *   - materials           · pelota_gomaespuma / roja / naranja / verde / amarilla / conos / chinos / comba / lineas_goma / escalera
 *   - numJugadores        · 1-6
 *   - duracionRango       · 1-5 / 5-10 / 10-15 / 15-20 / +20
 *
 * Uso:  pnpm db:seed:exercises
 */

import { createSeederClient } from "./_db";
import { exercises } from "../schema";
import { eq } from "drizzle-orm";

type ExerciseSeed = typeof exercises.$inferInsert;

const seedExercises: ExerciseSeed[] = [
  /* ─── Calentamiento ────────────────────────────────────────── */
  {
    name: "Mini-tenis con bote y golpe",
    description:
      "Peloteo suave dentro del cuadro de saque, golpeando solo después del bote. Activa el ritmo de bola sin presión y prepara el contacto.",
    objectives:
      "Sensibilidad de bola, posición de raqueta, ritmo respiratorio.",
    category: "warm-up",
    difficulty: "beginner",
    durationMinutes: 8,
    nivel: "descubrimiento",
    aspectoJuego: "tecnica",
    golpes: ["derecha", "revés"],
    location: "pista_tenis",
    materials: ["pelota_gomaespuma", "pelota_roja"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "5-10",
    isGlobal: true,
  },
  {
    name: "Movilidad articular y activación",
    description:
      "Rotaciones de hombros, caderas, tobillos. Skipping bajo, talones al glúteo y desplazamientos laterales suaves.",
    objectives: "Subir temperatura corporal, prevenir lesiones.",
    category: "warm-up",
    difficulty: "beginner",
    durationMinutes: 5,
    nivel: "adultos_iniciacion",
    aspectoJuego: "fisico",
    location: "pista_tenis",
    materials: [],
    numJugadores: 6,
    tipologia: "otros_deportes",
    duracionRango: "1-5",
    isGlobal: true,
  },
  {
    name: "Escalera de coordinación",
    description:
      "Recorrido por la escalera con varios patrones (in-in-out-out, lateral cruzado, salto a una pierna). Foco en pies rápidos y mirada al frente.",
    objectives: "Pies rápidos, coordinación, propiocepción.",
    category: "warm-up",
    difficulty: "intermediate",
    durationMinutes: 8,
    nivel: "consolidacion",
    aspectoJuego: "fisico",
    location: "pista_tenis",
    materials: ["escalera"],
    numJugadores: 4,
    tipologia: "otros_deportes",
    duracionRango: "5-10",
    isGlobal: true,
  },
  {
    name: "Peloteo cruzado a tres cuartos",
    description:
      "Peloteo continuo cruzado por derecha entre las dos líneas de individuales. Sin ganar el punto, mantener la bola en juego.",
    objectives: "Ritmo, contacto limpio, profundidad media.",
    category: "warm-up",
    difficulty: "intermediate",
    durationMinutes: 10,
    nivel: "especializacion",
    aspectoJuego: "tecnica",
    golpes: ["derecha"],
    parametro: "profundidad",
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Frontón cara a cara con la pared",
    description:
      "Tres minutos golpeando contra la pared a media altura, derecha y revés alternando. Gana sensaciones de control y muñeca.",
    objectives: "Repetición masiva, sensación de bola, autonomía.",
    category: "warm-up",
    difficulty: "beginner",
    durationMinutes: 6,
    nivel: "desarrollo",
    aspectoJuego: "tecnica",
    golpes: ["derecha", "revés"],
    location: "pared",
    materials: ["pelota_naranja"],
    numJugadores: 1,
    tipologia: "reto",
    duracionRango: "5-10",
    isGlobal: true,
  },

  /* ─── Técnica ──────────────────────────────────────────────── */
  {
    name: "Derecha cruzada profunda",
    description:
      "Series de 8 derechas cruzadas buscando la línea de fondo opuesta. Salida liftada, finalización por encima del hombro contrario.",
    objectives:
      "1) preparar la raqueta antes del bote 2) terminar el golpe por encima del hombro contrario 3) profundidad consistente",
    category: "technique",
    difficulty: "intermediate",
    durationMinutes: 12,
    nivel: "especializacion",
    aspectoJuego: "tecnica",
    golpes: ["derecha"],
    efecto: ["liftado"],
    parametro: "profundidad",
    location: "pista_tenis",
    materials: ["pelota_verde", "conos"],
    numJugadores: 2,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Revés cortado de seguridad",
    description:
      "Revés cortado a una mano (o cortado a dos manos) buscando salida baja sobre la red. El rival debe atacar desde abajo.",
    objectives: "Control de altura, defensa activa, cambio de ritmo.",
    category: "technique",
    difficulty: "advanced",
    durationMinutes: 12,
    nivel: "competicion",
    aspectoJuego: "tecnica",
    golpes: ["revés"],
    efecto: ["cortado"],
    parametro: "altura",
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Volea de derecha cerca de la red",
    description:
      "Volea por delante del cuerpo con bloqueo. El monitor lanza con la mano desde el otro lado de la red, alumno responde con paso atacante.",
    objectives:
      "Punto de impacto delante, mano firme, paso al ángulo de salida.",
    category: "technique",
    difficulty: "beginner",
    durationMinutes: 10,
    nivel: "consolidacion",
    aspectoJuego: "tecnica",
    golpes: ["volea"],
    efecto: ["plano"],
    location: "pista_tenis",
    materials: ["pelota_naranja"],
    numJugadores: 3,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Saque plano al cuadro de derecha",
    description:
      "Series de 10 saques planos al cuadro de derecha buscando la T. Foco en el lanzamiento delante y la pronación final.",
    objectives:
      "Lanzamiento estable, pronación, diana en T.",
    category: "technique",
    difficulty: "advanced",
    durationMinutes: 15,
    nivel: "competicion",
    aspectoJuego: "tecnica",
    golpes: ["saque"],
    efecto: ["plano"],
    parametro: "direccion",
    location: "pista_tenis",
    materials: ["pelota_amarilla", "conos"],
    numJugadores: 1,
    tipologia: "reto",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Saque liftado segundo servicio",
    description:
      "Trabajar el segundo saque con efecto liftado. Bote alto, profundidad media, raqueta de abajo a arriba.",
    objectives: "Margen de error, kick, salida segura del saque.",
    category: "technique",
    difficulty: "advanced",
    durationMinutes: 15,
    nivel: "precompeticion",
    aspectoJuego: "tecnica",
    golpes: ["saque"],
    efecto: ["liftado"],
    parametro: "altura",
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 1,
    tipologia: "reto",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Remate desde mediocampo",
    description:
      "El monitor lanza globo corto, el alumno remata buscando los conos colocados a 2m de la línea lateral. Cierre del punto.",
    objectives: "Lectura del globo, golpeo encima de la cabeza, cierre.",
    category: "technique",
    difficulty: "advanced",
    durationMinutes: 12,
    nivel: "competicion",
    aspectoJuego: "tecnica",
    golpes: ["remate"],
    efecto: ["plano"],
    location: "pista_tenis",
    materials: ["pelota_amarilla", "conos"],
    numJugadores: 2,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Dejada disimulada con cortado",
    description:
      "Tras un peloteo de fondo, anunciar dejada con la mirada y ejecutarla con cortado bajo y corto. Premio si rebota dos veces antes del cuadro de saque.",
    objectives: "Disimulo, tacto fino, sorpresa.",
    category: "technique",
    difficulty: "advanced",
    durationMinutes: 12,
    nivel: "precompeticion",
    aspectoJuego: "tecnica",
    golpes: ["dejada"],
    efecto: ["cortado"],
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Globo defensivo profundo",
    description:
      "El monitor presiona en red, el alumno responde con globo de fondo buscando la línea. Foco en altura mínima 5 metros.",
    objectives: "Altura, profundidad, paciencia bajo presión.",
    category: "technique",
    difficulty: "intermediate",
    durationMinutes: 10,
    nivel: "especializacion",
    aspectoJuego: "tecnica",
    golpes: ["globo"],
    parametro: "altura",
    location: "pista_tenis",
    materials: ["pelota_verde"],
    numJugadores: 2,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Volea de revés en bandeja",
    description:
      "Voleas de revés sin doble apoyo, intentando bloquear con muñeca firme. Cono a 1m del pasillo como diana.",
    objectives: "Posicionamiento, muñeca firme, ángulo cerrado.",
    category: "technique",
    difficulty: "intermediate",
    durationMinutes: 10,
    nivel: "especializacion",
    aspectoJuego: "tecnica",
    golpes: ["volea", "revés"],
    parametro: "direccion",
    location: "pista_tenis",
    materials: ["pelota_amarilla", "conos"],
    numJugadores: 2,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Pelota roja: golpe controlado a media pista",
    description:
      "Niños 6-8 años. Peloteo lento con pelota roja en mediocampo, foco en la posición de raqueta antes del bote y terminar el gesto.",
    objectives: "Preparación temprana, contacto delante, equilibrio.",
    category: "technique",
    difficulty: "beginner",
    durationMinutes: 10,
    nivel: "desarrollo",
    aspectoJuego: "tecnica",
    golpes: ["derecha", "revés"],
    location: "pista_tenis",
    materials: ["pelota_roja"],
    numJugadores: 4,
    tipologia: "juego",
    duracionRango: "10-15",
    isGlobal: true,
  },

  /* ─── Táctica ──────────────────────────────────────────────── */
  {
    name: "Patrón 1+1: derecha cruzada y subida",
    description:
      "Tras la derecha cruzada profunda, subir a la red para volear. Trabaja el patrón ataque-cierre clásico.",
    objectives: "Encadenar golpes, leer la respuesta corta, cerrar punto.",
    category: "tactics",
    difficulty: "advanced",
    durationMinutes: 15,
    nivel: "competicion",
    aspectoJuego: "tactica",
    golpes: ["derecha", "volea"],
    parametro: "direccion",
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Punto corto desde el resto",
    description:
      "Servidor saca dirigido, restador devuelve y juegan el punto. Restador busca cerrar en máximo 4 golpes.",
    objectives: "Agresividad temprana, ángulos cortos, decisión rápida.",
    category: "tactics",
    difficulty: "advanced",
    durationMinutes: 15,
    nivel: "precompeticion",
    aspectoJuego: "tactica",
    golpes: ["saque", "derecha", "revés"],
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Defender pierna izquierda",
    description:
      "El alumno defiende solo el lado del revés (derecho diestro). Trabajar el revés cortado y el revés liftado en defensa.",
    objectives: "Cobertura del lado débil, decisión cortado/liftado.",
    category: "tactics",
    difficulty: "intermediate",
    durationMinutes: 15,
    nivel: "especializacion",
    aspectoJuego: "tactica",
    golpes: ["revés"],
    parametro: "altura",
    location: "pista_tenis",
    materials: ["pelota_verde"],
    numJugadores: 2,
    tipologia: "reto",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Punto a tres golpes obligados",
    description:
      "Cada jugador debe completar mínimo tres golpes antes de poder ganar el punto. Penaliza la prisa.",
    objectives: "Construcción de punto, paciencia, profundidad.",
    category: "tactics",
    difficulty: "intermediate",
    durationMinutes: 15,
    nivel: "consolidacion",
    aspectoJuego: "tactica",
    golpes: ["derecha", "revés"],
    parametro: "profundidad",
    location: "pista_tenis",
    materials: ["pelota_naranja"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Ataque de segundo saque",
    description:
      "El restador puede entrar dentro de la pista en el segundo saque. Trabajar la presión sobre el saque defensivo.",
    objectives: "Lectura del segundo, posición agresiva, devolución profunda.",
    category: "tactics",
    difficulty: "advanced",
    durationMinutes: 15,
    nivel: "competicion",
    aspectoJuego: "tactica",
    golpes: ["saque", "derecha"],
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Defensa con globo y contraataque",
    description:
      "Tras globo defensivo, leer la respuesta del rival. Si la bola vuelve corta, atacar; si vuelve profunda, repetir globo.",
    objectives: "Lectura, paciencia, transición defensa-ataque.",
    category: "tactics",
    difficulty: "advanced",
    durationMinutes: 15,
    nivel: "precompeticion",
    aspectoJuego: "tactica",
    golpes: ["globo", "derecha"],
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Diana puntuable: cuatro zonas",
    description:
      "Pista dividida en 4 zonas con valor 1-2-3-4. Suma puntos por cada bola colocada en zona alta. A 21.",
    objectives: "Variedad de dirección, control, lectura.",
    category: "tactics",
    difficulty: "intermediate",
    durationMinutes: 18,
    nivel: "especializacion",
    aspectoJuego: "tactica",
    golpes: ["derecha", "revés"],
    parametro: "direccion",
    location: "pista_tenis",
    materials: ["pelota_verde", "conos"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },

  /* ─── Físico ───────────────────────────────────────────────── */
  {
    name: "Sprints en estrella",
    description:
      "Desde el centro de la pista, salir corriendo a cada esquina y volver. Cinco repeticiones a máxima intensidad.",
    objectives: "Velocidad, cambio de dirección, capacidad anaeróbica.",
    category: "fitness",
    difficulty: "intermediate",
    durationMinutes: 10,
    nivel: "consolidacion",
    aspectoJuego: "fisico",
    location: "pista_tenis",
    materials: ["conos"],
    numJugadores: 4,
    tipologia: "otros_deportes",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Comba doble salto",
    description:
      "Tres rondas de 1 minuto saltando comba con descansos de 30s. Útil para coordinación y resistencia.",
    objectives: "Coordinación, resistencia, salto reactivo.",
    category: "fitness",
    difficulty: "intermediate",
    durationMinutes: 10,
    nivel: "especializacion",
    aspectoJuego: "fisico",
    location: "pista_tenis",
    materials: ["comba"],
    numJugadores: 6,
    tipologia: "otros_deportes",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Circuito de fuerza con líneas de goma",
    description:
      "Cinco estaciones: sentadilla con goma, remo, press de hombro, abducción de cadera, plancha. 30s por estación.",
    objectives: "Fuerza general, estabilidad, prevención.",
    category: "fitness",
    difficulty: "intermediate",
    durationMinutes: 18,
    nivel: "precompeticion",
    aspectoJuego: "fisico",
    location: "pista_tenis",
    materials: ["lineas_goma"],
    numJugadores: 4,
    tipologia: "otros_deportes",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Splits step y split jump",
    description:
      "Reaccionar al gesto del monitor. Trabajar el split step antes del golpe y el aterrizaje en posición.",
    objectives: "Reactividad, equilibrio dinámico.",
    category: "fitness",
    difficulty: "beginner",
    durationMinutes: 8,
    nivel: "consolidacion",
    aspectoJuego: "fisico",
    location: "pista_tenis",
    materials: [],
    numJugadores: 4,
    tipologia: "otros_deportes",
    duracionRango: "5-10",
    isGlobal: true,
  },
  {
    name: "Core anti-rotación con goma",
    description:
      "De pie con goma sujeta lateralmente, brazos extendidos al frente, mantener postura sin que el cuerpo gire. 3x30s por lado.",
    objectives: "Estabilidad de tronco, transferencia al golpe.",
    category: "fitness",
    difficulty: "intermediate",
    durationMinutes: 10,
    nivel: "precompeticion",
    aspectoJuego: "fisico",
    location: "casa",
    materials: ["lineas_goma"],
    numJugadores: 1,
    tipologia: "otros_deportes",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Resistencia: peloteo continuo 5 min",
    description:
      "Peloteo cruzado sin parar durante 5 minutos. Alternar derecha y revés sin perder ritmo.",
    objectives: "Resistencia aeróbica específica, foco mental.",
    category: "fitness",
    difficulty: "advanced",
    durationMinutes: 15,
    nivel: "competicion",
    aspectoJuego: "fisico",
    golpes: ["derecha", "revés"],
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },

  /* ─── Adultos · iniciación ─────────────────────────────────── */
  {
    name: "Adultos · sensibilidad de bola",
    description:
      "Botar la bola con la raqueta arriba y abajo alternando, caminando por la pista. Buscar 30 botes consecutivos.",
    objectives: "Sensibilidad, control, paciencia.",
    category: "warm-up",
    difficulty: "beginner",
    durationMinutes: 5,
    nivel: "adultos_iniciacion",
    aspectoJuego: "tecnica",
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 1,
    tipologia: "reto",
    duracionRango: "1-5",
    isGlobal: true,
  },
  {
    name: "Adultos · primera derecha cruzada",
    description:
      "Lanzamiento manual del monitor desde el otro lado. Alumno pega derecha cruzada con foco en pasos y contacto delante.",
    objectives: "Pasos, contacto delante, terminar el golpe.",
    category: "technique",
    difficulty: "beginner",
    durationMinutes: 12,
    nivel: "adultos_iniciacion",
    aspectoJuego: "tecnica",
    golpes: ["derecha"],
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 4,
    tipologia: "reto",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Adultos medio-alto · peloteo a 2 toques",
    description:
      "Peloteo en grupo de 4 donde cada uno solo puede dar dos toques a la bola. Trabajar control y comunicación.",
    objectives: "Control, lectura, comunicación.",
    category: "tactics",
    difficulty: "intermediate",
    durationMinutes: 15,
    nivel: "adultos_medio_alto",
    aspectoJuego: "tactica",
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 4,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },

  /* ─── Niños / mini-tenis ───────────────────────────────────── */
  {
    name: "Mini-tenis con globo final",
    description:
      "Peloteo en pista reducida con pelota roja, gana quien acierte un globo a la zona pintada al final del punto.",
    objectives: "Diversión, lectura del globo, defensa.",
    category: "tactics",
    difficulty: "beginner",
    durationMinutes: 10,
    nivel: "desarrollo",
    aspectoJuego: "tactica",
    golpes: ["globo"],
    location: "pista_tenis",
    materials: ["pelota_roja", "chinos"],
    numJugadores: 4,
    tipologia: "juego",
    duracionRango: "10-15",
    isGlobal: true,
  },
  {
    name: "Mini-tenis: el rey de la pista",
    description:
      "Cuatro alumnos rotando. Quien gana el punto se queda; quien pierde sale. Pelota naranja, pista de 18m.",
    objectives: "Competitividad sana, motivación, repetición.",
    category: "tactics",
    difficulty: "beginner",
    durationMinutes: 15,
    nivel: "consolidacion",
    aspectoJuego: "mental",
    location: "pista_tenis",
    materials: ["pelota_naranja"],
    numJugadores: 4,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Reto: 10 derechas seguidas",
    description:
      "El alumno debe mantener 10 derechas seguidas con el monitor sin perder la bola. Si falla, vuelve a empezar.",
    objectives: "Constancia, foco, control de respiración.",
    category: "technique",
    difficulty: "beginner",
    durationMinutes: 8,
    nivel: "consolidacion",
    aspectoJuego: "mental",
    golpes: ["derecha"],
    location: "pista_tenis",
    materials: ["pelota_naranja"],
    numJugadores: 1,
    tipologia: "reto",
    duracionRango: "5-10",
    isGlobal: true,
  },

  /* ─── Mental / decisión ────────────────────────────────────── */
  {
    name: "Punto de oro con presión",
    description:
      "Jugar puntos con marcador alterno y deuce ocasional. Foco en respiración entre puntos y rutina previa al saque.",
    objectives: "Gestión de presión, rutinas, foco.",
    category: "tactics",
    difficulty: "advanced",
    durationMinutes: 15,
    nivel: "competicion",
    aspectoJuego: "mental",
    golpes: ["saque"],
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 2,
    tipologia: "juego",
    duracionRango: "15-20",
    isGlobal: true,
  },
  {
    name: "Visualización del primer saque",
    description:
      "Antes de cada saque, cerrar los ojos 3 segundos y visualizar la trayectoria. Luego ejecutar.",
    objectives: "Foco mental, rutinas, autoconfianza.",
    category: "warm-up",
    difficulty: "advanced",
    durationMinutes: 5,
    nivel: "competicion",
    aspectoJuego: "mental",
    golpes: ["saque"],
    location: "pista_tenis",
    materials: ["pelota_amarilla"],
    numJugadores: 1,
    tipologia: "reto",
    duracionRango: "1-5",
    isGlobal: true,
  },
];

async function seed() {
  const { client, db } = createSeederClient();

  console.log(`Seeding ${seedExercises.length} ejercicios (biblioteca pública)…`);

  // Insertar evitando duplicados por nombre exacto entre los globales.
  let inserted = 0;
  let skipped = 0;
  for (const ex of seedExercises) {
    const existing = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(eq(exercises.name, ex.name))
      .limit(1);
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(exercises).values(ex);
    inserted++;
  }

  console.log(
    `  · Insertados: ${inserted}\n  · Ya existían: ${skipped}\n  · Total: ${seedExercises.length}`
  );

  await client.end();
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log("✓ Seed exercises completado.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("✗ Seed exercises falló:", error);
      process.exit(1);
    });
}

export { seed as seedExercises };
