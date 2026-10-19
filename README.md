# Bharat CultureMap — Phase 1 (Milestone 1) Full-Stack System

Practitioner-governed living heritage documentation and discovery system for the Kolhapur pilot study (`Voice, Consent and Credit`).

## What Is Included in Phase 1 (Milestone 1)

1. **Preserved Manus Public Frontend (`client/src/pages/Home.tsx`, `client/src/components/NationalCultureMap.tsx`)**:
   - Retains the original visual identity, typography (`Playfair Display`, `Manrope`, `DM Mono`), obsidian-and-cream color palette, glassmorphic navigation, and sections.
   - Adds the **Kolhapur District** layer (`India → Maharashtra → Kolhapur District → Kolhapur`) and dynamic database-driven map markers.
   - Isolates all 68 prototype records (`5` Kolhapur practices + `63` national city records) as `DEMO_REFERENCE` (`PROTOTYPE • DEMO DATA`) so demonstration material is never confused with field-verified research.
   - Includes an offline-capable interactive map fallback (`client/src/components/Map.tsx`) and local fallback images (`client/public/manus-storage/`) so the site runs reliably both online and offline at competition venues without requiring Manus proxy servers.

2. **Database Schema & Modular Repository (`server/db/migrations/0001_initial_schema.sql`, `server/db/repository.ts`)**:
   - Versioned SQL schema (`users`, `locations`, `cultural_records`, `rights_passports`, `heritage_vocabulary`, `provenance_logs`) built for SQLite (`better-sqlite3` in WAL mode) and standard SQL types for future PostgreSQL migration.
   - Includes a portable file/memory fallback store if native `better-sqlite3` binaries are not compiled on the host machine.

3. **Authentication & 5-Role RBAC (`server/modules/auth/index.ts`)**:
   - Implements `SUPER_ADMIN`, `FIELD_RESEARCHER`, `LANGUAGE_REVIEWER`, `FOLKLORE_REVIEWER`, and `PRACTITIONER_APPROVER`.
   - Zero hard-coded credentials: supports initial Super Admin bootstrap via `.env` (`ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`) or the one-time `/admin` setup screen (`POST /api/v1/auth/bootstrap`).

4. **Cultural Rights Passport & Server-Enforced Publication Gate (`server/modules/consent-gate/index.ts`)**:
   - Implements all **9 Rights Passport fields** and **7 Part-B informed consent statements** from Instrument 6.1 of the HLFA Research Master File, defaulting to the most protective values (`CHOSEN_NAME`, `DISTRICT`, `PRIVATE` audio/video, `ORIGINAL_ONLY` translation, `NONE` AI use, `PERMISSION_REQUIRED` reuse, `PROHIBITED` commercial use, `MODERATED_ENQUIRY` contact, `ACTIVE` withdrawal right).
   - Hard backend gate blocks publication (`403 CONSENT_GATE_BLOCKED`) unless 3-part consent, all 7 Part-B statements, sustained consent timestamps, authorized language/folklore review, and final practitioner approval are complete—and immediately blocks any record marked `isSacredOrRestricted`, `RESTRICTED`, or `WITHDRAWN`.
   - Public serializer strictly masks private practitioner legal names, phone numbers, exact addresses, and unpermitted audio/translation layers.

## Local Setup & Running Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment (Optional for Local Dev, Required for Production)
```bash
cp .env.example .env
```
Edit `.env` to set `SESSION_SECRET`, `FIELD_ENCRYPTION_KEY`, and optionally `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`. If you leave `ADMIN_BOOTSTRAP_PASSWORD` blank, visiting `http://localhost:3000/admin` for the first time will display a one-time Super Admin initialization form.

### 3. Initialize / Migrate Database
```bash
pnpm run db:migrate
```

### 4. Start the Full-Stack Development Server
```bash
pnpm run dev
```
- **Public Website**: `http://localhost:3000/`
- **Admin & Governance Panel**: `http://localhost:3000/admin`

*(Note: `vite.config.ts` mounts `/api/v1/*` directly inside the Vite server middleware during `pnpm run dev`, so both frontend and backend run together on port `3000`.)*

### 5. Production Build & Start
```bash
pnpm run build
pnpm start
```

### 6. Run Automated Tests
```bash
pnpm test
```

## Security Notice on Removed `.project-config.json`
The original archive contained a `.project-config.json` file with Manus-issued keys (`BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_KEY`, `JWT_SECRET`, and a temporary Cloudflare git token). That file has been completely removed from the repository and Git history, and added to `.gitignore`. Please revoke or rotate those keys in your Manus dashboard if that workspace is still active.
