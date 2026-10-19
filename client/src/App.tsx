import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import SiteHeader from "./components/SiteHeader";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminPanel from "./pages/AdminPanel";
import ArtMart from "./pages/ArtMart";
import AuthAccount from "./pages/AuthAccount";
import CulturalCalendar from "./pages/CulturalCalendar";
import EcosystemHub from "./pages/EcosystemHub";
import HerCraft from "./pages/HerCraft";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import PlaceDetail from "./pages/PlaceDetail";
import Practitioners from "./pages/Practitioners";
import TraditionExplorer from "./pages/TraditionExplorer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={AuthAccount} />
      <Route path="/register" component={AuthAccount} />
      <Route path="/account" component={AuthAccount} />
      <Route path="/hercraft" component={HerCraft} />
      <Route path="/hercraft/:slug" component={HerCraft} />
      <Route path="/traditions" component={TraditionExplorer} />
      <Route path="/traditions/:slug" component={TraditionExplorer} />
      <Route path="/practitioners" component={Practitioners} />
      <Route path="/practitioners/:slug" component={Practitioners} />
      <Route path="/art-mart" component={ArtMart} />
      <Route path="/art-mart/:slug" component={ArtMart} />
      <Route path="/calendar" component={CulturalCalendar} />
      <Route path="/calendar/:id" component={CulturalCalendar} />
      <Route path="/trip-planner" component={CulturalCalendar} />
      <Route path="/industry-to-art" component={EcosystemHub} />
      <Route path="/government-resources" component={EcosystemHub} />
      <Route path="/entrepreneurship" component={EcosystemHub} />
      <Route path="/places/:id" component={PlaceDetail} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen flex flex-col bg-[#0B0F17] overflow-x-hidden">
            <SiteHeader />
            <main className="flex-1 w-full max-w-full overflow-x-hidden">
              <Router />
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
