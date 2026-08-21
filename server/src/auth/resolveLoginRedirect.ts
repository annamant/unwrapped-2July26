export type LoginPortal = "shopper" | "business";

export function resolveLoginRedirect(
  user: { onboardingComplete: boolean; role: string },
  business: { status: string } | undefined,
  portal: LoginPortal,
): string {
  const hasActiveBusiness = business?.status === "active";
  const isAdminOnly = user.role === "admin" && !hasActiveBusiness;

  // Active merchants always open in business mode; shopper browse is opt-in
  // via "Browse as shopper" in the dashboard shell.
  if (hasActiveBusiness) {
    return "/dashboard";
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
