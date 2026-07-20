import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, "unwrapped_import_streatham_westnorwood.csv");
const UNCLAIMED_EMAIL = "unclaimed-directory@shopunwrapped.com";

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? "").trim(); });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) + "-" + Math.random().toString(36).slice(2, 6);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
console.log(`Parsed ${rows.length} rows`);

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const client = await pool.connect();
try {
  await client.query("BEGIN");

  let ownerRes = await client.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [UNCLAIMED_EMAIL],
  );
  let ownerId = ownerRes.rows[0]?.id;
  if (!ownerId) {
    ownerRes = await client.query(
      `INSERT INTO users (email, name, role, onboarding_complete)
       VALUES ($1, $2, 'consumer', true)
       RETURNING id`,
      [UNCLAIMED_EMAIL, "Unclaimed Directory"],
    );
    ownerId = ownerRes.rows[0].id;
    console.log("Created unclaimed owner", ownerId);
  } else {
    console.log("Using unclaimed owner", ownerId);
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    const category = row.category?.trim();
    const city = row.city?.trim();
    if (!name || !category || !city) {
      skipped++;
      continue;
    }

    const postcode = row.postcode?.trim() || null;
    const dup = await client.query(
      `SELECT id FROM businesses
       WHERE lower(name) = lower($1)
         AND lower(coalesce(postcode, '')) = lower(coalesce($2, ''))
       LIMIT 1`,
      [name, postcode],
    );
    if (dup.rows.length) {
      skipped++;
      continue;
    }

    const slug = slugify(name);
    await client.query(
      `INSERT INTO businesses (
         owner_id, slug, name, description, category, contact_email,
         website, city, address, postcode, status, approved_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, 'active', NOW()
       )`,
      [
        ownerId,
        slug,
        name,
        row.description || null,
        category,
        UNCLAIMED_EMAIL,
        row.website || null,
        city,
        row.address || null,
        postcode,
      ],
    );
    created++;
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ created, skipped, total: rows.length }));
} catch (err) {
  await client.query("ROLLBACK");
  console.error(err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
