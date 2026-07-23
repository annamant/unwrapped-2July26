import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, "../../business_emails_mapped.csv");

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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL missing. Please run this script with DATABASE_URL set.");
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
console.log(`Parsed ${rows.length} rows from CSV`);

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const client = await pool.connect();
try {
  await client.query("BEGIN");

  let updated = 0;
  let notFound = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    const city = row.city?.trim();
    const postcode = row.postcode?.trim() || null;
    
    if (!name || !city) continue;

    // Update the city where name and postcode match
    const res = await client.query(
      `UPDATE businesses 
       SET city = $1 
       WHERE lower(name) = lower($2) 
         AND lower(coalesce(postcode, '')) = lower(coalesce($3, ''))
       RETURNING id`,
      [city, name, postcode]
    );

    if (res.rowCount > 0) {
      updated += res.rowCount;
    } else {
      notFound++;
    }
  }

  await client.query("COMMIT");
  console.log(`Successfully updated cities for ${updated} businesses. (${notFound} not found in DB)`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("Error updating database:", err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
