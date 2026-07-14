import { useState, useEffect } from "react";
import { trpc } from "../../trpc";
import BusinessShell, { BG, FG, BORDER, MUTED_FG, V } from "../../components/business/BusinessShell";
import useIsMobile from "../../hooks/useIsMobile";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  border: `1px solid ${BORDER}`,
  background: BG,
  color: FG,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12,
};

export default function BusinessSettings() {
  const isMobile = useIsMobile(768);
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.businesses.myProfile.useQuery();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [website, setWebsite] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [locName, setLocName] = useState("Main Location");
  const [locAddress, setLocAddress] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locPostcode, setLocPostcode] = useState("");
  const [locError, setLocError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setDescription(profile.description ?? "");
    setInstagramHandle(profile.instagramHandle ?? "");
    setWebsite(profile.website ?? "");
  }, [profile]);

  const updateProfile = trpc.businesses.updateProfile.useMutation({
    onSuccess: async () => {
      setProfileError("");
      setProfileSaved(true);
      await utils.businesses.myProfile.invalidate();
      setTimeout(() => setProfileSaved(false), 2500);
    },
    onError: (e) => setProfileError(e.message),
  });

  const addLocation = trpc.businesses.addLocation.useMutation({
    onSuccess: async () => {
      setLocError("");
      setLocAddress("");
      setLocPostcode("");
      await utils.businesses.myProfile.invalidate();
    },
    onError: (e) => setLocError(e.message),
  });

  const removeLocation = trpc.businesses.removeLocation.useMutation({
    onSuccess: () => utils.businesses.myProfile.invalidate(),
    onError: (e) => setLocError(e.message),
  });

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    updateProfile.mutate({
      name,
      description: description || undefined,
      instagramHandle: instagramHandle || undefined,
      website: website || undefined,
    });
  }

  async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=gb`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await resp.json();
      if (data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch { /* fall through */ }
    return null;
  }

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    setLocError("");
    if (!locAddress.trim() || !locCity.trim()) {
      setLocError("Address and city are required.");
      return;
    }
    const query = [locAddress, locCity, locPostcode, "UK"].filter(Boolean).join(", ");
    const coords = await geocodeAddress(query);
    if (!coords) {
      setLocError("Couldn't find that address — check it and try again.");
      return;
    }
    addLocation.mutate({
      name: locName.trim() || "Main Location",
      address: locAddress.trim(),
      city: locCity.trim(),
      postcode: locPostcode.trim() || undefined,
      latitude: coords.lat,
      longitude: coords.lng,
    });
  }

  if (isLoading) {
    return (
      <BusinessShell>
        <div style={{ padding: 80, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 11, color: MUTED_FG, letterSpacing: "0.15em" }}>
          LOADING
        </div>
      </BusinessShell>
    );
  }

  return (
    <BusinessShell>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px", maxWidth: 640 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 8 }}>
          Settings
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 40 }}>
          Manage your business profile and pickup locations.
        </p>

        {/* Profile */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
            BUSINESS PROFILE
          </div>
          <form onSubmit={handleProfileSave}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 6 }}>Business name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />

            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 6 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 6 }}>Instagram</label>
            <input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@yourshop" style={inputStyle} />

            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 6 }}>Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" type="url" style={inputStyle} />

            {profileError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, marginBottom: 12 }}>{profileError}</p>
            )}
            {profileSaved && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#15803D", marginBottom: 12 }}>Saved.</p>
            )}

            <button
              type="submit"
              disabled={updateProfile.isPending}
              style={{
                background: FG, color: BG, border: "none",
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "13px 24px", cursor: "pointer",
                opacity: updateProfile.isPending ? 0.6 : 1,
              }}
            >
              {updateProfile.isPending ? "SAVING…" : "SAVE PROFILE"}
            </button>
          </form>
        </section>

        {/* Contact */}
        <section style={{ marginBottom: 48, paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
            CONTACT
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, marginBottom: 4 }}>
            {profile?.contactEmail}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.5 }}>
            Account email from your application. To change it, contact{" "}
            <a href="mailto:anna@shopunwrapped.com" style={{ color: V, textDecoration: "none" }}>anna@shopunwrapped.com</a>.
          </p>
          {profile?.slug && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginTop: 12 }}>
              Public page:{" "}
              <a href={`/business/${profile.slug}`} style={{ color: FG, textDecoration: "none" }}>
                /business/{profile.slug}
              </a>
            </p>
          )}
        </section>

        {/* Locations */}
        <section style={{ paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
            PICKUP LOCATIONS
          </div>

          {profile?.locations?.length ? (
            <div style={{ border: `1px solid ${BORDER}`, marginBottom: 24 }}>
              {profile.locations.map((loc, i) => (
                <div
                  key={loc.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16,
                    padding: "16px 20px",
                    borderBottom: i < profile.locations.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, marginBottom: 4 }}>{loc.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>
                      {loc.address}, {loc.city}{loc.postcode ? ` ${loc.postcode}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLocation.mutate({ locationId: loc.id })}
                    disabled={removeLocation.isPending}
                    style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG,
                      background: "none", border: "none", cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 24 }}>
              No locations yet. Add one before publishing drops.
            </p>
          )}

          <form onSubmit={handleAddLocation}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 6 }}>Location name</label>
            <input value={locName} onChange={(e) => setLocName(e.target.value)} style={inputStyle} />

            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 6 }}>Address</label>
            <input value={locAddress} onChange={(e) => setLocAddress(e.target.value)} required style={inputStyle} />

            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 6 }}>City</label>
            <input value={locCity} onChange={(e) => setLocCity(e.target.value)} required style={inputStyle} />

            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 6 }}>Postcode</label>
            <input value={locPostcode} onChange={(e) => setLocPostcode(e.target.value)} style={inputStyle} />

            {locError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, marginBottom: 12 }}>{locError}</p>
            )}

            <button
              type="submit"
              disabled={addLocation.isPending}
              style={{
                background: FG, color: BG, border: "none",
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "13px 24px", cursor: "pointer",
                opacity: addLocation.isPending ? 0.6 : 1,
              }}
            >
              {addLocation.isPending ? "ADDING…" : "ADD LOCATION"}
            </button>
          </form>
        </section>
      </div>
    </BusinessShell>
  );
}
