import React, { useState, useEffect } from "react";
import type { HerCraftEnterprise } from "@shared/contracts";
import { apiClient } from "@/lib/api";
import { X, Save, Sparkles, AlertCircle } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

interface EditHerCraftModalProps {
  open: boolean;
  onClose: () => void;
  enterprise: HerCraftEnterprise | null;
  onSaved: (updated: HerCraftEnterprise) => void;
}

export default function EditHerCraftModal({
  open,
  onClose,
  enterprise,
  onSaved,
}: EditHerCraftModalProps) {
  const [enterpriseName, setEnterpriseName] = useState("");
  const [leaderOrCollectiveLabel, setLeaderOrCollectiveLabel] = useState("");
  const [enterpriseType, setEnterpriseType] = useState<
    | "WOMEN_SHG"
    | "ARTISAN_COOPERATIVE"
    | "MASTER_ARTISAN_STUDIO"
    | "CULINARY_COLLECTIVE"
    | "TEXTILE_WEAVERS_GUILD"
  >("WOMEN_SHG");
  const [craftCategory, setCraftCategory] = useState("Textile");
  const [womenArtisansCount, setWomenArtisansCount] = useState(10);
  const [foundedYear, setFoundedYear] = useState(2018);
  const [stateName, setStateName] = useState("Maharashtra");
  const [districtName, setDistrictName] = useState("");
  const [cityName, setCityName] = useState("");
  const [shortSummary, setShortSummary] = useState("");
  const [storyNarrative, setStoryNarrative] = useState("");
  const [signatureCrafts, setSignatureCrafts] = useState("");
  const [supportNeeds, setSupportNeeds] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enterprise) return;
    setEnterpriseName(enterprise.enterpriseName || "");
    setLeaderOrCollectiveLabel(enterprise.leaderOrCollectiveLabel || "");
    setEnterpriseType(enterprise.enterpriseType || "WOMEN_SHG");
    setCraftCategory(enterprise.craftCategory || "Textile");
    setWomenArtisansCount(enterprise.womenArtisansCount || 10);
    setFoundedYear(enterprise.foundedYear || 2018);
    setStateName(enterprise.stateName || "Maharashtra");
    setDistrictName(enterprise.districtName || "");
    setCityName(enterprise.cityName || "");
    setShortSummary(enterprise.shortSummary || "");
    setStoryNarrative(enterprise.storyNarrative || "");
    setSignatureCrafts(
      Array.isArray(enterprise.signatureCrafts)
        ? enterprise.signatureCrafts.join(", ")
        : ""
    );
    setSupportNeeds(
      Array.isArray(enterprise.supportNeeds)
        ? enterprise.supportNeeds.join(", ")
        : ""
    );
    setHeroImageUrl(enterprise.heroImageUrl || "");
    setError("");
  }, [enterprise]);

  if (!open || !enterprise) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const craftsArray = signatureCrafts
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const resp = await apiClient.updateHerCraftEnterprise(enterprise.id, {
        enterpriseName,
        leaderOrCollectiveLabel,
        enterpriseType,
        craftCategory,
        womenArtisansCount: Number(womenArtisansCount),
        foundedYear: Number(foundedYear),
        stateName,
        districtName,
        cityName,
        shortSummary,
        storyNarrative,
        signatureCrafts: craftsArray,
        heroImageUrl: heroImageUrl.trim(),
      });

      onSaved(resp.enterprise);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update HerCraft collective.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-[#151927] p-6 md:p-8 text-white shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="eyebrow text-rose-300 flex items-center gap-2">
              <Sparkles size={14} /> HERCRAFT WOMEN-LED COLLECTIVE EDITOR
            </div>
            <h2 className="font-serif text-2xl text-white mt-1">
              Edit Collective: <span className="text-[#efb167]">{enterprise.enterpriseName}</span>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow block text-white/70">Enterprise / Collective Name *</label>
              <input
                required
                value={enterpriseName}
                onChange={(e) => setEnterpriseName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Leader or Collective Label *</label>
              <input
                required
                value={leaderOrCollectiveLabel}
                onChange={(e) => setLeaderOrCollectiveLabel(e.target.value)}
                placeholder="e.g. Smt. Radhabai Mahila Bachat Gat"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="eyebrow block text-white/70">Enterprise Type</label>
              <select
                value={enterpriseType}
                onChange={(e) => setEnterpriseType(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                <option value="WOMEN_SHG">Self-Help Group (Bachat Gat / SHG)</option>
                <option value="ARTISAN_COOPERATIVE">Registered Artisan Cooperative</option>
                <option value="MASTER_ARTISAN_STUDIO">Master Artisan Studio</option>
                <option value="TEXTILE_WEAVERS_GUILD">Textile Weavers Guild</option>
                <option value="CULINARY_COLLECTIVE">Culinary Collective</option>
              </select>
            </div>
            <div>
              <label className="eyebrow block text-white/70">Craft Category</label>
              <input
                required
                value={craftCategory}
                onChange={(e) => setCraftCategory(e.target.value)}
                placeholder="e.g. Textile, Metal, Lacquer"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Women Artisans Count</label>
              <input
                type="number"
                min="1"
                required
                value={womenArtisansCount}
                onChange={(e) => setWomenArtisansCount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="eyebrow block text-white/70">State *</label>
              <input
                required
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">District</label>
              <input
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                placeholder="e.g. Kolhapur District"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Founded Year</label>
              <input
                type="number"
                min="1950"
                max="2026"
                value={foundedYear}
                onChange={(e) => setFoundedYear(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
          </div>

          {/* Image Upload Field */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ImageUploadField
              label="Collective Banner / Workshop Photo"
              value={heroImageUrl}
              onChange={setHeroImageUrl}
              placeholder="Select from 9 verified national assets or upload workshop photo"
            />
          </div>

          <div>
            <label className="eyebrow block text-white/70">Signature Handcrafted Products (Comma Separated)</label>
            <input
              value={signatureCrafts}
              onChange={(e) => setSignatureCrafts(e.target.value)}
              placeholder="e.g. Paithani Pallu Dupattas, Brass Diyas, Natural Indigo Stoles"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block text-white/70">Community Executive Summary *</label>
            <textarea
              required
              rows={2}
              value={shortSummary}
              onChange={(e) => setShortSummary(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block text-white/70">Livelihood & Empowerment Story</label>
            <textarea
              rows={3}
              value={storyNarrative}
              onChange={(e) => setStoryNarrative(e.target.value)}
              placeholder="How this self-help group builds financial autonomy for rural women artisans..."
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block text-white/70">Institutional Support Needs (Comma Separated)</label>
            <input
              value={supportNeeds}
              onChange={(e) => setSupportNeeds(e.target.value)}
              placeholder="e.g. Working capital loan, Jacquard loom parts, Natural dye certification"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
            />
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
              {saving ? "Saving Changes..." : "Save Collective Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
