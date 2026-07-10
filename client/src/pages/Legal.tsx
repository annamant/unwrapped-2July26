const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED_FG = "#7A7A7A";

function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div style={{ background: BG, color: FG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: FG, textDecoration: "none" }}>Unwrapped</a>
        <a href="/" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}>← Back</a>
      </nav>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px 80px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700, letterSpacing: "-1px", marginBottom: 8 }}>{title}</h1>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 36 }}>LAST UPDATED {updated}</p>
        <div style={{ fontSize: 15, lineHeight: 1.75, color: FG }}>{children}</div>
      </div>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, margin: "32px 0 10px" }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 14, color: "#3a3733" }}>{children}</p>;
}

const CONTACT = <a href="mailto:anna@shopunwrapped.com" style={{ color: "#E8341C" }}>anna@shopunwrapped.com</a>;

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="8 JULY 2026">
      <P>Unwrapped ("we", "us") operates shopunwrapped.com, a platform where local businesses publish time-limited drops and consumers reserve them for collection. This policy explains what personal data we collect, why, and your rights over it. Contact for anything privacy-related: {CONTACT}.</P>

      <H>What we collect</H>
      <P>Account data: your name, email address, and a securely hashed password (we can never see your actual password). Preference data: the drop categories you select and the notification location zones you add (an approximate point and radius you choose — we never track your live location). Activity data: your reservations, follows, waitlist entries, and check-ins. Device data: a push-notification subscription if you enable alerts.</P>

      <H>Payments</H>
      <P>Payments are processed by Stripe. Your card details go directly to Stripe and never touch our servers — we store only a payment reference. Stripe's own privacy policy applies to payment processing.</P>

      <H>How we use your data</H>
      <P>To operate the service: issuing reservations and QR tickets, letting businesses check you in, and sending transactional emails (reservation confirmations, password resets, application decisions). To notify you: drop alerts matched to your chosen categories and zones — you can adjust or disable these anytime in your profile. We do not sell your data or use it for third-party advertising.</P>

      <H>Who we share it with</H>
      <P>Businesses you reserve from see your name and reservation details (not your email or payment data). Service providers acting on our instructions: Stripe (payments), Resend (email delivery), Railway (hosting). Nobody else, unless required by law.</P>

      <H>Retention and deletion</H>
      <P>We keep your data while your account is active. You can delete your account at any time in your profile — this permanently removes your personal data, reservations, preferences and push subscriptions. Payment records are retained by Stripe as required by financial regulations.</P>

      <H>Your rights</H>
      <P>Under UK GDPR you can request access to, correction of, or deletion of your personal data, object to processing, and lodge a complaint with the ICO (ico.org.uk). Email {CONTACT} to exercise any of these — we respond within 30 days.</P>

      <H>Cookies</H>
      <P>We use a single strictly-necessary session token to keep you signed in. No analytics or advertising cookies.</P>
    </LegalShell>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="8 JULY 2026">
      <P>These terms govern your use of shopunwrapped.com, operated from the United Kingdom. By creating an account or making a reservation you agree to them. Questions: {CONTACT}.</P>

      <H>What Unwrapped is</H>
      <P>Unwrapped is a marketplace. Businesses list time-limited "drops"; consumers reserve and pay (where applicable) through the platform and collect in person during the stated window. The contract for the goods or services in a drop is between you and the business — Unwrapped facilitates the reservation and payment.</P>

      <H>Reservations and collection</H>
      <P>A reservation entitles you to collect the item during the drop's collection window by presenting your QR ticket or reference code. If you do not collect within the window, the reservation expires and no refund is due, as the business has held the item for you.</P>

      <H>Cancellations and refunds</H>
      <P>You may cancel a reservation up to 24 hours before the collection window opens, in which case your payment is refunded in full to your original payment method. Within 24 hours of collection, cancellation is not available through the platform — contact {CONTACT} and we will do our best to help. If a business cancels a drop, or an item becomes unavailable after you paid, you receive an automatic full refund.</P>

      <H>For businesses</H>
      <P>Businesses join by application and are approved at our discretion. Businesses are responsible for the accuracy of their listings, the quality and legality of what they sell, honouring every valid reservation during the stated window, and complying with applicable law (including food safety and consumer protection rules where relevant). Unwrapped retains a platform fee on each successful reservation; payout terms are agreed at onboarding. We may suspend listings or accounts that breach these terms.</P>

      <H>Acceptable use</H>
      <P>No reselling reservations, no automated purchasing, no false accounts, no interference with the service. We may suspend accounts engaged in fraud or abuse.</P>

      <H>Liability</H>
      <P>Nothing in these terms limits liability that cannot be limited by law. Otherwise, Unwrapped's liability in connection with any reservation is limited to the amount you paid for it. We are not liable for the quality, safety, or fitness of items supplied by businesses, though we will assist in resolving disputes in good faith.</P>

      <H>Changes</H>
      <P>We may update these terms; material changes will be notified on the site or by email. Continued use after changes take effect constitutes acceptance.</P>

      <H>Governing law</H>
      <P>These terms are governed by the law of England and Wales, and disputes are subject to the jurisdiction of its courts.</P>
    </LegalShell>
  );
}
