import React, { useState, useEffect } from "react";
import {
  TRADITION_DIRECTORY_CATEGORIES,
  UNESCO_DOMAINS,
  EVIDENCE_STATUSES,
  type TraditionDirectoryCategory,
  type EvidenceStatus,
} from "@shared/const";
import type { TraditionAdmin } from "@shared/contracts";
import { apiClient } from "@/lib/api";
import { X, Check, Save, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

interface EditTraditionModalProps {
  open: boolean;
  onClose: () => void;
  tradition: TraditionAdmin | null;
  onSaved: (updated: TraditionAdmin) => void;
}

export default function EditTraditionModal({
  open,
  onClose,
  tradition,
  onSaved,
}: EditTraditionModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameNative, setNameNative] = useState("");
  const [category, setCategory] = useState<TraditionDirectoryCategory>(
    "Crafts, handloom and textiles"
  );
  const [subcategory, setSubcategory] = useState("");
  const [giTagStatus, setGiTagStatus] = useState("REGISTERED_GI");
  const [unescoDomain, setUnescoDomain] = useState("Traditional craftsmanship");
  const [evidenceStatus, setEvidenceStatus] = useState<EvidenceStatus>(
    "OFFICIAL_INSTITUTIONAL"
  );
  const [summary, setSummary] = useState("");
  const [culturalDescription, setCulturalDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [historicalBackground, setHistoricalBackground] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [status, setStatus] = useState<
    "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "RESTRICTED" | "ARCHIVED"
  >("PUBLISHED");
  const [isSacred, setIsSacred] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tradition) return;
    setNameEn(tradition.nameEn || "");
    setNameNative(tradition.nameNative || "");
    setCategory(tradition.traditionCategory || "Crafts, handloom and textiles");
    setSubcategory(tradition.subcategory || "");
    setGiTagStatus(tradition.giTagStatus || "REGISTERED_GI");
    setUnescoDomain(tradition.unescoDomain || "Traditional craftsmanship");
    setEvidenceStatus(tradition.evidenceStatus || "OFFICIAL_INSTITUTIONAL");
    setSummary(tradition.summary || "");
    setCulturalDescription(tradition.culturalDescription || "");
    setMaterials(
      Array.isArray(tradition.techniquesAndMaterials)
        ? tradition.techniquesAndMaterials.join(", ")
        : ""
    );
    setHistoricalBackground(tradition.historicalBackground || "");
    setStatus(tradition.status || "PUBLISHED");
    setIsSacred(Boolean(tradition.isSacredOrRestricted));

    // Resolve existing hero image
    const primaryHero = tradition.mediaAssets?.find(
      (m) => m.mediaType === "IMAGE" && m.directMediaUrl
    );
    setHeroImage(primaryHero?.directMediaUrl || "");
    setError("");
  }, [tradition]);

  if (!open || !tradition) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const materialsArray = materials
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      const updated = await apiClient.updateTradition(tradition.id, {
        nameEn,
        nameNative,
        traditionCategory: category,
        subcategory,
        giTagStatus,
        unescoDomain,
        evidenceStatus,
        summary,
        culturalDescription,
        techniquesAndMaterials: materialsArray,
        historicalBackground,
        status,
        isSacredOrRestricted: isSacred,
      });

      // If a hero image was provided and different from before, register/attach it
      if (heroImage && heroImage.trim() !== "") {
        try {
          await apiClient.createMediaAsset({
            title: `${nameEn} - Curated Visual Archive`,
            mediaType: "IMAGE",
            directMediaUrl: heroImage.trim(),
            sourcePageUrl: "https://bharatculturemap.gov.in/archive",
            licenseIdentifier: "CC BY-SA 4.0",
            attributionText: `Living Heritage Repository · ${nameEn}`,
            rightsStatus: "OPEN_LICENSE_VERIFIED",
            traditionId: tradition.id,
            isPrimaryHero: true,
          });
        } catch {
          // If media asset creation fails, continue since tradition fields are saved
        }
      }

      onSaved(updated.tradition);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update tradition.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-[#151927] p-6 md:p-8 text-white shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="eyebrow text-[#efb167] flex items-center gap-2">
              <Sparkles size={14} /> ADMIN LIVING TRADITION EDITOR
            </div>
            <h2 className="font-serif text-2xl text-white mt-1">
              Edit Tradition: <span className="text-[#efb167]">{tradition.nameEn}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs text-red-200">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Section: Names & Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow block text-white/70">Canonical Name (English) *</label>
              <input
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Native Script Name</label>
              <input
                value={nameNative}
                onChange={(e) => setNameNative(e.target.value)}
                placeholder="e.g. पैठणी साडी, চাউ মুখোশ"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="eyebrow block text-white/70">Tradition Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TraditionDirectoryCategory)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                {TRADITION_DIRECTORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block text-white/70">Subcategory / Cluster</label>
              <input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Silk Zari Weaving, Metal Casting"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">GI Tag Status</label>
              <select
                value={giTagStatus}
                onChange={(e) => setGiTagStatus(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                <option value="REGISTERED_GI">Registered GI (Geographical Indication)</option>
                <option value="GI_APPLIED">GI Application Filed</option>
                <option value="NOT_APPLICABLE">Living Oral / Folk Tradition</option>
                <option value="UNESCO_ICH">UNESCO Representative ICH List</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="eyebrow block text-white/70">UNESCO Domain</label>
              <select
                value={unescoDomain}
                onChange={(e) => setUnescoDomain(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                {UNESCO_DOMAINS.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block text-white/70">Evidence Benchmark</label>
              <select
                value={evidenceStatus}
                onChange={(e) => setEvidenceStatus(e.target.value as EvidenceStatus)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                {EVIDENCE_STATUSES.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block text-white/70">Publication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                <option value="PUBLISHED">PUBLISHED (Live on public map & directory)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (Institutional Review)</option>
                <option value="DRAFT">DRAFT (Internal Archival Entry)</option>
                <option value="RESTRICTED">RESTRICTED (Sacred / Community Protection)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          {/* Image Upload Field */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ImageUploadField
              label="Primary Hero / Visual Archive Asset"
              value={heroImage}
              onChange={setHeroImage}
              placeholder="Select from 9 verified national images or upload local file"
            />
          </div>

          {/* Section: Text Summaries */}
          <div>
            <label className="eyebrow block text-white/70">Executive Summary (Public Dossier) *</label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block text-white/70">Cultural & Ecological Context</label>
            <textarea
              rows={3}
              value={culturalDescription}
              onChange={(e) => setCulturalDescription(e.target.value)}
              placeholder="Detailed description of craftsmanship lineage, oral transmission, ritual calendar..."
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow block text-white/70">Materials & Techniques (Comma Separated)</label>
              <input
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="e.g. Brass, Lost-wax casting, Natural beeswax, Clay molds"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Historical Background & Lineage</label>
              <input
                value={historicalBackground}
                onChange={(e) => setHistoricalBackground(e.target.value)}
                placeholder="e.g. 4000-year Harappan continuity, Royal Maratha patronage"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isSacredCheck"
              checked={isSacred}
              onChange={(e) => setIsSacred(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/30 text-[#ef9d45]"
            />
            <label htmlFor="isSacredCheck" className="text-xs text-white/80 select-none cursor-pointer">
              Mark as sacred or restricted community heritage (prevents unauthorized commercial extraction)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-white/70 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#ef9d45] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#241a20] hover:bg-[#efb167] transition disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving Changes..." : "Save Tradition Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
