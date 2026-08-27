/** Unwrapped design tokens — Espresso + Baby Pink. */
export const BG = "#FFE0E7";
export const FG = "#160703";
export const BORDER = "#F0B8C4";
export const MUTED = "#FFCEDA";
export const MUTED_FG = "#8B555E";
export const V = "#160703";
export const V_DEEP = "#160703";
export const V_RICH = "#2C1410";
export const CREAM = "#FFF0F4";
export const RADIUS = 20;
export const RADIUS_SM = 999;

/** Soft page wash — baby pink mist */
export const BG_WASH = `
  radial-gradient(ellipse 90% 60% at 10% -10%, rgba(255,192,205,0.55), transparent 55%),
  radial-gradient(ellipse 70% 50% at 95% 20%, rgba(22,7,3,0.06), transparent 50%),
  radial-gradient(ellipse 60% 45% at 50% 100%, rgba(255,208,218,0.65), transparent 55%),
  linear-gradient(165deg, #FFF0F4 0%, #FFE0E7 38%, #FFD5E0 68%, #FFCEDA 100%)
`;

/** Soft mid-section wash */
export const SECTION_WASH = `
  radial-gradient(ellipse 80% 70% at 0% 50%, rgba(22,7,3,0.05), transparent 55%),
  radial-gradient(ellipse 70% 60% at 100% 40%, rgba(255,192,205,0.45), transparent 50%),
  linear-gradient(180deg, #FFD5E0 0%, #FFE0E7 55%, #FFCEDA 100%)
`;

/** Espresso band instead of flat block */
export const BAND_WASH = `
  radial-gradient(ellipse 70% 80% at 100% 0%, rgba(255,192,205,0.18), transparent 55%),
  radial-gradient(ellipse 50% 60% at 0% 100%, rgba(44,20,16,0.55), transparent 50%),
  linear-gradient(135deg, #2C1410 0%, #160703 45%, #0D0402 100%)
`;
