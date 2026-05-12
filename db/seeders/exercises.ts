/**
 * Seeder de ejercicios.
 *
 * La biblioteca se deja vacía para arrancar de cero. Este seeder se mantiene
 * como no-op para que `pnpm db:seed` siga siendo idempotente y no repueble el
 * dataset anterior.
 */

async function seed() {
  console.log("Seeder de ejercicios desactivado: biblioteca vacía.");
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
