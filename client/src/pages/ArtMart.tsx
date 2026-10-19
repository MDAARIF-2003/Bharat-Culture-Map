import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Filter,
  Heart,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type {
  ArtMartOrder,
  ArtMartProduct,
  ArtMartSeller,
  UserAccount,
} from "@shared/contracts";

interface CartItem {
  product: ArtMartProduct;
  quantity: number;
}

export default function ArtMart() {
  const [, setLocation] = useLocation();
  const [matchDetail, params] = useRoute("/art-mart/:slug");
  const activeSlug = matchDetail ? params?.slug : null;

  const [products, setProducts] = useState<ArtMartProduct[]>([]);
  const [sellers, setSellers] = useState<ArtMartSeller[]>([]);
  const [orders, setOrders] = useState<ArtMartOrder[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & active tab
  const [activeTab, setActiveTab] = useState<
    "catalogue" | "storefronts" | "seller-dashboard" | "cart" | "orders"
  >("catalogue");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedSellerId, setSelectedSellerId] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Simulated checkout form
  const [buyerName, setBuyerName] = useState("Meera Nambiar (Demo Buyer)");
  const [buyerEmail, setBuyerEmail] = useState(
    "buyer.demo@bharat-culturemap.local"
  );
  const [shippingCity, setShippingCity] = useState("Kolhapur");
  const [shippingState, setShippingState] = useState("Maharashtra");
  const [shippingAddress, setShippingAddress] = useState(
    "24 Bindu Chowk Heritage Lane, Kolhapur 416002 (Demo Address)"
  );
  const [paymentMethod, setPaymentMethod] = useState(
    "SIMULATED_UPI_SANDBOX (Zero real money transferred)"
  );
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ArtMartOrder | null>(
    null
  );
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Seller Dashboard: Create / Edit Product
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Leather & Footwear Craft");
  const [newTraditionSlug, setNewTraditionSlug] = useState("kolhapuri-chappal");
  const [newTraditionTitle, setNewTraditionTitle] =
    useState("Kolhapuri Chappal");
  const [newSellerId, setNewSellerId] = useState("seller-karvir-leather-demo");
  const [newPriceInr, setNewPriceInr] = useState("2200");
  const [newStock, setNewStock] = useState("8");
  const [newMaterials, setNewMaterials] = useState(
    "Vegetable-tanned buffalo hide, natural Hirda bark tan, hand-plaited leather cord."
  );
  const [newProcess, setNewProcess] = useState(
    "Hand-cut and stitched without nails in our Kolhapur demonstration studio."
  );
  const [newDescription, setNewDescription] = useState("");
  const [editingProduct, setEditingProduct] = useState<ArtMartProduct | null>(
    null
  );

  // Moderated seller enquiry state
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryContact, setEnquiryContact] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [enquirySuccess, setEnquirySuccess] = useState<string | null>(null);

  const loadArtMartData = async () => {
    setLoading(true);
    try {
      const [prodResp, ordResp, authResp] = await Promise.all([
        apiClient.listArtMartProducts({ includeUnpublished: true }),
        apiClient.listArtMartOrders(),
        apiClient.getAuthStatus().catch(() => ({
          needsBootstrap: false,
          user: null,
          driver: "sqlite",
        })),
      ]);
      setProducts(prodResp.products || []);
      setSellers(prodResp.sellers || []);
      setOrders(ordResp.orders || []);
      setCurrentUser(authResp.user);
      if (authResp.user) {
        setBuyerName(authResp.user.fullName);
        setBuyerEmail(authResp.user.email);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArtMartData();
    const onAuthChanged = () => void loadArtMartData();
    window.addEventListener("bcm-auth-changed", onAuthChanged);
    return () => window.removeEventListener("bcm-auth-changed", onAuthChanged);
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(p.category);
    return ["All", ...Array.from(set)];
  }, [products]);

  const states = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(p.stateName);
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (p.publicationStatus !== "PUBLISHED") return false;
      if (selectedCategory !== "All" && p.category !== selectedCategory)
        return false;
      if (selectedState !== "All" && p.stateName !== selectedState)
        return false;
      if (
        selectedSellerId !== "All" &&
        p.sellerId !== selectedSellerId &&
        p.sellerSlug !== selectedSellerId
      )
        return false;
      if (q) {
        const hay = [
          p.title,
          p.category,
          p.traditionTitle || "",
          p.sellerName,
          p.regionLabel,
          p.stateName,
          p.materialsUsed,
          p.description,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "price_asc") {
      list.sort((a, b) => a.priceInr - b.priceInr);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.priceInr - a.priceInr);
    } else if (sortBy === "stock_desc") {
      list.sort((a, b) => b.stockQuantity - a.stockQuantity);
    }
    return list;
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedState,
    selectedSellerId,
    sortBy,
  ]);

  const selectedProduct = useMemo(() => {
    if (!activeSlug) return null;
    return (
      products.find(
        (p) =>
          p.slug.toLowerCase() === activeSlug.toLowerCase() ||
          p.id.toLowerCase() === activeSlug.toLowerCase()
      ) || null
    );
  }, [products, activeSlug]);

  const addToCart = (product: ArtMartProduct, qty = 1) => {
    if (product.stockQuantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id
            ? {
                ...it,
                quantity: Math.min(
                  product.stockQuantity,
                  it.quantity + qty
                ),
              }
            : it
        );
      }
      return [...prev, { product, quantity: Math.min(product.stockQuantity, qty) }];
    });
    setFeedbackBanner(
      `Added "${product.title}" to your demonstration cart.`
    );
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const cartTotalInr = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.product.priceInr * item.quantity,
        0
      ),
    [cart]
  );

  const handleSimulatedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutSubmitting(true);
    try {
      const resp = await apiClient.createArtMartOrder({
        buyerName,
        buyerEmail,
        shippingCity,
        shippingState,
        shippingAddressLabel: shippingAddress,
        paymentMethodLabel: paymentMethod,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        })),
      });
      setConfirmedOrder(resp.order);
      setCart([]);
      await loadArtMartData();
    } catch (err: any) {
      setFeedbackBanner(err?.message || "Simulated checkout failed.");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleOrderStatusChange = async (
    orderId: string,
    status: ArtMartOrder["status"]
  ) => {
    await apiClient.updateArtMartOrderStatus(orderId, status);
    await loadArtMartData();
    setFeedbackBanner(
      status === "CANCELLED_DEMO"
        ? "Demo order cancelled and product stock automatically restored."
        : `Order status updated to ${status}.`
    );
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await apiClient.createArtMartProduct({
      title: newTitle,
      category: newCategory,
      traditionSlug: newTraditionSlug,
      traditionTitle: newTraditionTitle,
      sellerId: newSellerId,
      priceInr: Number(newPriceInr) || 1800,
      stockQuantity: Number(newStock) || 5,
      materialsUsed: newMaterials,
      makingProcess: newProcess,
      description:
        newDescription ||
        `${newTitle} — hand-crafted demonstration listing on Bharat CultureMap Art-Mart.`,
      approvalStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
    });
    setNewTitle("");
    setNewDescription("");
    await loadArtMartData();
    setFeedbackBanner("New demonstration craft product created and published.");
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await apiClient.updateArtMartProduct(editingProduct.id, {
      title: editingProduct.title,
      priceInr: editingProduct.priceInr,
      stockQuantity: editingProduct.stockQuantity,
      approvalStatus: editingProduct.approvalStatus,
      publicationStatus: editingProduct.publicationStatus,
      description: editingProduct.description,
    });
    setEditingProduct(null);
    await loadArtMartData();
    setFeedbackBanner("Product inventory & publication status updated.");
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleSellerEnquiry = async (
    e: React.FormEvent,
    product: ArtMartProduct
  ) => {
    e.preventDefault();
    await apiClient.submitCommunityEnquiry({
      enquiryType: "WORKSHOP_ENQUIRY",
      senderName: enquiryName,
      senderContact: enquiryContact,
      message: `[Art-Mart Craft Enquiry for ${product.title} / ${product.sellerName}]: ${enquiryMessage}`,
    });
    setEnquirySuccess(
      "Enquiry submitted to the moderated craft guild desk (DEMO_SAMPLE)."
    );
    setEnquiryName("");
    setEnquiryContact("");
    setEnquiryMessage("");
  };

  // Product Detail View (/art-mart/:slug)
  if (activeSlug && selectedProduct) {
    const seller = sellers.find((s) => s.id === selectedProduct.sellerId);
    const related = products
      .filter(
        (p) =>
          p.id !== selectedProduct.id &&
          p.publicationStatus === "PUBLISHED" &&
          (p.category === selectedProduct.category ||
            p.traditionSlug === selectedProduct.traditionSlug ||
            p.stateName === selectedProduct.stateName)
      )
      .slice(0, 3);

    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setLocation("/art-mart")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-amber-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Art-Mart Catalogue
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                DEMO_SAMPLE PRODUCT
              </span>
              <button
                type="button"
                onClick={() => {
                  setLocation("/art-mart");
                  setActiveTab("cart");
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" /> Cart ({cart.length})
              </button>
            </div>
          </div>

          {feedbackBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {feedbackBanner}
            </div>
          )}

          {/* Product Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/manus-storage/bharat-culturemap-craft_14d51f4e.jpg";
                  }}
                />
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">
                  Media & Provenance Attribution
                </div>
                <div>{selectedProduct.imageCredit}</div>
                <div className="text-amber-300/90">
                  {selectedProduct.demoDisclaimer}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-xs font-semibold">
                  {selectedProduct.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {selectedProduct.regionLabel}
                </span>
                {selectedProduct.industryCollaborationId && (
                  <button
                    type="button"
                    onClick={() => setLocation("/industry-to-art")}
                    className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold"
                  >
                    Upcycled via Industry-to-Art ({selectedProduct.industryCollaborationId})
                  </button>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                {selectedProduct.title}
              </h1>

              <div className="flex flex-wrap items-baseline gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block">
                    Illustrative Demonstration Price
                  </span>
                  <span className="text-3xl font-bold text-amber-400">
                    ₹{selectedProduct.priceInr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="px-3 py-1 rounded-lg bg-slate-800 text-xs">
                  {selectedProduct.stockQuantity > 0 ? (
                    <span className="text-emerald-400 font-semibold">
                      In Stock ({selectedProduct.stockQuantity} demo units available)
                    </span>
                  ) : (
                    <span className="text-red-400 font-semibold">
                      Out of Stock (Demo)
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">
                {selectedProduct.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold uppercase text-amber-300">
                    Materials & Raw Inputs
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedProduct.materialsUsed}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold uppercase text-amber-300">
                    Traditional Making Process
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedProduct.makingProcess}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">
                    Connected Cultural Tradition
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {selectedProduct.traditionTitle || "Regional Heritage Craft"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedProduct.provenanceNote}
                  </div>
                </div>
                {selectedProduct.traditionSlug && (
                  <button
                    type="button"
                    onClick={() =>
                      setLocation(`/traditions/${selectedProduct.traditionSlug}`)
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium flex items-center gap-1.5 shrink-0"
                  >
                    Explore Tradition <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Add to Cart & Wishlist Controls */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={selectedProduct.stockQuantity <= 0}
                  onClick={() => addToCart(selectedProduct, 1)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Demonstration Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedProduct, 1);
                    setLocation("/art-mart");
                    setActiveTab("cart");
                  }}
                  disabled={selectedProduct.stockQuantity <= 0}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm"
                >
                  Proceed to Simulated Checkout
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(selectedProduct.id)}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                    wishlistIds.includes(selectedProduct.id)
                      ? "bg-pink-500/20 border-pink-400 text-pink-200"
                      : "bg-slate-900 border-slate-700 text-slate-300"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  {wishlistIds.includes(selectedProduct.id)
                    ? "Saved in Wishlist"
                    : "Wishlist"}
                </button>
              </div>
            </div>
          </div>

          {/* Seller Storefront & Moderated Enquiry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Demonstration Seller Storefront
                </span>
                <span className="text-xs text-slate-400">
                  Rating: ★ {seller?.ratingAverage || 4.9} ({seller?.completedDemoOrders || 35} demo orders)
                </span>
              </div>
              <h2 className="text-xl font-serif font-bold text-white">
                {seller?.storefrontName || selectedProduct.sellerName}
              </h2>
              <p className="text-xs text-amber-200/90 font-medium">
                {seller?.craftClusterLabel}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {seller?.storySummary}
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                {seller?.verificationNote}
              </div>
              {seller?.linkedPractitionerId && (
                <button
                  type="button"
                  onClick={() => setLocation("/practitioners")}
                  className="text-xs font-semibold text-amber-300 hover:underline flex items-center gap-1"
                >
                  View Linked Master Practitioner Profile →
                </button>
              )}
            </div>

            <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h3 className="text-lg font-serif font-bold text-white">
                Contact Seller / Custom Commission Enquiry (Moderated)
              </h3>
              <p className="text-xs text-slate-400">
                Direct artisan phone numbers are protected. Submit a moderated enquiry to discuss custom sizing, bulk institutional orders, or craft provenance.
              </p>
              {enquirySuccess ? (
                <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200">
                  {enquirySuccess}
                </div>
              ) : (
                <form
                  onSubmit={(e) => handleSellerEnquiry(e, selectedProduct)}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={enquiryName}
                      onChange={(e) => setEnquiryName(e.target.value)}
                      placeholder="Your Name"
                      className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                    <input
                      type="text"
                      required
                      value={enquiryContact}
                      onChange={(e) => setEnquiryContact(e.target.value)}
                      placeholder="Email or Contact"
                      className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    placeholder="Ask about craft dimensions, custom motifs, or workshop provenance..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs"
                  >
                    Send Moderated Seller Enquiry
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-white">
                Related Regional Craft Listings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {related.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <span className="text-[11px] text-amber-300 font-semibold">
                        {item.category} • {item.regionLabel}
                      </span>
                      <h4 className="font-serif font-bold text-base text-white">
                        {item.title}
                      </h4>
                      <div className="text-lg font-bold text-amber-400">
                        ₹{item.priceInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocation(`/art-mart/${item.slug}`)}
                      className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300"
                    >
                      Inspect Craft Listing
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
      {/* Hero Banner */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-[#0B0F17] py-10 px-4">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <ShoppingBag className="w-3.5 h-3.5" /> ART-MART CULTURAL CRAFT MARKETPLACE (DEMO_SAMPLE)
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                Bharat Art-Mart — Provenance-Linked Craft Catalogue
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Explore illustrative regional craft products directly connected to documented traditions, GI clusters, and Industry-to-Art upcycled material collaborations. All prices, inventory counts, seller storefronts, and checkouts are simulated for demonstration.
              </p>
            </div>

            {/* Quick Cart & Orders Summary */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("cart")}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <ShoppingCart className="w-4 h-4" />
                Demo Cart ({cart.reduce((s, c) => s + c.quantity, 0)}) • ₹
                {cartTotalInr.toLocaleString("en-IN")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <Truck className="w-4 h-4 text-amber-400" />
                Orders ({orders.length})
              </button>
            </div>
          </div>

          {/* Module Sub-Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: "catalogue", label: `Craft Catalogue (${filteredProducts.length})`, icon: Package },
              { id: "storefronts", label: `Seller Storefronts (${sellers.length})`, icon: Store },
              { id: "seller-dashboard", label: "Seller Dashboard & Inventory", icon: Edit3 },
              { id: "cart", label: `Shopping Cart & Simulated Checkout (${cart.length})`, icon: ShoppingCart },
              { id: "orders", label: `Order History & Cancellations (${orders.length})`, icon: Truck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === tab.id
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {feedbackBanner && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {feedbackBanner}
            </span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: PRODUCT CATALOGUE */}
        {activeTab === "catalogue" && (
          <div className="space-y-6">
            {/* Search, Filter & Sort Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Kolhapuri Chappal, Saaj, Hupari silver, Warli, Pattachitra, Patola..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <select
                aria-label="Filter by Craft Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Craft Categories" : c}
                  </option>
                ))}
              </select>

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
                aria-label="Sort Products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="featured">Sort: Featured Provenance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_desc">Availability: High Stock</option>
              </select>
            </div>

            {selectedSellerId !== "All" && (
              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                <span>
                  Showing products from selected seller storefront:{" "}
                  <strong>
                    {sellers.find((s) => s.id === selectedSellerId)?.storefrontName ||
                      selectedSellerId}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSellerId("All")}
                  className="underline font-semibold"
                >
                  Show All Storefronts
                </button>
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Loading demonstration craft catalogue...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
                <p className="text-sm text-slate-300">
                  No demonstration products match your current filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setSelectedState("All");
                    setSelectedSellerId("All");
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold"
                >
                  Reset Catalogue Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition-all"
                  >
                    <div>
                      <div className="aspect-[16/10] bg-slate-950 relative overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "/manus-storage/bharat-culturemap-craft_14d51f4e.jpg";
                          }}
                        />
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-950/90 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase">
                            DEMO_SAMPLE
                          </span>
                          {product.industryCollaborationId && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/50 text-emerald-300 text-[10px] font-semibold">
                              Industry-to-Art Upcycled
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label="Save to wishlist"
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/80 text-slate-200 hover:text-pink-400"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              wishlistIds.includes(product.id)
                                ? "fill-pink-500 text-pink-500"
                                : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="text-amber-300 font-medium">
                            {product.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {product.regionLabel}
                          </span>
                        </div>

                        <h2 className="font-serif font-bold text-lg text-white leading-snug">
                          {product.title}
                        </h2>

                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>

                        <div className="text-[11px] text-slate-400 pt-1">
                          <div>
                            <strong className="text-slate-300">Storefront:</strong>{" "}
                            {product.sellerName}
                          </div>
                          {product.traditionTitle && (
                            <div>
                              <strong className="text-slate-300">Tradition:</strong>{" "}
                              <button
                                type="button"
                                onClick={() =>
                                  product.traditionSlug &&
                                  setLocation(`/traditions/${product.traditionSlug}`)
                                }
                                className="text-amber-300 underline"
                              >
                                {product.traditionTitle}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 space-y-3">
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block">
                            Demo Price
                          </span>
                          <span className="text-xl font-bold text-amber-400">
                            ₹{product.priceInr.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            product.stockQuantity > 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {product.stockQuantity > 0
                            ? `${product.stockQuantity} in stock`
                            : "Out of stock"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLocation(`/art-mart/${product.slug}`)}
                          className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          disabled={product.stockQuantity <= 0}
                          onClick={() => addToCart(product, 1)}
                          className="py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SELLER STOREFRONTS */}
        {activeTab === "storefronts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sellers.map((seller) => {
              const sellerProds = products.filter(
                (p) => p.sellerId === seller.id
              );
              return (
                <div
                  key={seller.id}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold">
                        DEMO_SAMPLE STOREFRONT
                      </span>
                      <span className="text-xs text-slate-400">
                        ★ {seller.ratingAverage} • {seller.completedDemoOrders} simulated orders
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white">
                      {seller.storefrontName}
                    </h3>
                    <div className="text-xs text-amber-300 font-medium">
                      {seller.craftClusterLabel}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {seller.storySummary}
                    </p>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                      {seller.verificationNote}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-300 font-medium">
                      {sellerProds.length} craft listings in catalogue
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSellerId(seller.id);
                        setActiveTab("catalogue");
                      }}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs"
                    >
                      Browse Storefront Products
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: SELLER DASHBOARD & INVENTORY MANAGEMENT */}
        {activeTab === "seller-dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase text-amber-400">
                  Artisan & Seller Studio
                </span>
                <h2 className="text-xl font-serif font-bold text-white">
                  Create New Craft Listing (Demo)
                </h2>
                <p className="text-xs text-slate-400">
                  Test adding a new craft product to a demonstration storefront. All created listings are marked DEMO_SAMPLE.
                </p>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Kurundwadi Hand-Braided Kolhapuri Chappal (Demo)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Storefront
                    </label>
                    <select
                      value={newSellerId}
                      onChange={(e) => setNewSellerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.storefrontName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Demo Price (INR)
                    </label>
                    <input
                      type="number"
                      min={50}
                      required
                      value={newPriceInr}
                      onChange={(e) => setNewPriceInr(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Initial Stock Quantity
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Linked Tradition Slug
                    </label>
                    <input
                      type="text"
                      value={newTraditionSlug}
                      onChange={(e) => setNewTraditionSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Linked Tradition Name
                    </label>
                    <input
                      type="text"
                      value={newTraditionTitle}
                      onChange={(e) => setNewTraditionTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Materials Used
                  </label>
                  <input
                    type="text"
                    value={newMaterials}
                    onChange={(e) => setNewMaterials(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Making Process & Provenance Description
                  </label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe how the craft item is made and its cultural lineage..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Publish Demonstration Product
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-xl font-serif font-bold text-white">
                Inventory, Approval & Publication Controls ({products.length})
              </h2>
              <p className="text-xs text-slate-400">
                Adjust stock quantities, demo pricing, or toggle publication status for any product.
              </p>

              {editingProduct && (
                <form
                  onSubmit={handleSaveProductEdit}
                  className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3"
                >
                  <div className="text-xs font-bold text-amber-300">
                    Editing: {editingProduct.title}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Demo Price (INR)
                      </label>
                      <input
                        type="number"
                        value={editingProduct.priceInr}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            priceInr: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={editingProduct.stockQuantity}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            stockQuantity: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Publication Status
                      </label>
                      <select
                        value={editingProduct.publicationStatus}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            publicationStatus: e.target.value as any,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded bg-amber-500 text-slate-950 font-semibold text-xs"
                    >
                      Save Inventory Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 max-w-md">
                      <div className="text-sm font-semibold text-white">
                        {prod.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {prod.sellerName} • ₹{prod.priceInr.toLocaleString("en-IN")} • Stock:{" "}
                        <strong className="text-amber-300">
                          {prod.stockQuantity}
                        </strong>{" "}
                        • Status: {prod.publicationStatus}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prod)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300"
                    >
                      Edit Price / Stock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SHOPPING CART & SIMULATED CHECKOUT */}
        {activeTab === "cart" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-xl font-serif font-bold text-white">
                Demonstration Shopping Cart
              </h2>

              {confirmedOrder && (
                <div className="p-5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Simulated Order Confirmed: {confirmedOrder.orderNumber}
                  </div>
                  <p className="text-xs text-slate-200">
                    Total Simulated Amount: ₹
                    {confirmedOrder.totalInr.toLocaleString("en-IN")} • Payment
                    Mode: {confirmedOrder.paymentMethodLabel}
                  </p>
                  <p className="text-[11px] text-amber-200/90">
                    {confirmedOrder.simulationDisclaimer}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-semibold text-xs"
                  >
                    View Order History & Manage Status →
                  </button>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="p-8 text-center space-y-3 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm text-slate-400">
                    Your demonstration cart is currently empty.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("catalogue")}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs"
                  >
                    Browse Craft Catalogue
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-1 max-w-md">
                        <div className="text-sm font-semibold text-white">
                          {item.product.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.product.sellerName} • ₹
                          {item.product.priceInr.toLocaleString("en-IN")} per unit
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={item.product.stockQuantity}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(
                              1,
                              Math.min(
                                item.product.stockQuantity,
                                Number(e.target.value) || 1
                              )
                            );
                            setCart((prev) =>
                              prev.map((c) =>
                                c.product.id === item.product.id
                                  ? { ...c, quantity: val }
                                  : c
                              )
                            );
                          }}
                          className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-center text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCart((prev) =>
                              prev.filter(
                                (c) => c.product.id !== item.product.id
                              )
                            )
                          }
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  SIMULATED PAYMENT SANDBOX ONLY
                </div>
                <div>
                  Do not enter real credit/debit card numbers. This checkout flow simulates order creation and stock updates without transferring money.
                </div>
              </div>

              <form onSubmit={handleSimulatedCheckout} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Buyer Name (Demo)
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Buyer Email
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingState}
                      onChange={(e) => setShippingState(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Delivery Address (Illustrative)
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Simulated Payment Adapter
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="SIMULATED_UPI_SANDBOX (Zero real money transferred)">
                      Simulated UPI Sandbox (No real payment)
                    </option>
                    <option value="SIMULATED_ESCROW_PREVIEW (Zero real money transferred)">
                      Simulated Artisan Guild Escrow Preview
                    </option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold">
                  <span>Simulated Order Total:</span>
                  <span className="text-amber-400 text-lg">
                    ₹{cartTotalInr.toLocaleString("en-IN")}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0 || checkoutSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs"
                >
                  {checkoutSubmitting
                    ? "Simulating Order..."
                    : "Complete Simulated Checkout"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: ORDER HISTORY & CANCELLATIONS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-serif font-bold text-white">
                  Demonstration Order History & Stock Restoration
                </h2>
                <p className="text-xs text-slate-400">
                  Cancelling an active demonstration order automatically restores the deducted stock quantity to the craft product inventory.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-amber-300">
                          {order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-semibold text-white">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Buyer: {order.buyerName} ({order.buyerEmail}) •{" "}
                        {order.shippingCity}, {order.shippingState}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-400">
                        ₹{order.totalInr.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.paymentMethodLabel}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {order.items.map((it, idx) => (
                      <div
                        key={`${order.id}-${idx}`}
                        className="flex items-center justify-between text-xs text-slate-200"
                      >
                        <span>
                          {it.quantity}x {it.productTitle} ({it.sellerName})
                        </span>
                        <span className="font-semibold">
                          ₹{it.lineTotalInr.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                    <span className="text-[11px] text-amber-200/80">
                      {order.simulationDisclaimer}
                    </span>
                    <div className="flex items-center gap-2">
                      {order.status !== "CANCELLED_DEMO" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleOrderStatusChange(
                                order.id,
                                "DISPATCHED_DEMO"
                              )
                            }
                            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                          >
                            Mark Dispatched (Demo)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleOrderStatusChange(
                                order.id,
                                "COMPLETED_DEMO"
                              )
                            }
                            className="px-3 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-xs text-emerald-200"
                          >
                            Mark Completed
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleOrderStatusChange(
                                order.id,
                                "CANCELLED_DEMO"
                              )
                            }
                            className="px-3 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-xs text-red-200 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel & Restore Stock
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
