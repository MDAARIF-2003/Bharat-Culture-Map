import React from "react";
import { useLocation } from "wouter";
import {
  Compass,
  HeartHandshake,
  Landmark,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function SiteFooter() {
  const [, setLocation] = useLocation();

  return (
    <footer className="border-t border-white/10 bg-[#0c0e17] text-white/70">
      <div className="mx-auto max-w-[1360px] px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center rounded-full border border-[#ef9d45]/60 text-[#efb167]">
                <span className="absolute h-3 w-3 rounded-full bg-[#ef9d45] shadow-[0_0_18px_#ef9d45]" />
                <span className="absolute h-7 w-7 rounded-full border border-[#ef9d45]/30" />
              </span>
              <div>
                <span className="block text-[12px] font-semibold tracking-[.25em] text-[#f3eee5]">
                  BHARAT
                </span>
                <span className="block font-serif text-[18px] tracking-[.03em] text-[#efb167]">
                  CultureMap
                </span>
              </div>
            </div>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
              India's Living Heritage & Craft Knowledge Platform. Documenting traditions,
              empowering artisan communities, and safeguarding cultural expressions across 28
              states and 8 union territories under the Cultural Rights Passport framework.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ef9d45]/30 bg-[#ef9d45]/10 px-3 py-1 text-[11px] font-medium text-[#efb167]">
                <ShieldCheck size={13} />
                Consent-Gated Archive
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0f807c]/40 bg-[#0f807c]/15 px-3 py-1 text-[11px] font-medium text-[#8ed5bd]">
                <Sparkles size={13} />
                GI & UNESCO Documented
              </span>
            </div>
          </div>

          {/* Discovery Portals */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-[#efb167]">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="transition hover:text-[#efb167]"
                >
                  National CultureMap
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/traditions")}
                  className="transition hover:text-[#efb167]"
                >
                  Tradition Explorer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/calendar")}
                  className="transition hover:text-[#efb167]"
                >
                  Cultural Calendar
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/trip-planner")}
                  className="transition hover:text-[#efb167]"
                >
                  Heritage Trip Planner
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/places/loc-country-in")}
                  className="transition hover:text-[#efb167]"
                >
                  Geographic Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Community & Marketplace */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-[#efb167]">
              Ecosystem
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/practitioners")}
                  className="transition hover:text-[#efb167]"
                >
                  Practitioner Guilds
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/hercraft")}
                  className="transition hover:text-[#efb167]"
                >
                  HerCraft Collective
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/art-mart")}
                  className="transition hover:text-[#efb167]"
                >
                  Art-Mart Marketplace
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/industry-to-art")}
                  className="transition hover:text-[#efb167]"
                >
                  Industry to Art
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/government-resources")}
                  className="transition hover:text-[#efb167]"
                >
                  Government Schemes
                </button>
              </li>
            </ul>
          </div>

          {/* Governance & Admin */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-[#efb167]">
              Governance
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/admin")}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#efb167] transition hover:text-white"
                >
                  <Lock size={12} />
                  Admin Panel
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLocation("/account")}
                  className="transition hover:text-[#efb167]"
                >
                  Account & Persona Switcher
                </button>
              </li>
              <li>
                <span className="text-white/40">Rights Passport Protocol</span>
              </li>
              <li>
                <span className="text-white/40">Sacred Knowledge Protection</span>
              </li>
              <li>
                <span className="text-white/40">Provenance Chain of Care</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Bharat CultureMap Initiative. Preserving India's Intangible & Material Heritage.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/50">
            <span>Living Heritage Archive</span>
            <span>•</span>
            <span>Ethical Consent Gate</span>
            <span>•</span>
            <span>Pan-India Cultural Geodata</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
