import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit3,
  Globe,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type {
  ArtMartProduct,
  PractitionerProfile,
  UserAccount,
} from "@shared/contracts";

export default function Practitioners() {
  const [, setLocation] = useLocation();
  const [matchDetail, params] = useRoute("/practitioners/:slug");
  const activeSlug = matchDetail ? params?.slug : null;

  const [practitioners, setPractitioners] = useState<PractitionerProfile[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ArtMartProduct[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedAvailability, setSelectedAvailability] = useState("All");

  // Edit profile modal / panel
  const [editingProfile, setEditingProfile] =
    useState<PractitionerProfile | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newStateName, setNewStateName] = useState("Maharashtra");
  const [newCityName, setNewCityName] = useState("Kolhapur");
  const [newLanguages, setNewLanguages] = useState("Marathi, Hindi");
  const [newSpecialisations, setNewSpecialisations] = useState("");
  const [newTraditionSlug, setNewTraditionSlug] = useState("kolhapuri-chappal");
  const [newTraditionTitle, setNewTraditionTitle] =
    useState("Kolhapuri Chappal");
  const [newBio, setNewBio] = useState("");

  // Moderated enquiry form
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [practResp, authResp] = await Promise.all([
        apiClient.listPractitioners({ includeUnpublished: true }),
        apiClient.getAuthStatus().catch(() => ({
          needsBootstrap: false,
          user: null,
          driver: "sqlite",
        })),
      ]);
      setPractitioners(practResp.practitioners || []);
      setCurrentUser(authResp.user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const onAuthChanged = () => void loadData();
    window.addEventListener("bcm-auth-changed", onAuthChanged);
    return () => window.removeEventListener("bcm-auth-changed", onAuthChanged);
  }, []);

  useEffect(() => {
    if (activeSlug) {
      apiClient
        .getPractitionerBySlug(activeSlug)
        .then((res) => setRelatedProducts(res.relatedProducts || []))
        .catch(() => setRelatedProducts([]));
    }
  }, [activeSlug]);

  const states = useMemo(() => {
    const s = new Set<string>();
    for (const p of practitioners) s.add(p.stateName);
    return ["All", ...Array.from(s)];
  }, [practitioners]);

  const filteredPractitioners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return practitioners.filter((p) => {
      if (selectedState !== "All" && p.stateName !== selectedState)
        return false;
      if (
        selectedAvailability !== "All" &&
        p.availabilityStatus !== selectedAvailability
      )
        return false;
      if (q) {
        const hay = [
          p.displayName,
          p.roleTitle,
          p.shortBio,
          p.stateName,
          p.districtName || "",
          p.cityName || "",
          ...p.languages,
          ...p.specialisations,
          ...p.traditionTitles,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [practitioners, searchQuery, selectedState, selectedAvailability]);

  const selectedPractitioner = useMemo(() => {
    if (!activeSlug) return null;
    return (
      practitioners.find(
        (p) =>
          p.slug.toLowerCase() === activeSlug.toLowerCase() ||
          p.id.toLowerCase() === activeSlug.toLowerCase()
      ) || null
    );
  }, [practitioners, activeSlug]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    await apiClient.updatePractitioner(editingProfile.id, {
      displayName: editingProfile.displayName,
      roleTitle: editingProfile.roleTitle,
      shortBio: editingProfile.shortBio,
      fullNarrative: editingProfile.fullNarrative,
      availabilityStatus: editingProfile.availabilityStatus,
      lineageNote: editingProfile.lineageNote,
    });
    setEditingProfile(null);
    await loadData();
    setStatusMessage(
      "Practitioner demonstration profile updated and persisted to SQLite."
    );
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCreatePractitioner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await apiClient.createPractitioner({
      displayName: newName,
      roleTitle: newRoleTitle || "Regional Craft & Performance Custodian (Demo)",
      stateName: newStateName,
      cityName: newCityName,
      languages: newLanguages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      specialisations: newSpecialisations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      traditionSlugs: [newTraditionSlug],
      traditionTitles: [newTraditionTitle],
      shortBio:
        newBio ||
        "Illustrative demonstration practitioner profile created for testing.",
      fullNarrative:
        newBio ||
        "Illustrative demonstration practitioner profile created for testing.",
    });
    setShowCreateForm(false);
    setNewName("");
    setNewBio("");
    await loadData();
    setStatusMessage("Created new DEMO_SAMPLE practitioner profile.");
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSubmitEnquiry = async (
    e: React.FormEvent,
    pract: PractitionerProfile
  ) => {
    e.preventDefault();
    await apiClient.submitCommunityEnquiry({
      enquiryType: "WORKSHOP_ENQUIRY",
      locationId: pract.placeId,
      senderName,
      senderContact,
      message: `[Practitioner / Workshop Enquiry for ${pract.displayName}]: ${enquiryMessage}`,
    });
    setSenderName("");
    setSenderContact("");
    setEnquiryMessage("");
    setStatusMessage(
      "Moderated workshop/learning enquiry submitted. No personal phone numbers are exposed publicly."
    );
  };

  // Detail View (/practitioners/:slug)
  if (activeSlug && selectedPractitioner) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setLocation("/practitioners")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-amber-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Practitioners Directory
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                DEMO_SAMPLE PRACTITIONER PROFILE
              </span>
              <button
                type="button"
                onClick={() => setEditingProfile(selectedPractitioner)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 border border-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Edit Profile (Role Demo)
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {statusMessage}
            </div>
          )}

          {editingProfile && (
            <form
              onSubmit={handleSaveEdit}
              className="p-6 rounded-2xl bg-slate-900 border border-amber-500/50 space-y-4"
            >
              <h2 className="text-lg font-serif font-bold text-amber-300">
                Edit Practitioner Profile ({editingProfile.displayName})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editingProfile.displayName}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        displayName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Specialisation Title
                  </label>
                  <input
                    type="text"
                    value={editingProfile.roleTitle}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        roleTitle: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={editingProfile.availabilityStatus}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        availabilityStatus: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="OPEN_FOR_WORKSHOPS">OPEN_FOR_WORKSHOPS</option>
                    <option value="AVAILABLE_FOR_APPRENTICESHIP">
                      AVAILABLE_FOR_APPRENTICESHIP
                    </option>
                    <option value="BY_ENQUIRY_ONLY">BY_ENQUIRY_ONLY</option>
                    <option value="SEASONAL_BREAK">SEASONAL_BREAK</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Display Biography
                </label>
                <textarea
                  rows={3}
                  value={editingProfile.fullNarrative}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      fullNarrative: e.target.value,
                      shortBio: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save Profile Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Profile Hero Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-900/75 border border-slate-800 rounded-2xl p-6">
            <div className="lg:col-span-4 space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={selectedPractitioner.profileImageUrl}
                  alt={selectedPractitioner.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/manus-storage/bharat-culturemap-hero_1c81260f.jpg";
                  }}
                />
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-amber-300">
                  {selectedPractitioner.verificationBadge}
                </div>
                <div>{selectedPractitioner.profileImageCredit}</div>
                <div className="text-amber-200/80">
                  {selectedPractitioner.demoDisclaimer}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                  {selectedPractitioner.availabilityStatus.replace(/_/g, " ")}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {[
                    selectedPractitioner.cityName,
                    selectedPractitioner.districtName,
                    selectedPractitioner.stateName,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                  {selectedPractitioner.yearsOfPractice} Years Illustrative Practice
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  {selectedPractitioner.displayName}
                </h1>
                <p className="text-sm text-amber-300 font-medium mt-1">
                  {selectedPractitioner.roleTitle}
                </p>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">
                {selectedPractitioner.fullNarrative}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold uppercase text-amber-300">
                    Craft & Teaching Specialisations
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {selectedPractitioner.specialisations.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold uppercase text-amber-300">
                    Associated Traditions & Languages
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPractitioner.traditionTitles.map((title, idx) => {
                      const slug = selectedPractitioner.traditionSlugs[idx];
                      return (
                        <button
                          key={title}
                          type="button"
                          onClick={() =>
                            slug && setLocation(`/traditions/${slug}`)
                          }
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold"
                        >
                          {title} →
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-slate-400 pt-1">
                    <strong className="text-slate-300">Languages:</strong>{" "}
                    {selectedPractitioner.languages.join(", ")}
                  </div>
                  <div className="text-xs text-slate-400">
                    <strong className="text-slate-300">Lineage Note:</strong>{" "}
                    {selectedPractitioner.lineageNote}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workshops & Moderated Enquiry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-4">
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Workshops & Learning Opportunities (Demo)
              </h2>
              {selectedPractitioner.workshops.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Enquire via the moderated form for seasonal apprenticeship schedules.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedPractitioner.workshops.map((wk) => (
                    <div
                      key={wk.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">
                          {wk.title}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold">
                          {wk.mode} • ₹{wk.feeInr.toLocaleString("en-IN")} (Demo Fee)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {wk.summary}
                      </p>
                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-4">
                        <span>Duration: {wk.durationLabel}</span>
                        <span>Level: {wk.skillLevel}</span>
                        <span>Schedule: {wk.nextSessionLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-4">
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                Moderated Learning & Workshop Enquiry
              </h2>
              <p className="text-xs text-slate-400">
                All practitioner contact is governed by Cultural Rights Passports. Submit an enquiry for workshop registration or academic study.
              </p>
              <form
                onSubmit={(e) => handleSubmitEnquiry(e, selectedPractitioner)}
                className="space-y-3"
              >
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <input
                  type="text"
                  required
                  value={senderContact}
                  onChange={(e) => setSenderContact(e.target.value)}
                  placeholder="Your Email or Phone"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <textarea
                  rows={3}
                  required
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  placeholder="Specify workshop interest, preferred dates, or research context..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Submit Moderated Enquiry
                </button>
              </form>
            </div>
          </div>

          {/* Connected Art-Mart Listings */}
          {relatedProducts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                Related Craft Works on Art-Mart
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {relatedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <span className="text-[11px] text-amber-300 font-semibold">
                        {prod.category}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-white mt-1">
                        {prod.title}
                      </h4>
                      <div className="text-base font-bold text-amber-400 mt-1">
                        ₹{prod.priceInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocation(`/art-mart/${prod.slug}`)}
                      className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300"
                    >
                      Open in Art-Mart →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-16">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-[#0B0F17] py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" /> PRACTITIONERS, TEACHERS & CUSTODIANS (DEMO_SAMPLE)
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              Cultural Practitioners & Workshop Mentors
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore illustrative practitioner and teacher profiles connected to Kolhapur, Maharashtra, and pan-India traditions. All sample identities are explicitly marked DEMO_SAMPLE and do not claim to represent real individuals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Demo Practitioner Profile
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm">
            {statusMessage}
          </div>
        )}

        {showCreateForm && (
          <form
            onSubmit={handleCreatePractitioner}
            className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-4"
          >
            <h2 className="text-lg font-serif font-bold text-white">
              Create New Demonstration Practitioner Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Display Name (e.g. Guru Raghunath Demo)"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <input
                type="text"
                required
                value={newRoleTitle}
                onChange={(e) => setNewRoleTitle(e.target.value)}
                placeholder="Specialisation Role Title"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <input
                type="text"
                value={newLanguages}
                onChange={(e) => setNewLanguages(e.target.value)}
                placeholder="Languages (comma-separated)"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="State"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="City / Locality"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <input
                type="text"
                value={newTraditionSlug}
                onChange={(e) => setNewTraditionSlug(e.target.value)}
                placeholder="Tradition Slug (e.g. kolhapuri-chappal)"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <input
                type="text"
                value={newTraditionTitle}
                onChange={(e) => setNewTraditionTitle(e.target.value)}
                placeholder="Tradition Title"
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <textarea
              rows={2}
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              placeholder="Illustrative biography and craft/teaching specialisation..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Save Demonstration Profile
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by practitioner name, tradition (Chappal, Powada, Saaj, Mallakhamb, Chhau, Warli), or language..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
          <select
            aria-label="Filter by State"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
          >
            {states.map((st) => (
              <option key={st} value={st}>
                {st === "All" ? "All States & Regions" : st}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by Availability"
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
          >
            <option value="All">All Availability Statuses</option>
            <option value="OPEN_FOR_WORKSHOPS">Open for Workshops</option>
            <option value="AVAILABLE_FOR_APPRENTICESHIP">
              Available for Apprenticeship
            </option>
            <option value="BY_ENQUIRY_ONLY">By Moderated Enquiry Only</option>
          </select>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading practitioner profiles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPractitioners.map((pract) => (
              <article
                key={pract.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition-all"
              >
                <div>
                  <div className="aspect-[16/10] bg-slate-950 relative overflow-hidden">
                    <img
                      src={pract.profileImageUrl}
                      alt={pract.displayName}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/manus-storage/bharat-culturemap-hero_1c81260f.jpg";
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-950/90 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                        DEMO_SAMPLE
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/40 text-emerald-300 text-[10px] font-semibold">
                        {pract.availabilityStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-amber-300">
                        <MapPin className="w-3.5 h-3.5" />
                        {pract.cityName ? `${pract.cityName}, ` : ""}
                        {pract.stateName}
                      </span>
                      <span>{pract.yearsOfPractice} yrs</span>
                    </div>

                    <h2 className="font-serif font-bold text-lg text-white">
                      {pract.displayName}
                    </h2>
                    <div className="text-xs font-medium text-amber-200/90">
                      {pract.roleTitle}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {pract.shortBio}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pract.traditionTitles.map((t, i) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            pract.traditionSlugs[i] &&
                            setLocation(`/traditions/${pract.traditionSlugs[i]}`)
                          }
                          className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[11px] hover:bg-slate-700"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-2.5">
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Languages: {pract.languages.join(", ")}</span>
                    <span>{pract.workshops.length} workshops</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocation(`/practitioners/${pract.slug}`)}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Open Practitioner Profile & Workshops
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
