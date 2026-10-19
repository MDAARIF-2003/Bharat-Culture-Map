import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { apiClient, DemoAccountInfo } from "@/lib/api";
import {
  PUBLIC_REGISTRATION_PERSONAS,
  STAFF_ROLES,
  USER_ROLES,
  type AccountPersonaType,
  type UserRole,
} from "@shared/const";
import type {
  ArtMartOrder,
  ArtMartProduct,
  HerCraftEnterprise,
  PractitionerProfile,
  UserAccount,
} from "@shared/contracts";

const PERSONA_META: Record<
  string,
  { label: string; subtitle: string; badgeClass: string }
> = {
  BUYER: {
    label: "Cultural Patron & Buyer",
    subtitle:
      "Browse Art-Mart crafts, manage cart & wishlist, test simulated checkout, and track or cancel demo orders.",
    badgeClass: "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F3E5AB]",
  },
  PRACTITIONER: {
    label: "Practitioner & Teacher",
    subtitle:
      "Manage your illustrative practitioner profile, workshop offerings, teaching schedule, and availability.",
    badgeClass: "border-teal-500/40 bg-teal-500/15 text-teal-200",
  },
  ARTISAN_SELLER: {
    label: "Artisan & Craft Seller",
    subtitle:
      "Manage Art-Mart craft listings, update demo stock levels, and request surplus industrial materials.",
    badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-200",
  },
  HERCRAFT_ENTREPRENEUR: {
    label: "HerCraft Women-Led Enterprise",
    subtitle:
      "Submit and manage women-led SHGs, craft cooperatives, training cohorts, and explore women artisan grants.",
    badgeClass: "border-rose-400/40 bg-rose-500/15 text-rose-200",
  },
  VISITOR: {
    label: "Cultural Explorer & Visitor",
    subtitle:
      "Explore India's living traditions, build multi-day cultural itineraries, and submit moderated enquiries.",
    badgeClass: "border-sky-400/40 bg-sky-500/15 text-sky-200",
  },
  FIELD_RESEARCHER: {
    label: "Field Researcher (Staff Role)",
    subtitle:
      "Document cultural records, attach verified sources, record informed consent, and submit entries for review.",
    badgeClass: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  },
  SUPER_ADMIN: {
    label: "Super Administrator (Staff Role)",
    subtitle:
      "Full platform governance: manage staff roles, approve publications, review HerCraft & Industry-to-Art queues.",
    badgeClass: "border-purple-400/40 bg-purple-500/15 text-purple-200",
  },
};

