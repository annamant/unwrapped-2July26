import { useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "../trpc";
import Nav from "../components/Nav";
import { format } from "date-fns";
import QRCode from "qrcode";

const V = "#E8341C";
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";

export default function Ticket() {
  const [, params] = useRoute("/ticket/:id");
  const [, navigate] = useLocation();
  const id = params?.id ?? "";

  const { data, isLoading, error } = trpc.reservations.getById.useQuery({ id }, { enabled: !!id });
  const utils = trpc.useUtils();

  const cancel = trpc.reservations.cancel.useMutation({
    onSuccess: () => {
      utils.reservations.getById.invalidate({ id });
      utils.reservations.myReservations.invalidate();
    },
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!data?.reservation.qrCodeHash || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data.reservation.qrCodeHash, {
      width: 240,
      margin: 2,
      color: { dark: FG, light: BG },
    });
  }, [data?.reservation.qrCodeHash]);

  if (isLoading) return <Shell><Loading /></Shell>;
  if (error || !data) return <Shell><NotFound /></Shell>;

  const { reservation, drop, business, location } = data;
  const now = new Date();
  const start = new Date(drop.collectionStart);
  const end = new Date(drop.collectionEnd);
  const isLive = now >= start && now <= end;
  const cancelDeadline = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const canCancel = reservation.status === "active" && now < cancelDeadline;

  const statusLabel: Record<string, string> = {
    active: "Reserved",
    fulfilled: "Collected",
    cancelled: "Cancelled",
    expired: "Expired",
  };
  const statusColor: Record<string, string> = {
    active: FG,
    fulfilled: "#22C55E",
    cancelled: MUTED_FG,
    expired: MUTED_FG,
  };

  return (
    <Shell>
      <div style={{ maxWidth: 480, margin: "48px auto", padding: "0 24px" }}>

        {/* Status badge */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: statusColor[reservation.status] ?? FG,
            letterSpacing: "0.2em", marginBottom: 8,
          }}>
            {statusLabel[reservation.status]?.toUpperCase() ?? reservation.status.toUpperCase()}
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28, fontWeight: 700, color: FG, lineHeight: 1.2,
          }}>
            {drop.title}
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginTop: 6 }}>
            {business.name}
          </p>
        </div>

        {/* QR code */}
        <div style={{
          border: `1px solid ${BORDER}`, background: BG,
          padding: 32, textAlign: "center", marginBottom: 24,
        }}>
          {reservation.status === "active" ? (
            <>
              <canvas ref={canvasRef} style={{ display: "block", margin: "0 auto 20px" }} />
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 20,
                fontWeight: 700, color: FG, letterSpacing: "0.15em",
                marginBottom: 8,
              }}>
                {reservation.referenceCode}
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                Show this QR code or reference at the door
              </p>
            </>
          ) : (
            <div style={{ padding: "24px 0" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: MUTED_FG, letterSpacing: "0.1em" }}>
                {reservation.status === "fulfilled" ? "✓ COLLECTED" : "CODE NO LONGER VALID"}
              </div>
            </div>
          )}
        </div>

        {/* Collection details */}
        <div style={{ border: `1px solid ${BORDER}`, marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {[
              { label: "Date", value: format(start, "EEE d MMM") },
              { label: "Window", value: `${format(start, "h:mm a")} – ${format(end, "h:mm a")}` },
              { label: "Address", value: location.address, full: true },
              { label: "Price paid", value: `£${(drop.price / 100).toFixed(2)}` },
              { label: "Status", value: statusLabel[reservation.status] ?? reservation.status },
            ].map(({ label, value, full }, i) => (
              <div
                key={label}
                style={{
                  padding: "16px 20px",
                  gridColumn: full ? "1 / -1" : undefined,
                  borderBottom: i < 4 ? `1px solid ${BORDER}` : "none",
                  borderRight: !full && i % 2 === 0 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: FG }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live banner */}
        {isLive && reservation.status === "active" && (
          <div style={{
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            padding: "14px 20px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#15803D" }}>
              Collection is open now — head to {location.address.split(",")[0]}
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
          <a
            href={`/business/${business.slug}`}
            style={{
              textAlign: "center", padding: "13px",
              border: `1px solid ${BORDER}`, color: FG,
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", textDecoration: "none",
              display: "block",
            }}
          >
            VIEW {business.name.toUpperCase()}
          </a>

          {canCancel && (
            <button
              onClick={() => {
                if (window.confirm("Cancel this reservation? Your spot will be released.")) {
                  cancel.mutate({ reservationId: id });
                }
              }}
              disabled={cancel.isPending}
              style={{
                padding: "13px", border: `1px solid ${BORDER}`,
                background: BG, color: MUTED_FG,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", cursor: "pointer",
              }}
            >
              {cancel.isPending ? "CANCELLING…" : "CANCEL RESERVATION"}
            </button>
          )}

          {!canCancel && reservation.status === "active" && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, textAlign: "center" }}>
              Cancellations close 24 hours before the collection window.
            </p>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", background: BG }}><Nav />{children}</div>;
}
function Loading() {
  return <div style={{ padding: 80, textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 11, color: MUTED_FG, letterSpacing: "0.15em" }}>LOADING</div>;
}
function NotFound() {
  return <div style={{ padding: 80, textAlign: "center" }}><p style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: MUTED_FG }}>Ticket not found</p><a href="/profile" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: FG }}>← My reservations</a></div>;
}
