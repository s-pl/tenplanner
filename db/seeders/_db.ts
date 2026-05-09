import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Conexión compartida para todos los seeders.
 * Usa DIRECT_URL si existe (puerto 5432, evita el pooler que puede romper transacciones).
 */
export function createSeederClient() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DIRECT_URL o DATABASE_URL en .env para correr el seeder."
    );
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  return { client, db };
}
