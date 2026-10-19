import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Filter,
  Heart,
  Landmark,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { STAFF_ROLES } from "@shared/const";
import type {
  ArtMartProduct,
  HerCraftEnterprise,
  HerCraftOpportunity,
  PractitionerProfile,
  UserAccount,
} from "@shared/contracts";

const ENTERPRISE_TYPE_LABELS: Record<string, string> = {
  WOMEN_SHG: "Women's Self-Help Group (SHG)",
  ARTISAN_COOPERATIVE: "Women's Artisan Cooperative",
  MASTER_ARTISAN_STUDIO: "Women Master Artisan Studio",
  CULINARY_COLLECTIVE: "Women's Culinary & Agrarian Collective",
  TEXTILE_WEAVERS_GUILD: "Women's Handloom & Weavers Guild",
};

const OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
  GOVERNMENT_SCHEME: "Central / State Government Scheme",
  TRAINING_FELLOWSHIP: "Skill Training & Craft Fellowship",
  MICRO_GRANT_OR_CREDIT: "Micro-Grant & Working Capital Credit",
  EXHIBITION_AND_MARKET: "Exhibition & Market Access",
  INCUBATION_PROGRAM: "Design & Circular Craft Incubation",
};

export default function HerCraft() {
  const [, setLocation] = useLocation();
  const [matchDetail, paramsDetail] = useRoute("/hercraft/:slug");
  const detailSlug = matchDetail ? paramsDetail?.slug : null;

  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [enterprises, setEnterprises] = useState<HerCraftEnterprise[]>([]);
  const [opportunities, setOpportunities] = useState<HerCraftOpportunity[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ArtMartProduct[]>(
    []
  );
  const [facets, setFacets] = useState<{
    totalPublishedEnterprises: number;
    pendingReviewEnterprises: number;
    totalWomenArtisansRepresented: number;
    statesRepresented: string[];
    craftCategories: string[];
    enterpriseTypes: string[];
  }>({
    totalPublishedEnterprises: 0,
    pendingReviewEnterprises: 0,
    totalWomenArtisansRepresented: 0,
    statesRepresented: [],
    craftCategories: [],
    enterpriseTypes: [],
  });

  // Detail state
  const [detailData, setDetailData] = useState<{
    enterprise: HerCraftEnterprise;
    relatedProducts: ArtMartProduct[];
    linkedPractitioner: PractitionerProfile | null;
    opportunities: HerCraftOpportunity[];
  } | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<
    "enterprises" | "products" | "opportunities" | "submit"
  >("enterprises");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEnterpriseType, setSelectedEnterpriseType] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedOpportunityType, setSelectedOpportunityType] = useState("All");
  const [includePending, setIncludePending] = useState(false);

  // Banner & Enquiry Modal
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [enquiryTarget, setEnquiryTarget] = useState<{
    title: string;
    context: string;
  } | null>(null);
  const [enqName, setEnqName] = useState("");
  const [enqContact, setEnqContact] = useState("");
  const [enqMessage, setEnqMessage] = useState("");

  // Submit Enterprise Form
  const [newEntName, setNewEntName] = useState("");
  const [newEntLeader, setNewEntLeader] = useState("");
  const [newEntType, setNewEntType] =
    useState<HerCraftEnterprise["enterpriseType"]>("WOMEN_SHG");
  const [newEntCategory, setNewEntCategory] = useState(
    "Leather & Footwear Craft"
  );
  const [newEntTraditionSlug, setNewEntTraditionSlug] =
    useState("kolhapuri-chappal");
  const [newEntState, setNewEntState] = useState("Maharashtra");
  const [newEntDistrict, setNewEntDistrict] = useState("Kolhapur District");
  const [newEntCity, setNewEntCity] = useState("Kolhapur");
  const [newEntCount, setNewEntCount] = useState("15");
  const [newEntSummary, setNewEntSummary] = useState("");
  const [newEntNarrative, setNewEntNarrative] = useState("");
  const [newEntCrafts, setNewEntCrafts] = useState(
    "Hand-Braided Kolhapuri Veni Straps, Zero-Nail Cord Stitching"
  );

  // Submit Opportunity Form
  const [newOppTitle, setNewOppTitle] = useState("");
  const [newOppType, setNewOppType] =
    useState<HerCraftOpportunity["opportunityType"]>("GOVERNMENT_SCHEME");
  const [newOppOrganiser, setNewOppOrganiser] = useState("");
  const [newOppStateScope, setNewOppStateScope] = useState("Maharashtra");
  const [newOppEligibility, setNewOppEligibility] = useState("");
  const [newOppBenefit, setNewOppBenefit] = useState("");
  const [newOppUrl, setNewOppUrl] = useState("https://handicrafts.nic.in/");

  const isStaff = user
    ? (STAFF_ROLES as readonly string[]).includes(user.role)
    : false;

  const loadDirectory = async (staffPendingFlag?: boolean) => {
    setLoading(true);
    try {
      const authStatus = await apiClient.getAuthStatus().catch(() => ({
        user: null,
      }));
      setUser(authStatus.user);
      const userIsStaff = authStatus.user
        ? (STAFF_ROLES as readonly string[]).includes(authStatus.user.role)
        : false;
      const wantPending =
        staffPendingFlag !== undefined ? staffPendingFlag : userIsStaff;
      setIncludePending(wantPending);

      const dir = await apiClient.queryHerCraftDirectory({
        includePending: wantPending,
      });
      setEnterprises(dir.enterprises || []);
      setOpportunities(dir.opportunities || []);
      setFeaturedProducts(dir.featuredProducts || []);
      setFacets(dir.facets);

      if (detailSlug) {
        const det = await apiClient
          .getHerCraftEnterpriseBySlug(detailSlug)
          .catch(() => null);
        setDetailData(det);
      } else {
        setDetailData(null);
      }
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Failed to load HerCraft directory.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDirectory();
  }, [detailSlug]);

  const filteredEnterprises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enterprises.filter((e) => {
      if (
        !includePending &&
        (e.publicationStatus !== "PUBLISHED" || e.approvalStatus !== "APPROVED")
      ) {
        return false;
      }
      if (selectedCategory !== "All" && e.craftCategory !== selectedCategory) {
        return false;
      }
      if (
        selectedEnterpriseType !== "All" &&
        e.enterpriseType !== selectedEnterpriseType
      ) {
        return false;
      }
      if (
        selectedState !== "All" &&
        e.stateName.toLowerCase() !== selectedState.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedDistrict !== "All" &&
        (e.districtName || "").toLowerCase() !== selectedDistrict.toLowerCase()
      ) {
        return false;
      }
      if (q) {
        const hay = [
          e.enterpriseName,
          e.leaderOrCollectiveLabel,
          e.craftCategory,
          e.traditionTitle || "",
          e.stateName,
          e.districtName || "",
          e.cityName || "",
          e.shortSummary,
          ...e.signatureCrafts,
          ...e.productsAndTechniques,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    enterprises,
    includePending,
    searchQuery,
    selectedCategory,
    selectedEnterpriseType,
    selectedState,
    selectedDistrict,
  ]);

  const filteredOpportunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (
        selectedOpportunityType !== "All" &&
        o.opportunityType !== selectedOpportunityType
      ) {
        return false;
      }
      if (
        selectedState !== "All" &&
        !o.stateScope.toLowerCase().includes("all india") &&
        !o.stateScope.toLowerCase().includes(selectedState.toLowerCase())
      ) {
        return false;
      }
      if (q) {
        const hay = [
          o.title,
          o.organiserName,
          o.stateScope,
          o.eligibilitySummary,
          o.benefitSummary,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [opportunities, searchQuery, selectedOpportunityType, selectedState]);

  const allDistricts = useMemo(() => {
    const set = new Set<string>();
    for (const e of enterprises) {
      if (e.districtName) set.add(e.districtName);
    }
    return Array.from(set).sort();
  }, [enterprises]);

  const handleSubmitEnterprise = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!newEntName.trim() || !newEntSummary.trim()) {
      setBanner({
        type: "error",
        message: "Enterprise name and short summary are required.",
      });
      return;
    }
    try {
      const res = await apiClient.createHerCraftEnterprise({
        enterpriseName: newEntName.trim(),
        leaderOrCollectiveLabel:
          newEntLeader.trim() ||
          "Women-Led Artisan Collective (Demo Submission)",
        enterpriseType: newEntType,
        craftCategory: newEntCategory,
        traditionSlug: newEntTraditionSlug,
        traditionTitle: newEntTraditionSlug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        stateName: newEntState.trim(),
        districtName: newEntDistrict.trim() || null,
        cityName: newEntCity.trim() || null,
        womenArtisansCount: Math.max(1, Number(newEntCount || 10)),
        shortSummary: newEntSummary.trim(),
        storyNarrative: newEntNarrative.trim() || newEntSummary.trim(),
        signatureCrafts: newEntCrafts
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setNewEntName("");
      setNewEntSummary("");
      setNewEntNarrative("");
      await loadDirectory(true);
      setBanner({
        type: "success",
        message: `Submitted "${res.enterprise.enterpriseName}" (${res.enterprise.approvalStatus} / ${res.enterprise.publicationStatus}).`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Failed to submit HerCraft enterprise.",
      });
    }
  };

  const handleModerateEnterprise = async (
    id: string,
    approvalStatus: HerCraftEnterprise["approvalStatus"],
    publicationStatus: HerCraftEnterprise["publicationStatus"]
  ) => {
    try {
      await apiClient.updateHerCraftEnterprise(id, {
        approvalStatus,
        publicationStatus,
      });
      await loadDirectory(true);
      setBanner({
        type: "success",
        message: `Updated HerCraft enterprise status to ${approvalStatus} / ${publicationStatus}.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Failed to update enterprise status.",
      });
    }
  };

  const handleSubmitOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!newOppTitle.trim() || !newOppEligibility.trim()) {
      setBanner({
        type: "error",
        message: "Opportunity title and eligibility summary are required.",
      });
      return;
    }
    try {
      const res = await apiClient.createHerCraftOpportunity({
        title: newOppTitle.trim(),
        opportunityType: newOppType,
        organiserName:
          newOppOrganiser.trim() || "Women Artisan Support Programme (Demo)",
        stateScope: newOppStateScope.trim() || "All India",
        eligibilitySummary: newOppEligibility.trim(),
        benefitSummary: newOppBenefit.trim() || "Training & market support.",
        applicationOrOfficialUrl:
          newOppUrl.trim() || "https://handicrafts.nic.in/",
      });
      setNewOppTitle("");
      setNewOppEligibility("");
      setNewOppBenefit("");
      await loadDirectory(true);
      setBanner({
        type: "success",
        message: `Created HerCraft opportunity "${res.opportunity.title}" (${res.opportunity.approvalStatus}).`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Failed to create opportunity.",
      });
    }
  };

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryTarget || !enqName.trim() || !enqContact.trim()) return;
    try {
      await apiClient.submitCommunityEnquiry({
        enquiryType: "WORKSHOP_ENQUIRY",
        senderName: enqName.trim(),
        senderContact: enqContact.trim(),
        message: `[HerCraft Enquiry — ${enquiryTarget.title}] ${enqMessage.trim()}`,
      });
      setEnquiryTarget(null);
      setEnqName("");
      setEnqContact("");
      setEnqMessage("");
      setBanner({
        type: "success",
        message:
          "Your moderated HerCraft enquiry has been logged for community review.",
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Could not submit enquiry.",
      });
    }
  };

  // ===========================================================================
  // DETAIL VIEW (/hercraft/:slug)
  // ===========================================================================
  if (detailSlug) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#0B0F17] text-[#F5EFE6] p-12 text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#D4AF37]" />
          <p className="mt-3 text-sm text-slate-300">
            Loading HerCraft enterprise profile...
          </p>
        </div>
      );
    }

    if (!detailData) {
      return (
        <div className="min-h-screen bg-[#0B0F17] text-[#F5EFE6] p-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-400" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-white">
            HerCraft Enterprise Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            The requested women-led cultural enterprise profile does not exist or is awaiting moderation approval.
          </p>
          <button
            type="button"
            onClick={() => setLocation("/hercraft")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-[#0B0F17]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to HerCraft Directory</span>
          </button>
        </div>
      );
    }

    const { enterprise, relatedProducts, linkedPractitioner, opportunities: relOpps } =
      detailData;

    return (
      <div className="min-h-screen bg-[#0B0F17] text-[#F5EFE6] pb-20">
        <div className="border-b border-white/10 bg-gradient-to-b from-[#131B2E] to-[#0B0F17] py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setLocation("/hercraft")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to HerCraft Women-Led Enterprises</span>
            </button>

            <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
              <strong>DEMO_SAMPLE DISCLOSURE:</strong> {enterprise.demoDisclaimer}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#131B2E]">
                  <img
                    src={enterprise.heroImageUrl}
                    alt={enterprise.enterpriseName}
                    className="h-64 sm:h-72 w-full object-cover"
                  />
                  <div className="p-3.5 text-[11px] text-slate-400 border-t border-white/10">
                    Media Credit: {enterprise.imageCredit}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-0.5 text-xs font-semibold text-rose-200">
                      {ENTERPRISE_TYPE_LABELS[enterprise.enterpriseType] ||
                        enterprise.enterpriseType}
                    </span>
                    <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-0.5 text-xs font-semibold text-[#F3E5AB]">
                      {enterprise.craftCategory}
                    </span>
                    <span className="rounded-full border border-teal-400/40 bg-teal-500/10 px-3 py-0.5 text-xs font-semibold text-teal-200">
                      {enterprise.womenArtisansCount} Women Artisans
                    </span>
                  </div>

                  <h1 className="mt-3 font-serif text-2xl sm:text-4xl font-bold text-white">
                    {enterprise.enterpriseName}
                  </h1>
                  <p className="mt-1 text-sm text-[#D4AF37]">
                    {enterprise.leaderOrCollectiveLabel}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#D4AF37]" />
                      {enterprise.cityName || enterprise.districtName},{" "}
                      {enterprise.stateName}
                    </span>
                    {enterprise.traditionSlug && (
                      <button
                        type="button"
                        onClick={() =>
                          setLocation(`/traditions/${enterprise.traditionSlug}`)
                        }
                        className="inline-flex items-center gap-1 text-teal-300 hover:underline font-semibold"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Tradition: {enterprise.traditionTitle}</span>
                      </button>
                    )}
                  </div>

                  <p className="mt-4 text-sm text-slate-200 leading-relaxed">
                    {enterprise.shortSummary}
                  </p>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {enterprise.storyNarrative}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      setEnquiryTarget({
                        title: enterprise.enterpriseName,
                        context: enterprise.contactOrEnquiryNote,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-[#0B0F17] hover:bg-[#e3be42]"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Send Moderated Collective Enquiry</span>
                  </button>
                  {enterprise.sourceUrl && (
                    <a
                      href={enterprise.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    >
                      <span>Official Craft Reference</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Sections */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
              <h3 className="font-serif text-lg font-bold text-white">
                Signature Women-Led Crafts
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {enterprise.signatureCrafts.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4AF37] mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
              <h3 className="font-serif text-lg font-bold text-white">
                Materials & Process Techniques
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {enterprise.productsAndTechniques.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
              <h3 className="font-serif text-lg font-bold text-white">
                Collective Support & Ecosystem Needs
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {enterprise.supportNeeds.map((n, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Award className="h-4 w-4 shrink-0 text-rose-300 mt-0.5" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-slate-400 border-t border-white/10 pt-3">
                Source Note: {enterprise.sourceAttribution}
              </p>
            </div>
          </div>

          {/* Workshops & Training */}
          {enterprise.trainingAndWorkshops.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
              <h3 className="font-serif text-xl font-bold text-white">
                Training Cohorts & Learning Workshops (Demo)
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {enterprise.trainingAndWorkshops.map((wk) => (
                  <div
                    key={wk.id}
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0B0F17]/80 p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="rounded-md bg-teal-500/15 px-2.5 py-0.5 text-teal-200 font-semibold">
                          {wk.mode} • {wk.durationLabel}
                        </span>
                        <span className="font-bold text-[#F3E5AB]">
                          ₹{wk.feeInr.toLocaleString("en-IN")} (Demo)
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-white">
                        {wk.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-300">
                        {wk.summary}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        Schedule: {wk.scheduleLabel} • Level: {wk.skillLevel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEnquiryTarget({
                          title: wk.title,
                          context: wk.scheduleLabel,
                        })
                      }
                      className="mt-4 self-start rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3.5 py-1.5 text-xs font-semibold text-[#F3E5AB] hover:bg-[#D4AF37] hover:text-[#0B0F17] transition"
                    >
                      Request Workshop Cohort Info
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Art-Mart Products */}
          {relatedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-serif text-xl font-bold text-white">
                  Related Art-Mart Craft Listings
                </h3>
                <button
                  type="button"
                  onClick={() => setLocation("/art-mart")}
                  className="text-xs font-semibold text-[#D4AF37] hover:underline"
                >
                  Open Full Art-Mart →
                </button>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] p-5"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-[#D4AF37]">
                        {prod.category}
                      </span>
                      <h4 className="mt-1 font-serif text-base font-bold text-white">
                        {prod.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                        {prod.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#F3E5AB]">
                        ₹{prod.priceInr.toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLocation(`/art-mart/${prod.slug}`)}
                        className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#0B0F17]"
                      >
                        View Craft Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Practitioner & Relevant Schemes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {linkedPractitioner && (
              <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                    Associated Master Practitioner (Demo Sample)
                  </span>
                  <h3 className="mt-2 font-serif text-lg font-bold text-white">
                    {linkedPractitioner.displayName}
                  </h3>
                  <p className="text-xs text-[#D4AF37]">
                    {linkedPractitioner.roleTitle}
                  </p>
                  <p className="mt-2 text-xs text-slate-300">
                    {linkedPractitioner.shortBio}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocation(`/practitioners/${linkedPractitioner.slug}`)
                  }
                  className="mt-4 self-start rounded-xl border border-teal-400/40 bg-teal-500/15 px-4 py-2 text-xs font-semibold text-teal-200 hover:bg-teal-500/25"
                >
                  Open Practitioner Profile →
                </button>
              </div>
            )}

            {relOpps.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                <h3 className="font-serif text-lg font-bold text-white">
                  Applicable Women Artisan Schemes & Grants
                </h3>
                <div className="mt-3 space-y-3">
                  {relOpps.slice(0, 3).map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-xl border border-white/10 bg-[#0B0F17]/70 p-3.5"
                    >
                      <div className="text-xs font-bold text-white">
                        {opp.title}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-300">
                        {opp.benefitSummary}
                      </p>
                      <a
                        href={opp.applicationOrOfficialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37] hover:underline"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // DIRECTORY VIEW (/hercraft)
  // ===========================================================================
  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F5EFE6] pb-20">
      {/* Hero Banner */}
      <section className="border-b border-white/10 bg-gradient-to-b from-[#1A1626] via-[#131B2E] to-[#0B0F17] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/15 px-3.5 py-1 text-xs font-semibold text-rose-200">
                <Sparkles className="h-3.5 w-3.5 text-rose-300" />
                <span>
                  HerCraft • Women-Led Cultural Enterprises, Collectives & Opportunities
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
                HerCraft Living Heritage Hub
              </h1>
              <p className="mt-3 max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
                Discover women-led self-help groups (SHGs), cottage silver and leather cooperatives in Kolhapur and Hupari, indigenous painting guilds, handloom samitis, women-crafted Art-Mart products, and sourced government welfare schemes.
              </p>
            </div>

            {/* Key Facet Metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
              <div className="rounded-2xl border border-white/10 bg-[#0B0F17]/80 px-4 py-3 text-center">
                <div className="font-serif text-xl sm:text-2xl font-bold text-[#D4AF37]">
                  {facets.totalPublishedEnterprises}
                </div>
                <div className="text-[11px] text-slate-400">
                  Published Collectives
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0B0F17]/80 px-4 py-3 text-center">
                <div className="font-serif text-xl sm:text-2xl font-bold text-rose-300">
                  {facets.totalWomenArtisansRepresented}+
                </div>
                <div className="text-[11px] text-slate-400">
                  Women Artisans (Demo)
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0B0F17]/80 px-4 py-3 text-center">
                <div className="font-serif text-xl sm:text-2xl font-bold text-teal-300">
                  {opportunities.length}
                </div>
                <div className="text-[11px] text-slate-400">
                  Schemes & Fellowships
                </div>
              </div>
            </div>
          </div>

          {/* Transparency Disclosure Banner */}
          <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong>ETHICAL & DEMO DISCLOSURE:</strong> Individual enterprise and collective profiles in HerCraft are clearly marked{" "}
              <code className="text-amber-200">DEMO_SAMPLE</code> fictional records created so every screen can be examined without presenting fictional profiles as real people. Central and State government schemes cite official public portals.
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedState("Maharashtra");
                setSelectedDistrict("Kolhapur District");
              }}
              className="shrink-0 rounded-lg border border-amber-300/40 bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-100 hover:bg-amber-400/30"
            >
              Filter: Kolhapur & Hupari Collectives
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {banner && (
          <div
            className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm ${
              banner.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200"
            }`}
          >
            <span>{banner.message}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "enterprises",
                label: `Women-Led Enterprises (${filteredEnterprises.length})`,
                icon: Users,
              },
              {
                id: "products",
                label: `Art-Mart Craft Showcase (${featuredProducts.length})`,
                icon: ShoppingBag,
              },
              {
                id: "opportunities",
                label: `Schemes, Grants & Training (${filteredOpportunities.length})`,
                icon: Landmark,
              },
              {
                id: "submit",
                label: isStaff
                  ? `Submit & Admin Review Queue (${facets.pendingReviewEnterprises} Pending)`
                  : "Nominate Enterprise / Opportunity",
                icon: Plus,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                    active
                      ? "bg-[#D4AF37] text-[#0B0F17] shadow-md"
                      : "border border-white/10 bg-[#131B2E] text-slate-200 hover:border-white/25"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {isStaff && (
            <label className="inline-flex items-center gap-2 text-xs text-teal-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includePending}
                onChange={(e) => setIncludePending(e.target.checked)}
                className="rounded border-white/20"
              />
              <span>Show Pending Review Entries ({facets.pendingReviewEnterprises})</span>
            </label>
          )}
        </div>

        {/* Search & Filter Bar */}
        {activeTab !== "submit" && (
          <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#131B2E] p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SHGs, Hupari silver, Veni, Warli..."
                className="w-full rounded-xl border border-white/15 bg-[#0B0F17] pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter by Craft Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="All">All Craft Categories</option>
              {facets.craftCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by Enterprise Type"
              value={selectedEnterpriseType}
              onChange={(e) => setSelectedEnterpriseType(e.target.value)}
              className="rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="All">All Collective Types</option>
              {Object.entries(ENTERPRISE_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by State"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("All");
              }}
              className="rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="All">All States</option>
              {facets.statesRepresented.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by District"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="All">All Districts</option>
                {allDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {(searchQuery ||
                selectedCategory !== "All" ||
                selectedEnterpriseType !== "All" ||
                selectedState !== "All" ||
                selectedDistrict !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setSelectedEnterpriseType("All");
                    setSelectedState("All");
                    setSelectedDistrict("All");
                  }}
                  className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] text-slate-300 hover:bg-white/10"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: WOMEN-LED ENTERPRISES */}
        {activeTab === "enterprises" && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEnterprises.map((ent) => (
              <article
                key={ent.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] overflow-hidden shadow-lg hover:border-[#D4AF37]/40 transition"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-[#0B0F17]">
                    <img
                      src={ent.heroImageUrl}
                      alt={ent.enterpriseName}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-[#0B0F17]/90 border border-rose-400/40 px-2.5 py-0.5 text-[10px] font-semibold text-rose-200">
                        {ENTERPRISE_TYPE_LABELS[ent.enterpriseType] ||
                          ent.enterpriseType}
                      </span>
                      <span className="rounded-md bg-[#0B0F17]/90 border border-amber-400/40 px-2 py-0.5 text-[10px] font-mono text-amber-200">
                        DEMO_SAMPLE
                      </span>
                    </div>
                    {ent.approvalStatus !== "APPROVED" && (
                      <div className="absolute bottom-2 right-2 rounded-md bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-slate-950">
                        {ent.approvalStatus}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#D4AF37]">
                      <span>{ent.craftCategory}</span>
                      <span>{ent.womenArtisansCount} Women Artisans</span>
                    </div>
                    <h2 className="mt-1.5 font-serif text-lg font-bold text-white leading-snug">
                      {ent.enterpriseName}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {ent.cityName || ent.districtName}, {ent.stateName}
                    </p>
                    <p className="mt-2.5 text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {ent.shortSummary}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ent.signatureCrafts.slice(0, 2).map((sc, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-white/10 bg-[#0B0F17]/70 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[#0B0F17]/50 px-5 py-3.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setLocation(`/hercraft/${ent.slug}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline"
                  >
                    <span>Explore Enterprise Profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  {ent.traditionSlug && (
                    <button
                      type="button"
                      onClick={() =>
                        setLocation(`/traditions/${ent.traditionSlug}`)
                      }
                      className="text-[11px] text-teal-300 hover:underline"
                    >
                      Tradition →
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* TAB 2: WOMEN-CRAFTED ART-MART SHOWCASE */}
        {activeTab === "products" && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] overflow-hidden"
              >
                <div>
                  <img
                    src={prod.imageUrl}
                    alt={prod.title}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#D4AF37]">
                      <span>{prod.category}</span>
                      <span>Stock: {prod.stockQuantity}</span>
                    </div>
                    <h3 className="mt-1.5 font-serif text-base font-bold text-white">
                      {prod.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {prod.regionLabel} • {prod.sellerName}
                    </p>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                      {prod.description}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 px-5 py-3.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#F3E5AB]">
                    ₹{prod.priceInr.toLocaleString("en-IN")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocation(`/art-mart/${prod.slug}`)}
                    className="rounded-xl bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-[#0B0F17]"
                  >
                    Open in Art-Mart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: SCHEMES, GRANTS & TRAINING OPPORTUNITIES */}
        {activeTab === "opportunities" && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Opportunity Type:</span>
              <button
                type="button"
                onClick={() => setSelectedOpportunityType("All")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  selectedOpportunityType === "All"
                    ? "bg-[#D4AF37] text-[#0B0F17]"
                    : "border border-white/10 bg-[#131B2E] text-slate-300"
                }`}
              >
                All Types
              </button>
              {Object.entries(OPPORTUNITY_TYPE_LABELS).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedOpportunityType(k)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    selectedOpportunityType === k
                      ? "bg-[#D4AF37] text-[#0B0F17]"
                      : "border border-white/10 bg-[#131B2E] text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] p-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-0.5 text-[11px] font-semibold text-[#F3E5AB]">
                        {OPPORTUNITY_TYPE_LABELS[opp.opportunityType] ||
                          opp.opportunityType}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          opp.relationshipStatus === "OFFICIAL_PUBLIC_SOURCE"
                            ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                            : "border border-amber-400/40 bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {opp.relationshipStatus === "OFFICIAL_PUBLIC_SOURCE"
                          ? "Official Public Source Reference"
                          : "Illustrative Demo Fellowship"}
                      </span>
                    </div>

                    <h3 className="mt-3 font-serif text-lg font-bold text-white">
                      {opp.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#D4AF37]">
                      {opp.organiserName} • Scope: {opp.stateScope}
                    </p>
                    <p className="mt-2.5 text-xs text-slate-300">
                      <strong>Eligibility:</strong> {opp.eligibilitySummary}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-300">
                      <strong>Benefits & Support:</strong> {opp.benefitSummary}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Cycle: {opp.deadlineOrCycleLabel} • {opp.demoDisclaimer}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <a
                      href={opp.applicationOrOfficialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline"
                    >
                      <span>Open Official Reference Portal</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUBMIT ENTERPRISE / OPPORTUNITY & ADMIN MODERATION QUEUE */}
        {activeTab === "submit" && (
          <div className="mt-8 space-y-8">
            {/* Admin Moderation Queue */}
            <div className="rounded-2xl border border-teal-500/35 bg-[#131B2E] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-300" />
                  <h2 className="font-serif text-xl font-bold text-white">
                    HerCraft Moderation & Publication Workflow
                  </h2>
                </div>
                <span className="text-xs text-teal-200">
                  {isStaff
                    ? `Signed in with Staff Role (${user?.role}) — Approval Controls Unlocked`
                    : "Public View — Sign in with a Staff Role to Approve/Publish"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Manage women-led enterprise profiles and opportunities without code edits. Newly submitted entries enter{" "}
                <code>PENDING_REVIEW</code> until approved by authorized staff.
              </p>

              <div className="mt-4 space-y-3">
                {enterprises.map((ent) => (
                  <div
                    key={ent.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0F17]/80 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {ent.enterpriseName}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            ent.approvalStatus === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : "bg-amber-500/20 text-amber-200"
                          }`}
                        >
                          {ent.approvalStatus}
                        </span>
                        <span className="rounded-md border border-white/15 px-2 py-0.5 text-[10px] text-slate-300">
                          {ent.publicationStatus}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {ent.cityName || ent.districtName}, {ent.stateName} •{" "}
                        {ent.craftCategory}
                      </p>
                    </div>

                    {isStaff && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleModerateEnterprise(
                              ent.id,
                              "APPROVED",
                              "PUBLISHED"
                            )
                          }
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                        >
                          Approve & Publish
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleModerateEnterprise(
                              ent.id,
                              "PENDING_REVIEW",
                              "DRAFT"
                            )
                          }
                          className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200"
                        >
                          Move to Draft
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleModerateEnterprise(
                              ent.id,
                              "REJECTED",
                              "ARCHIVED"
                            )
                          }
                          className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200"
                        >
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Submit Enterprise Form */}
              <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                <h3 className="font-serif text-lg font-bold text-white">
                  Submit a Women-Led Cultural Enterprise (Demo)
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Public submissions are tagged as <code>DEMO_SAMPLE</code> and placed in{" "}
                  <code>PENDING_REVIEW</code> until verified.
                </p>

                <form
                  onSubmit={handleSubmitEnterprise}
                  className="mt-4 space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Enterprise / SHG / Collective Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newEntName}
                      onChange={(e) => setNewEntName(e.target.value)}
                      placeholder="e.g., Kagal Mahila Kapashi Leather Veni Group (Demo)"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">
                        Collective Type
                      </label>
                      <select
                        value={newEntType}
                        onChange={(e) => setNewEntType(e.target.value as any)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white"
                      >
                        {Object.entries(ENTERPRISE_TYPE_LABELS).map(
                          ([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">
                        Craft Category
                      </label>
                      <input
                        type="text"
                        value={newEntCategory}
                        onChange={(e) => setNewEntCategory(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">
                        State
                      </label>
                      <input
                        type="text"
                        value={newEntState}
                        onChange={(e) => setNewEntState(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">
                        District
                      </label>
                      <input
                        type="text"
                        value={newEntDistrict}
                        onChange={(e) => setNewEntDistrict(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">
                        Women Artisans Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newEntCount}
                        onChange={(e) => setNewEntCount(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Short Craft & Enterprise Summary *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newEntSummary}
                      onChange={(e) => setNewEntSummary(e.target.value)}
                      placeholder="Describe the traditional craft, techniques, and women's leadership role..."
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#0B0F17] hover:bg-[#e3be42]"
                  >
                    Submit HerCraft Enterprise Profile
                  </button>
                </form>
              </div>

              {/* Submit Opportunity Form */}
              <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                <h3 className="font-serif text-lg font-bold text-white">
                  Submit a Women Artisan Scheme or Fellowship
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Add a sourced public scheme or illustrative training fellowship to the HerCraft directory.
                </p>

                <form
                  onSubmit={handleSubmitOpportunity}
                  className="mt-4 space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Scheme / Fellowship Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOppTitle}
                      onChange={(e) => setNewOppTitle(e.target.value)}
                      placeholder="e.g., Kolhapur District Women SHG Craft Exhibition Grant (Demo)"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">
                        Opportunity Type
                      </label>
                      <select
                        value={newOppType}
                        onChange={(e) => setNewOppType(e.target.value as any)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 py-2 text-xs text-white"
                      >
                        {Object.entries(OPPORTUNITY_TYPE_LABELS).map(
                          ([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">
                        State / Regional Scope
                      </label>
                      <input
                        type="text"
                        value={newOppStateScope}
                        onChange={(e) => setNewOppStateScope(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Eligibility Summary *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newOppEligibility}
                      onChange={(e) => setNewOppEligibility(e.target.value)}
                      placeholder="Who is eligible to apply..."
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Benefits & Official URL
                    </label>
                    <input
                      type="text"
                      value={newOppBenefit}
                      onChange={(e) => setNewOppBenefit(e.target.value)}
                      placeholder="Summary of grant, toolkit, or training benefit"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-4 py-2.5 text-xs font-bold text-[#F3E5AB] hover:bg-[#D4AF37] hover:text-[#0B0F17] transition"
                  >
                    Submit Opportunity Entry
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Moderated Enquiry Modal */}
      {enquiryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#131B2E] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg font-bold text-white">
              Moderated HerCraft Enquiry
            </h3>
            <p className="mt-1 text-xs text-[#D4AF37]">{enquiryTarget.title}</p>
            <p className="mt-1 text-[11px] text-slate-300">
              {enquiryTarget.context}
            </p>
            <form onSubmit={handleSendEnquiry} className="mt-4 space-y-3">
              <input
                type="text"
                required
                value={enqName}
                onChange={(e) => setEnqName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
              />
              <input
                type="text"
                required
                value={enqContact}
                onChange={(e) => setEnqContact(e.target.value)}
                placeholder="Your Email or Phone"
                className="w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
              />
              <textarea
                rows={3}
                required
                value={enqMessage}
                onChange={(e) => setEnqMessage(e.target.value)}
                placeholder="Share your learning, exhibition, or craft collaboration enquiry..."
                className="w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 py-2 text-xs text-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEnquiryTarget(null)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#0B0F17]"
                >
                  Submit Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
