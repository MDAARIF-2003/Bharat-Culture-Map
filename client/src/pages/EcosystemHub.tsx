import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Factory,
  Filter,
  Landmark,
  MapPin,
  Plus,
  Recycle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type {
  ArtMartProduct,
  EcosystemResourceItem,
  IndustryMaterialListing,
  IndustryMaterialRequest,
} from "@shared/contracts";

const COLLABORATION_STATUS_STEPS: Array<{
  status: IndustryMaterialRequest["collaborationStatus"];
  stepNumber: number;
  label: string;
}> = [
  {
    status: "SUBMITTED_BY_ARTISAN",
    stepNumber: 3,
    label: "Step 3: Artisan Request Submitted",
  },
  {
    status: "REVIEWED_BY_ADMIN_OR_INDUSTRY",
    stepNumber: 4,
    label: "Step 4: Reviewed by Admin / Industry",
  },
  {
    status: "ALLOCATED_TO_ARTISAN",
    stepNumber: 5,
    label: "Step 5a: Material Allocated to Artisan",
  },
  {
    status: "IN_CRAFT_PRODUCTION",
    stepNumber: 5,
    label: "Step 5b: In Craft Production",
  },
  {
    status: "CRAFT_PRODUCT_LISTED_ON_ART_MART",
    stepNumber: 6,
    label: "Step 6: Resulting Craft Product Listed on Art-Mart",
  },
];

