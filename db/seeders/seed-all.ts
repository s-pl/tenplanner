/**
 * Orquestador: corre todos los seeders en orden seguro.
 *
 *   1. exercises (biblioteca pública)
 *   2. classes   (necesita ejercicios)
 *   3. coach-fixtures (necesita ejercicios + opcional COACH_USER_ID)
 *
 * Uso:  pnpm db:seed
 *       COACH_USER_ID=<uuid> pnpm db:seed
 */

import { seedExercises } from "./exercises";
import { seedClasses } from "./classes";
import { seedCoachFixtures } from "./coach-fixtures";

async function main() {
  console.log("════════════════════════════════════════════");
  console.log("  Ten Planner · seed-all");
  console.log("════════════════════════════════════════════");

  console.log("\n[1/3] Ejercicios biblioteca");
  await seedExercises();

  console.log("\n[2/3] Clases biblioteca");
  await seedClasses();

  console.log("\n[3/3] Fixtures de coach (lugares, alumnos, grupos, sesiones)");
  try {
    await seedCoachFixtures();
  } catch (err) {
    console.warn(
      "\n⚠ No se pudieron seedear fixtures de coach. Continuando.",
      err instanceof Error ? err.message : err
    );
  }

  console.log("\n════════════════════════════════════════════");
  console.log("  ✓ seed-all completado");
  console.log("════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n✗ seed-all falló:", error);
    process.exit(1);
  });
