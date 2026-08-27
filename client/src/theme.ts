/** Unwrapped design tokens — British Racing Green + Baby Pink. */
export const BG = "#FFE0E7";
export const FG = "#244B36";
export const BORDER = "#F0B8C4";
export const MUTED = "#FFCEDA";
export const MUTED_FG = "#5A6E62";
export const V = "#244B36";
export const V_DEEP = "#244B36";
export const V_RICH = "#2F5F44";
export const CREAM = "#FFF0F4";
export const RADIUS = 20;
export const RADIUS_SM = 999;

/** Soft page wash — baby pink mist */
export const BG_WASH = `
  radial-gradient(ellipse 90% 60% at 10% -10%, rgba(255,192,205,0.55), transparent 55%),
  radial-gradient(ellipse 70% 50% at 95% 20%, rgba(36,75,54,0.06), transparent 50%),
  radial-gradient(ellipse 60% 45% at 50% 100%, rgba(255,208,218,0.65), transparent 55%),
  linear-gradient(165deg, #FFF0F4 0%, #FFE0E7 38%, #FFD5E0 68%, #FFCEDA 100%)
`;

/** Soft mid-section wash */
export const SECTION_WASH = `
  radial-gradient(ellipse 80% 70% at 0% 50%, rgba(36,75,54,0.05), transparent 55%),
  radial-gradient(ellipse 70% 60% at 100% 40%, rgba(255,192,205,0.45), transparent 50%),
  linear-gradient(180deg, #FFD5E0 0%, #FFE0E7 55%, #FFCEDA 100%)
`;

/** Racing-green band instead of flat block */
export const BAND_WASH = `
  radial-gradient(ellipse 70% 80% at 100% 0%, rgba(255,192,205,0.18), transparent 55%),
  radial-gradient(ellipse 50% 60% at 0% 100%, rgba(47,95,68,0.55), transparent 50%),
  linear-gradient(135deg, #2F5F44 0%, #244B36 45%, #1A3526 100%)
`;
