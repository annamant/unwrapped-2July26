/**
 * Non-interactive additive migrations for Railway predeploy.
 * drizzle-kit push is skipped because it can prompt (e.g. type changes) and
 * abort the deploy — see railway.json history.
 *
 * Applies server/migrations/*.sql once each, tracked in schema_migrations.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "migrations");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[migrate] DATABASE_URL is required");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const id = file;
    const { rows } = await client.query(
      `SELECT 1 FROM schema_migrations WHERE id = $1`,
      [id],
    );
    if (rows.length) {
      console.log(`[migrate] skip ${id} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`[migrate] apply ${id}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [id]);
      await client.query("COMMIT");
      console.log(`[migrate] ok ${id}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  console.log("[migrate] done");
} finally {
  await client.end();
}
