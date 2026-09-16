import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import QRCode from "qrcode";
import { trpc } from "../../trpc";
import BusinessShell from "../../components/business/BusinessShell";
import useIsMobile from "../../hooks/useIsMobile";
import {
  copyText,
  dropPublicUrl,
  dropShareNudge,
  formatCollectionWindow,
  isDropId,
  whatsappShareUrl,
} from "../../lib/dropShare";
import { BG, FG, BORDER, MUTED, MUTED_FG } from "../../theme";

type Copied = "link" | "nudge" | "link-fail" | "nudge-fail" | null;

export default function ShareDrop() {
  const isMobile = useIsMobile(768);
  const [, params] = useRoute("/dashboard/drops/:id/share");
  const id = params?.id ?? "";
  const idOk = isDropId(id);

  const { data, isLoading, error } = trpc.drops.getById.useQuery(
    { id },
    { enabled: idOk, retry: 1 },
  );

  const urlInputRef = useRef<HTMLInputElement>(null);
  const nudgeRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState<Copied>(null);

  const dropUrl = idOk ? dropPublicUrl(id) : "";

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function handleCopyLink() {
    if (!dropUrl) return;
    const ok = await copyText(dropUrl, urlInputRef.current);
    setCopied(ok ? "link" : "link-fail");
  }

  async function handleCopyNudge() {
    const text = nudgeRef.current?.value ?? "";
    if (!text) return;
    const ok = await copyText(text, nudgeRef.current);
    setCopied(ok ? "nudge" : "nudge-fail");
  }

  const notFound = !idOk || error?.data?.code === "NOT_FOUND";
  const loadFailed = Boolean(error) && !notFound;

  return (
    <BusinessShell>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px", maxWidth: 640 }}>
        <a href="/dashboard/drops" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}>
          ← Drops
        </a>

        {notFound ? (
          <EmptyState
            title="Drop not found"
            body="This share page needs a live drop. Go back to Drops and open Share from there, or publish a new one."
          />
        ) : loadFailed ? (
          <EmptyState
            title="Couldn't load this drop"
            body="Check your connection and try again. The drop is still published — open Share from Drops when you're back online."
          />
        ) : isLoading || !data ? (
          <div style={{ padding: 60, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.15em" }}>
            LOADING
          </div>
        ) : (
          <ShareBody
            isMobile={isMobile}
            title={data.drop.title}
            collectionStart={data.drop.collectionStart}
            collectionEnd={data.drop.collectionEnd}
            dropId={data.drop.id}
            dropUrl={dropUrl}
            copied={copied}
            urlInputRef={urlInputRef}
            nudgeRef={nudgeRef}
            onCopyLink={handleCopyLink}
            onCopyNudge={handleCopyNudge}
          />
        )}
      </div>
    </BusinessShell>
  );
}

function ShareBody({
  isMobile,
  title,
  collectionStart,
  collectionEnd,
  dropId,
  dropUrl,
  copied,
  urlInputRef,
  nudgeRef,
  onCopyLink,
  onCopyNudge,
}: {
  isMobile: boolean;
  title: string;
  collectionStart: Date | string;
  collectionEnd: Date | string;
  dropId: string;
  dropUrl: string;
  copied: Copied;
  urlInputRef: React.RefObject<HTMLInputElement>;
  nudgeRef: React.RefObject<HTMLTextAreaElement>;
  onCopyLink: () => void;
  onCopyNudge: () => void;
}) {
  const windowLabel = formatCollectionWindow(collectionStart, collectionEnd);
  const waHref = whatsappShareUrl({ title, collectionStart, collectionEnd, dropId });
  const nudge = dropShareNudge({ title, collectionStart, collectionEnd, dropId });

  return (
    <>
      <div style={{ marginTop: 12, marginBottom: 32 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 8 }}>
          DROP LIVE
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, lineHeight: 1.2 }}>
          Share this drop
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, marginTop: 10, lineHeight: 1.5 }}>
          {title}
          <br />
          Collect {windowLabel}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", textAlign: "center", padding: "15px",
            background: FG, color: BG, textDecoration: "none",
            fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.12em",
          }}
        >
          SHARE ON WHATSAPP
        </a>
        <button
          type="button"
          onClick={onCopyLink}
          style={{
            padding: "15px", background: BG, color: FG,
            border: `1px solid ${FG}`, cursor: "pointer",
            fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.12em",
          }}
        >
          {copied === "link" ? "LINK COPIED" : copied === "link-fail" ? "COULDN'T COPY — SELECT LINK BELOW" : "COPY LINK"}
        </button>
      </div>

      <Section label="DROP LINK">
        <input
          ref={urlInputRef}
          readOnly
          value={dropUrl}
          onFocus={e => e.currentTarget.select()}
          aria-label="Drop link"
          style={inputStyle}
        />
      </Section>

      <Section label="TILL POSTER QR">
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, margin: "0 0 16px", lineHeight: 1.5 }}>
          Shoppers scan this to open the drop page — not the till scanner.
        </p>
        <div style={{
          border: `1px solid ${BORDER}`, background: MUTED,
          padding: isMobile ? 20 : 28, textAlign: "center",
        }}>
          <TillPosterQr url={dropUrl} />
        </div>
      </Section>

      <Section label="CAPTION NUDGE">
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, margin: "0 0 12px", lineHeight: 1.5 }}>
          Copy this into a story, broadcast, or group chat.
        </p>
        <textarea
          ref={nudgeRef}
          readOnly
          value={nudge}
          rows={7}
          onFocus={e => e.currentTarget.select()}
          aria-label="Share caption"
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
        <button
          type="button"
          onClick={onCopyNudge}
          style={{
            marginTop: 12, padding: "11px 20px",
            background: BG, color: FG, border: `1px solid ${BORDER}`,
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            letterSpacing: "0.1em", cursor: "pointer",
          }}
        >
          {copied === "nudge" ? "CAPTION COPIED" : copied === "nudge-fail" ? "COULDN'T COPY — SELECT TEXT ABOVE" : "COPY CAPTION"}
        </button>
      </Section>

      <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {copied === "link" ? "Link copied" : copied === "nudge" ? "Caption copied" : ""}
      </div>

      <a
        href="/dashboard/drops"
        style={{
          display: "inline-flex", alignItems: "center",
          marginTop: 8, padding: "13px 24px",
          border: `1px solid ${BORDER}`, color: MUTED_FG, textDecoration: "none",
          fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
        }}
      >
        BACK TO DROPS
      </a>
    </>
  );
}

function TillPosterQr({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !url) return;
    let cancelled = false;
    setFailed(false);
    QRCode.toCanvas(canvas, url, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: FG, light: BG },
    }).then(() => {
      if (cancelled) return;
      setFailed(false);
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, [url]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        aria-label={`QR code for ${url}`}
        style={{
          display: failed ? "none" : "block",
          margin: "0 auto",
          width: 240,
          height: 240,
          maxWidth: "100%",
          aspectRatio: "1",
        }}
      />
      {failed && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, margin: 0, lineHeight: 1.5 }}>
          Couldn't draw the QR. Use the drop link above.
        </p>
      )}
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, padding: 24, marginBottom: 16 }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginTop: 24, padding: 32, border: `1px solid ${BORDER}` }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: FG, marginBottom: 10 }}>
        {title}
      </h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.6, marginBottom: 20 }}>
        {body}
      </p>
      <a
        href="/dashboard/drops/new"
        style={{
          display: "inline-block", padding: "12px 20px",
          background: FG, color: BG, textDecoration: "none",
          fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
        }}
      >
        NEW DROP
      </a>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", boxSizing: "border-box",
  border: `1px solid ${BORDER}`, background: BG, color: FG,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  outline: "none", appearance: "none",
};
