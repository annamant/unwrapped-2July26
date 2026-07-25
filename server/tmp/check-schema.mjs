import pg from "pg";
const url = "postgresql://postgres:fwQDlDbwFPoRlmjyGGWnAXzhXvUMLmhO@hayabusa.proxy.rlwy.net:13357/railway";
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
const r = await client.query(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'businesses' AND column_name = 'thank_you_sent_at'
`);
console.log("thank_you_sent_at column:", r.rows.length ? r.rows[0] : "NOT FOUND");
await client.end();
