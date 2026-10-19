import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { apiClient } from "../lib/api";
import {
  CONSERVATIVE_PASSPORT_DEFAULTS,
  CULTURE_CATEGORIES,
  EVENT_RECURRENCE_PATTERNS,
  EVENT_SCHEDULE_STATUSES,
  LOCATION_GRANULARITY_OPTIONS,
  RECORD_ORIGINS,
  ACCOUNT_PERSONA_TYPES,
  PUBLIC_REGISTRATION_PERSONAS,
  STAFF_ROLES,
  UNESCO_DOMAINS,
  USER_ROLES,
  VISITOR_ACCESS_OPTIONS,
} from "../../../shared/const";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = fs.existsSync(path.resolve(process.cwd(), "client/src/App.tsx")) ? process.cwd() : path.resolve(__dirname, "../../..");

describe("Bharat CultureMap — Frontend Contracts, Visual Assets & Map Component Verification", () => {
  it("exposes the 5 RBAC roles, UNESCO domains, and Rights Passport location granularities from shared constants", () => {
    expect(STAFF_ROLES).toEqual([
      "SUPER_ADMIN",
      "FIELD_RESEARCHER",
      "LANGUAGE_REVIEWER",
      "FOLKLORE_REVIEWER",
      "PRACTITIONER_APPROVER",
    ]);
    expect(USER_ROLES).toEqual([
      "PUBLIC_USER",
      "SUPER_ADMIN",
      "FIELD_RESEARCHER",
      "LANGUAGE_REVIEWER",
      "FOLKLORE_REVIEWER",
      "PRACTITIONER_APPROVER",
    ]);
    expect(PUBLIC_REGISTRATION_PERSONAS).toEqual([
      "BUYER",
      "PRACTITIONER",
      "ARTISAN_SELLER",
      "HERCRAFT_ENTREPRENEUR",
      "VISITOR",
    ]);
    expect(ACCOUNT_PERSONA_TYPES).toContain("HERCRAFT_ENTREPRENEUR");
    expect(RECORD_ORIGINS).toEqual(["FIELD_VERIFIED", "DEMO_REFERENCE"]);
    expect(LOCATION_GRANULARITY_OPTIONS).toEqual([
      "EXACT_WORKSHOP",
      "VILLAGE",
      "CITY_TOWN",
      "TALUKA",
      "DISTRICT",
      "HIDDEN",
    ]);
    expect(CONSERVATIVE_PASSPORT_DEFAULTS.locationGranularity).toBe("DISTRICT");
    expect(CULTURE_CATEGORIES.length).toBeGreaterThanOrEqual(8);
    expect(UNESCO_DOMAINS.length).toBe(5);
    expect(EVENT_SCHEDULE_STATUSES).toEqual([
      "CONFIRMED",
      "PROVISIONAL",
      "SEASONAL_ESTIMATE",
      "CANCELLED",
      "PAST",
    ]);
    expect(EVENT_RECURRENCE_PATTERNS).toContain("ANNUAL_LUNAR_SOLAR_TRADITION");
    expect(VISITOR_ACCESS_OPTIONS).toContain("ACCESS_NOT_ESTABLISHED");
  });

  it("exposes typed frontend API client methods for public discovery, Cultural Calendar, Trip Planner, authentication, and Admin Panel lifecycle", () => {
    expect(typeof apiClient.getAuthStatus).toBe("function");
    expect(typeof apiClient.login).toBe("function");
    expect(typeof apiClient.getMapDiscovery).toBe("function");
    expect(typeof apiClient.getPlaceDetail).toBe("function");
    expect(typeof apiClient.getGeographyMetadata).toBe("function");
    expect(typeof apiClient.listPublicRecords).toBe("function");
    expect(typeof apiClient.queryPublicCalendar).toBe("function");
    expect(typeof apiClient.getPublicEventById).toBe("function");
    expect(typeof apiClient.submitPublicCalendarEvent).toBe("function");
    expect(typeof apiClient.generateTripPlan).toBe("function");
    expect(typeof apiClient.saveTripPlan).toBe("function");
    expect(typeof apiClient.updateTripPlan).toBe("function");
    expect(typeof apiClient.getTripPlanById).toBe("function");
    expect(typeof apiClient.listPublicEvents).toBe("function");
    expect(typeof apiClient.submitCommunityEnquiry).toBe("function");
    expect(typeof apiClient.createRecord).toBe("function");
    expect(typeof apiClient.updateRecord).toBe("function");
    expect(typeof apiClient.updateRightsPassport).toBe("function");
    expect(typeof apiClient.submitReview).toBe("function");
    expect(typeof apiClient.recordPractitionerApproval).toBe("function");
    expect(typeof apiClient.publishRecord).toBe("function");
    expect(typeof apiClient.restrictOrWithdrawRecord).toBe("function");
    expect(typeof apiClient.createEvent).toBe("function");
    expect(typeof apiClient.updateEvent).toBe("function");
    expect(typeof apiClient.publishEvent).toBe("function");
    expect(typeof apiClient.updateEventStatus).toBe("function");
  });

  it("verifies local homepage hero, craft profile, and textile JPEG assets exist and exceed 150 KB", () => {
    const requiredAssets = [
      "client/public/manus-storage/bharat-culturemap-hero_1c81260f.jpg",
      "client/public/manus-storage/bharat-culturemap-craft_14d51f4e.jpg",
      "client/public/manus-storage/bharat-culturemap-textile_e59e6de2.jpg",
    ];

    for (const rel of requiredAssets) {
      const fullPath = path.join(REPO_ROOT, rel);
      expect(fs.existsSync(fullPath)).toBe(true);
      const buf = fs.readFileSync(fullPath);
      expect(buf.length).toBeGreaterThan(150 * 1024);
      expect(buf[0]).toBe(0xff);
      expect(buf[1]).toBe(0xd8);
      expect(buf[2]).toBe(0xff);
    }
  });

  it("verifies Map.tsx configures genuine OpenStreetMap/CARTO tiles, attribution, and graceful offline handling", () => {
    const mapSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/components/Map.tsx"),
      "utf8"
    );
    expect(mapSource).toContain("tile.openstreetmap.org");
    expect(mapSource).toContain("OpenStreetMap</a> contributors");
    expect(mapSource).toContain('tileLayer.on("tileerror"');
    expect(mapSource).toContain('updateStatus("unavailable")');
    expect(mapSource).not.toContain("forge.butterfly-effect.dev");
    expect(mapSource).not.toContain("forge.manus.ai");
  });

  it("verifies Home.tsx, NationalCultureMap.tsx, PlaceDetail.tsx, and AdminPanel.tsx integrate with backend API and remove prototype labels", () => {
    const homeSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/Home.tsx"),
      "utf8"
    );
    const normalizedHome = homeSource.replace(/\s+/g, " ");
    expect(normalizedHome).toContain("apiClient.listPublicRecords()");
    expect(normalizedHome).toContain("apiClient .getPublicRecordBySlug(");
    expect(homeSource).toContain("HeroIndiaArtwork");
    expect(homeSource).toContain("profileSwitcherRecords");
    expect(homeSource).toContain('recordOrigin === "FIELD_VERIFIED"');
    expect(homeSource).not.toContain("active?.heroImageUrl || CRAFT_IMAGE");
    expect(homeSource).not.toContain('r.slug === "kolhapuri-chappal-demo"');
    expect(homeSource).toContain("selectRecordAndSyncUrl");
    expect(homeSource).toContain("industry-to-art");
    expect(homeSource).toContain("gov-resources");
    expect(homeSource).not.toContain("PROTOTYPE • DEMO DATA");
    expect(homeSource).not.toContain("DEMO AUDIO PLACEHOLDER");
    expect(homeSource).not.toContain("CURRENT PROTOTYPE");

    const nationalMapSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/components/NationalCultureMap.tsx"),
      "utf8"
    );
    const normalizedNationalMap = nationalMapSource.replace(/\s+/g, " ");
    expect(normalizedNationalMap).toContain("getMapDiscovery(includeDemo)");
    expect(nationalMapSource).toContain("Discover the culture of this place");
    expect(nationalMapSource).toContain("Upcoming Cultural Events");

    const placeDetailSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/PlaceDetail.tsx"),
      "utf8"
    );
    expect(placeDetailSource).toContain("Discover the culture of this place");
    expect(placeDetailSource).toContain("GEOGRAPHIC HIERARCHY");

    const adminSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/AdminPanel.tsx"),
      "utf8"
    );
    expect(adminSource).toContain("apiClient.updateRecord");
    expect(adminSource).toContain("handleSaveRecordEdit");
    expect(adminSource).toContain("apiClient.publishRecord");
    expect(adminSource).toContain("handleSaveEventChanges");
    expect(adminSource).toContain("handlePublishEvent");
  });

  it("verifies CulturalCalendar.tsx implements list, calendar grid, map, and trip planner views, tourist safeguards, and moderation submission", () => {
    const calendarSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/CulturalCalendar.tsx"),
      "utf8"
    );
    expect(calendarSource).toContain("Event-List View");
    expect(calendarSource).toContain("Calendar Grid View");
    expect(calendarSource).toContain("Map View");
    expect(calendarSource).toContain("Culture Trip Planner");
    expect(calendarSource).toContain("VISITOR ACCESS & TOURIST SAFEGUARDS");
    expect(calendarSource).toContain("Recurring Tradition vs. Verified Occurrences");
    expect(calendarSource).toContain("queryPublicCalendar");
    expect(calendarSource).toContain("submitPublicCalendarEvent");

    const appSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/App.tsx"),
      "utf8"
    );
    expect(appSource).toContain('path="/calendar"');
    expect(appSource).toContain('path="/calendar/:id"');
    expect(appSource).toContain('path="/trip-planner"');
  });

  it("verifies CultureTripPlanner.tsx supports day-by-day itinerary generation, add/remove/reorder controls, save/print, and tourist safeguards", () => {
    const plannerSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/components/CultureTripPlanner.tsx"),
      "utf8"
    );
    expect(plannerSource).toContain("generateTripPlan");
    expect(plannerSource).toContain("saveTripPlan");
    expect(plannerSource).toContain("handleAddItemToDay");
    expect(plannerSource).toContain("handleRemoveItemFromDay");
    expect(plannerSource).toContain("handleMoveItemInDay");
    expect(plannerSource).toContain("window.print()");
    expect(plannerSource).toContain("EXCLUDED BY COMMUNITY & TOURIST SAFEGUARDS");
  });

  it("verifies TraditionExplorer.tsx, /traditions routes, multi-region spatial map, source citations, and media attribution panels", () => {
    expect(typeof apiClient.queryPublicTraditions).toBe("function");
    expect(typeof apiClient.getPublicTraditionBySlug).toBe("function");
    expect(typeof apiClient.listPublicSources).toBe("function");
    expect(typeof apiClient.listPublicMediaAssets).toBe("function");
    expect(typeof apiClient.listAdminTraditions).toBe("function");
    expect(typeof apiClient.createTradition).toBe("function");
    expect(typeof apiClient.addTraditionPlaceAssociation).toBe("function");
    expect(typeof apiClient.createSourceCitation).toBe("function");
    expect(typeof apiClient.createMediaAsset).toBe("function");
    expect(typeof apiClient.updateMediaAsset).toBe("function");

    const appSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/App.tsx"),
      "utf8"
    );
    expect(appSource).toContain('path="/traditions"');
    expect(appSource).toContain('path="/traditions/:slug"');

    const explorerSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/TraditionExplorer.tsx"),
      "utf8"
    );
    expect(explorerSource).toContain("NeutralTraditionPlaceholder");
    expect(explorerSource).toContain("MediaAttributionCard");
    expect(explorerSource).toContain("Source Citations & Fact-Verification Log");
    expect(explorerSource).toContain("SPATIAL TRADITION-TO-PLACE RELATIONSHIPS");
    expect(explorerSource).not.toContain("bharat-culturemap-craft_14d51f4e.jpg");
  });

  it("verifies SiteHeader.tsx, ArtMart.tsx, Practitioners.tsx, EcosystemHub.tsx, and dynamic Trip Planner defaults", () => {
    const headerSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/components/SiteHeader.tsx"),
      "utf8"
    );
    expect(headerSource).toContain(
      "DEMONSTRATION ENVIRONMENT — Sample profiles, products, transactions and workflow records are illustrative"
    );
    expect(headerSource).toContain("Art-Mart");
    expect(headerSource).toContain("Practitioners");
    expect(headerSource).toContain("Industry-to-Art");
    expect(headerSource).toContain("Government and Partners");

    const artMartSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/ArtMart.tsx"),
      "utf8"
    );
    expect(artMartSource).toContain("SIMULATED PAYMENT SANDBOX ONLY");
    expect(artMartSource).toContain("Cancel & Restore Stock");

    const practSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/Practitioners.tsx"),
      "utf8"
    );
    expect(practSource).toContain("DEMO_SAMPLE PRACTITIONER PROFILE");

    const ecoSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/EcosystemHub.tsx"),
      "utf8"
    );
    expect(ecoSource).toContain("Interactive 6-Step Circular Craft Workflow");
    expect(ecoSource).toContain("OFFICIAL_PUBLIC_SOURCE");

    const plannerSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/components/CultureTripPlanner.tsx"),
      "utf8"
    );
    expect(plannerSource).not.toContain('useState("2026-11-14")');
    expect(plannerSource).toContain("new Date().toISOString().slice(0, 10)");
  });

  it("verifies Bharat CultureMap 6 Accounts (/login, /register, /account), HerCraft module (/hercraft), and responsive CSS rules", () => {
    expect(typeof apiClient.registerAccount).toBe("function");
    expect(typeof apiClient.updateProfile).toBe("function");
    expect(typeof apiClient.getDemoAccounts).toBe("function");
    expect(typeof apiClient.demoLogin).toBe("function");
    expect(typeof apiClient.adminUpdateUser).toBe("function");
    expect(typeof apiClient.queryHerCraftDirectory).toBe("function");
    expect(typeof apiClient.getHerCraftEnterpriseBySlug).toBe("function");
    expect(typeof apiClient.createHerCraftEnterprise).toBe("function");
    expect(typeof apiClient.updateHerCraftEnterprise).toBe("function");
    expect(typeof apiClient.createHerCraftOpportunity).toBe("function");
    expect(typeof apiClient.updateHerCraftOpportunity).toBe("function");

    const appSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/App.tsx"),
      "utf8"
    );
    expect(appSource).toContain('path="/login"');
    expect(appSource).toContain('path="/register"');
    expect(appSource).toContain('path="/account"');
    expect(appSource).toContain('path="/hercraft"');
    expect(appSource).toContain('path="/hercraft/:slug"');

    const authSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/AuthAccount.tsx"),
      "utf8"
    );
    expect(authSource).toContain("PUBLIC_USER");
    expect(authSource).toContain("HERCRAFT_ENTREPRENEUR");

    const herCraftSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/pages/HerCraft.tsx"),
      "utf8"
    );
    expect(herCraftSource).toContain("DEMO_SAMPLE");
    expect(herCraftSource).toContain("Submit HerCraft Enterprise");

    const cssSource = fs.readFileSync(
      path.join(REPO_ROOT, "client/src/index.css"),
      "utf8"
    );
    expect(cssSource).toContain(".bcm-card-straight");
    expect(cssSource).toContain(".passport-stamp");
    expect(cssSource).not.toContain("translateY(0px) rotate(-2deg)");
  });
});
