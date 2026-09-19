import {
  DEFAULT_TITLE,
  SITE,
  fallbackSeo,
  googlebotFromRobots,
  injectSeo,
  stripJsonLd,
} from "./seo-inject.mjs";

const SHELL = `<!DOCTYPE html>
<html lang="en-GB">
  <head>
    <title>${DEFAULT_TITLE}</title>
    <meta name="description" content="Local shops post photos and videos of limited deals. You see it, claim it on your phone, and collect it in person. Never miss what's around the corner." />
    <meta name="robots" content="index, follow" />
    <meta name="googlebot" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="https://shopunwrapped.com/" />
    <meta property="og:title" content="${DEFAULT_TITLE}" />
    <meta property="og:description" content="home desc" />
    <meta property="og:url" content="https://shopunwrapped.com/" />
    <meta property="og:image:alt" content="${DEFAULT_TITLE}" />
    <script type="application/ld+json" data-unwrapped-jsonld>
      {"@context":"https://schema.org","@type":"Organization","name":"Unwrapped","url":"https://shopunwrapped.com"}
    </script>
    <script type="application/ld+json" data-unwrapped-jsonld>
      {"@context":"https://schema.org","@type":"WebSite","name":"Unwrapped","url":"https://shopunwrapped.com"}
    </script>
  </head>
  <body>
    <div id="root"></div>
    <noscript><h1>Grab specials from shops near you before they're gone.</h1></noscript>
  </body>
</html>`;

let failed = 0;

function check(name, got, want) {
  const ok = typeof want === "function" ? want(got) : got === want;
  if (ok) {
    console.log(`ok   ${name}`);
  } else {
    failed++;
    console.error(`fail ${name}\n  got:  ${got}\n  want: ${want}`);
  }
}

const london = injectSeo(SHELL, {
  title: "London boroughs — Unwrapped",
  description: "Launching densest in South London, with a page for every borough.",
  canonical: `${SITE}/london`,
  image: `${SITE}/og-image.png`,
  type: "website",
  jsonLd: { "@type": "CollectionPage", url: `${SITE}/london` },
  bodyHtml: "<article><h1>London boroughs</h1></article>",
});

check("london title is unique", /<title>London boroughs — Unwrapped<\/title>/.test(london), true);
check("london canonical matches path", london.includes(`rel="canonical" href="${SITE}/london"`), true);
check("london og:url matches path", london.includes(`property="og:url" content="${SITE}/london"`), true);
check("london og:title aligned", london.includes(`property="og:title" content="London boroughs — Unwrapped"`), true);
check("london does not keep home canonical", london.includes(`href="${SITE}/"`) && london.includes("canonical")
  ? !/<link rel="canonical" href="https:\/\/shopunwrapped.com\/" \/>/.test(london)
  : true, true);
check("london strips homepage JSON-LD", /"@type":"Organization"/.test(london), false);
check("london injects route JSON-LD", london.includes('"@type":"CollectionPage"'), true);
check("london replaces homepage noscript", london.includes("<h1>London boroughs</h1>"), true);
check("london noscript is not the homepage hero", london.includes("Grab specials from shops near you"), false);

const biz = injectSeo(SHELL, {
  title: "Brixton Village Market · Lambeth — Unwrapped",
  description: "Shopping arcade with global food outlets.",
  canonical: `${SITE}/business/brixton-village-market-iopq`,
  image: `${SITE}/og-image.png`,
  type: "website",
});
check(
  "business canonical is the shop URL",
  biz.includes(`rel="canonical" href="${SITE}/business/brixton-village-market-iopq"`),
  true,
);
check("business title uses shop name", biz.includes("<title>Brixton Village Market · Lambeth — Unwrapped</title>"), true);

const drop = injectSeo(SHELL, {
  title: "Sourdough · Test Bakery — Unwrapped",
  description: "Today's batch.",
  canonical: `${SITE}/drop/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`,
  image: `${SITE}/og-image.png`,
  type: "product",
});
check("drop og:type is product", drop.includes(`property="og:type" content="product"`), true);
check(
  "drop canonical is the drop URL",
  drop.includes(`rel="canonical" href="${SITE}/drop/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"`),
  true,
);

const homeInjected = injectSeo(SHELL, {
  title: DEFAULT_TITLE,
  description: "Local shops post photos and videos of limited deals. You see it, claim it on your phone, and collect it in person. Never miss what's around the corner.",
  canonical: `${SITE}/`,
  image: `${SITE}/og-image.png`,
  type: "website",
});
check("homepage canonical stays /", /<link rel="canonical" href="https:\/\/shopunwrapped.com\/" \/>/.test(homeInjected), true);
check("homepage title unchanged", homeInjected.includes(`<title>${DEFAULT_TITLE}</title>`), true);

check("fallback /london canonical", fallbackSeo("/london").canonical, `${SITE}/london`);
check("fallback borough canonical", fallbackSeo("/london/lambeth").canonical, `${SITE}/london/lambeth`);
check("fallback business canonical", fallbackSeo("/business/foo-bar").canonical, `${SITE}/business/foo-bar`);
check("fallback drop canonical", fallbackSeo("/drop/abc").canonical, `${SITE}/drop/abc`);
check("fallback drop is noindex", fallbackSeo("/drop/abc").robots, "noindex, follow");
check("fallback never uses home canonical on deep links", fallbackSeo("/london").canonical !== `${SITE}/`, true);
check("fallback strips trailing slash", fallbackSeo("/london/").canonical, `${SITE}/london`);
check("stripJsonLd removes both shell scripts", stripJsonLd(SHELL).includes("application/ld+json"), false);
check("googlebot noindex follows robots", googlebotFromRobots("noindex, follow"), "noindex, follow");
check("googlebot index keeps preview hint", googlebotFromRobots("index, follow"), "index, follow, max-image-preview:large");

const missingDrop = injectSeo(SHELL, {
  title: "Drop not found — Unwrapped",
  description: "This drop is no longer available on Unwrapped.",
  canonical: `${SITE}/drop/00000000-0000-0000-0000-000000000000`,
  image: `${SITE}/og-image.png`,
  type: "website",
  robots: "noindex, follow",
});
check(
  "missing drop does not keep homepage canonical",
  /<link rel="canonical" href="https:\/\/shopunwrapped.com\/" \/>/.test(missingDrop),
  false,
);
check(
  "missing drop canonical is the drop URL",
  missingDrop.includes(`rel="canonical" href="${SITE}/drop/00000000-0000-0000-0000-000000000000"`),
  true,
);
check("missing drop robots is noindex", missingDrop.includes(`name="robots" content="noindex, follow"`), true);
check("missing drop googlebot is noindex", missingDrop.includes(`name="googlebot" content="noindex, follow"`), true);
check("missing drop googlebot is not homepage index", missingDrop.includes("max-image-preview:large"), false);

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll seo-inject cases passed.");
