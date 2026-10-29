import React, { useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import { SAMPLE_CULTURAL_IMAGES, VERIFIED_CULTURAL_IMAGES } from "@/lib/images";
import { Check, Image as ImageIcon, Loader2, Sparkles, UploadCloud, X, Award, ShieldCheck } from "lucide-react";

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  placeholder?: string;
}

const VERIFIED_LABELS: Record<string, { title: string; origin: string; tag: string }> = {
  kolhapuriChappal: { title: "Kolhapuri Chappal", origin: "Maharashtra (Kolhapur)", tag: "GI App. 169" },
  paithaniSaree: { title: "Paithani Saree", origin: "Maharashtra (Paithan)", tag: "GI App. 36" },
  warliPainting: { title: "Warli Folk Art", origin: "Maharashtra (Palghar)", tag: "GI App. 171" },
  bluePottery: { title: "Jaipur Blue Pottery", origin: "Rajasthan (Jaipur)", tag: "GI App. 37" },
  kalbeliaDance: { title: "Kalbelia Folk Dance", origin: "Rajasthan (Thar)", tag: "UNESCO ICH" },
  channapatnaToys: { title: "Channapatna Toys", origin: "Karnataka (Ramanagara)", tag: "GI App. 24" },
  thanjavurPainting: { title: "Thanjavur Painting", origin: "Tamil Nadu (Thanjavur)", tag: "GI App. 22" },
  dokraCasting: { title: "Bengal Dokra Casting", origin: "West Bengal (Bankura)", tag: "GI App. 583" },
  odishaPattachitra: { title: "Odisha Pattachitra", origin: "Odisha (Raghurajpur)", tag: "GI App. 105" },
};

export default function ImageUploadField({
  label = "Hero / Cover Photograph",
  value,
  onChange,
  helperText = "Upload your photo, paste a URL, or pick from verified national heritage images.",
  placeholder = "/cultural-images/... or https://...",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samplePickerOpen, setSamplePickerOpen] = useState(false);
  const [activeGalleryTab, setActiveGalleryTab] = useState<"verified" | "samples">("verified");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP, SVG).");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await apiClient.uploadImage(file);
      onChange(res.url);
    } catch (err: any) {
      setError(err?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
          <ImageIcon size={13} className="text-[#efb167]" />
          {label}
        </label>
        <button
          type="button"
          onClick={() => setSamplePickerOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ef9d45]/30 bg-[#ef9d45]/10 px-2.5 py-1 text-[11px] font-semibold text-[#efb167] transition hover:bg-[#ef9d45] hover:text-[#191c2a]"
        >
          <Sparkles size={12} />
          {samplePickerOpen ? "Close Visual Gallery" : "Browse Verified Gallery"}
        </button>
      </div>

      {/* Main input & upload bar */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-white/30 focus:border-[#ef9d45]"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ef9d45]/40 bg-[#ef9d45]/15 px-4 py-2.5 text-xs font-semibold text-[#efb167] transition hover:bg-[#ef9d45] hover:text-[#191c2a] disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud size={14} />
              Upload Local Image
            </>
          )}
        </button>
      </div>

      {helperText && <p className="text-[11px] text-white/45">{helperText}</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}

      {/* Live Preview */}
      {value && (
        <div className="relative mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <img
            src={value}
            alt="Preview"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = SAMPLE_CULTURAL_IMAGES.heroDefault;
            }}
            className="h-36 w-full object-cover object-center"
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/85 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-sm border border-white/10">
            <ShieldCheck size={11} className="text-[#34D399]" />
            Active Photo Preview
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white/70 hover:text-white hover:bg-black/90 transition"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Quick Curated Sample Picker Modal / Drawer */}
      {samplePickerOpen && (
        <div className="mt-3 rounded-2xl border border-[#ef9d45]/40 bg-[#121624] p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveGalleryTab("verified")}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full transition ${
                  activeGalleryTab === "verified"
                    ? "bg-[#ef9d45] text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Award size={12} />
                Verified National Images ({Object.keys(VERIFIED_CULTURAL_IMAGES).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveGalleryTab("samples")}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full transition ${
                  activeGalleryTab === "samples"
                    ? "bg-[#38BDF8] text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Cultural Archetypes ({Object.keys(SAMPLE_CULTURAL_IMAGES).length})
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSamplePickerOpen(false)}
              className="text-white/50 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          {activeGalleryTab === "verified" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(VERIFIED_CULTURAL_IMAGES).map(([key, imgPath]) => {
                const meta = VERIFIED_LABELS[key] || { title: key, origin: "India", tag: "Verified" };
                const isSelected = value === imgPath;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChange(imgPath);
                      setSamplePickerOpen(false);
                    }}
                    className={`group relative overflow-hidden rounded-xl border text-left transition p-1.5 ${
                      isSelected
                        ? "border-[#ef9d45] bg-[#ef9d45]/15 ring-2 ring-[#ef9d45]"
                        : "border-white/10 bg-white/[0.03] hover:border-[#ef9d45]/60 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="relative h-24 w-full overflow-hidden rounded-lg">
                      <img
                        src={imgPath}
                        alt={meta.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-black/80 px-2 py-0.5 text-[9px] font-bold text-[#F59E0B] border border-amber-500/30">
                        {meta.tag}
                      </span>
                    </div>
                    <div className="mt-2 px-1">
                      <div className="font-semibold text-xs text-white truncate">{meta.title}</div>
                      <div className="text-[10px] text-white/50 truncate">{meta.origin}</div>
                    </div>
                    {isSelected && (
                      <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-[#ef9d45] text-black font-bold">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 max-h-[280px] overflow-y-auto pr-1">
              {Object.entries(SAMPLE_CULTURAL_IMAGES).map(([key, imgPath]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange(imgPath);
                    setSamplePickerOpen(false);
                  }}
                  className={`group relative overflow-hidden rounded-lg border text-left transition ${
                    value === imgPath
                      ? "border-[#ef9d45] ring-2 ring-[#ef9d45]"
                      : "border-white/10 hover:border-[#ef9d45]/60"
                  }`}
                >
                  <img
                    src={imgPath}
                    alt={key}
                    className="h-16 w-full object-cover transition group-hover:scale-105"
                  />
                  <span className="block truncate bg-[#0f121d] px-1.5 py-1 text-[9px] capitalize text-white/75">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  {value === imgPath && (
                    <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-[#ef9d45] text-black">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
