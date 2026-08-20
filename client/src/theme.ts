/** Unwrapped design tokens — red-on-red system (no heavy black). */
export const BG = "#FFF4EF";
export const FG = "#3A1610";
export const BORDER = "#F3C9BC";
export const MUTED = "#FFE3D7";
export const MUTED_FG = "#8A564A";
export const V = "#FF2D12";
export const V_DEEP = "#9E1C0E";
export const V_RICH = "#C92210";
export const CREAM = "#FFF8F4";
export const RADIUS = 20;
export const RADIUS_SM = 999;

/** Soft page wash — blush → peach → coral mist */
export const BG_WASH = `
  radial-gradient(ellipse 90% 60% at 10% -10%, rgba(255,90,60,0.28), transparent 55%),
  radial-gradient(ellipse 70% 50% at 95% 20%, rgba(255,45,18,0.16), transparent 50%),
  radial-gradient(ellipse 60% 45% at 50% 100%, rgba(255,160,120,0.35), transparent 55%),
  linear-gradient(165deg, #FFF8F4 0%, #FFE8DE 38%, #FFF1EA 68%, #FFD9CC 100%)
`;

/** Soft mid-section wash */
export const SECTION_WASH = `
  radial-gradient(ellipse 80% 70% at 0% 50%, rgba(255,45,18,0.1), transparent 55%),
  radial-gradient(ellipse 70% 60% at 100% 40%, rgba(255,120,80,0.18), transparent 50%),
  linear-gradient(180deg, #FFE8DE 0%, #FFF4EF 55%, #FFE3D7 100%)
`;

/** Wine band instead of flat black/red block */
export const BAND_WASH = `
  radial-gradient(ellipse 70% 80% at 100% 0%, rgba(255,120,80,0.45), transparent 55%),
  radial-gradient(ellipse 50% 60% at 0% 100%, rgba(255,45,18,0.35), transparent 50%),
  linear-gradient(135deg, #C92210 0%, #9E1C0E 45%, #7A150A 100%)
`;
