import pg from "pg";
const url = "postgresql://postgres:fwQDlDbwFPoRlmjyGGWnAXzhXvUMLmhO@hayabusa.proxy.rlwy.net:13357/railway";
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

// Idempotent: only add if missing
const check = await client.query(`
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'businesses' AND column_name = 'thank_you_sent_at'
`);
if (check.rows.length) {
  console.log("Column already exists — nothing to do.");
  await client.end();
  process.exit(0);
}

await client.query(`ALTER TABLE businesses ADD COLUMN thank_you_sent_at timestamp`);
const verify = await client.query(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'businesses' AND column_name = 'thank_you_sent_at'
`);
console.log("Added column:", verify.rows[0]);
await client.end();
