/** London borough SEO registry — all 32 boroughs + City of London. */

export type LondonRegion = "south" | "central" | "north" | "east" | "west";

export type LondonBorough = {
  slug: string;
  name: string;
  region: LondonRegion;
  /** Primary postcode districts (outcodes) used to match shops. */
  outcodes: string[];
  /** Neighbourhood names for copy + city-field matching. */
  neighbourhoods: string[];
  blurb: string;
};

export const LONDON_BOROUGHS: LondonBorough[] = [
  // ── South London (launch focus) ──────────────────────────────────────────
  {
    slug: "lambeth",
    name: "Lambeth",
    region: "south",
    outcodes: ["SE1", "SE5", "SE11", "SE19", "SE21", "SE24", "SE27", "SW2", "SW4", "SW8", "SW9", "SW12", "SW16"],
    neighbourhoods: [
      "Brixton",
      "Clapham",
      "Streatham",
      "Herne Hill",
      "Stockwell",
      "Vauxhall",
      "Kennington",
      "Oval",
      "West Norwood",
      "Tulse Hill",
      "Crystal Palace",
      "Dulwich",
      "Balham",
      "Camberwell",
      "Waterloo",
    ],
    blurb: "Brixton, Clapham, Streatham, Herne Hill and more — look into Lambeth high streets, claim drops, collect in person.",
  },
  {
    slug: "wandsworth",
    name: "Wandsworth",
    region: "south",
    outcodes: ["SW11", "SW12", "SW15", "SW17", "SW18", "SW19"],
    neighbourhoods: ["Battersea", "Balham", "Putney", "Tooting", "Wandsworth", "Earlsfield", "Southfields", "Clapham Junction"],
    blurb: "Battersea, Balham, Putney, Tooting — see what's ready on Wandsworth high streets and collect at the counter.",
  },
  {
    slug: "southwark",
    name: "Southwark",
    region: "south",
    outcodes: ["SE1", "SE5", "SE15", "SE16", "SE17", "SE21", "SE22"],
    neighbourhoods: ["Borough", "Bermondsey", "Peckham", "Camberwell", "Walworth", "Rotherhithe", "Dulwich", "East Dulwich", "London Bridge"],
    blurb: "Peckham, Bermondsey, Borough and East Dulwich — Unwrapped for Southwark shops you can see before you go.",
  },
  {
    slug: "lewisham",
    name: "Lewisham",
    region: "south",
    outcodes: ["SE3", "SE4", "SE6", "SE8", "SE12", "SE13", "SE14", "SE23", "SE26"],
    neighbourhoods: ["Lewisham", "Deptford", "New Cross", "Catford", "Forest Hill", "Sydenham", "Blackheath", "Ladywell", "Hither Green"],
    blurb: "Deptford, Forest Hill, Catford and New Cross — local drops from Lewisham high streets.",
  },
  {
    slug: "greenwich",
    name: "Greenwich",
    region: "south",
    outcodes: ["SE3", "SE7", "SE9", "SE10", "SE18", "SE28"],
    neighbourhoods: ["Greenwich", "Woolwich", "Charlton", "Eltham", "Blackheath", "Plumstead", "Thamesmead"],
    blurb: "Greenwich, Woolwich, Blackheath — claim what's live and collect on the south-east high street.",
  },
  {
    slug: "croydon",
    name: "Croydon",
    region: "south",
    outcodes: ["CR0", "CR2", "CR7", "SE19", "SE25"],
    neighbourhoods: ["Croydon", "South Norwood", "Thornton Heath", "Crystal Palace", "Purley", "Addiscombe"],
    blurb: "Croydon and South Norwood high streets — see the real thing, claim in the app, collect in person.",
  },
  {
    slug: "bromley",
    name: "Bromley",
    region: "south",
    outcodes: ["BR1", "BR2", "BR3", "BR4", "BR5", "BR6", "BR7", "SE19", "SE20"],
    neighbourhoods: ["Bromley", "Beckenham", "Orpington", "Penge", "Anerley", "Crystal Palace", "Chislehurst"],
    blurb: "Bromley, Beckenham and Penge — Unwrapped for south-east London shops you can actually see.",
  },
  {
    slug: "merton",
    name: "Merton",
    region: "south",
    outcodes: ["SW19", "SW20", "CR4"],
    neighbourhoods: ["Wimbledon", "Mitcham", "Morden", "Raynes Park", "Colliers Wood", "South Wimbledon"],
    blurb: "Wimbledon, Mitcham and Morden — look into Merton shops, claim a drop, walk in with QR.",
  },
  {
    slug: "kingston-upon-thames",
    name: "Kingston upon Thames",
    region: "south",
    outcodes: ["KT1", "KT2", "KT3", "KT5", "KT6", "KT9"],
    neighbourhoods: ["Kingston", "Surbiton", "New Malden", "Tolworth", "Norbiton"],
    blurb: "Kingston and Surbiton high streets on Unwrapped — see it, claim it, collect it.",
  },
  {
    slug: "sutton",
    name: "Sutton",
    region: "south",
    outcodes: ["SM1", "SM2", "SM3", "SM5", "SM6", "SM7"],
    neighbourhoods: ["Sutton", "Carshalton", "Wallington", "Cheam", "Belmont"],
    blurb: "Sutton and Carshalton — local shopping you can see before you leave the sofa.",
  },
  {
    slug: "richmond-upon-thames",
    name: "Richmond upon Thames",
    region: "south",
    outcodes: ["TW1", "TW2", "TW9", "TW10", "TW11", "TW12", "SW13", "SW14"],
    neighbourhoods: ["Richmond", "Twickenham", "Teddington", "Barnes", "East Sheen", "Mortlake", "Kew", "Ham"],
    blurb: "Richmond, Barnes and Twickenham — high-street drops with photos you can trust.",
  },
  {
    slug: "bexley",
    name: "Bexley",
    region: "south",
    outcodes: ["DA1", "DA5", "DA6", "DA7", "DA8", "DA14", "DA15", "DA16", "DA17", "DA18"],
    neighbourhoods: ["Bexleyheath", "Sidcup", "Welling", "Erith", "Crayford", "Belvedere"],
    blurb: "Bexleyheath, Sidcup and Welling — Unwrapped coming to south-east London high streets.",
  },

  // ── Central ──────────────────────────────────────────────────────────────
  {
    slug: "westminster",
    name: "Westminster",
    region: "central",
    outcodes: ["W1", "W1A", "W1B", "W1C", "W1D", "W1F", "W1G", "W1H", "W1J", "W1K", "W1S", "W1T", "W1U", "W1W", "SW1", "SW1A", "SW1E", "SW1H", "SW1P", "SW1V", "SW1W", "SW1X", "SW1Y", "WC2"],
    neighbourhoods: ["Soho", "Mayfair", "Marylebone", "Covent Garden", "Victoria", "Pimlico", "Paddington", "Fitzrovia"],
    blurb: "Soho to Victoria — see central London shops on Unwrapped and collect in person.",
  },
  {
    slug: "city-of-london",
    name: "City of London",
    region: "central",
    outcodes: ["EC1", "EC2", "EC3", "EC4"],
    neighbourhoods: ["City of London", "Barbican", "Bank", "Monument", "Liverpool Street"],
    blurb: "The Square Mile — claim what's live from City shops and collect at the counter.",
  },
  {
    slug: "camden",
    name: "Camden",
    region: "central",
    outcodes: ["NW1", "NW3", "NW5", "WC1", "N1", "N6", "N7", "N19"],
    neighbourhoods: ["Camden Town", "Kentish Town", "Hampstead", "Bloomsbury", "King's Cross", "Gospel Oak"],
    blurb: "Camden, Kentish Town and Hampstead high streets — see the drop before you go.",
  },
  {
    slug: "islington",
    name: "Islington",
    region: "central",
    outcodes: ["N1", "N5", "N7", "N19", "EC1"],
    neighbourhoods: ["Islington", "Angel", "Highbury", "Holloway", "Canonbury", "Finsbury Park"],
    blurb: "Angel, Highbury and beyond — Unwrapped for Islington shops you can see.",
  },
  {
    slug: "kensington-and-chelsea",
    name: "Kensington and Chelsea",
    region: "central",
    outcodes: ["W8", "W10", "W11", "W14", "SW3", "SW5", "SW7", "SW10"],
    neighbourhoods: ["Kensington", "Chelsea", "Notting Hill", "Earl's Court", "South Kensington", "Holland Park"],
    blurb: "Chelsea, Kensington and Notting Hill — visual drops from RBKC high streets.",
  },
  {
    slug: "hackney",
    name: "Hackney",
    region: "east",
    outcodes: ["E5", "E8", "E9", "E2", "N1", "N16"],
    neighbourhoods: ["Hackney", "Dalston", "Homerton", "London Fields", "Stoke Newington", "Shoreditch", "Clapton"],
    blurb: "Dalston, Hackney Central and London Fields — look in, claim, collect.",
  },
  {
    slug: "tower-hamlets",
    name: "Tower Hamlets",
    region: "east",
    outcodes: ["E1", "E2", "E3", "E14", "E1W"],
    neighbourhoods: ["Shoreditch", "Whitechapel", "Bethnal Green", "Mile End", "Canary Wharf", "Bow", "Wapping"],
    blurb: "Whitechapel to Canary Wharf — Tower Hamlets shops on Unwrapped.",
  },

  // ── East ─────────────────────────────────────────────────────────────────
  {
    slug: "newham",
    name: "Newham",
    region: "east",
    outcodes: ["E6", "E7", "E12", "E13", "E15", "E16", "E20"],
    neighbourhoods: ["Stratford", "Forest Gate", "East Ham", "West Ham", "Canning Town", "Plaistow"],
    blurb: "Stratford and Forest Gate — east London high streets you can browse before you visit.",
  },
  {
    slug: "waltham-forest",
    name: "Waltham Forest",
    region: "east",
    outcodes: ["E10", "E11", "E17", "E4"],
    neighbourhoods: ["Walthamstow", "Leyton", "Leytonstone", "Chingford"],
    blurb: "Walthamstow and Leyton — claim local drops and collect on the high street.",
  },
  {
    slug: "redbridge",
    name: "Redbridge",
    region: "east",
    outcodes: ["IG1", "IG2", "IG3", "IG4", "IG5", "IG6", "E11", "E18"],
    neighbourhoods: ["Ilford", "Wanstead", "Woodford", "Barkingside", "Gants Hill"],
    blurb: "Ilford and Wanstead — Unwrapped for Redbridge neighbourhood shops.",
  },
  {
    slug: "barking-and-dagenham",
    name: "Barking and Dagenham",
    region: "east",
    outcodes: ["IG11", "RM8", "RM9", "RM10"],
    neighbourhoods: ["Barking", "Dagenham", "Becontree"],
    blurb: "Barking and Dagenham high streets — see it, claim it, collect it.",
  },
  {
    slug: "havering",
    name: "Havering",
    region: "east",
    outcodes: ["RM1", "RM2", "RM3", "RM5", "RM7", "RM11", "RM12", "RM13", "RM14"],
    neighbourhoods: ["Romford", "Hornchurch", "Upminster", "Rainham"],
    blurb: "Romford and Hornchurch — local shopping with photos you can trust.",
  },

  // ── North ────────────────────────────────────────────────────────────────
  {
    slug: "haringey",
    name: "Haringey",
    region: "north",
    outcodes: ["N4", "N8", "N10", "N15", "N17", "N22"],
    neighbourhoods: ["Crouch End", "Hornsey", "Tottenham", "Wood Green", "Muswell Hill", "Harringay"],
    blurb: "Crouch End, Tottenham and Wood Green — Unwrapped for Haringey high streets.",
  },
  {
    slug: "enfield",
    name: "Enfield",
    region: "north",
    outcodes: ["EN1", "EN2", "EN3", "N9", "N11", "N13", "N14", "N18", "N21"],
    neighbourhoods: ["Enfield", "Southgate", "Palmers Green", "Edmonton", "Winchmore Hill"],
    blurb: "Enfield and Southgate — look into north London shops before you go.",
  },
  {
    slug: "barnet",
    name: "Barnet",
    region: "north",
    outcodes: ["EN4", "EN5", "N2", "N3", "N11", "N12", "N20", "NW2", "NW4", "NW7", "NW9", "NW11", "HA8"],
    neighbourhoods: ["Finchley", "Golders Green", "Hendon", "Barnet", "Edgware", "Mill Hill", "Whetstone"],
    blurb: "Finchley to Golders Green — Barnet neighbourhood drops on Unwrapped.",
  },

  // ── West ─────────────────────────────────────────────────────────────────
  {
    slug: "hammersmith-and-fulham",
    name: "Hammersmith and Fulham",
    region: "west",
    outcodes: ["W6", "W12", "W14", "SW6"],
    neighbourhoods: ["Hammersmith", "Fulham", "Shepherd's Bush", "West Kensington", "Parsons Green"],
    blurb: "Hammersmith, Fulham and Shepherd's Bush — see the real thing, collect in person.",
  },
  {
    slug: "ealing",
    name: "Ealing",
    region: "west",
    outcodes: ["W3", "W5", "W7", "W13", "UB1", "UB2", "UB5", "UB6"],
    neighbourhoods: ["Ealing", "Acton", "Hanwell", "Southall", "Greenford", "Northolt"],
    blurb: "Ealing and Acton high streets — claim local drops on Unwrapped.",
  },
  {
    slug: "hounslow",
    name: "Hounslow",
    region: "west",
    outcodes: ["TW3", "TW4", "TW5", "TW7", "TW8", "W4"],
    neighbourhoods: ["Hounslow", "Chiswick", "Brentford", "Isleworth", "Osterley"],
    blurb: "Chiswick and Hounslow — west London shops you can peek into first.",
  },
  {
    slug: "brent",
    name: "Brent",
    region: "west",
    outcodes: ["NW2", "NW6", "NW9", "NW10", "HA0", "HA9"],
    neighbourhoods: ["Willesden", "Kilburn", "Wembley", "Harlesden", "Neasden", "Queens Park"],
    blurb: "Kilburn, Willesden and Wembley — Unwrapped for Brent high streets.",
  },
  {
    slug: "harrow",
    name: "Harrow",
    region: "west",
    outcodes: ["HA1", "HA2", "HA3", "HA5", "HA7"],
    neighbourhoods: ["Harrow", "Pinner", "Stanmore", "Wealdstone", "South Harrow"],
    blurb: "Harrow and Pinner — see neighbourhood shops, claim, collect.",
  },
  {
    slug: "hillingdon",
    name: "Hillingdon",
    region: "west",
    outcodes: ["UB3", "UB4", "UB7", "UB8", "UB9", "UB10", "HA4", "HA6"],
    neighbourhoods: ["Uxbridge", "Ruislip", "Hayes", "West Drayton", "Northwood", "Yiewsley"],
    blurb: "Uxbridge and Ruislip — west London high streets on Unwrapped.",
  },
];

