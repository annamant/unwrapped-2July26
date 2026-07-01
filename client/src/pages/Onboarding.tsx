import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../trpc";

const V = "rgb(232, 52, 28)";

const CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<"categories" | "location">("categories");
  const [locationInput, setLocationInput] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const complete = trpc.auth.completeOnboarding.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/home");
    },
    onError: (e) => setError(e.message),
  });

  function toggleCategory(cat: string) {
    setSelected(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  }

  function handleSubmit() {
    if (selected.length < 3) {
      setError("Select at least 3 categories.");
      return;
    }
    complete.mutate({ interestCategories: selected });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FCFCFC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#ABABAB", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Step 1 of 1
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: "#020202", letterSpacing: "-1px", marginBottom: 12 }}>
            What are you into?
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#888", lineHeight: 1.6 }}>
            Pick at least 3 categories. We'll show you drops from local businesses that match.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 40 }}>
          {CATEGORIES.map(cat => {
            const active = selected.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "10px 18px",
                  cursor: "pointer",
                  border: active ? `2px solid ${V}` : "2px solid #E2E2E2",
                  background: active ? "#FFF0EE" : "#FCFCFC",
                  color: active ? V : "#020202",
                  transition: "all 0.1s",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: V, marginBottom: 16 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={complete.isPending || selected.length < 3}
          style={{
            width: "100%",
            background: selected.length >= 3 ? V : "#E2E2E2",
            color: "#FCFCFC",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            padding: "16px 0",
            border: "none",
            cursor: selected.length >= 3 ? "pointer" : "not-allowed",
            transition: "background 0.1s",
          }}
        >
          {complete.isPending ? "Saving..." : `Continue with ${selected.length} selected`}
        </button>
      </div>
    </div>
  );
}
