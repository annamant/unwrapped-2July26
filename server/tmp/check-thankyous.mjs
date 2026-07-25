import pg from "pg";
const url = "postgresql://postgres:fwQDlDbwFPoRlmjyGGWnAXzhXvUMLmhO@hayabusa.proxy.rlwy.net:13357/railway";
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const r = await client.query(`
  SELECT b.name, b.contact_email, b.thank_you_sent_at, u.password_hash IS NOT NULL AS claimed
  FROM businesses b
  JOIN users u ON b.owner_id = u.id
  WHERE b.status = 'active'
    AND u.password_hash IS NOT NULL
    AND lower(b.contact_email) <> 'unclaimed-directory@shopunwrapped.com'
  ORDER BY b.thank_you_sent_at DESC NULLS LAST, b.name
`);
console.log(`Claimed businesses: ${r.rows.length}`);
let thanked = 0;
for (const row of r.rows) {
  if (row.thank_you_sent_at) thanked++;
  console.log(`  ${row.thank_you_sent_at ? "✓" : "✗"} ${row.name} | ${row.contact_email} | thanked: ${row.thank_you_sent_at ?? "—"}`);
}
console.log(`\nThanked: ${thanked}/${r.rows.length}`);

await client.end();
