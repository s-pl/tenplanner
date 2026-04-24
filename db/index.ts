import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Detect Supabase connection pooler (port 6543 or pooler hostname) — requires
// disabling prepared statements for compatibility.
const dbUrl = process.env.DATABASE_URL!;
const isPooler = /:6543(\/|\?|$)/.test(dbUrl) || /pooler\./.test(dbUrl);

const client = postgres(dbUrl, {
  prepare: isPooler ? false : undefined,
  max: isPooler ? 1 : undefined,
});

export const db = drizzle(client, { schema });
