export type LoginPortal = "shopper" | "business";

export function resolveLoginRedirect(
  user: { onboardingComplete: boolean; role: string },
  business: { status: string } | undefined,
  portal: LoginPortal,
): string {
  const hasActiveBusiness = business?.status === "active";
  const isAdminOnly = user.role === "admin" && !hasActiveBusiness;

  if (hasActiveBusiness) {
    return portal === "business" ? "/dashboard" : "/home";
  }

  if (isAdminOnly) {
    return "/admin";
  }

  if (portal === "business") {
    return "/business/signin";
  }

  if (!user.onboardingComplete) return "/onboarding";
  return "/home";
}
