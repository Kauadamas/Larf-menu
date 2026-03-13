import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCompanies from "./pages/admin/Companies";
import AdminCategories from "./pages/admin/Categories";
import AdminMenuItems from "./pages/admin/MenuItems";
import AdminUsers from "./pages/admin/Users";
import CompanySettings from "./pages/admin/CompanySettings";
import CompanyMembers from "./pages/admin/CompanyMembers";
import AdminReviews from "./pages/admin/Reviews";
import SmartImport from "./pages/admin/SmartImport";
import PublicMenu from "./pages/PublicMenu";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import { SubdomainRouter } from "./components/SubdomainRouter";

function Router() {
  return (
    <Switch>
      {/* Public menu page - accessible by slug */}
      <Route path="/menu/:slug" component={PublicMenu} />
      {/* Admin panel */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/companies" component={AdminCompanies} />
      <Route path="/admin/companies/:companyId/categories" component={AdminCategories} />
      <Route path="/admin/companies/:companyId/items" component={AdminMenuItems} />
      <Route path="/admin/companies/:companyId/settings" component={CompanySettings} />
      <Route path="/admin/companies/:companyId/members" component={CompanyMembers} />
      <Route path="/admin/companies/:companyId/reviews" component={AdminReviews} />
      <Route path="/admin/companies/:companyId/import" component={SmartImport} />
      <Route path="/admin/users" component={AdminUsers} />
      {/* Login & password */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/reset-password" component={ResetPassword} />
      {/* Landing page */}
      <Route path="/" component={Home} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <SubdomainRouter>
            <Router />
          </SubdomainRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
