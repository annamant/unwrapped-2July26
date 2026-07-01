import { Switch, Route, Redirect } from "wouter";
import { trpc } from "./trpc";

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
import BusinessProfile from "./pages/BusinessProfile";
import BusinessDashboard from "./pages/business/Dashboard";
import BusinessCreateDrop from "./pages/business/CreateDrop";
import BusinessDrops from "./pages/business/Drops";
import BusinessScanner from "./pages/business/Scanner";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminApplications from "./pages/admin/Applications";

export default function App() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#ABABAB", letterSpacing: 2 }}>
          LOADING
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={() => user ? <Redirect to="/home" /> : <Landing />} />
      <Route path="/signin" component={() => user ? <Redirect to="/home" /> : <SignIn />} />
      <Route path="/business/signin" component={() => user?.hasBusiness ? <Redirect to="/dashboard" /> : <BusinessSignIn />} />
      <Route path="/business-apply" component={BusinessApply} />
      <Route path="/business/:slug" component={BusinessProfile} />

      {/* Consumer — requires auth */}
      <Route path="/onboarding" component={() => !user ? <Redirect to="/signin" /> : <Onboarding />} />
      <Route path="/home" component={() => !user ? <Redirect to="/signin" /> : <Home />} />
      <Route path="/drop/:id" component={DropDetail} />
      <Route path="/ticket/:id" component={() => !user ? <Redirect to="/signin" /> : <Ticket />} />
      <Route path="/profile" component={() => !user ? <Redirect to="/signin" /> : <Profile />} />

      {/* Business dashboard */}
      <Route path="/dashboard" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessDashboard />} />
      <Route path="/dashboard/drops/new" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessCreateDrop />} />
      <Route path="/dashboard/drops" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessDrops />} />
      <Route path="/dashboard/scanner" component={() => !user?.hasBusiness ? <Redirect to="/business/signin" /> : <BusinessScanner />} />

      {/* Admin */}
      <Route path="/admin" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminDashboard />} />
      <Route path="/admin/applications" component={() => user?.role !== "admin" ? <Redirect to="/home" /> : <AdminApplications />} />

      {/* 404 */}
      <Route>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 64, color: "#E2E2E2" }}>404</span>
          <a href="/" style={{ fontFamily: "'DM Sans', sans-serif", color: "rgb(232, 52, 28)", textDecoration: "none" }}>Back to Unwrapped</a>
        </div>
      </Route>
    </Switch>
  );
}
