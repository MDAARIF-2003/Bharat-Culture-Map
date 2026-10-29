import React, { useState, useEffect } from "react";
import type { ArtMartProduct } from "@shared/contracts";
import { apiClient } from "@/lib/api";
import { X, Save, ShoppingBag, AlertCircle } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  product: ArtMartProduct | null;
  onSaved: (updated: ArtMartProduct) => void;
}

export default function EditProductModal({
  open,
  onClose,
  product,
  onSaved,
}: EditProductModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Craft");
  const [priceInr, setPriceInr] = useState(1200);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [makingProcess, setMakingProcess] = useState("");
  const [provenanceNote, setProvenanceNote] = useState("");
  const [description, setDescription] = useState("");
  const [publicationStatus, setPublicationStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("PUBLISHED");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product) return;
    setTitle(product.title || "");
    setCategory(product.category || "Craft");
    setPriceInr(product.priceInr || 1200);
    setStockQuantity(product.stockQuantity || 10);
    setMaterialsUsed(product.materialsUsed || "");
    setMakingProcess(product.makingProcess || "");
    setProvenanceNote(product.provenanceNote || "");
    setDescription(product.description || "");
    setPublicationStatus(product.publicationStatus || "PUBLISHED");
    setImageUrl(product.imageUrl || "");
    setError("");
  }, [product]);

  if (!open || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const resp = await apiClient.updateArtMartProduct(product.id, {
        title,
        category,
        priceInr: Number(priceInr),
        stockQuantity: Number(stockQuantity),
        materialsUsed,
        makingProcess,
        provenanceNote,
        description,
        publicationStatus,
        imageUrl: imageUrl.trim(),
      });

      onSaved(resp.product);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update craft product.");
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
            <div className="eyebrow text-[#efb167] flex items-center gap-2">
              <ShoppingBag size={14} /> ART-MART FAIR-TRADE PRODUCT EDITOR
            </div>
            <h2 className="font-serif text-2xl text-white mt-1">
              Edit Product: <span className="text-[#efb167]">{product.title}</span>
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
              <label className="eyebrow block text-white/70">Product Title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Craft Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                <option value="Craft">Living Craft</option>
                <option value="Textile">Handloom & Textile</option>
                <option value="Pottery">Ceramic & Blue Pottery</option>
                <option value="Metalware">Bell Metal & Dokra</option>
                <option value="Painting">Pattachitra & Folk Painting</option>
                <option value="Toymaking">Lacquerware & Woodcraft</option>
                <option value="Leather">Handcrafted Footwear & Leather</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="eyebrow block text-white/70">Price (INR ₹) *</label>
              <input
                type="number"
                min="50"
                step="50"
                required
                value={priceInr}
                onChange={(e) => setPriceInr(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Stock Available (Units) *</label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Marketplace Status</label>
              <select
                value={publicationStatus}
                onChange={(e) => setPublicationStatus(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              >
                <option value="PUBLISHED">Published (Available for Purchase)</option>
                <option value="DRAFT">Draft / Unpublished</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Product Image Field */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ImageUploadField
              label="Primary Product Showcase Image"
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="Select from 9 verified national assets or upload product photo"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow block text-white/70">Authentic Raw Materials</label>
              <input
                value={materialsUsed}
                onChange={(e) => setMaterialsUsed(e.target.value)}
                placeholder="e.g. Quartz powder, Fuller's earth, Copper oxide, Gum"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow block text-white/70">Geographic Provenance / GI Cluster</label>
              <input
                value={provenanceNote}
                onChange={(e) => setProvenanceNote(e.target.value)}
                placeholder="e.g. Kot Jewar, Jaipur Cluster, Rajasthan (GI: GI-RAJ-02)"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="eyebrow block text-white/70">Artisan Technique & Craft Process</label>
            <input
              value={makingProcess}
              onChange={(e) => setMakingProcess(e.target.value)}
              placeholder="e.g. Dough rolled into molds, hand-painted with squirrel-hair brushes, low-temperature wood kiln firing"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2 text-xs text-white focus:border-[#ef9d45] focus:outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block text-white/70">Artisan Description & Cultural Story *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {saving ? "Saving Changes..." : "Save Product Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