export const SOUTH_LONDON_SLUGS = LONDON_BOROUGHS.filter((b) => b.region === "south").map((b) => b.slug);

export function getBoroughBySlug(slug: string | undefined | null): LondonBorough | undefined {
  if (!slug) return undefined;
  return LONDON_BOROUGHS.find((b) => b.slug === slug.toLowerCase());
}

export function outcodeFromPostcode(postcode?: string | null): string | null {
  if (!postcode) return null;
  const m = postcode.trim().toUpperCase().match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  return m?.[1] ?? null;
}

export function shopMatchesBorough(
  shop: { city?: string | null; postcode?: string | null; address?: string | null; district?: string | null },
  borough: LondonBorough,
): boolean {
  const oc = outcodeFromPostcode(shop.postcode) || (shop.district ? shop.district.toUpperCase().trim() : null);
  // Exact outcode match only — SE19 must not match SE1.
  if (oc && borough.outcodes.includes(oc)) return true;

  const hay = `${shop.city ?? ""} ${shop.address ?? ""}`.toLowerCase();
  if (!hay.trim()) return false;
  if (hay.includes(borough.name.toLowerCase())) return true;
  return borough.neighbourhoods.some((n) => hay.includes(n.toLowerCase()));
}

/** Prefer South London when an outcode spans multiple boroughs. */
export function findBoroughForShop(
  shop: { city?: string | null; postcode?: string | null; address?: string | null; district?: string | null },
): LondonBorough | undefined {
  const matches = LONDON_BOROUGHS.filter((b) => shopMatchesBorough(shop, b));
  if (!matches.length) return undefined;
  return matches.find((b) => b.region === "south") || matches[0];
}