export default function AuthAccount() {
  const [location, setLocation] = useLocation();
  const mode: "login" | "register" | "account" = location.startsWith("/register")
    ? "register"
    : location.startsWith("/account")
      ? "account"
      : "login";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [demoModeEnabled, setDemoModeEnabled] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountInfo[]>([]);
  const [banner, setBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPersona, setRegPersona] = useState<AccountPersonaType>("BUYER");
  const [regLocation, setRegLocation] = useState("Kolhapur, Maharashtra");
  const [regOrganisation, setRegOrganisation] = useState("");
  const [regLanguage, setRegLanguage] = useState("Marathi");
  const [regBio, setRegBio] = useState("");

  // Account profile edit form state
  const [profFullName, setProfFullName] = useState("");
  const [profPersona, setProfPersona] = useState<AccountPersonaType>("BUYER");
  const [profLocation, setProfLocation] = useState("");
  const [profOrganisation, setProfOrganisation] = useState("");
  const [profLanguage, setProfLanguage] = useState("English");
  const [profPhone, setProfPhone] = useState("");
  const [profBio, setProfBio] = useState("");
  const [profCurrentPassword, setProfCurrentPassword] = useState("");
  const [profNewPassword, setProfNewPassword] = useState("");

  // Role-specific account data
  const [orders, setOrders] = useState<ArtMartOrder[]>([]);
  const [practitioners, setPractitioners] = useState<PractitionerProfile[]>([]);
  const [products, setProducts] = useState<ArtMartProduct[]>([]);
  const [herCraftList, setHerCraftList] = useState<HerCraftEnterprise[]>([]);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);

  const syncProfileForm = (u: UserAccount) => {
    setProfFullName(u.fullName || "");
    setProfPersona((u.accountType as AccountPersonaType) || "VISITOR");
    setProfLocation(u.locationLabel || "");
    setProfOrganisation(u.organisationOrGuild || "");
    setProfLanguage(u.preferredLanguage || "English");
    setProfPhone(u.phone || "");
    setProfBio(u.bio || "");
  };

  const loadRoleSpecificData = async (currentUser: UserAccount) => {
    try {
      const [ordRes, practRes, prodRes, hcRes] = await Promise.all([
        apiClient.listArtMartOrders(
          currentUser.accountType === "BUYER" ? currentUser.email : undefined
        ),
        apiClient.listPractitioners({ includeUnpublished: true }),
        apiClient.listArtMartProducts({ includeUnpublished: true }),
        apiClient.queryHerCraftDirectory({ includePending: true }),
      ]);
      setOrders(ordRes.orders || []);
      setPractitioners(practRes.practitioners || []);
      setProducts(prodRes.products || []);
      setHerCraftList(hcRes.enterprises || []);

      if (currentUser.role === "SUPER_ADMIN") {
        const usersRes = await apiClient.listUsers();
        setAllUsers(usersRes.users || []);
      }
    } catch {
      // Ignore secondary dashboard load errors
    }
  };

  const refreshAuth = async () => {
    setLoading(true);
    try {
      const [statusRes, demoRes] = await Promise.all([
        apiClient.getAuthStatus(),
        apiClient
          .getDemoAccounts()
          .catch(() => ({ demoAccounts: [], demoModeEnabled: false })),
      ]);
      setNeedsBootstrap(statusRes.needsBootstrap);
      setUser(statusRes.user);
      setDemoModeEnabled(
        statusRes.demoModeEnabled ?? demoRes.demoModeEnabled ?? true
      );
      setDemoAccounts(demoRes.demoAccounts || []);

      if (statusRes.user) {
        syncProfileForm(statusRes.user);
        await loadRoleSpecificData(statusRes.user);
      }
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Failed to check authentication session.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAuth();
  }, [location]);

  const notifyHeaderRefresh = () => {
    window.dispatchEvent(new CustomEvent("bcm-auth-changed"));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!loginEmail.trim() || !loginPassword) {
      setBanner({
        type: "error",
        message: "Please enter both your email address and password.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      setUser(res.user);
      syncProfileForm(res.user);
      notifyHeaderRefresh();
      setBanner({
        type: "success",
        message: `Welcome back, ${res.user.fullName}. Redirecting to your account workspace...`,
      });
      setLocation("/account");
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Sign-in failed. Check your credentials.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoQuickLogin = async (email: string) => {
    setBanner(null);
    setSubmitting(true);
    try {
      const res = await apiClient.demoLogin(email);
      setUser(res.user);
      syncProfileForm(res.user);
      notifyHeaderRefresh();
      setBanner({
        type: "success",
        message: `Switched to demonstration persona: ${res.user.fullName} (Role: ${res.user.role}).`,
      });
      setLocation("/account");
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Demo persona sign-in failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!regFullName.trim() || !regEmail.trim().includes("@")) {
      setBanner({
        type: "error",
        message: "Please enter your full name and a valid email address.",
      });
      return;
    }
    if (regPassword.length < 8) {
      setBanner({
        type: "error",
        message:
          "Password must be at least 8 characters long and include letters and numbers or symbols.",
      });
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setBanner({
        type: "error",
        message: "Passwords do not match. Please re-enter your confirmation password.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.registerAccount({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        accountType: regPersona,
        locationLabel: regLocation.trim(),
        organisationOrGuild: regOrganisation.trim(),
        preferredLanguage: regLanguage.trim(),
        bio: regBio.trim(),
      });
      setUser(res.user);
      syncProfileForm(res.user);
      notifyHeaderRefresh();
      setBanner({
        type: "success",
        message: `Account created for ${res.user.fullName} with least-privileged PUBLIC_USER authorization and ${res.user.accountType} persona.`,
      });
      setLocation("/account");
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Registration failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBanner(null);
    setSubmitting(true);
    try {
      const res = await apiClient.updateProfile({
        fullName: profFullName,
        accountType: profPersona,
        locationLabel: profLocation,
        organisationOrGuild: profOrganisation,
        preferredLanguage: profLanguage,
        phone: profPhone,
        bio: profBio,
        currentPassword: profCurrentPassword || undefined,
        newPassword: profNewPassword || undefined,
      });
      setUser(res.user);
      syncProfileForm(res.user);
      setProfCurrentPassword("");
      setProfNewPassword("");
      notifyHeaderRefresh();
      setBanner({
        type: "success",
        message: "Your account profile settings have been saved.",
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Could not update profile.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await apiClient.updateArtMartOrderStatus(orderId, "CANCELLED_DEMO");
      if (user) {
        await loadRoleSpecificData(user);
      }
      setBanner({
        type: "success",
        message: "Simulated order cancelled and demo craft inventory restored.",
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Failed to cancel demo order.",
      });
    }
  };

  const handleAdminRoleChange = async (
    targetUserId: string,
    newRole: UserRole
  ) => {
    try {
      await apiClient.adminUpdateUser(targetUserId, { role: newRole });
      if (user) {
        await loadRoleSpecificData(user);
      }
      setBanner({
        type: "success",
        message: `Updated user authorization role to ${newRole}.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Could not update user role.",
      });
    }
  };

  const handleLogout = async () => {
    await apiClient.logout().catch(() => {});
    setUser(null);
    notifyHeaderRefresh();
    setBanner({
      type: "info",
      message: "You have been signed out of Bharat CultureMap.",
    });
    setLocation("/login");
  };

  const isStaff = user
    ? (STAFF_ROLES as readonly string[]).includes(user.role)
    : false;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F5EFE6] pb-20">
      {/* Top Hero Header */}
      <section className="border-b border-white/10 bg-gradient-to-b from-[#131B2E] to-[#0B0F17] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-medium text-[#F3E5AB]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>
                  Least-Privileged Account Architecture • Persona & Staff Role Separation
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {mode === "login"
                  ? "Sign In to Bharat CultureMap"
                  : mode === "register"
                    ? "Create Your Public Account"
                    : "My Account & Persona Workspace"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-300">
                {mode === "login"
                  ? "Access your cultural patron orders, practitioner workshop studio, artisan seller inventory, HerCraft collective profile, or staff governance tools."
                  : mode === "register"
                    ? "Choose your community participation persona. All public registrations start with least-privileged PUBLIC_USER permissions—administrative roles require Super Admin verification."
                    : "Manage your profile, review your persona-specific activity across Art-Mart, Practitioners, and HerCraft, and inspect your active permission boundaries."}
              </p>
            </div>

            {/* Mode Switcher Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  mode === "login"
                    ? "bg-[#D4AF37] text-[#0B0F17] shadow-md"
                    : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setLocation("/register")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  mode === "register"
                    ? "bg-[#D4AF37] text-[#0B0F17] shadow-md"
                    : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register</span>
              </button>
              <button
                type="button"
                onClick={() => setLocation("/account")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  mode === "account"
                    ? "bg-[#D4AF37] text-[#0B0F17] shadow-md"
                    : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>My Account</span>
              </button>
              <button
                type="button"
                onClick={() => setLocation("/admin")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2.5 text-xs font-semibold text-teal-200 hover:bg-teal-500/20 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
                <span>Staff / Admin Login</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {banner && (
          <div
            className={`mb-6 flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${
              banner.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : banner.type === "error"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {banner.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              )}
              <span>{banner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-10 text-center text-slate-300">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#D4AF37]" />
            <p className="mt-3 text-sm">Restoring session & account workspace...</p>
          </div>
        ) : (
          <>
            {/* =============================================================== */}
            {/* MODE 1: LOGIN (/login)                                          */}
            {/* =============================================================== */}
            {mode === "login" && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6 sm:p-8 shadow-xl">
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="h-5 w-5 text-[#D4AF37]" />
                      <h2 className="font-serif text-xl font-bold text-white">
                        Sign In with Email & Password
                      </h2>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Sign in with a registered public persona account or an authorized staff governance account.
                    </p>

                    {user && (
                      <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
                        <div className="font-semibold">
                          Active session: {user.fullName} ({user.email})
                        </div>
                        <div className="mt-1 text-emerald-300/80">
                          Authorization Role: <strong>{user.role}</strong> • Persona:{" "}
                          <strong>{user.accountType || "VISITOR"}</strong>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setLocation("/account")}
                            className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
                          >
                            Open My Account
                          </button>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                      <div>
                        <label
                          htmlFor="login-email"
                          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          Email Address
                        </label>
                        <input
                          id="login-email"
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="you@example.org"
                          className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="login-password"
                          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          Password
                        </label>
                        <input
                          id="login-password"
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#0B0F17] hover:bg-[#e3be42] disabled:opacity-50 transition"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>{submitting ? "Signing In..." : "Sign In"}</span>
                      </button>
                    </form>

                    <div className="mt-6 border-t border-white/10 pt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span>New to Bharat CultureMap?</span>
                      <button
                        type="button"
                        onClick={() => setLocation("/register")}
                        className="font-semibold text-[#D4AF37] hover:underline"
                      >
                        Create a Public Account →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Demo Persona Switcher & Least-Privilege Security Matrix */}
                <div className="lg:col-span-7 space-y-6">
                  {demoModeEnabled && demoAccounts.length > 0 ? (
                    <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#131B2E] p-6 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                          <h2 className="font-serif text-xl font-bold text-white">
                            One-Click Local Demonstration Personas
                          </h2>
                        </div>
                        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200">
                          Disabled by Default in Production
                        </span>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm text-slate-300">
                        Test the platform immediately as a Super Admin, Field Researcher, Practitioner, Artisan Seller, HerCraft Women-Led Enterprise Lead, or Cultural Patron Buyer. Notice how public personas hold least-privileged{" "}
                        <code className="text-[#F3E5AB]">PUBLIC_USER</code> authorization while staff governance accounts hold explicit staff roles.
                      </p>

                      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        {demoAccounts.map((acc) => {
                          const isCurrent =
                            user?.email.toLowerCase() === acc.email.toLowerCase();
                          const accIsStaff = (
                            STAFF_ROLES as readonly string[]
                          ).includes(acc.role);
                          return (
                            <div
                              key={acc.email}
                              className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                                isCurrent
                                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                                  : "border-white/10 bg-[#0B0F17]/70 hover:border-white/25"
                              }`}
                            >
                              <div>
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F3E5AB]">
                                    Persona: {acc.accountType}
                                  </span>
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                      accIsStaff
                                        ? "bg-teal-500/20 text-teal-200 border border-teal-500/40"
                                        : "bg-slate-800 text-slate-300 border border-white/10"
                                    }`}
                                  >
                                    Role: {acc.role}
                                  </span>
                                </div>
                                <h3 className="mt-2.5 text-sm font-bold text-white">
                                  {acc.fullName}
                                </h3>
                                <p className="mt-0.5 text-[11px] font-mono text-slate-400 break-all">
                                  {acc.email}
                                </p>
                                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                                  {acc.description}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleDemoQuickLogin(acc.email)}
                                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-2 text-xs font-semibold text-[#F3E5AB] hover:bg-[#D4AF37] hover:text-[#0B0F17] transition"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>
                                  {isCurrent
                                    ? "Active Persona (Open Account)"
                                    : "Switch to This Persona"}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                      <h3 className="font-serif text-lg font-bold text-white">
                        Production Authentication Mode Active
                      </h3>
                      <p className="mt-1 text-xs text-slate-300">
                        Public demo quick-login credentials are disabled in production (`ENABLE_DEMO_ACCOUNTS` is off). Please sign in with your verified account credentials.
                      </p>
                    </div>
                  )}

                  {needsBootstrap && (
                    <div className="rounded-2xl border border-teal-500/40 bg-teal-950/30 p-5 text-xs text-teal-100">
                      <div className="font-bold text-sm text-teal-200">
                        Initial Super Admin Bootstrap Available
                      </div>
                      <p className="mt-1 text-teal-200/80">
                        No user accounts exist in the database yet. You can bootstrap the initial{" "}
                        <code>SUPER_ADMIN</code> account on the{" "}
                        <button
                          type="button"
                          onClick={() => setLocation("/admin")}
                          className="underline font-semibold text-white"
                        >
                          /admin governance page
                        </button>
                        .
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* MODE 2: REGISTER (/register)                                    */}
            {/* =============================================================== */}
            {mode === "register" && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6 sm:p-8 shadow-xl">
                    <div className="flex items-center gap-2.5">
                      <UserPlus className="h-5 w-5 text-[#D4AF37]" />
                      <h2 className="font-serif text-xl font-bold text-white">
                        Register a Public Community Account
                      </h2>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300">
                      Select how you participate in India's cultural heritage ecosystem. All public registrations receive the least-privileged{" "}
                      <code className="text-[#F3E5AB]">PUBLIC_USER</code> role.
                    </p>

                    <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          1. Choose Your Public Account Persona
                        </label>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {PUBLIC_REGISTRATION_PERSONAS.map((persona) => {
                            const meta = PERSONA_META[persona];
                            const selected = regPersona === persona;
                            return (
                              <button
                                key={persona}
                                type="button"
                                onClick={() => setRegPersona(persona)}
                                className={`text-left rounded-xl border p-3.5 transition ${
                                  selected
                                    ? "border-[#D4AF37] bg-[#D4AF37]/15"
                                    : "border-white/10 bg-[#0B0F17]/70 hover:border-white/25"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {meta?.label || persona}
                                  </span>
                                  <span className="text-[10px] font-mono uppercase text-[#D4AF37]">
                                    {persona}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-300 leading-snug">
                                  {meta?.subtitle}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="reg-fullname"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                          >
                            Full Name or Chosen Display Name *
                          </label>
                          <input
                            id="reg-fullname"
                            type="text"
                            required
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="e.g., Smt. Kavita Jadhav"
                            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="reg-email"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                          >
                            Email Address *
                          </label>
                          <input
                            id="reg-email"
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="name@example.org"
                            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="reg-password"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                          >
                            Password (Min 8 chars, letter + number/symbol) *
                          </label>
                          <input
                            id="reg-password"
                            type="password"
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="reg-confirm"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                          >
                            Confirm Password *
                          </label>
                          <input
                            id="reg-confirm"
                            type="password"
                            required
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                            City / District / State
                          </label>
                          <input
                            type="text"
                            value={regLocation}
                            onChange={(e) => setRegLocation(e.target.value)}
                            placeholder="Kolhapur, Maharashtra"
                            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Guild / SHG / Organisation
                          </label>
                          <input
                            type="text"
                            value={regOrganisation}
                            onChange={(e) => setRegOrganisation(e.target.value)}
                            placeholder="Optional cooperative or studio"
                            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Preferred Language
                          </label>
                          <input
                            type="text"
                            value={regLanguage}
                            onChange={(e) => setRegLanguage(e.target.value)}
                            placeholder="Marathi / English / Hindi"
                            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Short Cultural Interest or Craft Note
                        </label>
                        <textarea
                          rows={2}
                          value={regBio}
                          onChange={(e) => setRegBio(e.target.value)}
                          placeholder="Tell us about the craft, performing art, or region you are exploring or practising..."
                          className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#0B0F17] hover:bg-[#e3be42] disabled:opacity-50 transition"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>
                          {submitting
                            ? "Creating Account..."
                            : "Create Least-Privileged Public Account"}
                        </span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Column: Security & Role Separation Explanation */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="rounded-2xl border border-teal-500/30 bg-[#131B2E] p-6">
                    <div className="flex items-center gap-2 text-teal-300">
                      <Lock className="h-5 w-5" />
                      <h3 className="font-serif text-lg font-bold text-white">
                        How Persona & Staff Permissions Are Separated
                      </h3>
                    </div>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      Bharat CultureMap strictly separates <strong>Public Account Personas</strong> from <strong>Staff Governance Roles</strong>:
                    </p>
                    <ul className="mt-3 space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400 mt-0.5" />
                        <span>
                          <strong>Public Registration (`PUBLIC_USER`):</strong> New Buyers, Practitioners, Artisan Sellers, and HerCraft Entrepreneurs receive{" "}
                          <code className="text-[#F3E5AB]">role: "PUBLIC_USER"</code>. They can never modify other people's cultural records, approve Rights Passports, or publish unreviewed records.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400 mt-0.5" />
                        <span>
                          <strong>No Automatic Privilege Escalation:</strong> Selecting{" "}
                          <code>BUYER</code> does not grant{" "}
                          <code>LANGUAGE_REVIEWER</code>; selecting{" "}
                          <code>ARTISAN_SELLER</code> does not grant{" "}
                          <code>FIELD_RESEARCHER</code>; selecting{" "}
                          <code>PRACTITIONER</code> does not grant{" "}
                          <code>PRACTITIONER_APPROVER</code>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400 mt-0.5" />
                        <span>
                          <strong>Administrator-Only Role Upgrades:</strong> Only an authenticated{" "}
                          <code>SUPER_ADMIN</code> can assign or upgrade staff governance roles.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* MODE 3: ACCOUNT WORKSPACE (/account)                            */}
            {/* =============================================================== */}
            {mode === "account" && (
              <>
                {!user ? (
                  <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-8 text-center max-w-xl mx-auto">
                    <Lock className="mx-auto h-10 w-10 text-[#D4AF37]" />
                    <h2 className="mt-3 font-serif text-2xl font-bold text-white">
                      Sign In Required
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Sign in with your account or select a local demonstration persona to view your profile and role-specific tools.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setLocation("/login")}
                        className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-[#0B0F17] hover:bg-[#e3be42]"
                      >
                        Go to Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocation("/register")}
                        className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Create an Account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Account Identity Banner */}
                    <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#131B2E] p-6 sm:p-8">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                                PERSONA_META[user.accountType || "VISITOR"]
                                  ?.badgeClass ||
                                "border-white/20 bg-white/10 text-white"
                              }`}
                            >
                              Persona:{" "}
                              {PERSONA_META[user.accountType || "VISITOR"]
                                ?.label ||
                                user.accountType ||
                                "VISITOR"}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                                isStaff
                                  ? "border-teal-400/40 bg-teal-500/15 text-teal-200"
                                  : "border-slate-600 bg-slate-800/80 text-slate-200"
                              }`}
                            >
                              Authorization Role: {user.role}
                            </span>
                          </div>
                          <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-white">
                            {user.fullName}
                          </h2>
                          <p className="mt-1 text-xs sm:text-sm text-slate-300">
                            {user.email}
                            {user.locationLabel ? ` • ${user.locationLabel}` : ""}
                            {user.organisationOrGuild
                              ? ` • ${user.organisationOrGuild}`
                              : ""}
                          </p>
                          {user.bio && (
                            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-300">
                              {user.bio}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {isStaff && (
                            <button
                              type="button"
                              onClick={() => setLocation("/admin")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              <span>Open Admin Governance</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 transition"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                      {/* Left Column: Edit Profile & Security */}
                      <div className="lg:col-span-5">
                        <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                          <h3 className="font-serif text-lg font-bold text-white">
                            Edit Profile & Preferences
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            Update your display name, community persona, location, and password.
                          </p>

                          <form
                            onSubmit={handleProfileSave}
                            className="mt-5 space-y-4"
                          >
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Full Name / Display Name
                              </label>
                              <input
                                type="text"
                                required
                                value={profFullName}
                                onChange={(e) => setProfFullName(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Public Participation Persona
                              </label>
                              <select
                                value={profPersona}
                                onChange={(e) =>
                                  setProfPersona(
                                    e.target.value as AccountPersonaType
                                  )
                                }
                                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                              >
                                {PUBLIC_REGISTRATION_PERSONAS.map((p) => (
                                  <option key={p} value={p}>
                                    {PERSONA_META[p]?.label || p} ({p})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  value={profLocation}
                                  onChange={(e) =>
                                    setProfLocation(e.target.value)
                                  }
                                  placeholder="Kolhapur, Maharashtra"
                                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                  Preferred Language
                                </label>
                                <input
                                  type="text"
                                  value={profLanguage}
                                  onChange={(e) =>
                                    setProfLanguage(e.target.value)
                                  }
                                  placeholder="Marathi / English"
                                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                  Guild / SHG / Organisation
                                </label>
                                <input
                                  type="text"
                                  value={profOrganisation}
                                  onChange={(e) =>
                                    setProfOrganisation(e.target.value)
                                  }
                                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                  Phone (Private)
                                </label>
                                <input
                                  type="text"
                                  value={profPhone}
                                  onChange={(e) => setProfPhone(e.target.value)}
                                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Bio / Cultural Practice Note
                              </label>
                              <textarea
                                rows={3}
                                value={profBio}
                                onChange={(e) => setProfBio(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                              />
                            </div>

                            <div className="border-t border-white/10 pt-3">
                              <div className="text-xs font-semibold text-slate-300 mb-2">
                                Optional Password Change
                              </div>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <input
                                  type="password"
                                  value={profCurrentPassword}
                                  onChange={(e) =>
                                    setProfCurrentPassword(e.target.value)
                                  }
                                  placeholder="Current password"
                                  className="w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                                />
                                <input
                                  type="password"
                                  value={profNewPassword}
                                  onChange={(e) =>
                                    setProfNewPassword(e.target.value)
                                  }
                                  placeholder="New password (min 8 chars)"
                                  className="w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={submitting}
                              className="w-full rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#0B0F17] hover:bg-[#e3be42] transition"
                            >
                              {submitting ? "Saving..." : "Save Profile Changes"}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right Column: Role & Persona-Specific Views */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* 1. Buyer / Patron Orders View */}
                        <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                              <h3 className="font-serif text-lg font-bold text-white">
                                Art-Mart Simulated Orders & Patron Activity
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLocation("/art-mart")}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline"
                            >
                              <span>Browse Art-Mart</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            Simulated demonstration orders linked to your account or demo patron workspace.
                          </p>

                          <div className="mt-4 space-y-3">
                            {orders.slice(0, 4).map((ord) => (
                              <div
                                key={ord.id}
                                className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0F17]/70 p-4 sm:flex-row sm:items-center"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[#F3E5AB]">
                                      {ord.orderNumber}
                                    </span>
                                    <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase">
                                      {ord.status}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-300">
                                    {ord.items
                                      .map(
                                        (it) =>
                                          `${it.productTitle} (×${it.quantity})`
                                      )
                                      .join(", ")}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    Total: ₹{ord.totalInr.toLocaleString("en-IN")} •{" "}
                                    {ord.shippingCity}, {ord.shippingState}
                                  </p>
                                </div>
                                {ord.status !== "CANCELLED_DEMO" && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelOrder(ord.id)}
                                    className="self-start sm:self-center shrink-0 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                                  >
                                    Cancel Demo Order
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. HerCraft Women-Led Enterprises View */}
                        <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-rose-300" />
                              <h3 className="font-serif text-lg font-bold text-white">
                                HerCraft — Women-Led Enterprises & Collectives
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLocation("/hercraft")}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline"
                            >
                              <span>Open HerCraft Hub</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {user.linkedHerCraftId
                              ? `Linked HerCraft Collective ID: ${user.linkedHerCraftId}`
                              : "Explore or nominate women-led SHGs, cooperatives, and craft studios."}
                          </p>
                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {herCraftList.slice(0, 4).map((ent) => (
                              <div
                                key={ent.id}
                                className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0B0F17]/70 p-3.5"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 text-[10px] text-rose-300">
                                    <span>{ent.enterpriseType}</span>
                                    <span>{ent.approvalStatus}</span>
                                  </div>
                                  <h4 className="mt-1 text-xs font-bold text-white">
                                    {ent.enterpriseName}
                                  </h4>
                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    {ent.cityName || ent.districtName},{" "}
                                    {ent.stateName} • {ent.womenArtisansCount}{" "}
                                    women artisans
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLocation(`/hercraft/${ent.slug}`)
                                  }
                                  className="mt-3 text-left text-[11px] font-semibold text-[#D4AF37] hover:underline"
                                >
                                  View Enterprise Profile →
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. Practitioner & Artisan Seller Quick Access */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] p-5">
                            <div>
                              <div className="flex items-center gap-2 text-teal-300">
                                <Users className="h-4 w-4" />
                                <h4 className="text-sm font-bold text-white">
                                  Practitioner & Workshop Studio
                                </h4>
                              </div>
                              <p className="mt-1.5 text-xs text-slate-300">
                                {user.linkedPractitionerId
                                  ? `Linked Practitioner Profile: ${user.linkedPractitionerId}`
                                  : `${practitioners.length} demonstration practitioner profiles active across Kolhapur & India.`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLocation("/practitioners")}
                              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:underline"
                            >
                              <span>Manage Practitioner Profiles</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] p-5">
                            <div>
                              <div className="flex items-center gap-2 text-amber-300">
                                <Store className="h-4 w-4" />
                                <h4 className="text-sm font-bold text-white">
                                  Artisan Seller & Industry-to-Art
                                </h4>
                              </div>
                              <p className="mt-1.5 text-xs text-slate-300">
                                {user.linkedSellerId
                                  ? `Linked Storefront: ${user.linkedSellerId}`
                                  : `${products.length} craft products listed in Art-Mart catalogue.`}
                              </p>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => setLocation("/art-mart")}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline"
                              >
                                <span>Seller Studio →</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setLocation("/industry-to-art")}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:underline"
                              >
                                <span>Material Circularity →</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 4. Super Admin User Role Management Table */}
                        {user.role === "SUPER_ADMIN" && allUsers.length > 0 && (
                          <div className="rounded-2xl border border-purple-500/30 bg-[#131B2E] p-6">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-purple-300" />
                                <h3 className="font-serif text-lg font-bold text-white">
                                  Super Admin — Least-Privilege Role Assignment
                                </h3>
                              </div>
                              <span className="text-[11px] font-mono text-purple-200">
                                SUPER_ADMIN ONLY
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-300">
                              Upgrade or revoke staff governance roles for registered accounts. Public registrations always default to{" "}
                              <code>PUBLIC_USER</code>.
                            </p>

                            <div className="mt-4 space-y-2.5">
                              {allUsers.map((u) => (
                                <div
                                  key={u.id}
                                  className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-[#0B0F17]/70 p-3.5 sm:flex-row sm:items-center"
                                >
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">
                                      {u.fullName}
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 truncate">
                                      {u.email} • Persona:{" "}
                                      {u.accountType || "VISITOR"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <select
                                      aria-label={`Role for ${u.email}`}
                                      value={u.role}
                                      onChange={(e) =>
                                        handleAdminRoleChange(
                                          u.id,
                                          e.target.value as UserRole
                                        )
                                      }
                                      className="rounded-lg border border-white/15 bg-[#131B2E] px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                                    >
                                      {USER_ROLES.map((r) => (
                                        <option key={r} value={r}>
                                          {r}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