export default function EcosystemHub() {
  const [location, setLocation] = useLocation();

  const initialSection = location.startsWith("/government")
    ? "government"
    : location.startsWith("/entrepreneurship")
      ? "entrepreneurship"
      : "industry-to-art";

  const [activeSection, setActiveSection] = useState<
    "industry-to-art" | "government" | "entrepreneurship"
  >(initialSection);

  useEffect(() => {
    if (location.startsWith("/government")) setActiveSection("government");
    else if (location.startsWith("/entrepreneurship"))
      setActiveSection("entrepreneurship");
    else if (location.startsWith("/industry-to-art"))
      setActiveSection("industry-to-art");
  }, [location]);

  const [materials, setMaterials] = useState<IndustryMaterialListing[]>([]);
  const [requests, setRequests] = useState<IndustryMaterialRequest[]>([]);
  const [resources, setResources] = useState<EcosystemResourceItem[]>([]);
  const [products, setProducts] = useState<ArtMartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters
  const [matSearch, setMatSearch] = useState("");
  const [matCategory, setMatCategory] = useState("All");
  const [resSearch, setResSearch] = useState("");
  const [resOrgType, setResOrgType] = useState("All");
  const [resStatusFilter, setResStatusFilter] = useState("All");

  // Step 1: Industry lists surplus material form
  const [showListMaterialForm, setShowListMaterialForm] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matOrg, setMatOrg] = useState("");
  const [matCatInput, setMatCatInput] = useState(
    "Vegetable-Tanned Leather & Hide Offcuts"
  );
  const [matQty, setMatQty] = useState("");
  const [matCondition, setMatCondition] = useState(
    "Clean, untreated offcuts safe for handcraft"
  );
  const [matCity, setMatCity] = useState("Kolhapur");
  const [matState, setMatState] = useState("Maharashtra");
  const [matTerms, setMatTerms] =
    useState<IndustryMaterialListing["pricingTerms"]>("DONATION_FREE");
  const [matSafety, setMatSafety] = useState(
    "Verified free of toxic heavy metals or synthetic coatings."
  );

  // Step 3: Artisan submits material request form
  const [selectedMaterialForReq, setSelectedMaterialForReq] =
    useState<IndustryMaterialListing | null>(null);
  const [reqArtisanName, setReqArtisanName] = useState(
    "Master Subhash Satpute (Demo Artisan)"
  );
  const [reqTradition, setReqTradition] = useState("Kolhapuri Chappal");
  const [reqQty, setReqQty] = useState("25 kg clean pattern strips");
  const [reqUse, setReqUse] = useState("");

  // Government resource creation form
  const [showAddResourceForm, setShowAddResourceForm] = useState(false);
  const [newResTitle, setNewResTitle] = useState("");
  const [newResCategory, setNewResCategory] = useState(
    "Artisan Cluster Support"
  );
  const [newResOrgType, setNewResOrgType] =
    useState<EcosystemResourceItem["organisationType"]>("NGO_FOUNDATION");
  const [newResRelStatus, setNewResRelStatus] =
    useState<EcosystemResourceItem["relationshipStatus"]>(
      "ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR"
    );
  const [newResState, setNewResState] = useState("Maharashtra");
  const [newResSummary, setNewResSummary] = useState("");
  const [newResEligibility, setNewResEligibility] = useState("");
  const [newResUrl, setNewResUrl] = useState("https://example.org/demo-partner");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [matResp, reqResp, resResp, prodResp] = await Promise.all([
        apiClient.listIndustryMaterials({ includePending: true }),
        apiClient.listIndustryRequests(),
        apiClient.listEcosystemResources(),
        apiClient.listArtMartProducts(),
      ]);
      setMaterials(matResp.materials || []);
      setRequests(reqResp.requests || []);
      setResources(resResp.resources || []);
      setProducts(prodResp.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredMaterials = useMemo(() => {
    const q = matSearch.trim().toLowerCase();
    return materials.filter((m) => {
      if (matCategory !== "All" && m.materialCategory !== matCategory)
        return false;
      if (q) {
        const hay = [
          m.title,
          m.industryOrgLabel,
          m.materialCategory,
          m.locationCity,
          m.locationState,
          ...m.suggestedTraditions,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [materials, matSearch, matCategory]);

  const filteredResources = useMemo(() => {
    const q = resSearch.trim().toLowerCase();
    return resources.filter((r) => {
      if (resOrgType !== "All" && r.organisationType !== resOrgType)
        return false;
      if (
        resStatusFilter !== "All" &&
        r.relationshipStatus !== resStatusFilter
      )
        return false;
      if (q) {
        const hay = [
          r.title,
          r.resourceCategory,
          r.stateScope,
          r.summary,
          r.eligibilityDetails,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [resources, resSearch, resOrgType, resStatusFilter]);

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;
    await apiClient.createIndustryMaterial({
      title: matTitle,
      industryOrgLabel:
        matOrg || "Illustrative Circular Manufacturing Unit (Demo)",
      materialCategory: matCatInput,
      quantityAvailableLabel: matQty || "40 kg clean surplus",
      conditionLabel: matCondition,
      locationCity: matCity,
      locationState: matState,
      pricingTerms: matTerms,
      safetyRestrictions: matSafety,
      adminReviewStatus: "PENDING_ADMIN_REVIEW",
    });
    setMatTitle("");
    setShowListMaterialForm(false);
    await loadAll();
    setFeedback(
      "Step 1 complete: Surplus material listed with status PENDING_ADMIN_REVIEW."
    );
  };

  const handleApproveMaterial = async (id: string) => {
    await apiClient.updateIndustryMaterialStatus(id, "APPROVED", "AVAILABLE");
    await loadAll();
    setFeedback(
      "Step 2 complete: Administrator reviewed and approved surplus material listing."
    );
  };

  const handleSubmitArtisanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForReq || !reqUse.trim()) return;
    await apiClient.createIndustryRequest({
      materialId: selectedMaterialForReq.id,
      artisanName: reqArtisanName,
      traditionTitle: reqTradition,
      requestedQuantityLabel: reqQty,
      intendedCraftUse: reqUse,
    });
    setSelectedMaterialForReq(null);
    setReqUse("");
    await loadAll();
    setFeedback(
      "Step 3 complete: Artisan material request submitted for review."
    );
  };

  const handleAdvanceRequestStatus = async (
    reqItem: IndustryMaterialRequest,
    nextStatus: IndustryMaterialRequest["collaborationStatus"],
    linkedProductId?: string | null
  ) => {
    await apiClient.updateIndustryRequestStatus(
      reqItem.id,
      nextStatus,
      `Updated to ${nextStatus} in demonstration workflow.`,
      linkedProductId !== undefined
        ? linkedProductId
        : reqItem.linkedArtMartProductId
    );
    await loadAll();
    setFeedback(`Collaboration #${reqItem.id} advanced to ${nextStatus}.`);
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle.trim()) return;
    await apiClient.createEcosystemResource({
      title: newResTitle,
      resourceCategory: newResCategory,
      organisationType: newResOrgType,
      relationshipStatus: newResRelStatus,
      stateScope: newResState,
      summary: newResSummary,
      eligibilityDetails: newResEligibility,
      officialUrl: newResUrl,
    });
    setNewResTitle("");
    setNewResSummary("");
    setShowAddResourceForm(false);
    await loadAll();
    setFeedback("Added new ecosystem resource entry.");
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-16">
      {/* Header Banner */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-[#0B0F17] py-10 px-4">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Recycle className="w-3.5 h-3.5" /> CULTURAL ECOSYSTEM, CIRCULAR CRAFT & PUBLIC SCHEMES (DEMO_SAMPLE)
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              {activeSection === "industry-to-art"
                ? "Industry-to-Art — Circular Material & Craft Collaboration Hub"
                : activeSection === "government"
                  ? "Government Schemes, GI Registries & Ecosystem Partners"
                  : "Artisan Entrepreneurship, Cooperatives & Cluster Incubation"}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeSection === "industry-to-art"
                ? "Demonstrates the complete 6-step workflow connecting clean industrial surplus materials (vegetable-tanned leather, silver punch scrap, unbleached canvas, seasoned teak) to traditional artisans and resulting Art-Mart craft listings."
                : activeSection === "government"
                  ? "Distinguishes official public institutional reference schemes from clearly labelled illustrative prospective collaborators and simulated partners."
                  : "Supports craft guilds, GI-tagged cluster cooperatives, workshop scheduling, and provenance-backed Art-Mart storefronts."}
            </p>
          </div>

          {/* Section Switcher */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveSection("industry-to-art");
                setLocation("/industry-to-art");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                activeSection === "industry-to-art"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-900 border border-slate-800 text-slate-300"
              }`}
            >
              <Factory className="w-4 h-4" /> Industry-to-Art Workflow (
              {materials.length} Materials • {requests.length} Collaborations)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection("government");
                setLocation("/government-resources");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                activeSection === "government"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-900 border border-slate-800 text-slate-300"
              }`}
            >
              <Landmark className="w-4 h-4" /> Government & Ecosystem Resources (
              {resources.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection("entrepreneurship");
                setLocation("/entrepreneurship");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                activeSection === "entrepreneurship"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-900 border border-slate-800 text-slate-300"
              }`}
            >
              <Award className="w-4 h-4" /> Craft Entrepreneurship & Incubation
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-8">
        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {feedback}
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SECTION 1: INDUSTRY-TO-ART */}
        {activeSection === "industry-to-art" && (
          <div className="space-y-8">
            {/* 6-Step Workflow Visual Guide */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Interactive 6-Step Circular Craft Workflow
                </span>
                <button
                  type="button"
                  onClick={() => setShowListMaterialForm((v) => !v)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Step 1: List Surplus Material (Demo)
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                {[
                  "1. Industry lists surplus material",
                  "2. Administrator reviews safety & quality",
                  "3. Artisan searches & submits request",
                  "4. Industry / Admin reviews request",
                  "5. Collaboration progresses through production",
                  "6. Resulting craft product listed on Art-Mart",
                ].map((step) => (
                  <div
                    key={step}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-medium"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1 Form */}
            {showListMaterialForm && (
              <form
                onSubmit={handleCreateMaterial}
                className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-4"
              >
                <h2 className="text-lg font-serif font-bold text-white">
                  Step 1: Submit Industrial Surplus Material Listing (Demo)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={matTitle}
                    onChange={(e) => setMatTitle(e.target.value)}
                    placeholder="Material Title (e.g. Clean Brass Sheet Offcuts)"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    value={matOrg}
                    onChange={(e) => setMatOrg(e.target.value)}
                    placeholder="Illustrative Industry Name (Demo)"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                    placeholder="Quantity Available (e.g. 85 kg)"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={matCatInput}
                    onChange={(e) => setMatCatInput(e.target.value)}
                    placeholder="Material Category"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={matCity}
                    onChange={(e) => setMatCity(e.target.value)}
                    placeholder="City"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={matState}
                    onChange={(e) => setMatState(e.target.value)}
                    placeholder="State"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <select
                    value={matTerms}
                    onChange={(e) => setMatTerms(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="DONATION_FREE">DONATION_FREE</option>
                    <option value="NOMINAL_RECOVERY_COST">
                      NOMINAL_RECOVERY_COST
                    </option>
                    <option value="SPONSORED_CSR_GRANT">
                      SPONSORED_CSR_GRANT
                    </option>
                  </select>
                </div>
                <input
                  type="text"
                  value={matSafety}
                  onChange={(e) => setMatSafety(e.target.value)}
                  placeholder="Safety & Non-Hazardous Restrictions Note"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Submit for Admin Review (Step 1 → Step 2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowListMaterialForm(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Step 3 Modal/Drawer: Artisan Material Request */}
            {selectedMaterialForReq && (
              <form
                onSubmit={handleSubmitArtisanRequest}
                className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif font-bold text-emerald-300">
                    Step 3: Submit Artisan Material Request —{" "}
                    {selectedMaterialForReq.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedMaterialForReq(null)}
                    className="text-xs text-slate-400"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={reqArtisanName}
                    onChange={(e) => setReqArtisanName(e.target.value)}
                    placeholder="Artisan / Guild Name"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    value={reqTradition}
                    onChange={(e) => setReqTradition(e.target.value)}
                    placeholder="Associated Tradition (e.g. Kolhapuri Chappal)"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    placeholder="Requested Quantity"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={reqUse}
                  onChange={(e) => setReqUse(e.target.value)}
                  placeholder="Describe how this surplus material will be transformed into a traditional craft product..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Submit Artisan Request (Step 3)
                </button>
              </form>
            )}

            {/* Surplus Material Catalogue */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-serif font-bold text-white">
                  Surplus Industrial Material Listings ({filteredMaterials.length})
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={matSearch}
                    onChange={(e) => setMatSearch(e.target.value)}
                    placeholder="Filter materials by city, tradition, or type..."
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          DEMO_SAMPLE • {mat.pricingTerms.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mat.adminReviewStatus === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          Admin Review: {mat.adminReviewStatus}
                        </span>
                      </div>

                      <h3 className="text-lg font-serif font-bold text-white">
                        {mat.title}
                      </h3>
                      <div className="text-xs text-amber-200/90">
                        {mat.industryOrgLabel} • {mat.locationCity},{" "}
                        {mat.locationState}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                        <div>
                          <strong className="text-slate-400">Quantity:</strong>{" "}
                          {mat.quantityAvailableLabel}
                        </div>
                        <div>
                          <strong className="text-slate-400">Condition:</strong>{" "}
                          {mat.conditionLabel}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                        <strong className="text-amber-300">
                          Safety & Craft Restrictions:
                        </strong>{" "}
                        {mat.safetyRestrictions}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {mat.suggestedTraditions.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]"
                          >
                            Suggested: {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        Availability: {mat.availabilityStatus}
                      </span>
                      <div className="flex items-center gap-2">
                        {mat.adminReviewStatus === "PENDING_ADMIN_REVIEW" && (
                          <button
                            type="button"
                            onClick={() => handleApproveMaterial(mat.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                          >
                            Step 2: Admin Approve Listing
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedMaterialForReq(mat)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                        >
                          Step 3: Artisan Request Material
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Collaborations & Step 4-6 Progression */}
            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-white">
                Steps 4–6: Active Artisan Requests & Art-Mart Product Linkage ({requests.length})
              </h2>
              <div className="space-y-4">
                {requests.map((reqItem) => (
                  <div
                    key={reqItem.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-amber-300 font-bold">
                          Collaboration #{reqItem.id}
                        </span>
                        <h3 className="text-base font-serif font-bold text-white">
                          {reqItem.artisanName} ({reqItem.traditionTitle}) →{" "}
                          {reqItem.materialTitle}
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                        {reqItem.collaborationStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      <strong>Requested Batch:</strong>{" "}
                      {reqItem.requestedQuantityLabel} •{" "}
                      <strong>Intended Craft Transformation:</strong>{" "}
                      {reqItem.intendedCraftUse}
                    </p>
                    <p className="text-xs text-slate-400">
                      <strong>Review Note:</strong> {reqItem.adminReviewerNote}
                    </p>

                    {/* Workflow Status Progression Controls */}
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {COLLABORATION_STATUS_STEPS.map((st) => (
                          <button
                            key={st.status}
                            type="button"
                            onClick={() =>
                              handleAdvanceRequestStatus(
                                reqItem,
                                st.status,
                                st.status ===
                                  "CRAFT_PRODUCT_LISTED_ON_ART_MART" &&
                                  !reqItem.linkedArtMartProductId
                                  ? products[1]?.id || products[0]?.id
                                  : undefined
                              )
                            }
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                              reqItem.collaborationStatus === st.status
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>

                      {reqItem.linkedArtMartProductSlug && (
                        <button
                          type="button"
                          onClick={() =>
                            setLocation(
                              `/art-mart/${reqItem.linkedArtMartProductSlug}`
                            )
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> View Resulting Art-Mart Product →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: GOVERNMENT, NGOS & INSTITUTIONAL RESOURCES */}
        {activeSection === "government" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <input
                  type="text"
                  value={resSearch}
                  onChange={(e) => setResSearch(e.target.value)}
                  placeholder="Search GI Registry, Handicrafts, Sangeet Natak Akademi, Maharashtra schemes..."
                  className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <select
                  value={resStatusFilter}
                  onChange={(e) => setResStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="All">
                    All Relationship Statuses (Official + Illustrative)
                  </option>
                  <option value="OFFICIAL_PUBLIC_SOURCE">
                    Official Public Reference Sources Only
                  </option>
                  <option value="ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR">
                    Illustrative Prospective Collaborators (Demo)
                  </option>
                  <option value="DEMO_SIMULATED_PARTNER">
                    Demo Simulated Partners
                  </option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowAddResourceForm((v) => !v)}
                className="px-3.5 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Resource Entry
              </button>
            </div>

            {showAddResourceForm && (
              <form
                onSubmit={handleCreateResource}
                className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-3"
              >
                <h3 className="text-base font-serif font-bold text-white">
                  Add Ecosystem / Government Reference Entry (Demo)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newResTitle}
                    onChange={(e) => setNewResTitle(e.target.value)}
                    placeholder="Programme / Organisation Title"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <select
                    value={newResRelStatus}
                    onChange={(e) => setNewResRelStatus(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="OFFICIAL_PUBLIC_SOURCE">
                      OFFICIAL_PUBLIC_SOURCE
                    </option>
                    <option value="ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR">
                      ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR
                    </option>
                    <option value="DEMO_SIMULATED_PARTNER">
                      DEMO_SIMULATED_PARTNER
                    </option>
                  </select>
                  <input
                    type="url"
                    required
                    value={newResUrl}
                    onChange={(e) => setNewResUrl(e.target.value)}
                    placeholder="Official URL"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={newResSummary}
                  onChange={(e) => setNewResSummary(e.target.value)}
                  placeholder="Summary and eligibility details..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save Ecosystem Resource
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          res.relationshipStatus === "OFFICIAL_PUBLIC_SOURCE"
                            ? "bg-sky-500/20 border border-sky-400/40 text-sky-300"
                            : "bg-amber-500/20 border border-amber-400/40 text-amber-300"
                        }`}
                      >
                        {res.relationshipStatus.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        Last Reviewed: {res.lastReviewedDate}
                      </span>
                    </div>

                    <div className="text-xs text-amber-300 font-medium">
                      {res.resourceCategory} • {res.organisationType.replace(/_/g, " ")} •{" "}
                      {res.stateScope}
                    </div>

                    <h3 className="text-lg font-serif font-bold text-white">
                      {res.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {res.summary}
                    </p>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <strong className="text-amber-300">Eligibility:</strong>{" "}
                      {res.eligibilityDetails}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] text-amber-200/85">
                      {res.demoDisclaimer}
                    </div>
                    <a
                      href={res.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline"
                    >
                      Open Reference Portal ({res.officialUrl}){" "}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: ENTREPRENEURSHIP & GUILD INCUBATION */}
        {activeSection === "entrepreneurship" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
                  1. GI Cluster Storefronts
                </span>
                <h3 className="text-xl font-serif font-bold text-white">
                  Direct Artisan-to-Patron Art-Mart Onboarding
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Artisan collectives in Kolhapur (Leather & Saaj), Hupari (Silver), Palghar (Warli), Raghurajpur (Pattachitra), Purulia (Chhau Masks), and Patan (Patola) manage their own storefronts, provenance notes, and stock without middlemen.
                </p>
                <button
                  type="button"
                  onClick={() => setLocation("/art-mart")}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Open Art-Mart Storefronts →
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  2. Teaching & Apprenticeships
                </span>
                <h3 className="text-xl font-serif font-bold text-white">
                  Practitioner-Led Workshops & Learning Cohorts
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Master custodians publish structured in-person and online workshops (vegetable-tanned leather braiding, Powada meter, Mallakhamb conditioning, Pattachitra natural pigments) with moderated enquiry protection.
                </p>
                <button
                  type="button"
                  onClick={() => setLocation("/practitioners")}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Explore Practitioner Workshops →
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-xs font-bold">
                  3. Circular Material Economy
                </span>
                <h3 className="text-xl font-serif font-bold text-white">
                  Zero-Waste Upcycled Craft Lineages
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Connects regional manufacturing units with craft guilds to lower raw-material costs using verified chromium-free leather offcuts, fine silver punch scrap, and unbleached cotton duck roll-ends.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection("industry-to-art")}
                  className="px-4 py-2 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs"
                >
                  Launch Industry-to-Art Hub →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