export function boroughSeo(borough: LondonBorough): { title: string; description: string; path: string } {
  const south = borough.region === "south";
  const title = south
    ? `${borough.name} high street drops — Unwrapped (South London)`
    : `${borough.name} high street drops — Unwrapped (London)`;
  const description = `${borough.blurb} See it, claim it, collect it — video or photo of what's just landed, pay in the app, collect in person.`;
  return { title, description, path: `/london/${borough.slug}` };
}

export function londonHubSeo(): { title: string; description: string; path: string } {
  return {
    title: "London boroughs — Unwrapped",
    description:
      "Grab specials from shops near you before they're gone. Local shops post photos and videos of limited deals — claim in the app, collect at the counter. Launching densest in South London, with a page for every borough.",
    path: "/london",
  };
}

type BoroughShopLd = { name: string; slug?: string; url?: string };

export function boroughJsonLd(
  borough: LondonBorough,
  shops: BoroughShopLd[] = [],
): Record<string, unknown>[] {
  const pageUrl = `https://shopunwrapped.com/london/${borough.slug}`;
  const graphs: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${borough.name} on Unwrapped`,
      description: borough.blurb,
      url: pageUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Unwrapped",
        url: "https://shopunwrapped.com",
      },
      about: {
        "@type": "Place",
        name: `London Borough of ${borough.name}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: borough.name,
          addressRegion: "London",
          addressCountry: "GB",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://shopunwrapped.com/" },
        { "@type": "ListItem", position: 2, name: "London", item: "https://shopunwrapped.com/london" },
        { "@type": "ListItem", position: 3, name: borough.name, item: pageUrl },
      ],
    },
  ];

  if (shops.length) {
    graphs.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Shops in ${borough.name}`,
      numberOfItems: shops.length,
      itemListElement: shops.slice(0, 50).map((shop, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: shop.name,
        ...(shop.slug || shop.url
          ? { url: shop.url || `https://shopunwrapped.com/business/${shop.slug}` }
          : {}),
      })),
    });
  }

  return graphs;
}

export function londonHubJsonLd(): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "London boroughs on Unwrapped",
      description: londonHubSeo().description,
      url: "https://shopunwrapped.com/london",
      isPartOf: {
        "@type": "WebSite",
        name: "Unwrapped",
        url: "https://shopunwrapped.com",
      },
      about: {
        "@type": "Place",
        name: "London",
        address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://shopunwrapped.com/" },
        { "@type": "ListItem", position: 2, name: "London", item: "https://shopunwrapped.com/london" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "London boroughs on Unwrapped",
      numberOfItems: LONDON_BOROUGHS.length,
      itemListElement: LONDON_BOROUGHS.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        url: `https://shopunwrapped.com/london/${b.slug}`,
      })),
    },
  ];
}
