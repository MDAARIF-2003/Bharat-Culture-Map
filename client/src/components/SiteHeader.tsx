import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  Compass,
  Factory,
  Landmark,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserCheck,
  Users,
  X,
  GraduationCap,
} from "lucide-react";
import { apiClient, DemoAccountInfo } from "@/lib/api";
import type { AccountPersonaType, UserAccount } from "@shared/contracts";
import AavishkarDossierModal from "@/components/AavishkarDossierModal";

export const DEMO_ENVIRONMENT_BANNER_TEXT =
  "DEMONSTRATION ENVIRONMENT — Sample profiles, products, transactions and workflow records are illustrative and are not claims about real people, organisations, events or completed transactions.";

export default function SiteHeader() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ecosystemDropdownOpen, setEcosystemDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"demo" | "login" | "register">("demo");
  const [dossierOpen, setDossierOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountInfo[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPersona, setRegPersona] = useState<AccountPersonaType>("BUYER");

  const refreshAuth = async () => {
    try {
      const [statusResp, demoResp] = await Promise.all([
        apiClient.getAuthStatus(),
        apiClient.getDemoAccounts().catch(() => ({ demoAccounts: [] })),
      ]);
      setCurrentUser(statusResp.user);
      setDemoAccounts(demoResp.demoAccounts || []);
    } catch {
      // Ignore initial status error
    }
  };

  useEffect(() => {
    void refreshAuth();
    const handler = () => {
      void refreshAuth();
    };
    window.addEventListener("bcm-auth-changed", handler);
    return () => window.removeEventListener("bcm-auth-changed", handler);
  }, []);

  const navigateTo = (path: string) => {
    setMobileMenuOpen(false);
    setEcosystemDropdownOpen(false);
    setLocation(path);
  };

  const handleDemoAccountSwitch = async (email: string) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      const resp = await apiClient.demoLogin(email);
      setCurrentUser(resp.user);
      setAuthMessage(`Signed in as ${resp.user.fullName}`);
      window.dispatchEvent(new CustomEvent("bcm-auth-changed"));
      setTimeout(() => {
        setAuthModalOpen(false);
        setAuthMessage(null);
      }, 600);
    } catch (err: any) {
      setAuthError(err?.message || "Failed to switch demonstration account.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      const resp = await apiClient.login({
        email: loginEmail,
        password: loginPassword,
      });
      setCurrentUser(resp.user);
      setAuthMessage(`Signed in as ${resp.user.fullName}`);
      window.dispatchEvent(new CustomEvent("bcm-auth-changed"));
      setTimeout(() => {
        setAuthModalOpen(false);
        setAuthMessage(null);
      }, 600);
    } catch (err: any) {
      setAuthError(err?.message || "Invalid credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      const resp = await apiClient.registerAccount({
        fullName: regName,
        email: regEmail,
        password: regPassword,
        accountType: regPersona,
      });
      setCurrentUser(resp.user);
      setAuthMessage(`Registered & signed in as ${resp.user.fullName}`);
      window.dispatchEvent(new CustomEvent("bcm-auth-changed"));
      setTimeout(() => {
        setAuthModalOpen(false);
        setAuthMessage(null);
      }, 600);
    } catch (err: any) {
      setAuthError(err?.message || "Registration failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await apiClient.logout();
      setCurrentUser(null);
      window.dispatchEvent(new CustomEvent("bcm-auth-changed"));
      setAuthModalOpen(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const isActive = (prefix: string) => {
    if (prefix === "/") return location === "/";
    return location.startsWith(prefix);
  };

  return (
    <>
      {/* Unobtrusive Site-Wide Demonstration Environment Banner */}
      <div
        role="region"
        aria-label="Demonstration Environment Notice"
        className="bg-[#1B120C] border-b border-amber-500/30 text-amber-200/95 px-3 py-1.5 text-xs leading-relaxed"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-semibold uppercase tracking-wider text-[11px] shrink-0">
              <Sparkles className="w-3 h-3" /> DEMO_SAMPLE
            </span>
            <span className="text-[12px] text-amber-100/90">
              {DEMO_ENVIRONMENT_BANNER_TEXT}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => {
                setAuthTab("demo");
                setAuthModalOpen(true);
              }}
              className="underline text-amber-300 hover:text-amber-100 font-medium"
            >
              Switch Demo Role ({currentUser ? currentUser.accountType || currentUser.role : "Visitor"})
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Primary Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0F141C]/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="flex items-center gap-2.5 text-left group shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center text-slate-950 font-bold shadow-sm">
              भ
            </div>
            <div>
              <div className="font-serif font-bold text-base tracking-tight text-white group-hover:text-amber-300 transition-colors">
                Bharat CultureMap
              </div>
              <div className="text-[11px] text-slate-400 leading-none">
                Living Heritage • Consent & Provenance
              </div>
            </div>
          </button>

          {/* Desktop Grouped Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-1 text-sm"
          >
            <button
              type="button"
              onClick={() => navigateTo("/")}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/")
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4 text-amber-400" />
              Explore
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/traditions")}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/traditions")
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Traditions
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/practitioners")}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/practitioners")
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              Practitioners
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/art-mart")}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/art-mart")
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              Art-Mart
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/hercraft")}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/hercraft")
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 text-rose-300" />
              HerCraft
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/calendar")}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/calendar") || isActive("/trip-planner")
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              Events and Trips
            </button>

            {/* Grouped Ecosystem Dropdown: Entrepreneurship, Industry-to-Art, Government and Partners */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setEcosystemDropdownOpen((v) => !v)}
                className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/industry-to-art") ||
                  isActive("/government-resources") ||
                  isActive("/entrepreneurship")
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Factory className="w-4 h-4 text-amber-400" />
                Ecosystem & Partners
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {ecosystemDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50">
                  <button
                    type="button"
                    onClick={() => navigateTo("/hercraft")}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-3"
                  >
                    <Sparkles className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        HerCraft Hub
                      </div>
                      <div className="text-xs text-slate-400">
                        Women-led enterprises, SHGs, products & grants
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/entrepreneurship")}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-3"
                  >
                    <Award className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Entrepreneurship
                      </div>
                      <div className="text-xs text-slate-400">
                        Artisan cooperatives, GI readiness & craft incubation
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/industry-to-art")}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-3"
                  >
                    <Factory className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Industry-to-Art
                      </div>
                      <div className="text-xs text-slate-400">
                        6-step surplus material circularity workflow
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/government-resources")}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-3"
                  >
                    <Landmark className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Government and Partners
                      </div>
                      <div className="text-xs text-slate-400">
                        Official schemes, GI registries & illustrative collaborators
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions: Governance Studio + Login / Account */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDossierOpen(true)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:text-white hover:border-amber-300 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Open Avishkar 2024-26 Research Convention Dossier & Jury Defense"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              Avishkar Research Dossier (HLFA)
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/admin")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isActive("/admin")
                  ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                  : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Admin Studio
            </button>

            <button
              type="button"
              onClick={() => navigateTo(currentUser ? "/account" : "/login")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isActive("/login") || isActive("/register") || isActive("/account")
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                  : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              {currentUser ? "My Account" : "Sign In / Register"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab("demo");
                setAuthModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {currentUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="max-w-[140px] truncate">
                    {currentUser.fullName.split(" ")[0]} ({currentUser.accountType || currentUser.role})
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  Login / Account
                </>
              )}
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAuthTab("demo");
                setAuthModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-amber-500 text-slate-950"
            >
              {currentUser ? currentUser.accountType || "Account" : "Login"}
            </button>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-md bg-slate-800 text-slate-200 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigateTo("/")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <Compass className="w-4 h-4 text-amber-400" /> Explore Map
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/traditions")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <BookOpen className="w-4 h-4 text-amber-400" /> Traditions
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/practitioners")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <Users className="w-4 h-4 text-amber-400" /> Practitioners
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/art-mart")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" /> Art-Mart
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/hercraft")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <Sparkles className="w-4 h-4 text-rose-300" /> HerCraft
              </button>
              <button
                type="button"
                onClick={() => navigateTo(currentUser ? "/account" : "/login")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <UserCheck className="w-4 h-4 text-amber-300" />{" "}
                {currentUser ? "My Account" : "Sign In / Register"}
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/calendar")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <Calendar className="w-4 h-4 text-amber-400" /> Events & Trips
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/entrepreneurship")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <Award className="w-4 h-4 text-amber-400" /> Entrepreneurship
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/industry-to-art")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <Factory className="w-4 h-4 text-emerald-400" /> Industry-to-Art
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/government-resources")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm font-medium"
              >
                <Landmark className="w-4 h-4 text-sky-400" /> Gov & Partners
              </button>
            </div>
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setDossierOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-lg border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                Avishkar Research Dossier & Jury Defense (HLFA)
              </button>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo("/admin")}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Studio
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo("/places/loc-district-kolhapur-district")}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" /> Kolhapur Hub
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Account & 1-Click Demo Persona Modal */}
      {authModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Login and Demonstration Account Switcher"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold">
                  LOCAL DEMONSTRATION AUTHENTICATION
                </span>
                <h2 className="text-xl font-serif font-bold text-white mt-1">
                  Account & Role Switcher
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Switch between role personas (Super Admin, Field Researcher, Practitioner, Seller, Buyer) or sign in with credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentUser && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-emerald-300 font-semibold uppercase">
                    Active Session ({currentUser.accountType || currentUser.role})
                  </div>
                  <div className="text-sm font-bold text-white">
                    {currentUser.fullName}
                  </div>
                  <div className="text-xs text-slate-300">{currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={authLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-800 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthTab("demo")}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  authTab === "demo"
                    ? "border-amber-400 text-amber-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                1-Click Demo Personas
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("login")}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  authTab === "login"
                    ? "border-amber-400 text-amber-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("register")}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  authTab === "register"
                    ? "border-amber-400 text-amber-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Register Buyer / Artisan
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-xs text-red-200">
                {authError}
              </div>
            )}
            {authMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200">
                {authMessage}
              </div>
            )}

            {authTab === "demo" && (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {demoAccounts.map((acc) => (
                  <div
                    key={acc.email}
                    className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {acc.fullName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold">
                          {acc.accountType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {acc.description}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {acc.email} • Password: DemoPassword!2026
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() => handleDemoAccountSwitch(acc.email)}
                      className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shrink-0"
                    >
                      Use Persona
                    </button>
                  </div>
                ))}
              </div>
            )}

            {authTab === "login" && (
              <form onSubmit={handleStandardLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin.demo@bharat-culturemap.local"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="DemoPassword!2026"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm"
                >
                  {authLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {authTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g., Ananya Joshi (Demo Buyer)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="patron@example.org"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Account Role Persona
                    </label>
                    <select
                      value={regPersona}
                      onChange={(e) =>
                        setRegPersona(e.target.value as AccountPersonaType)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                    >
                      <option value="BUYER">Buyer / Cultural Patron</option>
                      <option value="ARTISAN_SELLER">Artisan / Art-Mart Seller</option>
                      <option value="PRACTITIONER">Practitioner / Teacher</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a local demo password"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm"
                >
                  {authLoading ? "Creating Demo Account..." : "Create Demonstration Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Avishkar Research Convention Dossier Modal */}
      <AavishkarDossierModal
        open={dossierOpen}
        onClose={() => setDossierOpen(false)}
      />
    </>
  );
}
