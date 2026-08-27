import { Switch, Route, Redirect, useLocation } from "wouter";
import { trpc } from "./trpc";
import SeoHead from "./components/SeoHead";
import { seoForPath } from "./lib/seo";

// Pages
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import BusinessSignIn from "./pages/BusinessSignIn";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import DropDetail from "./pages/DropDetail";
import Ticket from "./pages/Ticket";
import Profile from "./pages/Profile";
import BusinessApply from "./pages/BusinessApply";
import Recommend from "./pages/Recommend";
import BusinessProfile from "./pages/BusinessProfile";
import BusinessDashboard from "./pages/business/Dashboard";
import BusinessCreateDrop from "./pages/business/CreateDrop";
import BusinessDrops from "./pages/business/Drops";
import BusinessScanner from "./pages/business/Scanner";
import BusinessSettings from "./pages/business/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminApplications from "./pages/admin/Applications";
import AdminRecommendations from "./pages/admin/Recommendations";
import AdminUsers from "./pages/admin/Users";
import AdminDatabases from "./pages/admin/Databases";
import AdminBusinesses from "./pages/admin/Businesses";
import AdminDrops from "./pages/admin/Drops";
import AdminReservations from "./pages/admin/Reservations";
import AdminApparelMap from "./pages/admin/ApparelMap";
import ResetPassword from "./pages/ResetPassword";
import Instagram from "./pages/Instagram";
import Resources from "./pages/Resources";
import { Privacy, Terms } from "./pages/Legal";
import LondonHub from "./pages/LondonHub";
import BoroughLanding from "./pages/BoroughLanding";

/** Applies path-based defaults; BusinessProfile / DropDetail / London pages override with richer tags. */
function RouteSeo() {
  const [loc] = useLocation();
  const path = loc.split("?")[0] || "/";
  // Deep public pages set their own SeoHead once data loads — skip defaults to avoid flicker.
  if (path.startsWith("/business/") || path.startsWith("/drop/") || path === "/london" || path.startsWith("/london/")) {
    return null;
  }
  const seo = seoForPath(path);
  return <SeoHead {...seo} />;
}

export default function App() {
  const { data: user, isLoading, isError } = trpc.auth.me.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  // Merchants land in the business dashboard by default; they can switch to
  // shopper browse from BusinessShell. Admins without a shop go to /admin.
  const postLoginPath = user?.hasBusiness
    ? "/dashboard"
    : user?.role === "admin"
      ? "/admin"
      : "/home";

  if (isLoading && !isError) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100vh", gap: 16, background: "#FFE0E7",
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", background: "#244B36",
          boxShadow: "0 0 0 0 rgba(36,75,54,0.5)",
          animation: "uw-boot-pulse 1.2s ease-out infinite",
        }} />
        <style>{`@keyframes uw-boot-pulse{0%{transform:scale(1);box-shadow:0 0 0 0 rgba(36,75,54,.45)}70%{transform:scale(1.15);box-shadow:0 0 0 16px rgba(36,75,54,0)}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(36,75,54,0)}}`}</style>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
          color: "#244B36", letterSpacing: "0.04em",
        }}>
          Unwrapping…
        </div>
      </div>
    );
  }

  return (
    <>
      <RouteSeo />
      <Switch>
        {/* Public */}
        <Route path="/" component={() => user ? <Redirect to={postLoginPath} /> : <Landing />} />
        <Route path="/signin" component={() => user ? <Redirect to={postLoginPath} /> : <SignIn />} />
        <Route path="/business/signin" component={() => user?.hasBusiness ? <Redirect to="/dashboard" /> : <BusinessSignIn />} />
        <Route path="/business-apply" component={BusinessApply} />
        <Route path="/recommend" component={Recommend} />
        <Route path="/instagram" component={Instagram} />
        <Route path="/resources" component={Resources} />
        <Route path="/london" component={LondonHub} />
        <Route path="/london/:borough" component={BoroughLanding} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/business/:slug" component={BusinessProfile} />

        {/* Shopper — requires auth */}
        <Route path="/onboarding" component={() => !user ? <Redirect to="/signin" /> : user.hasBusiness ? <Redirect to="/dashboard" /> : user.role === "admin" ? <Redirect to="/admin" /> : <Onboarding />} />
        <Route path="/home" component={() => !user ? <Redirect to="/signin" /> : <Home />} />
        <Route path="/drop/:id" component={DropDetail} />
        <Route path="/ticket/:id" component={() => !user ? <Redirect to="/signin" /> : <Ticket />} />
        <Route path="/profile" component={() => !user ? <Redirect to="/signin" /> : <Profile />} />

        {/* Business dashboard */}
        <Route path="/dashboard" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessDashboard />} />
        <Route path="/dashboard/drops/new" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessCreateDrop />} />
        <Route path="/dashboard/drops" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessDrops />} />
        <Route path="/dashboard/scanner" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessScanner />} />
        <Route path="/dashboard/settings" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessSettings />} />

        {/* Admin */}
        <Route path="/admin" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminDashboard />} />
        <Route path="/admin/databases" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminDatabases />} />
        <Route path="/admin/users" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminUsers />} />
        <Route path="/admin/businesses" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminBusinesses />} />
        <Route path="/admin/drops" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminDrops />} />
        <Route path="/admin/reservations" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminReservations />} />
        <Route path="/admin/applications" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminApplications />} />
        <Route path="/admin/recommendations" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminRecommendations />} />
        <Route path="/admin/apparel-map" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminApparelMap />} />

        {/* 404 */}
        <Route>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 64, color: "#E2E2E2" }}>404</span>
            <a href="/" style={{ fontFamily: "'DM Sans', sans-serif", color: "#244B36", textDecoration: "none" }}>Back to Unwrapped</a>
          </div>
        </Route>
      </Switch>
    </>
  );
}
