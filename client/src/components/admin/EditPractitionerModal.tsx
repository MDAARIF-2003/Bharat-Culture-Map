import React, { useState, useEffect } from "react";
import type { PractitionerProfile } from "@shared/contracts";
import { apiClient } from "@/lib/api";
import { X, Save, Users, AlertCircle } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

interface EditPractitionerModalProps {
  open: boolean;
  onClose: () => void;
  practitioner: PractitionerProfile | null;
  onSaved: (updated: PractitionerProfile) => void;
}

export default function EditPractitionerModal({
  open,
  onClose,
  practitioner,
  onSaved,
}: EditPractitionerModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [yearsOfPractice, setYearsOfPractice] = useState(10);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    | "OPEN_FOR_WORKSHOPS"
    | "AVAILABLE_FOR_APPRENTICESHIP"
    | "BY_ENQUIRY_ONLY"
    | "SEASONAL_BREAK"
  >("OPEN_FOR_WORKSHOPS");
  const [verificationBadge, setVerificationBadge] = useState("NATIONAL_MASTER_AWARD");
  const [shortBio, setShortBio] = useState("");
  const [fullNarrative, setFullNarrative] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!practitioner) return;
    setDisplayName(practitioner.displayName || "");
    setRoleTitle(practitioner.roleTitle || "");
    setStateName(practitioner.stateName || "Maharashtra");
    setCityName(practitioner.cityName || "");
    setYearsOfPractice(practitioner.yearsOfPractice || 10);
    setAvailabilityStatus(practitioner.availabilityStatus || "OPEN_FOR_WORKSHOPS");
    setVerificationBadge(practitioner.verificationBadge || "NATIONAL_MASTER_AWARD");
    setShortBio(practitioner.shortBio || "");
    setFullNarrative(practitioner.fullNarrative || "");
    setProfileImageUrl(practitioner.profileImageUrl || "");
    setError("");
  }, [practitioner]);

  if (!open || !practitioner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const resp = await apiClient.updatePractitioner(practitioner.id, {
        displayName,
        roleTitle,
        stateName,
        cityName,
        yearsOfPractice: Number(yearsOfPractice),
        availabilityStatus,
        verificationBadge,
        shortBio,
        fullNarrative,
        profileImageUrl: profileImageUrl.trim(),
      });

      onSaved(resp.practitioner);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update practitioner.");
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
            <div className="eyebrow text-[#57c5a9] flex items-center gap-2">
              <Users size={14} /> PRACTITIONER & KNOWLEDGE BEARER PROFILE
            </div>
            <h2 className="font-serif text-2xl text-white mt-1">
              Edit Artisan: <span className="text-[#efb167]">{practitioner.displayName}</span>
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
              <label className="eyebrow block text-white/70">Master Artisan Full Name *</label>
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Heritage Craft Role / Title *</label>
              <input
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. 5th Generation Blue Pottery Master"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
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
              <label className="eyebrow block text-white/70">City / Village</label>
              <input
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Jaipur, Raghurajpur"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Years of Practice</label>
              <input
                type="number"
                min="1"
                max="80"
                value={yearsOfPractice}
                onChange={(e) => setYearsOfPractice(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow block text-white/70">Collaboration Availability</label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                <option value="OPEN_FOR_WORKSHOPS">Open for Workshops</option>
                <option value="AVAILABLE_FOR_APPRENTICESHIP">Available for Apprenticeship</option>
                <option value="BY_ENQUIRY_ONLY">By Enquiry Only</option>
                <option value="SEASONAL_BREAK">Seasonal Break</option>
              </select>
            </div>
            <div>
              <label className="eyebrow block text-white/70">Institutional Recognition</label>
              <select
                value={verificationBadge}
                onChange={(e) => setVerificationBadge(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                <option value="NATIONAL_MASTER_AWARD">National Master Craftsperson Award</option>
                <option value="UNESCO_FELLOW">UNESCO Living Human Treasure / Fellow</option>
                <option value="STATE_HERITAGE_HONOR">State Master Craftsperson Award</option>
                <option value="HERCRAFT_MASTER">HerCraft Guild Master & Mentor</option>
                <option value="COMMUNITY_ELDER">Traditional Lineage Custodian</option>
              </select>
            </div>
          </div>

          {/* Profile Image Picker */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ImageUploadField
              label="Practitioner Portrait / Workshop Photograph"
              value={profileImageUrl}
              onChange={setProfileImageUrl}
              placeholder="Select from 9 verified national assets or upload artisan photo"
            />
          </div>

          <div>
            <label className="eyebrow block text-white/70">Short Bio / Punchline *</label>
            <input
              required
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
              placeholder="e.g. Master craftsman recognized with President Award for revigorating natural dyes"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block text-white/70">Full Lineage Narrative & Apprenticeship History</label>
            <textarea
              rows={3}
              value={fullNarrative}
              onChange={(e) => setFullNarrative(e.target.value)}
              placeholder="Detailed oral history, master teachers, rare motif specializations..."
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
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
              {saving ? "Saving Changes..." : "Save Practitioner Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
