import useIsMobile from "../hooks/useIsMobile";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

type ResourceItem = {
  title: string;
  description: string;
  href: string;
  format: string;
  preview?: string;
  downloadName?: string;
};

type ResourceSection = {
  id: string;
  label: string;
  intro: string;
  items: ResourceItem[];
};

const SECTIONS: ResourceSection[] = [
  {
    id: "print",
    label: "Print",
    intro: "Shop-window posters and flyers for the neighbourhood.",
    items: [
      {
        title: "Window poster — A4",
        description:
          "Explains Unwrapped for people and shops. Print at 100% / actual size, full colour. Ideal for windows and local flyering.",
        href: "/resources/print/Unwrapped-Window-Poster-A4.pdf",
        preview: "/resources/print/Unwrapped-Window-Poster-A4.png",
        format: "PDF · A4",
        downloadName: "Unwrapped-Window-Poster-A4.pdf",
      },
      {
        title: "Window poster — PNG",
        description: "Same poster as a high-res image for WhatsApp, email, or digital screens.",
        href: "/resources/print/Unwrapped-Window-Poster-A4.png",
        preview: "/resources/print/Unwrapped-Window-Poster-A4.png",
        format: "PNG",
        downloadName: "Unwrapped-Window-Poster-A4.png",
      },
      {
        title: "Charity shop poster — A4",
        description:
          "Customer-facing for charity shop windows and till — follow special finds, reserve on phone, collect here.",
        href: "/resources/print/Unwrapped-Charity-Poster-A4.pdf",
        preview: "/resources/print/Unwrapped-Charity-Poster-A4.png",
        format: "PDF · A4",
        downloadName: "Unwrapped-Charity-Poster-A4.pdf",
      },
      {
        title: "Charity shop poster — PNG",
        description: "Same customer-facing charity poster as a high-res image for email or digital screens.",
        href: "/resources/print/Unwrapped-Charity-Poster-A4.png",
        preview: "/resources/print/Unwrapped-Charity-Poster-A4.png",
        format: "PNG",
        downloadName: "Unwrapped-Charity-Poster-A4.png",
      },
    ],
  },
  {
    id: "brand",
    label: "Brand",
    intro: "Official logos for press and partners. Don’t recolour or stretch.",
    items: [
      {
        title: "Logo mark",
        description: "Ink square with cream U and vermillion spark. Use for icons and small placements.",
        href: "/resources/brand/logo-mark.svg",
        preview: "/resources/brand/logo-mark.svg",
        format: "SVG",
      },
      {
        title: "Logo lockup",
        description: "Mark + wordmark side by side — best for magazine features and partner mentions.",
        href: "/resources/brand/logo-lockup-horizontal.svg",
        preview: "/resources/brand/logo-lockup-horizontal.svg",
        format: "SVG",
      },
    ],
  },
];

function DownloadLink({ item }: { item: ResourceItem }) {
  return (
    <a
      href={item.href}
      download={item.downloadName}
      className="uw-link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        textDecoration: "none",
        color: BG,
        background: FG,
        border: `1px solid ${FG}`,
        padding: "12px 16px",
        alignSelf: "flex-start",
      }}
    >
      Download
    </a>
  );
}

export default function Resources() {
  const isMobile = useIsMobile();

  return (
    <div style={{ background: BG, color: FG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "16px 20px" : "18px 40px",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 700,
            color: FG,
            textDecoration: "none",
          }}
        >
          Unwrapped
        </a>
        <a
          href="/"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: MUTED_FG,
            textDecoration: "none",
          }}
        >
          ← Back
        </a>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "40px 20px 80px" : "56px 40px 96px" }}>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: V,
            marginBottom: 14,
          }}
        >
          Marketing kit
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 36 : 48,
            fontWeight: 700,
            letterSpacing: "-1px",
            lineHeight: 1.05,
            marginBottom: 14,
          }}
        >
          Resources
        </h1>
        <p
          style={{
            fontSize: isMobile ? 15 : 17,
            lineHeight: 1.55,
            color: MUTED_FG,
            maxWidth: 52 * 8,
            marginBottom: 36,
            fontWeight: 300,
          }}
        >
          Print posters and logos for local businesses, press, and the neighbourhood.
          Free to download and use for Unwrapped. Questions:{" "}
          <a href="mailto:anna@shopunwrapped.com" style={{ color: V, textDecoration: "none" }}>
            anna@shopunwrapped.com
          </a>
          .
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: isMobile ? 40 : 56,
          }}
        >
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: FG,
                border: `1px solid ${BORDER}`,
                padding: "10px 14px",
                background: MUTED,
              }}
            >
              {section.label}
            </a>
          ))}
        </div>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} style={{ marginBottom: isMobile ? 48 : 64 }}>
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 28, marginBottom: 22 }}>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? 26 : 30,
                  fontWeight: 600,
                  letterSpacing: "-0.5px",
                  marginBottom: 8,
                }}
              >
                {section.label}
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: MUTED_FG, maxWidth: 52 * 8 }}>
                {section.intro}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              {section.items.map((item) => (
                <article
                  key={item.href}
                  style={{
                    border: `1px solid ${BORDER}`,
                    background: BG,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {item.preview ? (
                    <div
                      style={{
                        background: MUTED,
                        borderBottom: `1px solid ${BORDER}`,
                        aspectRatio: section.id === "print" ? "210 / 297" : section.id === "brand" && item.format.includes("1200") ? "1200 / 630" : "1 / 1",
                        maxHeight: section.id === "print" ? 320 : 220,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: section.id === "brand" && item.format === "SVG" ? 28 : 0,
                      }}
                    >
                      <img
                        src={item.preview}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: section.id === "brand" && item.format === "SVG" ? "contain" : "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  ) : null}

                  <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: MUTED_FG,
                      }}
                    >
                      {item.format}
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 20,
                        fontWeight: 600,
                        letterSpacing: "-0.3px",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 14, lineHeight: 1.45, color: MUTED_FG, flex: 1 }}>
                      {item.description}
                    </p>
                    <DownloadLink item={item} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 28,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.5, color: MUTED_FG, maxWidth: 48 * 8 }}>
            More kits coming as we grow. Need a neighbourhood-specific version or a larger print size? Email us.
          </p>
          <a
            href="mailto:anna@shopunwrapped.com?subject=Unwrapped%20resources"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: FG,
              border: `1px solid ${FG}`,
              padding: "12px 16px",
              alignSelf: isMobile ? "stretch" : "flex-start",
              textAlign: "center",
            }}
          >
            Request an asset
          </a>
        </div>
      </main>
    </div>
  );
}
