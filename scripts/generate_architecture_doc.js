import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = "d:\\Bharat Culture Map 1";
const docsDir = path.join(rootDir, "docs");
const screenshotsDir = path.join(docsDir, "screenshots");

const images = {
  home: fs.readFileSync(path.join(screenshotsDir, "01_home_culturemap.png")).toString("base64"),
  tradition: fs.readFileSync(path.join(screenshotsDir, "02_tradition_explorer.png")).toString("base64"),
  hercraft: fs.readFileSync(path.join(screenshotsDir, "03_hercraft_enterprises.png")).toString("base64"),
  artmart: fs.readFileSync(path.join(screenshotsDir, "04_art_mart_marketplace.png")).toString("base64"),
  calendar: fs.readFileSync(path.join(screenshotsDir, "05_cultural_calendar.png")).toString("base64"),
  ecosystem: fs.readFileSync(path.join(screenshotsDir, "06_ecosystem_hub.png")).toString("base64"),
  practitioners: fs.readFileSync(path.join(screenshotsDir, "07_practitioners_directory.png")).toString("base64"),
  auth: fs.readFileSync(path.join(screenshotsDir, "08_auth_portal.png")).toString("base64"),
  admin: fs.readFileSync(path.join(screenshotsDir, "09_admin_governance.png")).toString("base64"),
};

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bharat CultureMap — Technical Architecture & Web Feature Dossier</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }

    :root {
      --bg: #0B0F17;
      --card-bg: #131A26;
      --card-border: #232E42;
      --accent-gold: #D97706;
      --accent-blue: #0284C7;
      --accent-emerald: #059669;
      --text-main: #F3F4F6;
      --text-muted: #9CA3AF;
      --code-bg: #070A0F;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.5;
      padding: 30px 15px;
    }

    .container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
    }

    .header-banner {
      background: #131A26;
      border: 2px solid var(--accent-gold);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-right: 6px;
      margin-bottom: 10px;
    }
    .badge-gold { background: rgba(217, 119, 6, 0.2); color: #F59E0B; border: 1px solid #D97706; }
    .badge-blue { background: rgba(2, 132, 199, 0.2); color: #38BDF8; border: 1px solid #0284C7; }
    .badge-green { background: rgba(5, 150, 105, 0.2); color: #34D399; border: 1px solid #059669; }

    h1 { font-size: 1.9rem; color: #FFFFFF; margin-bottom: 8px; font-weight: 800; }
    h2 { font-size: 1.35rem; color: #F59E0B; margin: 24px 0 10px 0; border-bottom: 2px solid #232E42; padding-bottom: 6px; page-break-after: avoid; break-after: avoid; }
    h3 { font-size: 1.1rem; color: #38BDF8; margin: 18px 0 8px 0; page-break-after: avoid; break-after: avoid; }
    p { margin-bottom: 10px; color: #D1D5DB; font-size: 0.92rem; }

    .toc {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .toc ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin: 0; padding: 0; }
    .toc a { color: #38BDF8; text-decoration: none; font-size: 0.88rem; font-weight: 500; }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 18px;
      margin-bottom: 20px;
    }

    .feature-img-wrapper {
      margin: 12px 0;
      border: 1px solid #232E42;
      border-radius: 6px;
      overflow: hidden;
      background: #000;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .feature-img-wrapper img {
      max-width: 100%;
      max-height: 380px;
      width: auto;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .feature-caption {
      background: #0D131F;
      padding: 8px 12px;
      font-size: 0.8rem;
      color: #9CA3AF;
      border-top: 1px solid #232E42;
      font-style: italic;
      text-align: left;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 0.85rem;
    }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
    }
    th {
      background: #1A2333;
      color: #F59E0B;
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
    }

    code {
      background: #070A0F;
      color: #38BDF8;
      padding: 2px 5px;
      border-radius: 3px;
      font-family: Consolas, monospace;
      font-size: 0.85em;
      border: 1px solid #1E293B;
    }

    .alert {
      border-left: 4px solid #D97706;
      background: rgba(217, 119, 6, 0.1);
      padding: 10px 14px;
      border-radius: 0 4px 4px 0;
      margin: 12px 0;
      font-size: 0.9rem;
    }
    .alert-green {
      border-left-color: #059669;
      background: rgba(5, 150, 105, 0.1);
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 10px;
      color: #D1D5DB;
      font-size: 0.92rem;
    }
    li { margin-bottom: 4px; }

    /* ==============================================================
       PRINT OPTIMIZATIONS (Guarantees zero blank pages & clean PDF)
       ============================================================== */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background-color: #FFFFFF !important;
        color: #111827 !important;
        padding: 0 !important;
      }
      .container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .header-banner {
        background: #F9FAFB !important;
        border: 2px solid #D97706 !important;
        padding: 16px !important;
        margin-bottom: 16px !important;
      }
      h1 { color: #111827 !important; font-size: 1.6rem !important; }
      h2 { color: #B45309 !important; border-bottom: 2px solid #E5E7EB !important; font-size: 1.25rem !important; }
      h3 { color: #0284C7 !important; font-size: 1.05rem !important; }
      p, li, td { color: #374151 !important; font-size: 9pt !important; }
      
      .toc {
        background: #F3F4F6 !important;
        border: 1px solid #E5E7EB !important;
        padding: 12px !important;
        margin-bottom: 16px !important;
      }
      .toc a { color: #0284C7 !important; font-size: 8.5pt !important; }

      .card {
        background: #FFFFFF !important;
        border: 1px solid #E5E7EB !important;
        border-radius: 4px !important;
        padding: 12px !important;
        margin-bottom: 14px !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }

      .feature-img-wrapper {
        border: 1px solid #D1D5DB !important;
        background: #FFFFFF !important;
        margin: 8px 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .feature-img-wrapper img {
        max-width: 100% !important;
        max-height: 340px !important;
        width: auto !important;
        height: auto !important;
        display: block !important;
        margin: 0 auto !important;
      }
      .feature-caption {
        background: #F9FAFB !important;
        color: #4B5563 !important;
        border-top: 1px solid #E5E7EB !important;
        font-size: 8pt !important;
        padding: 6px 10px !important;
      }

      th {
        background: #F3F4F6 !important;
        color: #92400E !important;
        border-bottom: 2px solid #D1D5DB !important;
        font-size: 8pt !important;
      }
      td {
        border-bottom: 1px solid #E5E7EB !important;
        font-size: 8pt !important;
      }
      code {
        background: #F3F4F6 !important;
        color: #0369A1 !important;
        border: 1px solid #E5E7EB !important;
      }
      .alert {
        background: #FFFBEB !important;
        border-left: 4px solid #D97706 !important;
      }
      .alert-green {
        background: #ECFDF5 !important;
        border-left-color: #059669 !important;
      }
      .badge-gold { background: #FEF3C7 !important; color: #92400E !important; border-color: #D97706 !important; }
      .badge-blue { background: #E0F2FE !important; color: #0369A1 !important; border-color: #0284C7 !important; }
      .badge-green { background: #D1FAE5 !important; color: #065F46 !important; border-color: #059669 !important; }
    }
  </style>
</head>
<body>

<div class="container">

  <div class="header-banner">
    <span class="badge badge-gold">Official Technical Dossier</span>
    <span class="badge badge-blue">Version 1.2.1</span>
    <span class="badge badge-green">Pilot: Kolhapur (Voice, Consent & Credit)</span>
    <h1>Bharat CultureMap</h1>
    <p style="font-size: 1rem; color: #E5E7EB; margin-bottom: 0;">
      A practitioner-governed living heritage documentation, discovery, and ethical marketplace system built to protect and elevate indigenous artisan sovereignty, oral lore, and craft ecosystems.
    </p>
  </div>

  <div class="toc">
    <h3 style="margin-top: 0; margin-bottom: 8px; color: #FFFFFF;">Table of Contents</h3>
    <ul>
      <li><a href="#section-1">1. System Architecture & Overview</a></li>
      <li><a href="#section-2">2. Full-Stack Technology Stack</a></li>
      <li><a href="#section-3">3. Interactive Culture Map</a></li>
      <li><a href="#section-4">4. Living Tradition Directory</a></li>
      <li><a href="#section-5">5. HerCraft Platform (Women Artisans)</a></li>
      <li><a href="#section-6">6. Art-Mart Fair-Trade Marketplace</a></li>
      <li><a href="#section-7">7. Cultural Calendar & Trip Planner</a></li>
      <li><a href="#section-8">8. Ecosystem Hub & Circular Economy</a></li>
      <li><a href="#section-9">9. Master Practitioners Registry</a></li>
      <li><a href="#section-10">10. Multi-Persona Authentication & RBAC</a></li>
      <li><a href="#section-11">11. Governance & Admin Console</a></li>
      <li><a href="#section-12">12. Cultural Rights Passport Gate</a></li>
      <li><a href="#section-13">13. Relational Database Schema (19 Tables)</a></li>
      <li><a href="#section-14">14. Security & Deployment Blueprint</a></li>
    </ul>
  </div>

  <section id="section-1" class="card">
    <h2>1. System Architecture & Overview</h2>
    <p>
      <strong>Bharat CultureMap</strong> is engineered as a single-port, production-ready TypeScript web system. It seamlessly merges a high-performance <strong>React 19 Single-Page Application (SPA)</strong> frontend with an integrated <strong>Express 4.21 REST API gateway</strong> and a normalized <strong>SQLite 3</strong> relational database operating in Write-Ahead Logging (WAL) mode.
    </p>
    <div class="alert">
      <strong>Core Pilot Initiative:</strong> Built around the Kolhapur Pilot Study (<em>"Voice, Consent, and Credit"</em>), the platform enforces sovereign intellectual property protection for traditional knowledge holders. Prototype reference records are strictly marked as <code>DEMO_REFERENCE</code>, isolating demonstration data from authentic field-verified research.
    </div>
    <p>
      The architecture mounts the backend API directly into the Vite development middleware on port <code>3000</code>, ensuring zero-latency local development and unified network binding across local Wi-Fi networks (<code>0.0.0.0:3000</code>).
    </p>
  </section>

  <section id="section-2" class="card">
    <h2>2. Full-Stack Technology Stack</h2>
    <table>
      <thead>
        <tr>
          <th>System Tier</th>
          <th>Technology / Framework</th>
          <th>Primary Responsibilities</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend Core</strong></td>
          <td>React 19.2, Vite 7.1, TypeScript 5.6</td>
          <td>Component lifecycle, concurrent rendering, sub-second HMR.</td>
        </tr>
        <tr>
          <td><strong>Design & Styling</strong></td>
          <td>Tailwind CSS v4, Framer Motion 12.2</td>
          <td>Obsidian-and-cream palette (<code>#0B0F17</code>), fluid animations, and glassmorphic UI.</td>
        </tr>
        <tr>
          <td><strong>UI Primitives</strong></td>
          <td>Radix UI, Lucide Icons, Sonner</td>
          <td>Accessible headless modals, dropdowns, tabs, sliders, and toast feedback.</td>
        </tr>
        <tr>
          <td><strong>Geospatial Engine</strong></td>
          <td>Leaflet 1.9, React-Leaflet 5.0</td>
          <td>Interactive GIS mapping, GeoJSON administrative boundaries, and offline SVG tiles.</td>
        </tr>
        <tr>
          <td><strong>Client Routing</strong></td>
          <td>Wouter 3.3 (Patched regex router)</td>
          <td>Lightweight (~1.5 KB) declarative client-side routing.</td>
        </tr>
        <tr>
          <td><strong>Backend API</strong></td>
          <td>Node.js 24, Express 4.21, TSX</td>
          <td>Type-safe REST API endpoints, token hashing, multipart image uploads.</td>
        </tr>
        <tr>
          <td><strong>Persistence Tier</strong></td>
          <td>better-sqlite3 11.5 (WAL Mode)</td>
          <td>19 normalized relational tables, zero-ORM transactional repository, memory fallback.</td>
        </tr>
        <tr>
          <td><strong>Validation & Auth</strong></td>
          <td>Zod 4.1, HMAC-SHA256, PBKDF2</td>
          <td>Request validation, cryptographic session cookie verification, role authorization.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section id="section-3" class="card">
    <h2>3. Interactive National Culture Map</h2>
    <p>
      The geospatial interface provides an intuitive discovery gateway across India's living cultural traditions. Users can drill down hierarchically from national view down to states, districts (including the verified Kolhapur District pilot layer), talukas, and artisan clusters.
    </p>
    <ul>
      <li><strong>Geospatial Filters:</strong> Multi-select filtering by category (Craft, Music, Dance, Textile, Food Heritage, Rituals, Games).</li>
      <li><strong>Provenance Tagging:</strong> Clear badge differentiation between Field-Verified and Prototype data.</li>
      <li><strong>Offline Resilience:</strong> Built-in fallback tiles and locally bundled SVG/WebP assets for zero-internet venue demonstrations.</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.home}" alt="Interactive National Culture Map Screenshot">
      <div class="feature-caption">Figure 3.1: Live screenshot of the Interactive National Culture Map showing Kolhapur pilot records and category filters.</div>
    </div>
  </section>

  <section id="section-4" class="card">
    <h2>4. Living Tradition Directory</h2>
    <p>
      A verified cultural catalog categorized under UNESCO Intangible Cultural Heritage (ICH) domains and Geographical Indication (GI) registries. Each entry documents the cultural history, communities of practice, tools, and regional variations.
    </p>
    <ul>
      <li><strong>Multilingual Support:</strong> Preserves vernacular nomenclature in Devanagari alongside English transliterations.</li>
      <li><strong>Evidence Grounding:</strong> Every tradition links directly to authoritative academic, institutional, or practitioner citations (<code>source_citations</code> table).</li>
      <li><strong>Media Registry:</strong> Curated repository of documentary photographs, oral history audio, and craft process videos.</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.tradition}" alt="Tradition Explorer Screenshot">
      <div class="feature-caption">Figure 4.1: Live screenshot of the Tradition Explorer displaying living heritage categories and UNESCO classification.</div>
    </div>
  </section>

  <section id="section-5" class="card">
    <h2>5. HerCraft — Women Artisans & Enterprises</h2>
    <p>
      HerCraft is a dedicated economic empowerment module supporting women-led Self-Help Groups (SHGs), artisan collectives, and female master craftswomen across India.
    </p>
    <ul>
      <li><strong>Collective Profiles:</strong> Showcases active artisan count, signature crafts, founded year, and community narrative.</li>
      <li><strong>Support Needs Matcher:</strong> Highlights specific enterprise requirements (working capital, raw material access, design training).</li>
      <li><strong>Government & CSR Scheme Aggregator:</strong> Connects collectives to vetted state grants, subsidies, and capacity-building opportunities.</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.hercraft}" alt="HerCraft Screenshot">
      <div class="feature-caption">Figure 5.1: Live screenshot of HerCraft highlighting women-led collectives, enterprise metrics, and funding schemes.</div>
    </div>
  </section>

  <section id="section-6" class="card">
    <h2>6. Art-Mart — Fair-Trade Artisan Marketplace</h2>
    <p>
      An ethical e-commerce engine eliminating predatory middlemen by enabling direct transactions between traditional craftspeople and conscientious buyers.
    </p>
    <ul>
      <li><strong>Radical Transparency:</strong> Every product lists pricing in INR, material breakdown, making process, and artisan provenance.</li>
      <li><strong>Direct Commercial Credit:</strong> Revenue routes directly to authenticated makers and verified craft clusters.</li>
      <li><strong>Full E-Commerce State Engine:</strong> Client-side shopping cart, simulated checkout with automated order ID generation (<code>ORD-XXXXXXXX</code>), and order tracking.</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.artmart}" alt="Art-Mart Marketplace Screenshot">
      <div class="feature-caption">Figure 6.1: Live screenshot of Art-Mart exhibiting authentic handcrafted items with provenance badges and direct seller attribution.</div>
    </div>
  </section>

  <section id="section-7" class="card">
    <h2>7. Cultural Calendar & Intelligent Trip Planner</h2>
    <p>
      A dynamic seasonal schedule tracking solar, lunar, and regional cultural celebrations, paired with an algorithmic travel itinerary generator.
    </p>
    <ul>
      <li><strong>Event Verification:</strong> Tracks recurring festivals, entry criteria, visitor etiquette rules, and photography restrictions.</li>
      <li><strong>Algorithmic Cultural Itinerary Builder:</strong> Users select travel dates, starting locations, and cultural interests; the backend computes day-by-day travel routes with artisan workshop visits.</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.calendar}" alt="Cultural Calendar Screenshot">
      <div class="feature-caption">Figure 7.1: Live screenshot of the Cultural Calendar and Trip Planner interface.</div>
    </div>
  </section>

  <section id="section-8" class="card">
    <h2>8. Ecosystem Hub — Circular Economy & Resources</h2>
    <p>
      A cross-sector collaboration portal bridging traditional handicraft clusters with industrial manufacturers and statutory institutions.
    </p>
    <ul>
      <li><strong>Industry-to-Art Material Exchange:</strong> Industrial manufacturers donate or sell surplus clean materials (leather scraps, brass turnings, organic fabric offcuts) to artisan clusters.</li>
      <li><strong>Collaboration Request Tracker:</strong> Artisans log material requests and monitor allocation and production pipelines.</li>
      <li><strong>Institutional Resource Directory:</strong> Official guidelines from the Development Commissioner of Handicrafts, KVIC, and academic research bodies.</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.ecosystem}" alt="Ecosystem Hub Screenshot">
      <div class="feature-caption">Figure 8.1: Live screenshot of the Ecosystem Hub showing circular economy material exchanges and government resources.</div>
    </div>
  </section>

  <section id="section-9" class="card">
    <h2>9. Master Practitioners Registry</h2>
    <p>
      A curated registry celebrating recognized master artisans, hereditary practitioners, performing artists, and oral knowledge keepers.
    </p>
    <ul>
      <li><strong>Practitioner Narratives:</strong> Highlights lineage, years of practice, community context, and apprenticeship availability.</li>
      <li><strong>Privacy-Preserving Contact Protocol:</strong> Allows patrons, researchers, and institutions to submit workshop requests without exposing private contact details or home addresses.</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.practitioners}" alt="Practitioners Directory Screenshot">
      <div class="feature-caption">Figure 9.1: Live screenshot of the Practitioners Directory highlighting master artisans and inquiry channels.</div>
    </div>
  </section>

  <section id="section-10" class="card">
    <h2>10. Multi-Persona Authentication & RBAC System</h2>
    <p>
      A secure authentication system managing both public user accounts and specialized academic/governance review roles.
    </p>
    <ul>
      <li><strong>5 Public User Personas:</strong> <code>VISITOR</code>, <code>BUYER</code>, <code>PRACTITIONER</code>, <code>ARTISAN_SELLER</code>, <code>HERCRAFT_ENTREPRENEUR</code>.</li>
      <li><strong>5 Staff Governance Roles:</strong> <code>SUPER_ADMIN</code>, <code>FIELD_RESEARCHER</code>, <code>LANGUAGE_REVIEWER</code>, <code>FOLKLORE_REVIEWER</code>, <code>PRACTITIONER_APPROVER</code>.</li>
      <li><strong>Interactive Demo Switcher:</strong> One-click session switcher during development to simulate any role (strictly disabled in production).</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.auth}" alt="Auth Portal Screenshot">
      <div class="feature-caption">Figure 10.1: Live screenshot of the Authentication Portal showing login, multi-persona registration, and demo role switcher.</div>
    </div>
  </section>

  <section id="section-11" class="card">
    <h2>11. Governance & Admin Console</h2>
    <p>
      The nerve center for researchers, linguists, folklore specialists, and administrators to review records, audit consent, and curate platform content.
    </p>
    <ul>
      <li><strong>Multi-Tab Control Center:</strong> Tabbed management for Cultural Records, User Roles, Locations, Events, Inquiries, Traditions, Sources, and Media Assets.</li>
      <li><strong>Live Publication Gate Inspection:</strong> Inspects real-time consent gate criteria for any record before approval.</li>
      <li><strong>Media Asset Management:</strong> Built-in multi-part image uploader with MIME type verification and thumbnail previews.</li>
    </ul>
    <div class="feature-img-wrapper">
      <img src="data:image/png;base64,${images.admin}" alt="Admin Governance Console Screenshot">
      <div class="feature-caption">Figure 11.1: Live screenshot of the Admin & Governance Console with cultural records curation and live consent gate indicators.</div>
    </div>
  </section>

  <section id="section-12" class="card">
    <h2>12. The Cultural Rights Passport & Publication Gate Engine</h2>
    <p>
      The core intellectual property framework enforcing practitioner sovereignty (HLFA Research Master File Instrument 6.1). A record is strictly blocked from publication (<code>403 CONSENT_GATE_BLOCKED</code>) unless every gate condition is satisfied:
    </p>
    <div class="alert alert-green">
      <strong>Zero-Tolerance Guardrails:</strong> Any record marked <code>isSacredOrRestricted = 1</code>, <code>RESTRICTED</code>, or <code>WITHDRAWN</code> is instantly blocked and stripped from all public discovery endpoints.
    </div>
    <table>
      <thead>
        <tr>
          <th>Passport Field</th>
          <th>Conservative Default</th>
          <th>Supported Values</th>
          <th>Enforced System Behavior</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Identity Display</strong></td>
          <td><code>CHOSEN_NAME</code></td>
          <td>FULL_NAME, CHOSEN_NAME, COMMUNITY_NAME, ANONYMOUS</td>
          <td>Masks private legal name in public serializers.</td>
        </tr>
        <tr>
          <td><strong>Location Granularity</strong></td>
          <td><code>DISTRICT</code></td>
          <td>EXACT_WORKSHOP, VILLAGE, CITY_TOWN, TALUKA, DISTRICT, HIDDEN</td>
          <td>Obfuscates exact GPS coordinates to district/taluka center.</td>
        </tr>
        <tr>
          <td><strong>Audio / Video Access</strong></td>
          <td><code>PRIVATE</code></td>
          <td>PUBLIC, LIMITED, PRIVATE, NOT_PERMITTED</td>
          <td>Withholds raw oral history audio recordings from public API payloads.</td>
        </tr>
        <tr>
          <td><strong>Translation Scope</strong></td>
          <td><code>ORIGINAL_ONLY</code></td>
          <td>ORIGINAL_ONLY, SELECTED_LANGUAGES, NONE</td>
          <td>Preserves vernacular linguistic nuance; prevents unvetted AI translation.</td>
        </tr>
        <tr>
          <td><strong>AI Use / Training</strong></td>
          <td><code>NONE</code></td>
          <td>NONE, TRANSCRIPT_DRAFT_ONLY, TRANSLATION_DRAFT_ONLY, APPROVED_RETRIEVAL</td>
          <td>Strictly blocks automated LLM scraping, model training, and voice cloning.</td>
        </tr>
        <tr>
          <td><strong>Download & Reuse</strong></td>
          <td><code>PERMISSION_REQUIRED</code></td>
          <td>ALLOWED, EDUCATIONAL_ONLY, PERMISSION_REQUIRED, PROHIBITED</td>
          <td>Disallows automated downloading; requires explicit provenance attribution.</td>
        </tr>
        <tr>
          <td><strong>Commercial Use</strong></td>
          <td><code>PROHIBITED</code></td>
          <td>PROHIBITED, PERMISSION_REQUIRED, BENEFIT_SHARING_AGREEMENT</td>
          <td>Prevents commercial merchandising without an approved benefit-sharing deed.</td>
        </tr>
        <tr>
          <td><strong>Contact Mode</strong></td>
          <td><code>MODERATED_ENQUIRY</code></td>
          <td>DIRECT, MODERATED_ENQUIRY, UNAVAILABLE</td>
          <td>Routes communications through admin desk to prevent harassment and spam.</td>
        </tr>
        <tr>
          <td><strong>Withdrawal Status</strong></td>
          <td><code>ACTIVE</code></td>
          <td>ACTIVE, CORRECT_REQUESTED, RESTRICTED, REMOVED</td>
          <td>Guarantees permanent practitioner revocation right; revoking unpublishes instantly.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section id="section-13" class="card">
    <h2>13. Relational Database Schema & Data Dictionary</h2>
    <p>
      The system employs 19 normalized tables defined across 6 versioned SQL migrations in <code>server/db/migrations/</code>:
    </p>
    <table>
      <thead>
        <tr>
          <th>Table Name</th>
          <th>Primary Key</th>
          <th>Key Fields & References</th>
          <th>Purpose & Functional Domain</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>users</code></td>
          <td><code>id (TEXT)</code></td>
          <td>email, password_hash, role, account_type, is_active</td>
          <td>Authentication, RBAC roles, and linked persona profiles.</td>
        </tr>
        <tr>
          <td><code>locations</code></td>
          <td><code>id (TEXT)</code></td>
          <td>level, name_en, name_mr, parent_id, center_lat, center_lng</td>
          <td>Six-tier administrative geography hierarchy (Country to Village).</td>
        </tr>
        <tr>
          <td><code>cultural_records</code></td>
          <td><code>id (TEXT)</code></td>
          <td>slug, tradition_id, state_id, district_id, status, is_sacred_or_restricted</td>
          <td>Living heritage records, private practitioner fields, and dual-language summaries.</td>
        </tr>
        <tr>
          <td><code>rights_passports</code></td>
          <td><code>id (TEXT)</code></td>
          <td>cultural_record_id (FK), statements_json, 9 passport fields</td>
          <td>Instrument 6.1 informed consent and sovereign access controls.</td>
        </tr>
        <tr>
          <td><code>provenance_logs</code></td>
          <td><code>id (TEXT)</code></td>
          <td>cultural_record_id (FK), step_type, performed_by_user_id, version_label</td>
          <td>Immutable audit trail for collection, transcription, translation, and sign-offs.</td>
        </tr>
        <tr>
          <td><code>traditions</code></td>
          <td><code>id (TEXT)</code></td>
          <td>slug, tradition_category, unesco_domain, gi_tag_status</td>
          <td>Living tradition master registry with historical and community context.</td>
        </tr>
        <tr>
          <td><code>tradition_places</code></td>
          <td><code>id (TEXT)</code></td>
          <td>tradition_id (FK), location_id (FK), state_id (FK), relationship_role</td>
          <td>Many-to-many geospatial mapping between traditions and regional practice centers.</td>
        </tr>
        <tr>
          <td><code>source_citations</code></td>
          <td><code>id (TEXT)</code></td>
          <td>tradition_id (FK), cultural_record_id (FK), source_title, source_url</td>
          <td>Bibliographic citations grounding records in official archives and field notes.</td>
        </tr>
        <tr>
          <td><code>media_assets</code></td>
          <td><code>id (TEXT)</code></td>
          <td>tradition_id (FK), cultural_record_id (FK), media_type, asset_url</td>
          <td>Curated repository of documentary photographs, audio recordings, and videos.</td>
        </tr>
        <tr>
          <td><code>art_mart_sellers</code></td>
          <td><code>id (TEXT)</code></td>
          <td>slug, storefront_name, craft_cluster_label, owner_user_id (FK)</td>
          <td>Artisan seller storefront profiles with verification badges.</td>
        </tr>
        <tr>
          <td><code>art_mart_products</code></td>
          <td><code>id (TEXT)</code></td>
          <td>slug, seller_id (FK), tradition_id (FK), price_inr, stock_quantity</td>
          <td>Fair-trade handcrafted product catalog with materials and process notes.</td>
        </tr>
        <tr>
          <td><code>art_mart_orders</code></td>
          <td><code>id (TEXT)</code></td>
          <td>order_number, buyer_email, total_inr, items_json, status</td>
          <td>Simulated customer orders and fulfillment state tracking.</td>
        </tr>
        <tr>
          <td><code>hercraft_enterprises</code></td>
          <td><code>id (TEXT)</code></td>
          <td>slug, enterprise_name, women_artisans_count, tradition_id (FK)</td>
          <td>Women-led artisan collective registry with enterprise metrics.</td>
        </tr>
        <tr>
          <td><code>hercraft_opportunities</code></td>
          <td><code>id (TEXT)</code></td>
          <td>title, opportunity_type, organiser_name, benefit_summary</td>
          <td>Government and CSR grants, subsidies, and training schemes.</td>
        </tr>
        <tr>
          <td><code>industry_materials</code></td>
          <td><code>id (TEXT)</code></td>
          <td>title, industry_org_label, material_category, pricing_terms</td>
          <td>Surplus industrial raw materials available for craft circular economy.</td>
        </tr>
        <tr>
          <td><code>industry_requests</code></td>
          <td><code>id (TEXT)</code></td>
          <td>material_id (FK), artisan_email, intended_craft_use, collaboration_status</td>
          <td>Artisan material applications and allocation tracking.</td>
        </tr>
        <tr>
          <td><code>ecosystem_resources</code></td>
          <td><code>id (TEXT)</code></td>
          <td>title, resource_category, organisation_type, official_url</td>
          <td>Statutory boards, craft guilds, and public sector cultural resources.</td>
        </tr>
        <tr>
          <td><code>cultural_events</code></td>
          <td><code>id (TEXT)</code></td>
          <td>title_en, category, start_date, state_id (FK), visitor_access</td>
          <td>Festivals, gatherings, and seasonal celebrations with etiquette notes.</td>
        </tr>
        <tr>
          <td><code>community_enquiries</code></td>
          <td><code>id (TEXT)</code></td>
          <td>enquiry_type, sender_name, sender_contact, message, status</td>
          <td>Moderated community communications for workshops and maker inquiries.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section id="section-14" class="card">
    <h2>14. Security Architecture & Production Deployment Blueprint</h2>
    <h3>Security Architecture</h3>
    <ul>
      <li><strong>Field-Level Isolation:</strong> Private practitioner columns (<code>practitioner_phone_private</code>, <code>exact_lat_private</code>) are stripped at the repository layer.</li>
      <li><strong>Signed Session Cookies:</strong> HMAC-SHA256 session tokens with <code>HttpOnly</code>, <code>SameSite=Lax</code>, and <code>Secure</code> flags.</li>
      <li><strong>Rate-Limiting Protection:</strong> Sliding window brute-force limiter across login and registration endpoints.</li>
    </ul>

    <h3>Production Deployment Blueprint</h3>
    <p>
      Because Bharat CultureMap relies on a native SQLite relational database (<code>better-sqlite3</code> in WAL mode) and an active Node.js server process, it cannot be hosted on static file hosts like GitHub Pages. Recommended production environments include:
    </p>
    <ul>
      <li><strong>Fly.io / Render / Railway:</strong> Mount a persistent volume at <code>/var/data</code> and configure <code>SQLITE_DB_PATH=/var/data/bharat_culturemap.sqlite</code>.</li>
      <li><strong>Litestream Replication:</strong> Enable continuous streaming replication of SQLite transactions to Cloudflare R2 or AWS S3 for zero-loss disaster recovery.</li>
      <li><strong>Single-Instance Writer:</strong> Maintain a single Node.js writer instance attached to the volume rather than multiple replicas sharing a network filesystem.</li>
    </ul>
  </section>

  <footer style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 0.8rem; border-top: 1px solid #232E42; margin-top: 30px;">
    Bharat CultureMap © 2026. Living Heritage Documentation & Ethical Marketplace Platform. Kolhapur Pilot Study.
  </footer>

</div>

</body>
</html>
`;

// 1. Write HTML file
const htmlPath = path.join(docsDir, "Bharat_CultureMap_Technical_Architecture.html");
fs.writeFileSync(htmlPath, htmlContent, "utf8");
console.log("Generated standalone HTML:", htmlPath);

// 2. Write Markdown file
const mdContent = fs.readFileSync("C:\\Users\\MD AArif\\.gemini\\antigravity\\brain\\75050c55-c875-45ff-a18d-d8664998287e\\bharat_culturemap_technical_architecture.md", "utf8");
const relativeMdContent = mdContent.replace(
  /\/C:\/Users\/MD%20AArif\/\.gemini\/antigravity\/brain\/[a-f0-9-]+\/screenshots\//g,
  "./docs/screenshots/"
);
const mdPath = path.join(rootDir, "BHARAT_CULTUREMAP_TECHNICAL_ARCHITECTURE.md");
fs.writeFileSync(mdPath, relativeMdContent, "utf8");
console.log("Generated project root Markdown:", mdPath);

// 3. Generate PDF using Chrome headless
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const pdfPath = path.join(docsDir, "Bharat_CultureMap_Technical_Architecture.pdf");
const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

try {
  console.log("Rendering PDF with Chrome headless from URL:", fileUrl);
  const cmd = `"${chromePath}" --headless=new --disable-gpu --user-data-dir="%TEMP%\\chrome_pdf_export_fixed" --run-all-compositor-stages-before-draw --no-pdf-header-footer --virtual-time-budget=5000 --print-to-pdf="${pdfPath}" "${fileUrl}"`;
  execSync(cmd, { stdio: "inherit" });
  console.log("Successfully generated PDF:", pdfPath);
} catch (err) {
  console.error("PDF generation note:", err.message);
}
