import React, { useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import { SAMPLE_CULTURAL_IMAGES } from "@/lib/images";
import { Check, Image as ImageIcon, Loader2, Sparkles, UploadCloud, X } from "lucide-react";

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  placeholder?: string;
}

export default function ImageUploadField({
  label = "Hero / Cover Photograph",
  value,
  onChange,
  helperText = "Upload a local photo (JPG, PNG, WebP) or pick an authentic curated Indian cultural sample.",
  placeholder = "https://... or choose a sample image below",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samplePickerOpen, setSamplePickerOpen] = useState(false);

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
        <label className="text-xs font-semibold uppercase tracking-wider text-white/80">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setSamplePickerOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#efb167] transition hover:text-white"
        >
          <Sparkles size={12} />
          {samplePickerOpen ? "Hide Samples" : "Pick Curated Sample"}
        </button>
      </div>

      {/* Main input & upload bar */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/sample-images/handloom-sari.jpg or https://..."
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
              Upload Image
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
            className="h-32 w-full object-cover object-center"
          />
          <div className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm">
            Current Photo Preview
          </div>
        </div>
      )}

      {/* Quick Curated Sample Picker Modal / Drawer */}
      {samplePickerOpen && (
        <div className="mt-3 rounded-2xl border border-[#ef9d45]/30 bg-[#161a29] p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#efb167]">
            <span>Select Authentic Indian Cultural Sample</span>
            <button
              type="button"
              onClick={() => setSamplePickerOpen(false)}
              className="text-white/50 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
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
        </div>
      )}
    </div>
  );
}
