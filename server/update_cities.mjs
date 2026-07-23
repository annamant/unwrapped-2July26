/**
 * Fix businesses.city so it matches the real London area for each postcode.
 * Safe: only updates the `city` column. Does not send emails.
 * Uses one bulk UPDATE for speed.
 */
import pg from "pg";

const AREA_BY_OUTCODE = {
  SW16: "Streatham",
  SE27: "West Norwood",
  SW2: "Brixton",
  SW9: "Stockwell / Brixton",
  SW11: "Battersea",
  SW4: "Clapham",
  SW5: "Earl's Court",
  SW6: "Fulham",
  SW12: "Balham",
  SW15: "Putney",
  SW8: "Vauxhall",
  SW7: "South Kensington",
  SW3: "Chelsea",
  SW18: "Wandsworth",
  SW10: "Chelsea",
  SW17: "Tooting",
  SW13: "Barnes",
  SW14: "Mortlake / East Sheen",
  SW19: "Wimbledon",
  SW20: "Raynes Park",
  SW1A: "Westminster",
  SW1E: "Victoria",
  SW1H: "Westminster",
  SW1P: "Westminster",
  SW1V: "Pimlico",
  SW1W: "Belgravia",
  SW1X: "Belgravia",
  SW1Y: "St James's",
  SE1: "Southwark / Waterloo",
  SE5: "Camberwell",
  SE7: "Charlton",
  SE8: "Deptford",
  SE9: "Eltham",
  SE10: "Greenwich",
  SE11: "Kennington",
  SE14: "New Cross",
  SE15: "Peckham",
  SE16: "Bermondsey / Rotherhithe",
  SE17: "Walworth",
  SE19: "Crystal Palace",
  SE20: "Anerley",
  SE21: "Dulwich",
  SE22: "East Dulwich",
  SE23: "Forest Hill",
  SE24: "Herne Hill",
  SE25: "South Norwood",
  SE26: "Sydenham",
  CR0: "Croydon",
  CR4: "Mitcham",
  CR7: "Thornton Heath",
  BR3: "Beckenham",
  EN2: "Enfield",
  UB5: "Northolt",
  W1: "West End",
  W1A: "West End",
  W1B: "Soho",
  W1C: "Oxford Street",
  W1D: "Soho",
  W1F: "Soho",
  W1G: "Marylebone",
  W1H: "Marylebone",
  W1J: "Mayfair",
  W1K: "Mayfair",
  W1S: "Mayfair",
  W1T: "Fitzrovia",
  W1U: "Marylebone",
  W1W: "Fitzrovia",
  W2: "Paddington",
  W3: "Acton",
  W4: "Chiswick",
  W5: "Ealing",
  W6: "Hammersmith",
  W7: "Hanwell",
  W8: "Kensington",
  W9: "Maida Vale",
  W10: "North Kensington",
  W11: "Notting Hill",
  W12: "Shepherd's Bush",
  W14: "West Kensington",
  WC1A: "Bloomsbury",
  WC1B: "Bloomsbury",
  WC1E: "Bloomsbury",
  WC1H: "Bloomsbury",
  WC1N: "Bloomsbury",
  WC1R: "Holborn",
  WC1V: "Holborn",
  WC1X: "Clerkenwell",
  WC2A: "Holborn",
  WC2B: "Covent Garden",
  WC2E: "Covent Garden",
  WC2H: "Covent Garden",
  WC2N: "Covent Garden",
  WC2R: "Covent Garden",
  EC1A: "City of London",
  EC1M: "Clerkenwell",
  EC1N: "Hatton Garden",
  EC1R: "Clerkenwell",
  EC1V: "Clerkenwell",
  EC1Y: "Barbican",
  EC2A: "Shoreditch",
  EC2M: "City of London",
  EC2N: "City of London",
  EC2R: "City of London",
  EC2V: "City of London",
  EC2Y: "Barbican",
  EC3A: "City of London",
  EC3M: "City of London",
  EC3N: "City of London",
  EC3R: "City of London",
  EC3V: "City of London",
  EC4A: "City of London",
  EC4M: "City of London",
  EC4N: "City of London",
  EC4R: "City of London",
  EC4V: "City of London",
  EC4Y: "City of London",
  NW1: "Camden",
  NW2: "Cricklewood",
  NW3: "Hampstead",
  NW4: "Hendon",
  NW5: "Kentish Town",
  NW6: "Kilburn",
  NW8: "St John's Wood",
  NW10: "Willesden",
  NW11: "Golders Green",
  N1: "Islington",
  N1C: "King's Cross",
  N4: "Finsbury Park",
  N5: "Highbury",
  N6: "Highgate",
  N7: "Holloway",
  N8: "Hornsey",
  N10: "Muswell Hill",
  N11: "Friern Barnet",
  N12: "North Finchley",
  N16: "Stoke Newington",
  N19: "Archway / Highgate",
  N22: "Wood Green",
  E1: "Whitechapel / Aldgate",
  E2: "Bethnal Green",
  E3: "Bow",
  E8: "Hackney",
  E9: "Homerton",
  E14: "Canary Wharf",
  E15: "Stratford",
  E20: "Stratford",
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

const entries = Object.entries(AREA_BY_OUTCODE);
const valuesSql = entries
  .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
  .join(", ");
const params = entries.flatMap(([outcode, area]) => [outcode, area]);

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const client = await pool.connect();
try {
  // Extract outcode: first token before space, uppercased
  const sql = `
    WITH map(outcode, area) AS (
      VALUES ${valuesSql}
    ),
    targets AS (
      SELECT b.id, b.name, b.city AS old_city, b.postcode, m.area AS new_city
      FROM businesses b
      JOIN map m ON upper(split_part(b.postcode, ' ', 1)) = m.outcode
      WHERE b.status = 'active'
        AND b.postcode IS NOT NULL
        AND b.postcode <> ''
        AND b.city IS DISTINCT FROM m.area
    )
    ${
      dryRun
        ? `SELECT * FROM targets ORDER BY name LIMIT 30`
        : `UPDATE businesses b
           SET city = t.new_city
           FROM targets t
           WHERE b.id = t.id
           RETURNING b.id, b.name, t.old_city, b.city AS new_city, b.postcode`
    }
  `;

  const before = await client.query(`
    SELECT city, count(*)::int AS n
    FROM businesses WHERE status = 'active'
    GROUP BY city ORDER BY n DESC LIMIT 5
  `);

  if (!dryRun) await client.query("BEGIN");
  const result = await client.query(sql, params);
  if (!dryRun) await client.query("COMMIT");

  const after = await client.query(`
    SELECT city, count(*)::int AS n
    FROM businesses WHERE status = 'active'
    GROUP BY city ORDER BY n DESC LIMIT 20
  `);

  const mismatches = await client.query(`
    SELECT name, city, postcode FROM businesses
    WHERE status = 'active'
      AND (
        (city = 'Streatham' AND postcode NOT ILIKE 'SW16%')
        OR (city = 'West Norwood' AND postcode NOT ILIKE 'SE27%')
      )
    LIMIT 20
  `);

  const unmapped = await client.query(`
    SELECT name, city, postcode, upper(split_part(postcode, ' ', 1)) AS outcode
    FROM businesses
    WHERE status = 'active'
      AND postcode IS NOT NULL AND postcode <> ''
      AND upper(split_part(postcode, ' ', 1)) NOT IN (${entries.map((_, i) => `$${i + 1}`).join(",")})
    ORDER BY outcode, name
    LIMIT 30
  `, entries.map(([o]) => o));

  console.log(JSON.stringify({
    dryRun,
    changedRows: result.rowCount,
    sample: result.rows.slice(0, 15),
    beforeTopCities: before.rows,
    afterTopCities: after.rows,
    streathamWnMismatchesLeft: mismatches.rows,
    unmappedSample: unmapped.rows,
  }, null, 2));
} catch (err) {
  if (!dryRun) await client.query("ROLLBACK");
  console.error(err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
