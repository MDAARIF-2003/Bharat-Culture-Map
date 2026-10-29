import React, { useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { VERIFIED_CULTURAL_IMAGES } from "@/lib/images";

interface AavishkarDossierModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AavishkarDossierModal({
  open,
  onClose,
}: AavishkarDossierModalProps) {
  const [activeZone, setActiveZone] = useState<"western" | "northern" | "southern" | "eastern" | "northeastern">("western");
  const [activeTab, setActiveTab] = useState<"master_data" | "schema" | "repositories" | "defense">("master_data");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-[#D97706]/40 bg-[#0C1019] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Banner */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-[#172133] via-[#0E1524] to-[#1A1829] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#D97706]/20 border border-[#D97706]/50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
                  Aavishkar Research Convention
                </span>
                <span className="rounded-full bg-[#0284C7]/20 border border-[#0284C7]/50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                  Category: HLFA
                </span>
                <span className="rounded-full bg-[#059669]/20 border border-[#059669]/50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#34D399]">
                  Phase 1 National Corpus
                </span>
              </div>
              <h2 className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl">
                Bharat CultureMap — National Cultural Heritage Master Dataset
              </h2>
              <p className="mt-1 text-xs text-white/60">
                Official Public Records, Technical Taxonomy & Image Provenance Directory (Humanities, Languages and Fine Arts)
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/15 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("master_data")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "master_data"
                  ? "bg-[#D97706] text-black"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <Award size={13} />
              National Master Dataset (5 Zones)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("defense")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "defense"
                  ? "bg-[#38BDF8] text-black"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <GraduationCap size={13} />
              Jury Defense Strategy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schema")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "schema"
                  ? "bg-[#34D399] text-black"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <Database size={13} />
              JSON Schema Specification
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("repositories")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "repositories"
                  ? "bg-purple-400 text-black"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <BookOpen size={13} />
              Statutory Open Repositories
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "master_data" && (
            <div>
              {/* Research Design Note */}
              <div className="rounded-2xl border border-[#D97706]/30 bg-[#D97706]/10 p-4 text-xs leading-relaxed text-[#FDE68A]">
                <strong className="block text-sm font-bold text-[#F59E0B] mb-1">
                  Research Design Note: Phase 1 Secondary Validation vs. Phase 2 Field Pilot
                </strong>
                The records cataloged below serve as the primary knowledge corpus for Parampara AI and architectural stress-testing. Each record adheres strictly to the Cultural Provenance Chain and UNESCO/WIPO guidelines on Traditional Knowledge. In accordance with project ethics, all secondary public records are clearly marked as <em>&lsquo;Institutional Archetypes&rsquo;</em> until living practitioner interviews and Cultural Rights Passports are executed in the field.
              </div>

              {/* Zone Selector */}
              <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
                {[
                  { key: "western", label: "A. Western Region (MH & GJ)" },
                  { key: "northern", label: "B. Northern Region (UP, RJ, JK)" },
                  { key: "southern", label: "C. Southern Region (TN, KA, KL)" },
                  { key: "eastern", label: "D. Eastern & Central (WB, OD, MP)" },
                  { key: "northeastern", label: "E. North-Eastern (AS, MN, NL)" },
                ].map((z) => (
                  <button
                    key={z.key}
                    type="button"
                    onClick={() => setActiveZone(z.key as any)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                      activeZone === z.key
                        ? "bg-white text-black font-bold"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>

              {/* Zone Data Tables with Verified Media */}
              <div className="mt-4 space-y-4">
                {activeZone === "western" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.kolhapuriChappal} alt="Kolhapuri Chappal" className="h-32 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">GI App. No. 169</span>
                          <h4 className="font-serif text-sm font-bold text-white">Kolhapuri Chappal</h4>
                          <p className="text-[11px] text-white/60 mt-1">Vegetable-tanned hide; Babul bark & Harada botanical tanning; zero nails.</p>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.paithaniSaree} alt="Paithani Saree" className="h-32 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">GI App. No. 36</span>
                          <h4 className="font-serif text-sm font-bold text-white">Paithani Sarees</h4>
                          <p className="text-[11px] text-white/60 mt-1">Pure mulberry silk; genuine gold Zari; interlocking tapestry weave (Dhaap).</p>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.warliPainting} alt="Warli Painting" className="h-32 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">GI App. No. 171</span>
                          <h4 className="font-serif text-sm font-bold text-white">Warli Painting</h4>
                          <p className="text-[11px] text-white/60 mt-1">Tribal fresco; rice-flour paste with gum binder; Tarpa dance & Mother Palghat.</p>
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
                      <thead className="bg-[#172133] text-[#F59E0B]">
                        <tr>
                          <th className="p-2.5">State & District</th>
                          <th className="p-2.5">Tradition / Craft</th>
                          <th className="p-2.5">Official Registry ID</th>
                          <th className="p-2.5">Technical Taxonomy & Markers</th>
                          <th className="p-2.5">Archival Repository</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Maharashtra (Kolhapur)</td>
                          <td className="p-2.5">Kolhapuri Chappal (Handicraft)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 169</td>
                          <td className="p-2.5">Vegetable-tanned buffalo/ox hide; botanical Babul & Harada tanning; Charki cord stitch. Styles: Bichawa, Puda, Goda.</td>
                          <td className="p-2.5 text-white/60">IP India GIR Form GI-1; Indian Culture Portal (IIT-B/MoC)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Maharashtra (Paithan/Nashik)</td>
                          <td className="p-2.5">Paithani Sarees (Textile)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 36</td>
                          <td className="p-2.5">Pure mulberry silk; genuine gold/silver Zari; interlocking tapestry weave (Dhaap); Bangadi Mor & Asawali motifs.</td>
                          <td className="p-2.5 text-white/60">Weavers&apos; Service Centre (MoT); National Crafts Museum Folio</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Maharashtra (Palghar/Thane)</td>
                          <td className="p-2.5">Warli Painting (Folk Art)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 171</td>
                          <td className="p-2.5">Indigenous tribal fresco; rice-flour & water paste on Geru walls; bamboo chew-sticks; Tarpa dance spiral.</td>
                          <td className="p-2.5 text-white/60">Indira Gandhi National Centre for the Arts (IGNCA) Vault</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Gujarat (Patan)</td>
                          <td className="p-2.5">Patan Patola (Textile)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 232</td>
                          <td className="p-2.5">Double Ikat pure silk weaving; warp and weft tie-dyed separately with natural dyes; reversible Navratna Bhat.</td>
                          <td className="p-2.5 text-white/60">National Handlooms & Handicrafts Museum (NHHM) Catalog</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Gujarat (Kutch - Nirona)</td>
                          <td className="p-2.5">Rogan Art (Endangered Craft)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 638</td>
                          <td className="p-2.5">Castor oil boiled for 12+ hours into thick residue; mixed with cold water and mineral pigments; 6-inch steel Kalam.</td>
                          <td className="p-2.5 text-white/60">Ministry of Textiles Crafts Directory; OGD Portal India</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeZone === "northern" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.bluePottery} alt="Jaipur Blue Pottery" className="h-36 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">GI App. No. 37</span>
                          <h4 className="font-serif text-sm font-bold text-white">Jaipur Blue Pottery</h4>
                          <p className="text-[11px] text-white/60 mt-1">Ground quartz, Fuller&apos;s earth, copper oxide glaze; low-fire non-clay ceramics.</p>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.kalbeliaDance} alt="Kalbelia Dance" className="h-36 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">UNESCO ICH (2010)</span>
                          <h4 className="font-serif text-sm font-bold text-white">Kalbelia Songs & Dance</h4>
                          <p className="text-[11px] text-white/60 mt-1">Nomadic serpentine dance mimicking black cobras; Pungi & Khanjari oral folklore.</p>
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
                      <thead className="bg-[#172133] text-[#F59E0B]">
                        <tr>
                          <th className="p-2.5">State & District</th>
                          <th className="p-2.5">Tradition / Craft</th>
                          <th className="p-2.5">Registry ID</th>
                          <th className="p-2.5">Technical Taxonomy</th>
                          <th className="p-2.5">Repository</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Uttar Pradesh (Varanasi)</td>
                          <td className="p-2.5">Banaras Brocade (Textile)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 99</td>
                          <td className="p-2.5">Fine silk warp with gold/silver Zari; Kadwa & Fekwa weaving; Mughal Jhallar & Kalka patterns.</td>
                          <td className="p-2.5 text-white/60">Indian Culture Portal; DC Handicrafts</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Uttar Pradesh (Varanasi)</td>
                          <td className="p-2.5">Wooden Lacquerware</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 457</td>
                          <td className="p-2.5">Hand-turned lathe woodwork from Koriya and Eucalyptus; non-toxic natural lac with Pevdi & Sendur earth pigments.</td>
                          <td className="p-2.5 text-white/60">IP India GIR; DC Handicrafts</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Uttar Pradesh (Lucknow)</td>
                          <td className="p-2.5">Lucknow Chikan (Embroidery)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 119</td>
                          <td className="p-2.5">32 distinct stitches (Tepchi, Bakhiya, Phanda, Murri, Jali) on muslin and fine cotton.</td>
                          <td className="p-2.5 text-white/60">UP Tourism Heritage Archive</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Rajasthan (Jaipur)</td>
                          <td className="p-2.5">Blue Pottery (Craft)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 37</td>
                          <td className="p-2.5">Formulated from ground quartz, Multani Mitti, glass cullet; copper oxide turquoise-blue glaze.</td>
                          <td className="p-2.5 text-white/60">CCRT Archive; IP India GIR Record</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Rajasthan (Thar Desert)</td>
                          <td className="p-2.5">Kalbelia Songs (Performing Art)</td>
                          <td className="p-2.5 text-[#34D399]">UNESCO ICH 2010</td>
                          <td className="p-2.5">Nomadic serpentine dance mimicking black cobras; accompanied by Pungi woodwind and Khanjari percussion.</td>
                          <td className="p-2.5 text-white/60">Sangeet Natak Akademi Media Vault</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">J&K (Srinagar)</td>
                          <td className="p-2.5">Kashmir Pashmina (Textile)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 46</td>
                          <td className="p-2.5">Fine underfleece of Changthangi goat (below 15 microns); hand-spun on wooden Yender.</td>
                          <td className="p-2.5 text-white/60">Craft Development Institute Srinagar</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeZone === "southern" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.channapatnaToys} alt="Channapatna Wooden Toys" className="h-36 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">GI App. No. 24</span>
                          <h4 className="font-serif text-sm font-bold text-white">Channapatna Wooden Toys</h4>
                          <p className="text-[11px] text-white/60 mt-1">Ivory wood (Wrightia tinctoria); natural shellac; organic non-toxic vegetable dyes.</p>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.thanjavurPainting} alt="Thanjavur Painting" className="h-36 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">GI App. No. 22</span>
                          <h4 className="font-serif text-sm font-bold text-white">Thanjavur Gold Leaf Painting</h4>
                          <p className="text-[11px] text-white/60 mt-1">Teakwood base; limestone Gesso relief; certified 22-carat gold leaf foil & gems.</p>
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
                      <thead className="bg-[#172133] text-[#F59E0B]">
                        <tr>
                          <th className="p-2.5">State & District</th>
                          <th className="p-2.5">Tradition / Craft</th>
                          <th className="p-2.5">Registry ID</th>
                          <th className="p-2.5">Technical Taxonomy</th>
                          <th className="p-2.5">Repository</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Tamil Nadu (Thanjavur)</td>
                          <td className="p-2.5">Thanjavur Painting (Fine Art)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 22</td>
                          <td className="p-2.5">Teakwood board; Chunnam limestone paste; 22-carat gold foil leaf embossing; inlaid semi-precious gems.</td>
                          <td className="p-2.5 text-white/60">National Gallery of Modern Art (NGMA)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Tamil Nadu (Nilgiris)</td>
                          <td className="p-2.5">Toda Embroidery (Tribal Craft)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 135</td>
                          <td className="p-2.5">Called &lsquo;Pukhoor&rsquo;; reversible geometric needlework by Toda women using red & black wool on coarse cotton.</td>
                          <td className="p-2.5 text-white/60">TRIFED Heritage Digital Archive</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Karnataka (Bidar)</td>
                          <td className="p-2.5">Bidriware (Metal Craft)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 11</td>
                          <td className="p-2.5">Zinc-copper sand-cast alloy (16:1); inlaid silver wire (Tarkashi); patinated using 15th-century Bidar Fort soil.</td>
                          <td className="p-2.5 text-white/60">Cauvery Handicrafts Corp</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Karnataka (Ramanagara)</td>
                          <td className="p-2.5">Channapatna Toys (Handicraft)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 24</td>
                          <td className="p-2.5">Wood-lathe turnery from Wrightia tinctoria; natural lac colored with non-toxic vegetable dyes.</td>
                          <td className="p-2.5 text-white/60">IP India GIR Case Record Form GI-1</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Kerala (Temple Circuits)</td>
                          <td className="p-2.5">Koodiyattam (Theatre)</td>
                          <td className="p-2.5 text-[#34D399]">UNESCO ICH 2008</td>
                          <td className="p-2.5">Sanskrit temple theatre in Koothambalams; stylized eye acting (Nethrabhinaya); Mizhavu percussion.</td>
                          <td className="p-2.5 text-white/60">Kerala Kalamandalam Records</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Kerala (Pathanamthitta)</td>
                          <td className="p-2.5">Aranmula Kannadi (Metallurgy)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 1</td>
                          <td className="p-2.5">Front-surface metal reflection mirror (zero glass); secret copper-tin bell metal alloy; polished with velvet rouge.</td>
                          <td className="p-2.5 text-white/60">IP India GI App No. 1; Dept. of Science & Tech</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeZone === "eastern" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.dokraCasting} alt="Bengal Dokra" className="h-36 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">GI App. No. 583</span>
                          <h4 className="font-serif text-sm font-bold text-white">Bengal Dokra Metal Casting</h4>
                          <p className="text-[11px] text-white/60 mt-1">4,000-year Cire Perdue lost-wax brass & bronze hollow casting using beeswax cords.</p>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                        <img src={VERIFIED_CULTURAL_IMAGES.odishaPattachitra} alt="Odisha Pattachitra" className="h-36 w-full object-cover" />
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-[#F59E0B]">GI App. No. 105</span>
                          <h4 className="font-serif text-sm font-bold text-white">Odisha Pattachitra</h4>
                          <p className="text-[11px] text-white/60 mt-1">Cloth scroll on tamarind gum canvas; 100% natural conch shell & mineral pigments.</p>
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
                      <thead className="bg-[#172133] text-[#F59E0B]">
                        <tr>
                          <th className="p-2.5">State & District</th>
                          <th className="p-2.5">Tradition / Craft</th>
                          <th className="p-2.5">Registry ID</th>
                          <th className="p-2.5">Technical Taxonomy</th>
                          <th className="p-2.5">Repository</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        <tr>
                          <td className="p-2.5 font-semibold text-white">West Bengal (Bankura/Purulia)</td>
                          <td className="p-2.5">Bengal Dokra (Metal Craft)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 583</td>
                          <td className="p-2.5">Lost-wax casting (Cire Perdue); clay core coiled with beeswax/resin cords, fired in brass and bronze.</td>
                          <td className="p-2.5 text-white/60">Ministry of Culture Digital Library</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">WB / JH / OD (Tri-state)</td>
                          <td className="p-2.5">Chhau Dance (Performing Art)</td>
                          <td className="p-2.5 text-[#34D399]">UNESCO ICH 2010</td>
                          <td className="p-2.5">Martial folk dance; Purulia (clay-paper masks), Seraikella (symbolic masks), Mayurbhanj (unmasked).</td>
                          <td className="p-2.5 text-white/60">Sangeet Natak Akademi Gallery</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Odisha (Puri - Raghurajpur)</td>
                          <td className="p-2.5">Odisha Pattachitra (Folk Painting)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 105</td>
                          <td className="p-2.5">Tamarind gum cotton patti; conch shell white, hingula red, haritala yellow pigments; Jagannath lore.</td>
                          <td className="p-2.5 text-white/60">Indian Culture Portal; Odisha State Museum</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Madhya Pradesh (Ashoknagar)</td>
                          <td className="p-2.5">Chanderi Fabric (Textile)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 4</td>
                          <td className="p-2.5">Gossamer weave; fine cotton warp and silk weft; golden Zari motifs (Nalferma, Chatai) on pit looms.</td>
                          <td className="p-2.5 text-white/60">MP Hastshilp Vikas Nigam Archives</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Madhya Pradesh (Dhar)</td>
                          <td className="p-2.5">Bagh Prints (Textile)</td>
                          <td className="p-2.5 text-[#38BDF8]">GI App. No. 98</td>
                          <td className="p-2.5">Hand-block printing with iron-rich Bagh river water; teak wood blocks; natural alum & Dhavdi flower dyes.</td>
                          <td className="p-2.5 text-white/60">IP India GIR Official Journal File</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeZone === "northeastern" && (
                  <table className="w-full text-xs text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
                    <thead className="bg-[#172133] text-[#F59E0B]">
                      <tr>
                        <th className="p-2.5">State & District</th>
                        <th className="p-2.5">Tradition / Craft</th>
                        <th className="p-2.5">Registry ID</th>
                        <th className="p-2.5">Technical Taxonomy</th>
                        <th className="p-2.5">Repository</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Assam (Brahmaputra Valley)</td>
                        <td className="p-2.5">Muga Silk of Assam (Natural Silk)</td>
                        <td className="p-2.5 text-[#38BDF8]">GI App. No. 55</td>
                        <td className="p-2.5">Produced exclusively by wild silkworm Antheraea assamensis; endemic golden sheen that deepens with washing.</td>
                        <td className="p-2.5 text-white/60">Central Silk Board (Ministry of Textiles)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Assam (Majuli Island)</td>
                        <td className="p-2.5">Majuli Mask Making (Mukha Shilpa)</td>
                        <td className="p-2.5 text-[#38BDF8]">GI App. No. 709</td>
                        <td className="p-2.5">Split bamboo frame (Jati Baah), clay-cowdung coat, cotton drapery crafted in Vaishnavite Satras for Bhaona.</td>
                        <td className="p-2.5 text-white/60">SNA North East Centre; IGNCA Guwahati</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Manipur (Imphal Valley)</td>
                        <td className="p-2.5">Sankirtana Ritual (Performing Art)</td>
                        <td className="p-2.5 text-[#34D399]">UNESCO ICH 2013</td>
                        <td className="p-2.5">Meitei devotional lifecycle ritual; circular choreography featuring 2 Pung drummers and 10 Kartal cymbalists.</td>
                        <td className="p-2.5 text-white/60">UNESCO Living Heritage Portal; SNA New Delhi</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Nagaland (Phek / Kohima)</td>
                        <td className="p-2.5">Naga Shawls (Tribal Textile)</td>
                        <td className="p-2.5 text-[#38BDF8]">GI App. Nos. 541-545</td>
                        <td className="p-2.5">Back-strap tension loin loom weaving by tribal women; distinct clan motifs, symbolic Tsungkotepsu stripes.</td>
                        <td className="p-2.5 text-white/60">Nagaland Handloom Corp; TRIFED Vault</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === "defense" && (
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <span className="eyebrow text-[#38BDF8]">AVISHKAR RESEARCH CONVENTION</span>
                <h3 className="font-serif text-xl font-bold text-white mt-1">
                  Academic Defense Strategy for Jury Evaluation
                </h3>
                <p className="text-xs text-white/60">
                  Anticipated questions from the Avishkar Evaluation Committee & Recommended Defense Framework
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D97706]/20 font-bold text-xs text-[#F59E0B]">
                      Q1
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-white">
                        Why does your prototype show traditions from Rajasthan, Assam, and Kerala when your pilot is Kolhapur?
                      </h4>
                      <div className="mt-2.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-[#8ED5BD]">
                        <strong>Recommended Academic Defense:</strong><br />
                        Kolhapur serves as our deep primary ethnographic field site (validating local consent, audio recording, and artisan workflows). However, as a computer systems project under Humanities, Languages and Fine Arts (HLFA), our taxonomy, database schema, and Parampara AI engine must prove national scalability. We populated benchmark archetypes across 15+ states using statutory records from IP India and UNESCO to guarantee that the system can scale nationally without schema alterations.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D97706]/20 font-bold text-xs text-[#F59E0B]">
                      Q2
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-white">
                        Are the images and audio on the platform collected with practitioner consent?
                      </h4>
                      <div className="mt-2.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-[#8ED5BD]">
                        <strong>Recommended Academic Defense:</strong><br />
                        In our Phase 1 prototype, all non-local media are authenticated institutional archetypes sourced strictly under the Government of India Open Data License (GODL-India). For our primary Kolhapur field recordings, zero content is made public without a signed physical/audio Cultural Rights Passport. We strictly enforce provenance and never scrape unconsented private artisan media.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D97706]/20 font-bold text-xs text-[#F59E0B]">
                      Q3
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-white">
                        How does this differ from the Ministry of Culture&apos;s &lsquo;Mera Gaon Meri Dharohar&rsquo;?
                      </h4>
                      <div className="mt-2.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-[#8ED5BD]">
                        <strong>Recommended Academic Defense:</strong><br />
                        National missions like NMCM and Mera Gaon Meri Dharohar provide vital macro-level documentation of village assets. Bharat CultureMap is complementary: we introduce a practitioner-governed micro-layer that empowers tradition-bearers with granular consent (Rights Passport), provides human-narrated multilingual context (SwarSetu), and converts digital visibility into verified workshops, melas, and direct inquiries without exploitative intermediaries.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schema" && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <span className="eyebrow text-[#34D399]">SYSTEM ARCHITECTURE SPECIFICATION</span>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  Standardized JSON Database Schema Specification
                </h3>
                <p className="text-xs text-white/60">
                  Serialized data contract for multi-tiered search, strict consent governance, and source-linked retrieval.
                </p>
              </div>

              <pre className="rounded-2xl border border-white/10 bg-black/70 p-4 font-mono text-xs text-[#38BDF8] overflow-x-auto leading-relaxed">
{`{
  "heritage_id": "IND-MH-KOP-001",
  "name": "Kolhapuri Chappal",
  "category": "Traditional Handicraft",
  "state": "Maharashtra",
  "district": "Kolhapur",
  "taluka_clusters": ["Shirol", "Karveer", "Hupari"],
  "registry_status": {
    "type": "Geographical Indication",
    "registry_number": "GI Application No. 169",
    "authority": "Office of the CGPDTM, Govt. of India"
  },
  "cultural_provenance": {
    "source_type": "Official Public Record",
    "verified_by": "GI Registry of India",
    "field_verification_status": "Simulated Archetype for Architecture PoC",
    "license": "Public Government Documentation (GODL-India)"
  },
  "rights_passport": {
    "media_use": "Educational & Non-Commercial",
    "location_precision": "Taluka Level (Privacy Preserved)",
    "ai_retrieval_permitted": true,
    "commercial_attribution_required": true
  },
  "technical_markers": {
    "raw_materials": ["Buffalo/Ox Hide", "Babul Bark", "Harada Fruit"],
    "tools": ["Rampi (Cutter)", "Astha (Punch)", "Charki Thread"],
    "traditional_styles": ["Bichawa", "Puda", "Kapsi", "Kurundwadi"]
  },
  "official_image_reference": {
    "archive": "Indian Culture Portal / IP India GIR Database",
    "caption": "Hand-braiding of the traditional Veni strap without metallic fasteners."
  }
}`}
              </pre>
            </div>
          )}

          {activeTab === "repositories" && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <span className="eyebrow text-purple-400">STATUTORY REPOSITORIES</span>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  Official Public Portals for Verified Cultural Heritage
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <a
                  href="https://indianculture.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#D97706]/60 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-serif text-sm">1. Indian Culture Portal</strong>
                    <ExternalLink size={13} className="text-[#F59E0B]" />
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">indianculture.gov.in</div>
                  <p className="mt-2 text-white/70 leading-relaxed">
                    Curated by IIT Bombay under Ministry of Culture. Contains 300,000+ archival photographs, manuscripts, musical instruments, and textiles.
                  </p>
                </a>

                <a
                  href="https://search.ipindia.gov.in/GIRPublicSearch"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#D97706]/60 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-serif text-sm">2. IP India GIR Public Search</strong>
                    <ExternalLink size={13} className="text-[#F59E0B]" />
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">search.ipindia.gov.in/GIRPublicSearch</div>
                  <p className="mt-2 text-white/70 leading-relaxed">
                    Official statutory repository for Geographical Indications. Form GI-1 includes primary evidence submitted by artisan federations.
                  </p>
                </a>

                <a
                  href="https://ignca.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#D97706]/60 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-serif text-sm">3. IGNCA Kalanidhi Vault</strong>
                    <ExternalLink size={13} className="text-[#F59E0B]" />
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">ignca.gov.in</div>
                  <p className="mt-2 text-white/70 leading-relaxed">
                    Premier national visual repository for tribal folklore, mural paintings (Warli, Pattachitra), and ritual performances.
                  </p>
                </a>

                <a
                  href="https://sangeetnatak.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#D97706]/60 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-serif text-sm">4. Sangeet Natak Akademi (SNA)</strong>
                    <ExternalLink size={13} className="text-[#F59E0B]" />
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">sangeetnatak.gov.in</div>
                  <p className="mt-2 text-white/70 leading-relaxed">
                    Apex national body for performing arts. Contains verified photographic and AV recordings of UNESCO-listed intangible heritage.
                  </p>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-[#0B0E16] px-6 py-3.5 flex items-center justify-between text-xs text-white/50">
          <div>Bharat CultureMap · Kolhapur Pilot Study & National Master Dataset</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-1 text-white hover:bg-white/20 transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
