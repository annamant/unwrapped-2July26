import { useLocation } from "wouter";
import { trpc, clearSessionToken } from "../trpc";

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 56,
    borderBottom: "1px solid #E2E2E2",
    background: "#FCFCFC",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#020202",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  },
  actions: { display: "flex", alignItems: "center", gap: 20 },
  link: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "#020202",
    textDecoration: "none",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
  },
  cta: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "#FCFCFC",
    background: "rgb(232, 52, 28)",
    border: "none",
    padding: "8px 16px",
    cursor: "pointer",
    textDecoration: "none",
  },
};

export default function Nav() {
  const { data: user } = trpc.auth.me.useQuery();
  const signOut = trpc.auth.signOut.useMutation({
    onSuccess: () => { clearSessionToken(); window.location.href = "/"; },
  });
  const [, navigate] = useLocation();

  return (
    <nav style={styles.nav}>
      <a href={user ? "/home" : "/"} style={styles.logo}>Unwrapped</a>
      <div style={styles.actions}>
        {user ? (
          <>
            {user.hasBusiness && (
              <a href="/dashboard" style={styles.link}>Dashboard</a>
            )}
            {user.role === "admin" && (
              <a href="/admin" style={styles.link}>Admin</a>
            )}
            <a href="/profile" style={styles.link}>Profile</a>
            <button style={styles.link} onClick={() => signOut.mutate()}>Sign out</button>
          </>
        ) : (
          <>
            <a href="/business-apply" style={styles.link}>List your business</a>
            <a href="/signin" style={styles.cta}>Get drops</a>
          </>
        )}
      </div>
    </nav>
  );
}
