import { BG, FG, BORDER, MUTED_FG } from "../theme";

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

const CONTACT = <a href="mailto:anna@shopunwrapped.com" style={{ color: "#160703" }}>anna@shopunwrapped.com</a>;

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="8 JULY 2026">
      <P>Unwrapped ("we", "us") operates shopunwrapped.com, a platform where local businesses publish time-limited drops and shoppers reserve them for collection. This policy explains what personal data we collect, why, and your rights over it. Contact for anything privacy-related: {CONTACT}.</P>

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
    <LegalShell title="Terms and Conditions" updated="26 JULY 2026">
      <P>
        These Terms and Conditions (“Terms”) are a binding agreement between you and Unwrapped (“Unwrapped”, “we”, “us”, “our”) governing your use of shopunwrapped.com and related services (together, the “Platform”). Unwrapped operates from the United Kingdom and is starting in London. By creating an account, browsing the Platform, or making a reservation, you agree to these Terms. If you do not agree, do not use the Platform. Questions: {CONTACT}.
      </P>
      <P>
        These Terms should be read with our Privacy Policy. By accepting these Terms you confirm you have read that policy.
      </P>

      <H>1. What Unwrapped is</H>
      <P>
        Unwrapped is a marketplace. Local businesses (“Businesses”) list time-limited offers (“drops”). Shoppers (“you”, “users”) can browse drops, reserve them through the Platform, pay where a price applies, and collect in person during the stated collection window.
      </P>
      <P>
        We do not own, prepare, store, manufacture, pack, or supply the goods or services in a drop. We are not a party to the sale between you and the Business. The contract for what you collect is between you and the Business. We provide the Platform that helps you find drops, reserve them, pay (where applicable), and check in at collection.
      </P>

      <H>2. Accounts</H>
      <P>
        To reserve most drops you must register an account with accurate, complete, and up-to-date information. Keep your login details confidential. You are responsible for activity on your account. Tell us straight away at {CONTACT} if you think someone has used it without permission.
      </P>
      <P>
        You must be at least 18 and able to form a binding contract under the law of England and Wales. Do not impersonate anyone, use another person’s account, share your account, or create an account after we have suspended or terminated a previous one for breach of these Terms.
      </P>

      <H>3. How drops and reservations work</H>
      <P>
        A Business lists a drop with details such as title, description, quantity, price (if any), and a collection window and location. Availability depends on what the Business lists and what remains unreserved. We may show drops based on filters you choose (for example category or area). We do not guarantee that any particular drop will be available.
      </P>
      <P>
        When you place a reservation through the Platform, you reserve one unit of that drop for collection during the stated window. For paid drops, payment is taken when you reserve (not when you collect), using the payment method you provide. Completing a reservation is your offer to the Business to reserve and, where priced, purchase that drop for collection. The sale of the goods or services is concluded between you and the Business at collection, subject to these Terms and any information the Business provides.
      </P>
      <P>
        After a successful reservation we provide a confirmation with a reference and a QR ticket (or equivalent) in the Platform. You must be able to show this at collection. It is your responsibility to arrive during the collection window with a valid ticket.
      </P>

      <H>4. Collection</H>
      <P>
        Collect your reservation at the place and during the time window shown for the drop. Present your QR ticket or reference so the Business can check you in. Check that what you receive matches your reservation before you leave. If anything looks wrong, raise it with the Business before leaving and contact us at {CONTACT} if you need help.
      </P>
      <P>
        If you do not collect within the collection window, the reservation expires. Because the Business held the item for you, no refund is due for a missed collection, unless we say otherwise or the law requires it.
      </P>

      <H>5. Contents of drops</H>
      <P>
        We do not control, inspect, or manage the contents of drops. We are not responsible for quality, ingredients, allergens, condition, fitness for purpose, labelling, or accuracy of information provided by Businesses — on the Platform or at collection. Product, allergen, and safety information is the Business’s responsibility. If you have allergies, dietary needs, or any doubt about contents, confirm with the Business before collecting. Do not collect if you are not satisfied with the information they provide.
      </P>
      <P>
        Questions about a specific drop should go to the Business (their details appear on the Platform where available) or to {CONTACT} if you cannot resolve it with them.
      </P>

      <H>6. Price and payment</H>
      <P>
        Prices are shown in pounds sterling (GBP) as the all-in amount due at reservation. Where VAT or other tax applies and is included, it will form part of the price shown unless we state otherwise. Some drops may be free; free drops do not require payment.
      </P>
      <P>
        Payments are processed by Stripe. Card details go to Stripe and are not stored on our servers. We may store a payment reference needed to operate the Platform (for example refunds). Completing a paid reservation authorises us to charge the listed price through Stripe.
      </P>
      <P>
        We collect payment to facilitate the reservation between you and the Business. How we settle with Businesses, including any platform fee we retain, is agreed with Businesses separately and is not a separate charge itemised to you beyond the price shown at checkout unless we clearly display an additional fee.
      </P>

      <H>7. Cancellations and refunds</H>
      <P>
        Cancellation by you: you may cancel an active reservation through the Platform at any time before the collection window opens. If you paid, we will refund the amount you paid to your original payment method. Once the collection window has opened, you cannot cancel through the Platform. If something exceptional has happened, email {CONTACT} and we will help where we reasonably can — a refund is not guaranteed after the window has opened.
      </P>
      <P>
        Cancellation by the Business: if a Business cancels a drop or cannot fulfil your reservation after you have paid, you receive a full refund of the amount you paid.
      </P>
      <P>
        Cancellation by Unwrapped: we may cancel a reservation where we reasonably need to — for example fraud, a safety or recall issue, a dispute, a technical failure, or a legal requirement. If you had paid, you will receive a full refund.
      </P>
      <P>
        Missed collection: if you do not collect during the window and did not cancel before it opened, no refund is due.
      </P>
      <P>
        We may also issue a goodwill refund at our discretion. Refund requests or complaints about a reservation should normally be raised with us within 30 days after the end of the relevant collection window.
      </P>
      <P>
        Nothing in this section limits any rights you have against the Business under consumer law that cannot be excluded.
      </P>

      <H>8. Complaints</H>
      <P>
        For Platform or payment issues, contact {CONTACT} first and include your reservation reference and what went wrong. We will look into it and involve the Business when needed. These Terms do not stop you pursuing remedies against the Business under applicable law.
      </P>

      <H>9. Your responsibilities</H>
      <P>
        You agree to use the Platform lawfully and respectfully. In particular you agree that you will:
      </P>
      <P>
        only place reservations you intend to collect; pay in full for paid reservations; treat Business staff and other customers respectfully; not resell reservations or use the Platform to harvest pricing or listing data for competing services; not use bots, scrapers, or automated systems to reserve drops or extract data; not interfere with the Platform or attempt to bypass security; not upload harmful code or false information; and not access the Platform if you are a direct competitor of Unwrapped except with our prior written consent.
      </P>
      <P>
        If you behave abusively toward a Business, another user, or us, or if you breach these Terms, we may suspend or terminate your account.
      </P>

      <H>10. Businesses on Unwrapped</H>
      <P>
        Businesses join by application and are approved at our discretion. Businesses are responsible for the accuracy of their listings; the quality, safety, and legality of what they offer; honouring every valid reservation during the stated window; and complying with applicable law (including food safety and consumer protection rules where relevant).
      </P>
      <P>
        Unwrapped retains a platform fee on successful paid reservations. The fee is included in the price shown to shoppers (not itemised as a separate checkout charge). Fee and payout terms are agreed with each Business at onboarding (or as updated in writing). We may suspend listings or Business accounts that breach these Terms or applicable law. Detailed commercial terms for Businesses may be set out separately; if there is a conflict on fees or payout, those commercial terms prevail for that subject.
      </P>

      <H>11. Privacy</H>
      <P>
        We process personal data as described in our Privacy Policy. The Platform does not rely on continuous live location tracking; location features (such as notification zones) work as described in that policy.
      </P>

      <H>12. Intellectual property</H>
      <P>
        The Platform — including its design, software, branding, and content we provide — belongs to Unwrapped or our licensors. You may use the Platform only as allowed by these Terms. You may not copy, scrape, modify, or commercially exploit our content or software without our prior written consent, except to the extent the law allows.
      </P>
      <P>
        Business names, logos, and drop images remain the relevant Business’s or third party’s property. If you send us ideas or feedback about the Platform, you grant us a free, perpetual, worldwide licence to use that feedback without restriction or payment to you.
      </P>

      <H>13. Suspension and termination</H>
      <P>
        We may suspend or terminate your access, or delete your account, where we reasonably believe it is necessary — for example if you breach these Terms, create risk or harm for us, a Business, or others, we must comply with law, or your account has been inactive for a long period. If you think we got this wrong, contact {CONTACT}.
      </P>
      <P>
        You may stop using the Platform and delete your account as described in the product or by emailing {CONTACT}. Provisions that by nature should survive (including liability limits, IP, and governing law) continue after termination.
      </P>

      <H>14. Liability</H>
      <P>
        Nothing in these Terms excludes or limits liability that cannot be excluded or limited under English law — including liability for death or personal injury caused by negligence, or for fraud.
      </P>
      <P>
        Subject to that: we are not liable for acts or omissions of Businesses or other third parties, including the contents, quality, safety, or availability of drops; for losses caused by your use of the Platform or failure to collect; for links to third-party sites; or for events outside our reasonable control. We are not liable for indirect or consequential loss. Our total liability to you in connection with any reservation is limited to the amount you paid us for that reservation (or, if you paid nothing, £0).
      </P>
      <P>
        You agree to indemnify us against claims, losses, and reasonable costs arising from your breach of these Terms or misuse of the Platform, except to the extent caused by our negligence or breach of these Terms.
      </P>
      <P>
        The Platform is provided on an “as is” and “as available” basis. We do not promise uninterrupted or error-free service. Where the law implies warranties that cannot be excluded, those remain; otherwise we exclude implied warranties to the fullest extent permitted.
      </P>

      <H>15. Changes to these Terms</H>
      <P>
        We may update these Terms from time to time. We will post the updated version on the Platform and change the “Last updated” date. Material changes may also be notified by email or in-product notice where appropriate. The new Terms apply to your continued use of the Platform after they take effect. If you do not agree, stop using the Platform and delete your account.
      </P>

      <H>16. General</H>
      <P>
        If any part of these Terms is found unenforceable, the rest remains in force. Our failure to enforce a right is not a waiver of that right. These Terms are the whole agreement between you and us about the Platform (together with the Privacy Policy and any policies we expressly incorporate). We may refuse or reverse a payment or block access where we reasonably believe there is legal, fraud, or sanctions risk.
      </P>
      <P>
        The Platform may link to third-party sites. We are not responsible for their content or practices.
      </P>

      <H>17. Governing law and disputes</H>
      <P>
        These Terms are governed by the law of England and Wales. The courts of England and Wales have exclusive jurisdiction, without prejudice to any mandatory consumer protections that apply if you live elsewhere in the UK.
      </P>
      <P>
        Most issues can be resolved by emailing {CONTACT}. You may also seek advice from Citizens Advice or other consumer bodies where appropriate.
      </P>

      <H>18. Contact</H>
      <P>
        Unwrapped — {CONTACT}. Website: shopunwrapped.com.
      </P>
    </LegalShell>
  );
}
