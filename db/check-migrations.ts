import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
  const client = postgres(url, { max: 1 });

  const applied = await client`SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`;
  console.log(`Total applied: ${applied.length}`);
  applied.forEach((r, i) => console.log(`  ${i}: ${r.hash?.slice(0, 24)}`));

  await client.end();
}
main().catch(console.error);
