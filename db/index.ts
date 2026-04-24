import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL!;
const isPooler = /:6543(\/|\?|$)/.test(dbUrl) || /pooler\./.test(dbUrl);

const client = postgres(dbUrl, {
  prepare: isPooler ? false : undefined,
  max: isPooler ? 10 : undefined,
  idle_timeout: isPooler ? 20 : undefined,
});

export const db = drizzle(client, { schema });
