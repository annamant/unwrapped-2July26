/** Keep aligned with server/src/signupInterests.ts. */

export const SIGNUP_INTERESTS = [
  { id: "food_drink", label: "Food & drink" },
  { id: "hair_grooming", label: "Hair & grooming" },
  { id: "beauty", label: "Beauty" },
  { id: "fashion_vintage", label: "Fashion & vintage" },
  { id: "home_gifts", label: "Home & gifts" },
  { id: "fitness_wellbeing", label: "Fitness & wellbeing" },
] as const;

export type SignupInterestId = (typeof SIGNUP_INTERESTS)[number]["id"];
