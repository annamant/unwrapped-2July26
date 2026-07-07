import { useState, useRef, useEffect } from "react";
import { trpc } from "../../trpc";
import { DashLayout } from "./Dashboard";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

type ScanResult = {
  success: boolean;
  error?: string;
  message: string;
  dropTitle?: string;
  referenceCode?: string;
};

export default function Scanner() {
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [outsideWindow, setOutsideWindow] = useState(false);
  const [lastCode, setLastCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const checkin = trpc.reservations.scanCheckin.useMutation({
    onSuccess: (data) => {
      const res = data as ScanResult;
      if (res.error === "outside_window") {
        setOutsideWindow(true);
        setLastCode(code);
        setResult(res);
      } else {
        setResult(res);
        if (res.success) setCode("");
      }
    },
  });

  const forceCheckin = trpc.reservations.scanCheckin.useMutation({
    onSuccess: (data) => {
      setResult(data as ScanResult);
      setOutsideWindow(false);
      if (data.success) setCode("");
    },
  });

  // Auto-focus input on mount and after each scan
  useEffect(() => {
    inputRef.current?.focus();
  }, [result]);

  // Determine if input is a reference code (UW-XXXXXX, optionally entered
  // without the "UW-" prefix) or a QR hash (hex string), and normalize
  // reference codes to the full "UW-XXXXXX" form stored in the database.
  function parseCode(input: string): { referenceCode?: string; qrCodeHash?: string } {
    const trimmed = input.trim().toUpperCase();
    if (/^UW-[A-Z0-9]{6}$/.test(trimmed)) return { referenceCode: trimmed };
    if (/^[A-Z0-9]{6}$/.test(trimmed)) return { referenceCode: `UW-${trimmed}` };
    return { qrCodeHash: trimmed };
  }

  function handleScan() {
    if (!code.trim()) return;
    setResult(null);
    setOutsideWindow(false);
    checkin.mutate({ ...parseCode(code), forceAccept: false });
  }

  function handleForceAccept() {
    forceCheckin.mutate({ ...parseCode(lastCode), forceAccept: true });
  }

  return (
    <DashLayout>
      <div style={{ padding: "40px 48px", maxWidth: 560 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 8 }}>
          Scanner
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 32 }}>
          Scan a QR code or enter a reference code to check in a reservation.
        </p>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 0, marginBottom: 32, border: `1px solid ${BORDER}` }}>
          {(["manual", "camera"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "11px",
                background: mode === m ? FG : BG,
                color: mode === m ? BG : MUTED_FG,
                border: "none",
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", cursor: "pointer",
              }}
            >
              {m === "manual" ? "ENTER CODE" : "CAMERA"}
            </button>
          ))}
        </div>

        {mode === "manual" && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, display: "block", marginBottom: 8 }}>
              Reference code or QR hash
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                ref={inputRef}
                value={code}
                onChange={e => { setCode(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === "Enter" && handleScan()}
                placeholder="UW-ABC123"
                autoFocus
                style={{
                  flex: 1, padding: "13px 14px",
                  border: `1px solid ${BORDER}`, background: BG, color: FG,
                  fontFamily: "'Space Mono', monospace", fontSize: 14,
                  letterSpacing: "0.05em", outline: "none", textTransform: "uppercase",
                }}
              />
              <button
                onClick={handleScan}
                disabled={checkin.isPending || !code.trim()}
                style={{
                  padding: "13px 20px",
                  background: FG, color: BG, border: "none",
                  fontFamily: "'Space Mono', monospace", fontSize: 10,
                  letterSpacing: "0.1em", cursor: "pointer",
                  opacity: !code.trim() ? 0.4 : 1,
                }}
              >
                {checkin.isPending ? "…" : "CHECK IN"}
              </button>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 8 }}>
              Enter the UW-XXXXXX reference code from the customer's ticket, or paste the full QR hash. Press Enter to scan.
            </p>
          </div>
        )}

        {mode === "camera" && (
          <div style={{ border: `1px solid ${BORDER}`, padding: "40px", textAlign: "center", marginBottom: 24 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: MUTED_FG, fontStyle: "italic", marginBottom: 12 }}>
              Camera scanning
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 20, lineHeight: 1.6 }}>
              Point the camera at the customer's QR code. Requires a browser with camera access and a secure (HTTPS) connection.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>
              In production: integrate with a QR scanning library (e.g. <code>@zxing/browser</code>) and pipe decoded values into the check-in mutation above. The manual entry mode above works on any device right now.
            </p>
          </div>
        )}

        {/* Result card */}
        {result && (
          <div style={{
            border: `1px solid ${result.success ? "#BBF7D0" : outsideWindow ? BORDER : `${V}40`}`,
            background: result.success ? "#F0FDF4" : outsideWindow ? MUTED : "#FEF2F2",
            padding: "24px",
          }}>
            {result.success ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>✓</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#15803D", letterSpacing: "0.1em" }}>
                    CHECKED IN
                  </span>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#14532D", marginBottom: 6 }}>
                  {result.dropTitle}
                </p>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: "#15803D" }}>
                  {result.referenceCode}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#15803D", marginTop: 8, lineHeight: 1.5 }}>
                  {result.message}
                </p>
              </>
            ) : outsideWindow ? (
              <>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: FG, letterSpacing: "0.1em", marginBottom: 12 }}>
                  OUTSIDE COLLECTION WINDOW
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, lineHeight: 1.6, marginBottom: 16 }}>
                  {result.message}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 20 }}>
                  You can accept this reservation anyway — the payout will still be issued.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleForceAccept}
                    disabled={forceCheckin.isPending}
                    style={{
                      padding: "11px 20px",
                      background: FG, color: BG, border: "none",
                      fontFamily: "'Space Mono', monospace", fontSize: 10,
                      letterSpacing: "0.1em", cursor: "pointer",
                    }}
                  >
                    {forceCheckin.isPending ? "…" : "ACCEPT ANYWAY"}
                  </button>
                  <button
                    onClick={() => { setResult(null); setOutsideWindow(false); setCode(""); inputRef.current?.focus(); }}
                    style={{
                      padding: "11px 20px",
                      border: `1px solid ${BORDER}`, background: BG, color: FG,
                      fontFamily: "'Space Mono', monospace", fontSize: 10,
                      letterSpacing: "0.1em", cursor: "pointer",
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>✕</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: V, letterSpacing: "0.1em" }}>
                    {result.error === "already_redeemed" ? "ALREADY REDEEMED" : "INVALID"}
                  </span>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, lineHeight: 1.5 }}>
                  {result.message}
                </p>
              </>
            )}
          </div>
        )}

        {result?.success && (
          <button
            onClick={() => { setResult(null); setCode(""); inputRef.current?.focus(); }}
            style={{
              width: "100%", marginTop: 12, padding: "13px",
              border: `1px solid ${BORDER}`, background: BG, color: FG,
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", cursor: "pointer",
            }}
          >
            SCAN NEXT
          </button>
        )}
      </div>
    </DashLayout>
  );
}
