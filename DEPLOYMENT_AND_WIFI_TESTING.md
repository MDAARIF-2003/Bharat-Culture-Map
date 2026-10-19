# Bharat CultureMap 6 — Local Wi-Fi Phone Testing & Production Deployment Guide

This guide covers:
1. **Testing the live website on a phone over the same Wi-Fi network** (safe development-only host & Windows Defender Firewall configuration).
2. **Production deployment architecture** for a compatible Node.js + SQLite host (why GitHub Pages alone cannot run the full-stack application, required environment variables, persistent SQLite storage, automated backups, and uploaded-media storage).

---

## Part 1: Testing on a Phone over the Same Wi-Fi (Windows + Local Dev)

### 1. Keep the Local Dev Server Running with LAN Binding
`package.json` configures `pnpm run dev` to run `vite --host`, which binds the development server (including the embedded `/api/v1/*` Express + SQLite middleware) to all local network interfaces (`0.0.0.0`).

Start the development server in PowerShell:
```powershell
pnpm run dev
```

Vite will print output similar to:
```text
  VITE v7.1.7  ready in 650 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.42:3000/
```
*(Note: If port `3000` is already in use on your PC, Vite automatically increments to `3001`, `3002`, etc. Use the exact port shown in the terminal output.)*

### 2. Find Your Windows PC's Local Wi-Fi IPv4 Address
If Vite shows multiple network addresses, run this in PowerShell to inspect your active Wi-Fi IPv4 address:
```powershell
Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Select-Object IPAddress, InterfaceAlias
```
*(Or run `ipconfig` and check **Wireless LAN adapter Wi-Fi -> IPv4 Address**, e.g. `192.168.1.42`).*

### 3. Safe Development-Only Windows Firewall Configuration
By default, Windows Defender Firewall may block inbound connections from your phone to Node.js/Vite on port `3000`.

1. **Ensure your home/office Wi-Fi is set to "Private network"** in Windows (**Settings -> Network & internet -> Wi-Fi -> Properties -> Network profile type -> Private**). Never open development ports on a `Public` café/airport network.
2. **Add a temporary, Private-network-only inbound rule** for TCP port `3000` (run in an elevated **Administrator PowerShell**):
   ```powershell
   New-NetFirewallRule `
     -DisplayName "Bharat CultureMap Vite Dev (Private Wi-Fi Only)" `
     -Direction Inbound `
     -LocalPort 3000 `
     -Protocol TCP `
     -Action Allow `
     -Profile Private
   ```
3. **Open the site on your phone**:
   - Connect your phone to the **exact same Wi-Fi network** (ensure AP/client isolation or guest Wi-Fi is off).
   - Open Chrome or Safari on your phone and visit `http://<YOUR_PC_IPV4>:3000` (for example, `http://192.168.1.42:3000`).
   - If you connect using an mDNS hostname (`http://my-laptop.local:3000`), `.local` is already permitted in `vite.config.ts` (`server.allowedHosts`), or you can pass custom hostnames via `$env:VITE_ALLOWED_HOSTS="my-pc.local"`.
4. **Remove the firewall rule when finished testing** (optional cleanup):
   ```powershell
   Remove-NetFirewallRule -DisplayName "Bharat CultureMap Vite Dev (Private Wi-Fi Only)"
   ```

---

## Part 2: Production Deployment Guide (Node.js + Express + SQLite)

### Why GitHub Pages Alone Cannot Host Bharat CultureMap
Bharat CultureMap is a **full-stack application** consisting of:
- **React 19 + Vite SPA frontend** (`client/`).
- **Express REST API backend** (`server/api-handler.ts`, `/api/v1/*`) handling session authentication, RBAC authorization, HerCraft moderation, Art-Mart checkout, practitioner submissions, and admin audit logs.
- **Relational SQLite database** (`better-sqlite3` with 19 normalized tables, foreign-key enforcement, and geography hierarchy).

**GitHub Pages is a static file host only** — it cannot execute Node.js/Express server code, verify HMAC session cookies, enforce server-side RBAC, or read/write a SQLite database. While a static host could serve the compiled frontend bundle (`dist/public`), every `/api/v1/*` call would fail without a running Node.js backend.

Therefore, deploy Bharat CultureMap on a **Node.js host with persistent disk storage** (such as **Fly.io** with a persistent Volume, **Render** Standard Web Service with a Persistent Disk, **Railway** with a Volume, or a **Linux VPS** on DigitalOcean / Hetzner / AWS Lightsail).

### 1. Build & Start Commands
```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Run database migrations & import verified administrative geography
pnpm run db
pnpm run db:import-geography

# 3. Compile frontend (dist/public) and backend bundle (dist/index.js)
pnpm run build

# 4. Start production server
pnpm start
```

### 2. Required Production Environment Variables
Configure the following environment variables in your hosting provider's secret manager (never commit `.env` to Git):

| Variable | Required | Production Value / Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` — Enables `Secure` cookies, enforces `SESSION_SECRET` validation, and disables demo accounts by default. |
| `PORT` | **Yes** | `3000` (or the port injected by your host). |
| `SESSION_SECRET` | **Yes** | Cryptographically random secret of **at least 32 characters** (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). The server refuses to sign/verify tokens or start in production if missing or default. |
| `ENABLE_DEMO_ACCOUNTS` | **Yes** | `false` — Ensures `/api/v1/auth/demo-accounts`, `/api/v1/auth/demo-switch`, and demo registration seeding are **disabled** in production. Never publish local demo passwords or enable public demo accounts in production. |
| `SQLITE_DB_PATH` | **Yes** | Absolute path on your mounted persistent volume, e.g. `/var/data/bharat_culturemap.sqlite`. |

### 3. Persistent SQLite Database Storage & Backups
Because container filesystems are ephemeral across deploys, always mount a persistent disk/volume and point `SQLITE_DB_PATH` to that volume:
- **Mount path example**: Mount persistent volume at `/var/data` and set `SQLITE_DB_PATH=/var/data/bharat_culturemap.sqlite`.
- **Single-instance writer**: SQLite uses file-level locking (`WAL` mode). Run a single Node.js writer instance attached to the volume rather than multiple horizontal replicas sharing a network filesystem.
- **Automated Safe Backups**:
  - Do not copy a live SQLite file with raw `cp` during writes. Use the SQLite `.backup` command or **Litestream** for continuous streaming replication to S3-compatible object storage (AWS S3, Cloudflare R2, Backblaze B2):
    ```bash
    # Safe online snapshot backup via sqlite3 CLI (run via daily cron / systemd timer)
    sqlite3 /var/data/bharat_culturemap.sqlite ".backup '/var/data/backups/bharat_culturemap_$(date +%F_%H%M).sqlite'"
    ```
  - Retain daily encrypted snapshots off-host (e.g., 30-day retention in S3/R2) and test restoration quarterly.

### 4. Uploaded-Media & Static Asset Storage
- Seeded archival SVG/WebP illustrations under `client/public/manus-storage/` are compiled into `dist/public/manus-storage/` and served automatically.
- For user-uploaded media in production (artisan portfolio images, audio/video oral histories, and documentary attachments):
  - Store uploaded files in an **S3-compatible object storage bucket** (Cloudflare R2, AWS S3, or MinIO) or a dedicated subfolder on your persistent volume (`/var/data/uploads`) rather than inside the ephemeral application container directory.
  - Serve media through a CDN with immutable cache headers and validate MIME types and maximum upload sizes before storage.
