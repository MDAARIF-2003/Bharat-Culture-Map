import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createApiHandler } from "../api-handler";
import { applySchemaMigrations, resolveMigrationSqlPath } from "../db/index";
import { ModularCultureMapRepository } from "../db/repository";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = fs.existsSync(
  path.resolve(process.cwd(), "client", "src", "components", "Map.tsx")
)
  ? process.cwd()
  : path.resolve(__dirname, "../..");

async function startTestServer(customDbPath?: string) {
  const repo = new ModularCultureMapRepository(
    customDbPath
      ? { dbPath: customDbPath, inMemoryOnly: false }
      : { inMemoryOnly: true }
  );
  const handler = createApiHandler(repo);
  const server = http.createServer((req, res) => {
    void handler(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  async function api(
    urlPath: string,
    opts?: {
      method?: string;
      token?: string;
      body?: unknown;
    }
  ) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (opts?.token) {
      headers["Authorization"] = `Bearer ${opts.token}`;
    }
    const resp = await fetch(`${baseUrl}${urlPath}`, {
      method: opts?.method || "GET",
      headers,
      body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const data = await resp.json().catch(() => ({}));
    return { status: resp.status, data };
  }

  return { server, repo, api };
}

test("Final Full-Stack Regression Suite (Tasks 1 & 2 + Milestone 1)", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bcm-regression-test-"));
  const dbPath = path.join(tmpDir, "test_culturemap.sqlite");
  const { server, repo, api } = await startTestServer(dbPath);

  t.after(() => {
    server.close();
    repo.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  let superAdminToken = "";
  const tokensByRole: Record<string, string> = {};
  let recordId = "";
  let recordSlug = "";

  await t.test(
    "1. Geographic Discovery & Statistics: Kolhapur District hierarchy, talukas/cities, & distinct DEMO_REFERENCE vs FIELD_VERIFIED counts",
    async () => {
      const mapInitial = await api("/api/v1/public/map");
      assert.equal(mapInitial.status, 200);
      assert.equal(mapInitial.data.stats.fieldVerifiedPublished, 0);
      assert.equal(mapInitial.data.stats.demoReferencePublished, 68);

      const maharashtra = mapInitial.data.states.find(
        (s: any) => s.name === "Maharashtra"
      );
      assert.ok(maharashtra, "Maharashtra state must exist");
      assert.equal(maharashtra.fieldVerifiedCount, 0);
      assert.equal(maharashtra.demoCount, 9);

      const kolhapurDistrict = maharashtra.districts.find(
        (d: any) => d.name === "Kolhapur District"
      );
      assert.ok(
        kolhapurDistrict,
        "Kolhapur District must exist under Maharashtra"
      );
      for (const expectedPlace of [
        "Ichalkaranji",
        "Kagal",
        "Kolhapur",
        "Panhala",
        "Hupari",
        "Kapashi",
        "Gadhinglaj",
      ]) {
        assert.ok(
          kolhapurDistrict.cities.includes(expectedPlace),
          `Kolhapur District must expose constituent locality ${expectedPlace}`
        );
      }
      assert.equal(
        kolhapurDistrict.subdistricts.length,
        12,
        "Kolhapur District must expose all 12 Subdistricts/Talukas"
      );
      assert.equal(
        mapInitial.data.stats.statesAndUtsCount,
        36,
        "All 36 States and Union Territories of India must be indexed"
      );
      assert.equal(kolhapurDistrict.fieldVerifiedCount, 0);
      assert.equal(kolhapurDistrict.demoCount, 5);
      assert.equal(mapInitial.data.cities.Kolhapur.records.length, 5);

      const mapVerifiedOnly = await api(
        "/api/v1/public/map?includeDemo=false"
      );
      assert.equal(mapVerifiedOnly.status, 200);
      assert.equal(mapVerifiedOnly.data.stats.totalPublished, 0);
    }
  );

  await t.test(
    "2. Authentication & RBAC: Super Admin bootstrap and 5 role permissions",
    async () => {
      const unauthAdmin = await api("/api/v1/admin/records");
      assert.equal(unauthAdmin.status, 401);

      const bootstrapResp = await api("/api/v1/auth/bootstrap", {
        method: "POST",
        body: {
          email: "superadmin@bharat-culturemap.org",
          password: "StrongPassword!2026",
          fullName: "Lead Architect (Super Admin)",
        },
      });
      assert.equal(bootstrapResp.status, 201);
      superAdminToken = bootstrapResp.data.token;
      tokensByRole.SUPER_ADMIN = superAdminToken;

      const secondBootstrap = await api("/api/v1/auth/bootstrap", {
        method: "POST",
        body: {
          email: "attacker@example.com",
          password: "StrongPassword!2026",
          fullName: "Attacker",
        },
      });
      assert.equal(secondBootstrap.status, 403);

      const rolesToCreate = [
        [
          "researcher@bharat-culturemap.org",
          "FIELD_RESEARCHER",
          "Field Researcher",
        ],
        [
          "langreview@bharat-culturemap.org",
          "LANGUAGE_REVIEWER",
          "Marathi Reviewer",
        ],
        [
          "folklore@bharat-culturemap.org",
          "FOLKLORE_REVIEWER",
          "Folklore Reviewer",
        ],
        [
          "approver@bharat-culturemap.org",
          "PRACTITIONER_APPROVER",
          "Custodian Approver",
        ],
      ] as const;

      for (const [email, role, fullName] of rolesToCreate) {
        const createResp = await api("/api/v1/admin/users", {
          method: "POST",
          token: superAdminToken,
          body: { email, password: "RolePassword!2026", fullName, role },
        });
        assert.equal(createResp.status, 201);
        const loginResp = await api("/api/v1/auth/login", {
          method: "POST",
          body: { email, password: "RolePassword!2026" },
        });
        assert.equal(loginResp.status, 200);
        tokensByRole[role] = loginResp.data.token;
      }

      const forbiddenUserCreate = await api("/api/v1/admin/users", {
        method: "POST",
        token: tokensByRole.FIELD_RESEARCHER,
        body: {
          email: "extra@example.com",
          password: "RolePassword!2026",
          fullName: "Extra",
          role: "SUPER_ADMIN",
        },
      });
      assert.equal(forbiddenUserCreate.status, 403);
    }
  );

  await t.test(
    "3. Admin Creates and Edits Cultural Record with Private Exact Coordinates & Conservative Rights Passport Defaults",
    async () => {
      const createRecResp = await api("/api/v1/admin/records", {
        method: "POST",
        token: tokensByRole.FIELD_RESEARCHER,
        body: {
          titleEn: "Kolhapuri Chappal — Kapashi Draft",
          titleMr: "कोल्हापुरी चप्पल — कापशी परंपरा",
          subtitleEn: "Vegetable-tanned leather craft documented with consent",
          category: "Craft",
          unescoDomain: "Traditional craftsmanship",
          practitionerChosenName: "Karagir Dattatray (Chosen Name)",
          practitionerFullNamePrivate:
            "Dattatray Ramchandra More [Private Legal Name]",
          practitionerCommunityName: "Kapashi Charmakar Samaj",
          practitionerTaluka: "Kagal",
          practitionerVillagePrivate: "Kapashi Village, Near Main Chowk",
          practitionerPhonePrivate: "+91-9988776655",
          practitionerAddressPrivate: "Plot 12, Lane 4, Kapashi",
          stateId: "loc-state-maharashtra",
          districtId: "loc-district-kolhapur-district",
          cityTownId: "loc-city-kagal",
          exactLatPrivate: 16.578912,
          exactLngPrivate: 74.316543,
          summaryEn: "Initial summary before edit.",
          practiceContextEn: "Initial context.",
          originalVoiceLanguage: "Marathi",
          originalVoiceAudioUrl: "/media/consented-kapashi-voice.mp3",
          originalVoiceTranscriptMr:
            "आमची कला ही आमच्या हातांची आणि गावाची ओळख आहे.",
          mediationM1SubtitlesEn:
            "Our craft is the identity of our hands and our village.",
          mediationM2SyntheticContextText:
            "Approved context explaining the vegetable-tanning process in Kapashi.",
          mediationM3HumanStoryCompanionText:
            "Approved context read by a human Story Companion explaining the heritage vocabulary and leather tanning.",
          mediationM3NarratorCredit:
            "Narrated by Dr. Kulkarni (Approved Narrator)",
          vocabulary: [
            {
              termRoman: "Veni",
              termDevanagari: "वेणी",
              languageCode: "mr",
              meaningEn: "Braided leather strip across the instep",
            },
          ],
        },
      });

      assert.equal(createRecResp.status, 201);
      const createdRecord = createRecResp.data.record;
      recordId = createdRecord.id;
      recordSlug = createdRecord.slug;

      assert.equal(createdRecord.status, "DRAFT");
      assert.equal(createdRecord.recordOrigin, "FIELD_VERIFIED");
      assert.equal(createdRecord.publicationGate.allowed, false);

      // Test Editing the Record via PATCH /api/v1/admin/records/:id (Requirement 9)
      const editResp = await api(`/api/v1/admin/records/${recordId}`, {
        method: "PATCH",
        token: tokensByRole.FIELD_RESEARCHER,
        body: {
          titleEn: "Kolhapuri Chappal — Kapashi Master Craft",
          summaryEn:
            "Hand-stitched vegetable-tanned leather footwear documented under the practitioner-governed Rights Passport.",
          practiceContextEn:
            "Documented in Kolhapur District with original Marathi voice kept central and human Story Companion mediation.",
        },
      });
      assert.equal(editResp.status, 200);
      assert.equal(
        editResp.data.record.titleEn,
        "Kolhapuri Chappal — Kapashi Master Craft"
      );

      const draftPublicLookup = await api(
        `/api/v1/public/records/${recordSlug}`
      );
      assert.equal(draftPublicLookup.status, 404);
    }
  );

  await t.test(
    "4. Publication Gate Rejects Record Without Informed Consent, Review, or Approval",
    async () => {
      const prematurePublish = await api(
        `/api/v1/admin/records/${recordId}/publish`,
        {
          method: "POST",
          token: tokensByRole.PRACTITIONER_APPROVER,
        }
      );
      assert.equal(prematurePublish.status, 403);
      assert.equal(prematurePublish.data.code, "CONSENT_GATE_BLOCKED");
      assert.ok(prematurePublish.data.reasons.length >= 3);

      const consentUpdate = await api(
        `/api/v1/admin/records/${recordId}/rights-passport`,
        {
          method: "PUT",
          token: tokensByRole.FIELD_RESEARCHER,
          body: {
            consentTakingPart: true,
            consentBeingRecorded: true,
            consentPublicUse: true,
            consentMode: "WRITTEN_SIGNED",
            consentSignedAt: new Date().toISOString(),
            practitionerConfirmedAt: new Date().toISOString(),
            statements: {
              voluntaryParticipation: true,
              rightToWithdraw: true,
              interviewAndRecording: true,
              nothingPublicWithoutApproval: true,
              sacredPrivateExcluded: true,
              noExternalAiOrVoiceCloning: true,
              fairCompensationIndependentOfConsent: true,
            },
          },
        }
      );
      assert.equal(consentUpdate.status, 200);
      assert.equal(consentUpdate.data.record.status, "CONSENT_RECORDED");

      const publishBeforeReview = await api(
        `/api/v1/admin/records/${recordId}/publish`,
        {
          method: "POST",
          token: tokensByRole.PRACTITIONER_APPROVER,
        }
      );
      assert.equal(publishBeforeReview.status, 403);
      assert.equal(publishBeforeReview.data.code, "CONSENT_GATE_BLOCKED");
    }
  );

  await t.test(
    "5. Authorized Review, Sustained Practitioner Approval, and Publication Succeed",
    async () => {
      const unauthorizedReview = await api(
        `/api/v1/admin/records/${recordId}/review`,
        {
          method: "POST",
          token: tokensByRole.FIELD_RESEARCHER,
          body: { stepType: "TRANSLATED", notes: "Attempt by researcher" },
        }
      );
      assert.equal(unauthorizedReview.status, 403);

      const validReview = await api(
        `/api/v1/admin/records/${recordId}/review`,
        {
          method: "POST",
          token: tokensByRole.LANGUAGE_REVIEWER,
          body: {
            stepType: "TRANSLATED",
            notes: "Marathi transcript and English context verified.",
            practitionerApproved: true,
          },
        }
      );
      assert.equal(validReview.status, 200);
      assert.equal(validReview.data.record.status, "UNDER_REVIEW");

      const validApproval = await api(
        `/api/v1/admin/records/${recordId}/practitioner-approval`,
        {
          method: "POST",
          token: tokensByRole.PRACTITIONER_APPROVER,
          body: {
            notes:
              "Practitioner listened to the Story Companion and approved public release.",
          },
        }
      );
      assert.equal(validApproval.status, 200);
      assert.equal(
        validApproval.data.record.status,
        "PRACTITIONER_APPROVED"
      );
      assert.equal(validApproval.data.record.publicationGate.allowed, true);

      const publishSuccess = await api(
        `/api/v1/admin/records/${recordId}/publish`,
        {
          method: "POST",
          token: tokensByRole.PRACTITIONER_APPROVER,
          body: { notes: "Released to public Bharat CultureMap." },
        }
      );
      assert.equal(publishSuccess.status, 200);
      assert.equal(publishSuccess.data.record.status, "PUBLISHED");
    }
  );

  await t.test(
    "6. Public Visibility, Location Masking & Private Media Protection",
    async () => {
      const publicRecResp = await api(`/api/v1/public/records/${recordSlug}`);
      assert.equal(publicRecResp.status, 200);
      const pubRec = publicRecResp.data.record;

      assert.equal(pubRec.titleEn, "Kolhapuri Chappal — Kapashi Master Craft");
      assert.equal(pubRec.recordOrigin, "FIELD_VERIFIED");
      assert.equal(
        pubRec.creditedPractitionerLabel,
        "Karagir Dattatray (Chosen Name)"
      );
      assert.equal(pubRec.locationGranularity, "DISTRICT");
      assert.equal(
        pubRec.displayLocationLabel,
        "Kolhapur District, Maharashtra"
      );
      assert.equal(pubRec.cityTownName, null);
      assert.deepEqual(pubRec.publicCenter, {
        lat: 16.705,
        lng: 74.2433,
      });

      const serializedPublicJson = JSON.stringify(pubRec);
      assert.ok(!serializedPublicJson.includes("Dattatray Ramchandra More"));
      assert.ok(!serializedPublicJson.includes("+91-9988776655"));
      assert.ok(!serializedPublicJson.includes("Plot 12, Lane 4"));
      assert.ok(!serializedPublicJson.includes("16.578912"));
      assert.ok(!serializedPublicJson.includes("74.316543"));
      assert.ok(!serializedPublicJson.includes("Kapashi Village"));

      // Private media protection when audioVideoAccess='PRIVATE' & translationScope='ORIGINAL_ONLY'
      assert.equal(pubRec.canPlayAudioVideo, false);
      assert.equal(pubRec.originalVoiceAudioUrl, null);
      assert.equal(pubRec.translationPermitted, false);
      assert.equal(pubRec.mediationM3HumanStoryCompanionText, null);

      const mapAfterPublish = await api("/api/v1/public/map");
      assert.equal(mapAfterPublish.data.stats.fieldVerifiedPublished, 1);
      assert.equal(mapAfterPublish.data.stats.demoReferencePublished, 68);
    }
  );

  await t.test(
    "7. Sacred Content Flag, Restriction, and Withdrawal Immediately Remove Record from Public APIs",
    async () => {
      // Editing a published record to isSacredOrRestricted=true must auto-restrict it
      const sacredPatch = await api(`/api/v1/admin/records/${recordId}`, {
        method: "PATCH",
        token: tokensByRole.FIELD_RESEARCHER,
        body: { isSacredOrRestricted: true },
      });
      assert.equal(sacredPatch.status, 200);
      assert.equal(sacredPatch.data.record.status, "RESTRICTED");
      assert.equal(sacredPatch.data.record.publicationGate.allowed, false);

      const publicWhenSacred = await api(
        `/api/v1/public/records/${recordSlug}`
      );
      assert.equal(publicWhenSacred.status, 404);

      // Clear sacred flag, re-publish, then test explicit RESTRICTED and WITHDRAWN
      await api(`/api/v1/admin/records/${recordId}`, {
        method: "PATCH",
        token: tokensByRole.FIELD_RESEARCHER,
        body: { isSacredOrRestricted: false },
      });
      await api(`/api/v1/admin/records/${recordId}/publish`, {
        method: "POST",
        token: tokensByRole.PRACTITIONER_APPROVER,
      });

      const restrictResp = await api(
        `/api/v1/admin/records/${recordId}/restrict`,
        {
          method: "POST",
          token: tokensByRole.PRACTITIONER_APPROVER,
          body: {
            action: "RESTRICTED",
            reason: "Practitioner requested temporary restriction of record.",
          },
        }
      );
      assert.equal(restrictResp.status, 200);
      assert.equal(restrictResp.data.record.status, "RESTRICTED");
      assert.equal(
        (await api(`/api/v1/public/records/${recordSlug}`)).status,
        404
      );

      const withdrawResp = await api(
        `/api/v1/admin/records/${recordId}/restrict`,
        {
          method: "POST",
          token: tokensByRole.FIELD_RESEARCHER,
          body: {
            action: "WITHDRAWN",
            reason: "Practitioner exercised right to withdraw record.",
          },
        }
      );
      assert.equal(withdrawResp.status, 200);
      assert.equal(withdrawResp.data.record.status, "WITHDRAWN");
      assert.equal(
        withdrawResp.data.record.rightsPassport.withdrawalStatus,
        "REMOVED"
      );
      assert.equal(
        (await api(`/api/v1/public/records/${recordSlug}`)).status,
        404
      );
    }
  );

  await t.test(
    "8. Frontend & Local Asset Integrity: Hero, Craft, Textile JPEGs, Leaflet Map Component & Non-Hardcoded Data Flow",
    async () => {
      // Verify local visual assets exist, are valid JPEGs (0xFF 0xD8 0xFF), and >150KB
      const requiredAssets = [
        "client/public/manus-storage/bharat-culturemap-hero_1c81260f.jpg",
        "client/public/manus-storage/bharat-culturemap-craft_14d51f4e.jpg",
        "client/public/manus-storage/bharat-culturemap-textile_e59e6de2.jpg",
      ];
      for (const rel of requiredAssets) {
        const abs = path.join(WORKSPACE_ROOT, rel);
        assert.ok(fs.existsSync(abs), `Asset must exist: ${rel}`);
        const buf = fs.readFileSync(abs);
        assert.ok(buf.length > 150 * 1024, `Asset ${rel} must be high-res (>150KB)`);
        assert.equal(buf[0], 0xff);
        assert.equal(buf[1], 0xd8);
        assert.equal(buf[2], 0xff);
      }

      // Verify Map.tsx uses Leaflet + OpenStreetMap/CARTO, handles tileerror -> unavailable, and has no Manus proxy URLs
      const mapSrc = fs.readFileSync(
        path.join(WORKSPACE_ROOT, "client/src/components/Map.tsx"),
        "utf8"
      );
      assert.ok(
        mapSrc.includes("tile.openstreetmap.org"),
        "Map.tsx must configure genuine OpenStreetMap tiles"
      );
      assert.ok(
        mapSrc.includes("OpenStreetMap</a> contributors"),
        "Map.tsx must include OpenStreetMap attribution"
      );
      assert.ok(
        mapSrc.includes('tileLayer.on("tileerror"') &&
          mapSrc.includes('updateStatus("unavailable")'),
        "Map.tsx must handle tile-service failures gracefully with an unavailable state"
      );
      assert.ok(
        !mapSrc.includes("forge.butterfly-effect.dev") &&
          !mapSrc.includes("forge.manus.ai"),
        "Map.tsx must not reference undocumented Manus proxy URLs"
      );

      // Verify Home.tsx and NationalCultureMap.tsx load records from apiClient and select Kolhapuri Chappal initially
      const homeSrc = fs.readFileSync(
        path.join(WORKSPACE_ROOT, "client/src/pages/Home.tsx"),
        "utf8"
      );
      assert.ok(
        homeSrc.includes("apiClient") && homeSrc.includes("listPublicRecords"),
        "Home.tsx must load records from the database via apiClient.listPublicRecords()"
      );
      assert.ok(
        !homeSrc.includes('r.slug === "kolhapuri-chappal-demo"'),
        "Home.tsx must never hard-code a default lookup to Kolhapuri Chappal"
      );
      assert.ok(
        homeSrc.includes("HeroIndiaArtwork"),
        "Home.tsx must render HeroIndiaArtwork in the hero section"
      );
    }
  );

  await t.test(
    "9. Persistent Database Restart Survival, Repeatable Migrations & Existing Data Preservation",
    async () => {
      // Close current DB handle and instantiate a brand-new repository on the same dbPath
      // to simulate a full application restart
      repo.close();
      const restartedRepo = new ModularCultureMapRepository({
        dbPath,
        inMemoryOnly: false,
      });

      try {
        assert.equal(
          restartedRepo.countUsers(),
          5,
          "All 5 RBAC user accounts must survive application restart"
        );
        assert.ok(
          restartedRepo.listLocations().length >= 165,
          "All imported administrative geographic locations must survive application restart"
        );
        const persistedRecord = restartedRepo.getAdminRecordById(recordId);
        assert.ok(
          persistedRecord,
          "Created cultural record must survive application restart"
        );
        assert.equal(
          persistedRecord.titleEn,
          "Kolhapuri Chappal — Kapashi Master Craft"
        );
        assert.equal(persistedRecord.status, "WITHDRAWN");
        assert.equal(
          persistedRecord.rightsPassport.withdrawalStatus,
          "REMOVED"
        );

        // Verify migrations are repeatable and idempotent without erasing data
        const appliedMigrations = restartedRepo.runMigrations();
        assert.ok(appliedMigrations.includes("0001_initial_schema"));
        assert.equal(restartedRepo.countUsers(), 5);
        assert.equal(restartedRepo.listAdminRecords().length, 69);
      } finally {
        restartedRepo.close();
      }
    }
  );

  await t.test(
    "10. Objectives 1, 2 & 3: Polished Verification States, Source Attribution, Comprehensive Geography (/places/:id), Events & Enquiries",
    async () => {
      // Objective 1: Verify reference records carry sourceAttribution and respectful verification labels (never PROTOTYPE • DEMO DATA)
      const chappalResp = await api(
        "/api/v1/public/records/kolhapuri-chappal-demo"
      );
      assert.equal(chappalResp.status, 200);
      assert.equal(
        chappalResp.data.record.verificationStateLabel,
        "Reference information"
      );
      assert.ok(
        chappalResp.data.record.sourceAttribution.includes(
          "Geographical Indications Registry of India"
        ),
        "Reference record must include authoritative source attribution"
      );
      assert.ok(
        !chappalResp.data.record.originBadgeLabel.includes("PROTOTYPE"),
        "Public originBadgeLabel must not use PROTOTYPE label"
      );
      assert.equal(
        chappalResp.data.record.creditedPractitionerLabel,
        "Community verification pending"
      );

      // Objective 2: Verify hierarchical geographic detail endpoint (/api/v1/public/places/:id)
      const kolhapurPlace = await api(
        "/api/v1/public/places/loc-district-kolhapur-district"
      );
      assert.equal(kolhapurPlace.status, 200);
      assert.equal(kolhapurPlace.data.place.nameEn, "Kolhapur District");
      assert.equal(kolhapurPlace.data.breadcrumbs.length, 3); // India -> Maharashtra -> Kolhapur District
      assert.ok(
        kolhapurPlace.data.childPlaces.some(
          (c: any) => c.id === "loc-taluka-karveer" && c.level === "TALUKA"
        ),
        "Kolhapur District detail must include Karveer Taluka child location"
      );
      assert.ok(
        kolhapurPlace.data.datasetMetadata.sources.length >= 2,
        "Dataset metadata must document LGD/Census and OpenStreetMap sources and licenses"
      );

      // Objective 3: Verify empty place exists independently of cultural records with "Collection in progress" status
      const emptyPlace = await api("/api/v1/public/places/loc-village-hupari");
      assert.equal(emptyPlace.status, 200);
      assert.equal(emptyPlace.data.place.nameEn, "Hupari");
      assert.equal(emptyPlace.data.coverageSummary.totalPublishedRecords, 0);
      assert.equal(
        emptyPlace.data.coverageSummary.statusLabel,
        "Collection in progress"
      );

      // Verify upcoming cultural events and moderated community enquiries API
      const eventsResp = await api("/api/v1/public/events");
      assert.equal(eventsResp.status, 200);
      assert.ok(eventsResp.data.events.length >= 4);

      const enqCreate = await api("/api/v1/public/enquiries", {
        method: "POST",
        body: {
          enquiryType: "PLACE_CONTRIBUTION",
          locationId: "loc-village-hupari",
          senderName: "Hupari Chandi Karagir Sangh",
          senderContact: "contact@huparicraft.org",
          message:
            "Requesting field documentation of Hupari silver ornament craft traditions.",
        },
      });
      assert.equal(enqCreate.status, 201);
      assert.equal(enqCreate.data.enquiry.status, "PENDING_REVIEW");

      const adminEnqList = await api("/api/v1/admin/enquiries", {
        token: superAdminToken,
      });
      assert.equal(adminEnqList.status, 200);
      assert.equal(adminEnqList.data.enquiries.length, 1);
    }
  );

  await t.test(
    "11. Cultural Calendar Full-Stack Verification: Creation, Editing, Filtering, Date Boundaries, Recurring Traditions, Publication Permissions, Cancellation, Source Display, Privacy & Map Linking",
    async () => {
      // 1. Public Calendar Query, Facets & Pagination
      const calAll = await api("/api/v1/public/calendar?page=1&pageSize=2");
      assert.equal(calAll.status, 200);
      assert.ok(calAll.data.total >= 5, "Should have at least 5 seeded published events");
      assert.equal(calAll.data.events.length, 2, "Pagination pageSize=2 must return 2 events");
      assert.ok(calAll.data.totalPages >= 3);
      assert.ok(calAll.data.facets.confirmedCount >= 2);
      assert.ok(calAll.data.facets.recurringTraditionsCount >= 2);

      // 2. Filtering by District, Category, Visitor Interest, Recurring Only & Date Boundaries
      const calPune = await api(
        "/api/v1/public/calendar?districtId=loc-district-pune-district"
      );
      assert.equal(calPune.status, 200);
      assert.equal(calPune.data.total, 1);
      assert.equal(
        calPune.data.events[0].id,
        "evt-pune-lavani-archival-seminar-2026"
      );

      const calRecurring = await api(
        "/api/v1/public/calendar?onlyRecurring=true"
      );
      assert.equal(calRecurring.status, 200);
      assert.ok(calRecurring.data.events.length >= 2);
      assert.ok(
        calRecurring.data.events.every((e: any) => e.isRecurringTradition === true)
      );

      const calNovWindow = await api(
        "/api/v1/public/calendar?dateFrom=2026-11-10&dateTo=2026-11-20"
      );
      assert.equal(calNovWindow.status, 200);
      assert.ok(
        calNovWindow.data.events.some(
          (e: any) => e.id === "evt-kolhapur-chappal-workshop-2026"
        ),
        "Date boundary filter 2026-11-10..2026-11-20 must include Nov 14-16 Chappal event"
      );
      assert.ok(
        !calNovWindow.data.events.some(
          (e: any) => e.id === "evt-pune-lavani-archival-seminar-2026"
        ),
        "Date boundary filter 2026-11-10..2026-11-20 must exclude Oct 24-25 Pune event"
      );

      // 3. Event Detail, Source Display, Linked Practice & Privacy Masking
      const chappalEvt = await api(
        "/api/v1/public/calendar/evt-kolhapur-chappal-workshop-2026"
      );
      assert.equal(chappalEvt.status, 200);
      assert.equal(
        chappalEvt.data.event.culturalRecordSlug,
        "kolhapuri-chappal-demo"
      );
      assert.ok(chappalEvt.data.linkedRecord, "Must return linked cultural record");
      assert.ok(
        chappalEvt.data.event.sourceAttribution.includes("GI No. 169")
      );
      assert.ok(chappalEvt.data.event.lastVerifiedAt);
      assert.equal(chappalEvt.data.event.occurrences.length, 2);
      assert.ok(
        !JSON.stringify(chappalEvt.data).includes("+91-9000011111"),
        "Private organizer contact must never leak in public event response"
      );

      // Verify DISTRICT locationGranularity masks exact coordinates to district centroid
      const loomEvt = await api(
        "/api/v1/public/calendar/evt-ichalkaranji-weaving-open-loom-2026"
      );
      assert.equal(loomEvt.status, 200);
      assert.equal(loomEvt.data.event.locationGranularity, "DISTRICT");
      assert.equal(loomEvt.data.event.cityTownName, null);
      assert.deepEqual(loomEvt.data.event.publicCenter, {
        lat: 16.705,
        lng: 74.2433,
      });
      assert.ok(!JSON.stringify(loomEvt.data).includes("16.6912"));
      assert.ok(!JSON.stringify(loomEvt.data).includes("+91-9000044444"));

      // 4. Public Moderation Queue Submission (enters UNDER_REVIEW, not publicly visible)
      const pubSubResp = await api("/api/v1/public/calendar/submit", {
        method: "POST",
        body: {
          titleEn: "Kagal Community Pottery & Terracotta Demonstration",
          category: "Craft",
          stateId: "loc-state-maharashtra",
          districtId: "loc-district-kolhapur-district",
          venueLabel: "Kagal Weekly Market Square",
          startDate: "2026-12-20",
          descriptionEn: "Local terracotta artisans sharing seasonal work.",
          sourceAttribution: "Kagal Gram Panchayat Cultural Notice",
          submittedByPublicName: "Ramesh Kumbhar",
          submittedByPublicContact: "ramesh@kagalpottery.org",
        },
      });
      assert.equal(pubSubResp.status, 201);
      assert.equal(pubSubResp.data.status, "UNDER_REVIEW");
      const subEventId = pubSubResp.data.eventId;

      const pubLookupBeforeApprove = await api(
        `/api/v1/public/calendar/${subEventId}`
      );
      assert.equal(
        pubLookupBeforeApprove.status,
        404,
        "Publicly submitted event in UNDER_REVIEW must not be publicly visible before admin publication"
      );

      // 5. Admin Creation, Private/Restricted Ceremony Blocking, Role Permissions, Editing & Cancellation
      const adminCreateRestricted = await api("/api/v1/admin/events", {
        method: "POST",
        token: tokensByRole.FIELD_RESEARCHER,
        body: {
          titleEn: "Restricted Sacred Shrine Ceremony",
          category: "Performance",
          stateId: "loc-state-maharashtra",
          districtId: "loc-district-kolhapur-district",
          venueLabel: "Private Sacred Grove",
          startDate: "2026-12-22",
          descriptionEn: "Private community ceremony.",
          sourceAttribution: "",
          isPrivateOrRestrictedCeremony: true,
          visitorAccess: "RESTRICTED_OR_PRIVATE",
          organizerPrivateContact: "Secret Custodian Phone 9999900000",
        },
      });
      assert.equal(adminCreateRestricted.status, 201);
      const adminEvtId = adminCreateRestricted.data.event.id;
      assert.equal(
        adminCreateRestricted.data.event.eventPublicationGate.allowed,
        false
      );

      // Researcher cannot publish events (403 FORBIDDEN_ROLE)
      const researcherPubAttempt = await api(
        `/api/v1/admin/events/${adminEvtId}/publish`,
        {
          method: "POST",
          token: tokensByRole.FIELD_RESEARCHER,
        }
      );
      assert.equal(researcherPubAttempt.status, 403);
      assert.equal(researcherPubAttempt.data.code, "FORBIDDEN_ROLE");

      // Approver attempting to publish restricted ceremony without source is blocked (403 EVENT_PUBLICATION_BLOCKED)
      const blockedPubAttempt = await api(
        `/api/v1/admin/events/${adminEvtId}/publish`,
        {
          method: "POST",
          token: tokensByRole.PRACTITIONER_APPROVER,
        }
      );
      assert.equal(blockedPubAttempt.status, 403);
      assert.equal(blockedPubAttempt.data.code, "EVENT_PUBLICATION_BLOCKED");
      assert.ok(blockedPubAttempt.data.reasons.length >= 2);

      // Edit event to public-safe symposium with HIDDEN location granularity and documented source
      const editEvtResp = await api(`/api/v1/admin/events/${adminEvtId}`, {
        method: "PATCH",
        token: tokensByRole.FIELD_RESEARCHER,
        body: {
          titleEn: "Karveer Regional Folklore & Oral History Symposium",
          isPrivateOrRestrictedCeremony: false,
          visitorAccess: "OPEN_PUBLIC",
          locationGranularity: "HIDDEN",
          sourceAttribution: "Kolhapur University Folklore Department Notice",
          sourceUrl: "https://cultural.maharashtra.gov.in/",
        },
      });
      assert.equal(editEvtResp.status, 200);
      assert.equal(editEvtResp.data.event.eventPublicationGate.allowed, true);

      // Publish via authorized role
      const publishEvtOk = await api(
        `/api/v1/admin/events/${adminEvtId}/publish`,
        {
          method: "POST",
          token: tokensByRole.FOLKLORE_REVIEWER,
        }
      );
      assert.equal(publishEvtOk.status, 200);
      assert.equal(publishEvtOk.data.event.status, "PUBLISHED");

      // Verify HIDDEN locationGranularity masks publicCenter to null
      const pubHiddenCheck = await api(`/api/v1/public/calendar/${adminEvtId}`);
      assert.equal(pubHiddenCheck.status, 200);
      assert.equal(pubHiddenCheck.data.event.publicCenter, null);
      assert.ok(
        !JSON.stringify(pubHiddenCheck.data).includes("9999900000"),
        "Private organizer phone must never be exposed"
      );

      // Mark event as CANCELLED and verify cancellation notice & filter
      const cancelEvtResp = await api(
        `/api/v1/admin/events/${adminEvtId}/status`,
        {
          method: "POST",
          token: tokensByRole.PRACTITIONER_APPROVER,
          body: {
            status: "PUBLISHED",
            scheduleStatus: "CANCELLED",
            cancellationReason:
              "Symposium postponed due to auditorium renovation.",
          },
        }
      );
      assert.equal(cancelEvtResp.status, 200);
      assert.equal(cancelEvtResp.data.event.scheduleStatus, "CANCELLED");

      const cancelledPublicView = await api(
        `/api/v1/public/calendar/${adminEvtId}`
      );
      assert.equal(cancelledPublicView.status, 200);
      assert.equal(cancelledPublicView.data.event.scheduleStatus, "CANCELLED");
      assert.equal(
        cancelledPublicView.data.event.cancellationReason,
        "Symposium postponed due to auditorium renovation."
      );

      const excludeCancelledList = await api(
        "/api/v1/public/calendar?includeCancelled=false"
      );
      assert.ok(
        !excludeCancelledList.data.events.some((e: any) => e.id === adminEvtId),
        "includeCancelled=false must exclude cancelled events"
      );

      // Unpublish event and verify 404 on public calendar
      const unpubResp = await api(
        `/api/v1/admin/events/${adminEvtId}/status`,
        {
          method: "POST",
          token: tokensByRole.PRACTITIONER_APPROVER,
          body: { status: "UNPUBLISHED" },
        }
      );
      assert.equal(unpubResp.status, 200);
      assert.equal(
        (await api(`/api/v1/public/calendar/${adminEvtId}`)).status,
        404
      );
    }
  );

  await t.test(
    "12. Culture-Based Trip Planner End-to-End Verification: Itinerary Generation, Safeguard Exclusions, Date Certainty, Reordering/Saving & Persistence",
    async () => {
      // 1. Generate a 3-day Kolhapur District itinerary starting 2026-11-14
      const genResp = await api("/api/v1/public/trip-planner/generate", {
        method: "POST",
        body: {
          title: "Kolhapur Craft & Heritage 3-Day Plan",
          startDate: "2026-11-14",
          durationDays: 3,
          stateId: "loc-state-maharashtra",
          districtId: "loc-district-kolhapur-district",
          confirmedOnly: false,
        },
      });
      assert.equal(genResp.status, 200);
      const plan = genResp.data.plan;
      assert.equal(plan.days.length, 3);
      assert.equal(plan.days[0].isoDate, "2026-11-14");
      assert.equal(plan.days[1].isoDate, "2026-11-15");
      assert.equal(plan.days[2].isoDate, "2026-11-16");

      // Verify Day 1 includes the confirmed Kolhapuri Chappal workshop with source, verification date, etiquette & links
      const day1Chappal = plan.days[0].items.find(
        (it: any) => it.eventId === "evt-kolhapur-chappal-workshop-2026"
      );
      assert.ok(
        day1Chappal,
        "Day 1 (2026-11-14) must include the confirmed Kolhapuri Chappal workshop"
      );
      assert.equal(day1Chappal.dateCertainty, "CONFIRMED_DATE");
      assert.equal(day1Chappal.culturalRecordSlug, "kolhapuri-chappal-demo");
      assert.ok(day1Chappal.sourceAttribution.includes("GI No. 169"));
      assert.ok(day1Chappal.lastVerifiedAt);
      assert.ok(day1Chappal.etiquetteNotes.length > 10);

      // Verify practice experience items are clearly marked FLEXIBLE_PRACTICE_VISIT (never confirmed bookings)
      const practiceItems = plan.days
        .flatMap((d: any) => d.items)
        .filter((it: any) => it.itemType === "PRACTICE_EXPERIENCE");
      assert.ok(
        practiceItems.length >= 1,
        "Suggested itinerary should include regional cultural practice context items"
      );
      for (const pItem of practiceItems) {
        assert.equal(pItem.dateCertainty, "FLEXIBLE_PRACTICE_VISIT");
        assert.equal(
          pItem.registrationRequirement,
          "MODERATED_ENQUIRY_REQUIRED"
        );
      }

      // 2. Verify Tourist & Community Safeguard Exclusions:
      // Gondhal (LOCAL_COMMUNITY_ONLY) and Panhala (ACCESS_NOT_ESTABLISHED) must NOT be in itinerary items or candidates
      const allScheduledAndCandidates = [
        ...plan.days.flatMap((d: any) => d.items),
        ...plan.availableCandidates,
      ];
      assert.ok(
        !allScheduledAndCandidates.some(
          (it: any) =>
            it.eventId === "evt-kolhapur-gondhal-annual-tradition" ||
            it.eventId === "evt-panhala-oral-history-walk-2026"
        ),
        "LOCAL_COMMUNITY_ONLY and ACCESS_NOT_ESTABLISHED events must never be placed on tourist itineraries"
      );
      assert.ok(
        plan.excludedSafeguardSummary.some((ex: any) =>
          ex.titleEn.includes("Gondhal")
        ),
        "Excluded safeguard summary must transparently explain why Gondhal was excluded"
      );
      assert.ok(
        plan.excludedSafeguardSummary.some((ex: any) =>
          ex.titleEn.includes("Panhala")
        ),
        "Excluded safeguard summary must transparently explain why Panhala was excluded"
      );
      assert.ok(
        plan.disclaimer.includes("NOT automatically confirmed or booked"),
        "Plan must include honest transport and booking disclaimer"
      );

      // 3. Test confirmedOnly=true filter excludes flexible practice visits and provisional events
      const confirmedOnlyResp = await api(
        "/api/v1/public/trip-planner/generate",
        {
          method: "POST",
          body: {
            startDate: "2026-11-14",
            durationDays: 2,
            stateId: "loc-state-maharashtra",
            districtId: "loc-district-kolhapur-district",
            confirmedOnly: true,
          },
        }
      );
      assert.equal(confirmedOnlyResp.status, 200);
      const confirmedPlanItems = confirmedOnlyResp.data.plan.days.flatMap(
        (d: any) => d.items
      );
      assert.ok(confirmedPlanItems.length >= 1);
      assert.ok(
        confirmedPlanItems.every(
          (it: any) => it.dateCertainty === "CONFIRMED_DATE"
        )
      );

      // 4. Test saving, reordering/removing items, updating, and reloading a Trip Plan
      const saveResp = await api("/api/v1/public/trip-plans", {
        method: "POST",
        body: plan,
      });
      assert.equal(saveResp.status, 201);
      const savedPlanId = saveResp.data.plan.id;

      // Reorder Day 1 items (reverse order) and add a visitor note, then PUT update
      const modifiedDays = structuredClone(saveResp.data.plan.days);
      modifiedDays[0].items.reverse();
      if (modifiedDays[0].items[0]) {
        modifiedDays[0].items[0].visitorNotes =
          "Reconfirm morning hours with organizer before travel.";
      }

      const updateResp = await api(`/api/v1/public/trip-plans/${savedPlanId}`, {
        method: "PUT",
        body: {
          title: "Updated Kolhapur Cultural Plan",
          days: modifiedDays,
        },
      });
      assert.equal(updateResp.status, 200);
      assert.equal(updateResp.data.plan.title, "Updated Kolhapur Cultural Plan");

      const reloadResp = await api(`/api/v1/public/trip-plans/${savedPlanId}`);
      assert.equal(reloadResp.status, 200);
      assert.equal(reloadResp.data.plan.title, "Updated Kolhapur Cultural Plan");
      assert.equal(
        reloadResp.data.plan.days[0].items[0].visitorNotes,
        "Reconfirm morning hours with organizer before travel."
      );
    }
  );

  await t.test(
    "13. Canonical Schema & Forward-Only Migration Verification: All 4 SQL Migrations, taluka_id/source_attribution Columns & Legacy DB Upgrade",
    async () => {
      for (const migFile of [
        "0001_initial_schema.sql",
        "0002_geography_events_enquiries.sql",
        "0003_cultural_calendar.sql",
        "0004_trip_planner.sql",
        "0005_traditions_sources_media.sql",
        "0006_demo_ecosystem_marketplace.sql",
      ]) {
        const resolved = resolveMigrationSqlPath(migFile);
        assert.ok(
          fs.existsSync(resolved),
          `Migration file ${migFile} must exist at ${resolved}`
        );
      }

      const sql0001 = fs.readFileSync(
        resolveMigrationSqlPath("0001_initial_schema.sql"),
        "utf-8"
      );
      assert.ok(
        sql0001.includes("taluka_id TEXT"),
        "0001_initial_schema.sql must define taluka_id on cultural_records"
      );
      assert.ok(
        sql0001.includes("source_attribution TEXT"),
        "0001_initial_schema.sql must define source_attribution on cultural_records"
      );
      assert.ok(
        sql0001.includes("'CITY_TOWN'"),
        "0001_initial_schema.sql must include CITY_TOWN in rights_passports location_granularity CHECK"
      );

      // Verify mock adapter forward-migration adds missing columns when upgrading an older v1 table
      const executedSql: string[] = [];
      const mockAdapter = {
        driverName: "node:sqlite" as const,
        dbPath: "/tmp/nonexistent-legacy-upgrade.sqlite",
        exec(sql: string) {
          executedSql.push(sql);
        },
        prepare(sql: string) {
          return {
            run() {
              return {};
            },
            get() {
              if (sql.includes("sqlite_master")) {
                return {
                  sql: "CREATE TABLE rights_passports (location_granularity TEXT CHECK (location_granularity IN ('EXACT_WORKSHOP', 'VILLAGE', 'TALUKA', 'DISTRICT', 'HIDDEN')))",
                };
              }
              return null;
            },
            all() {
              if (sql.includes("PRAGMA table_info(cultural_records)")) {
                // Simulate legacy v1 cultural_records lacking taluka_id, source_attribution, source_url
                return [{ name: "id" }, { name: "slug" }, { name: "state_id" }];
              }
              return [];
            },
          };
        },
        transaction<T>(fn: () => T) {
          return fn;
        },
        close() {},
      };

      const applied = applySchemaMigrations(mockAdapter);
      assert.equal(applied.length, 6);
      assert.ok(
        executedSql.some((s) =>
          s.includes("ALTER TABLE cultural_records ADD COLUMN taluka_id")
        ),
        "applySchemaMigrations must add taluka_id to legacy cultural_records table"
      );
      assert.ok(
        executedSql.some((s) =>
          s.includes(
            "ALTER TABLE cultural_records ADD COLUMN source_attribution"
          )
        ),
        "applySchemaMigrations must add source_attribution to legacy cultural_records table"
      );
      assert.ok(
        executedSql.some((s) => s.includes("CREATE TABLE rights_passports_v2")),
        "applySchemaMigrations must upgrade legacy rights_passports CHECK constraint to include CITY_TOWN"
      );
    }
  );

  await t.test(
    "14. Tradition Explorer, Multi-Region Associations, Source Citations, Media Rights Gate & Zero Kolhapuri Chappal Fallbacks",
    async () => {
      // 1. Query public traditions directory
      const dirResp = await api("/api/v1/public/traditions");
      assert.equal(dirResp.status, 200);
      assert.ok(
        dirResp.data.traditions.length >= 16,
        "At least 16 source-backed pan-India traditions must be published"
      );
      assert.ok(
        dirResp.data.facets.categories.length >= 9,
        "All 9 living heritage categories must be represented in Tradition Explorer"
      );
      assert.ok(
        dirResp.data.facets.multiRegionCount >= 5,
        "Multi-region traditions must be represented"
      );

      // 2. Verify selecting a specific tradition returns that exact tradition and never falls back
      const chhauResp = await api("/api/v1/public/traditions/chhau-dance");
      assert.equal(chhauResp.status, 200);
      assert.equal(chhauResp.data.tradition.slug, "chhau-dance");
      assert.equal(chhauResp.data.tradition.nameEn, "Chhau Dance");
      assert.equal(
        chhauResp.data.tradition.places.length,
        3,
        "Chhau Dance must expose all 3 regional associations (Odisha, Jharkhand, West Bengal)"
      );
      const chhauStates = chhauResp.data.tradition.places.map(
        (p: any) => p.stateName
      );
      assert.ok(chhauStates.includes("Odisha"));
      assert.ok(chhauStates.includes("Jharkhand"));
      assert.ok(chhauStates.includes("West Bengal"));

      // Verify Kolhapuri Chappal multi-state GI association (Maharashtra + Karnataka)
      const chappalTradResp = await api(
        "/api/v1/public/traditions/kolhapuri-chappal"
      );
      assert.equal(chappalTradResp.status, 200);
      const chappalStates = chappalTradResp.data.tradition.places.map(
        (p: any) => p.stateName
      );
      assert.ok(chappalStates.includes("Maharashtra"));
      assert.ok(chappalStates.includes("Karnataka"));

      // Verify missing tradition returns 404 (never falls back to Kolhapuri Chappal)
      const missingTrad = await api(
        "/api/v1/public/traditions/non-existent-tradition-xyz"
      );
      assert.equal(missingTrad.status, 404);

      // 3. Verify no unrelated record in /api/v1/public/records uses the Kolhapuri Chappal image
      const allPubRecs = await api("/api/v1/public/records");
      assert.equal(allPubRecs.status, 200);
      const nonChappalWithCraftImg = allPubRecs.data.records.filter(
        (r: any) =>
          r.slug !== "kolhapuri-chappal-demo" &&
          !r.slug.includes("kolhapuri-chappal") &&
          r.heroImageUrl === "/manus-storage/bharat-culturemap-craft_14d51f4e.jpg"
      );
      assert.equal(
        nonChappalWithCraftImg.length,
        0,
        "Unrelated cultural records must never fall back to the Kolhapuri Chappal craft image"
      );

      // 4. Verify search & category/state/language filters
      const danceFilter = await api(
        "/api/v1/public/traditions?traditionCategory=" +
          encodeURIComponent("Classical & Folk Dance")
      );
      assert.equal(danceFilter.status, 200);
      assert.ok(danceFilter.data.traditions.length >= 2);
      assert.ok(
        danceFilter.data.traditions.every(
          (t: any) => t.traditionCategory === "Classical and folk dance"
        )
      );

      const keralaFilter = await api(
        "/api/v1/public/traditions?stateId=loc-state-kerala"
      );
      assert.equal(keralaFilter.status, 200);
      assert.ok(
        keralaFilter.data.traditions.some((t: any) => t.slug === "kathakali")
      );
      assert.ok(
        keralaFilter.data.traditions.some((t: any) => t.slug === "kutiyattam-sanskrit-theatre")
      );

      // 5. Verify Media Publication Gate blocks UNVERIFIED and RESTRICTED media from public endpoints
      const pubMedia = await api("/api/v1/public/media-assets");
      assert.equal(pubMedia.status, 200);
      assert.ok(pubMedia.data.mediaAssets.length >= 18);
      assert.ok(
        !pubMedia.data.mediaAssets.some(
          (m: any) =>
            m.id === "media-unverified-pending-check" ||
            m.id === "media-restricted-sacred-gondhal" ||
            m.rightsStatus === "UNVERIFIED" ||
            m.rightsStatus === "RESTRICTED"
        ),
        "UNVERIFIED and RESTRICTED media assets must never leak to public media API"
      );

      // Verify every public media asset has licenseIdentifier, attributionText, and sourcePageUrl
      for (const m of pubMedia.data.mediaAssets) {
        assert.ok(m.licenseIdentifier && m.licenseIdentifier.length > 0);
        assert.ok(m.attributionText && m.attributionText.length > 0);
        assert.ok(m.sourcePageUrl && m.sourcePageUrl.startsWith("https://"));
      }

      // Attempt to force-publish the UNVERIFIED media asset via Admin API -> must be blocked with 403
      const blockedMediaPub = await api(
        "/api/v1/admin/media-assets/media-unverified-pending-check",
        {
          method: "PATCH",
          token: tokensByRole.SUPER_ADMIN,
          body: { publicationStatus: "PUBLISHED" },
        }
      );
      assert.equal(blockedMediaPub.status, 403);
      assert.equal(blockedMediaPub.data.code, "MEDIA_PUBLICATION_BLOCKED");

      // 6. Verify Admin can create a new Tradition, link a second region, and attach a verified source citation
      const createTradResp = await api("/api/v1/admin/traditions", {
        method: "POST",
        token: tokensByRole.FIELD_RESEARCHER,
        body: {
          nameEn: "Yakshagana",
          nameNative: "ಯಕ್ಷಗಾನ",
          nativeScriptLang: "Kannada",
          traditionCategory: "Folk theatre, puppetry and storytelling",
          legacyCategory: "Performance",
          subcategory: "Traditional Dance-Drama",
          languages: ["Kannada", "Tulu"],
          summary:
            "Traditional dance-drama of coastal and Malnad Karnataka combining music, Yakshagana prosody, costume, and improvised dialogue.",
          evidenceStatus: "OFFICIAL_INSTITUTIONAL",
          places: [
            {
              locationId: "loc-state-karnataka",
              stateId: "loc-state-karnataka",
              relationshipRole: "PRIMARY_PRACTICE_REGION",
              regionalVariantName: "Tenkutittu & Badagutittu styles",
              isPrimary: true,
            },
          ],
        },
      });
      assert.equal(createTradResp.status, 201);
      const newTradId = createTradResp.data.tradition.id;

      const addPlaceResp = await api(
        `/api/v1/admin/traditions/${newTradId}/places`,
        {
          method: "POST",
          token: tokensByRole.FIELD_RESEARCHER,
          body: {
            locationId: "loc-state-kerala",
            stateId: "loc-state-kerala",
            relationshipRole: "HISTORICAL_OR_DISPERSION_REGION",
            regionalVariantName: "Kasaragod Tenkutittu tradition",
            isPrimary: false,
          },
        }
      );
      assert.equal(addPlaceResp.status, 201);

      const addSourceResp = await api("/api/v1/admin/sources", {
        method: "POST",
        token: tokensByRole.FOLKLORE_REVIEWER,
        body: {
          traditionId: newTradId,
          sourceTitle: "Yakshagana — Sangeet Natak Akademi Archival Dossier",
          sourceOrganisation: "Sangeet Natak Akademi, Ministry of Culture",
          sourceUrl: "https://www.sangeetnatak.gov.in/library",
          sourceType: "OFFICIAL_INSTITUTIONAL",
          specificFactsSupported:
            "Supports classification of Tenkutittu and Badagutittu Yakshagana traditions across coastal Karnataka and Kasaragod.",
        },
      });
      assert.equal(addSourceResp.status, 201);

      const yakshaPublic = await api("/api/v1/public/traditions/yakshagana");
      assert.equal(yakshaPublic.status, 200);
      assert.equal(yakshaPublic.data.tradition.places.length, 2);
      assert.equal(yakshaPublic.data.tradition.sources.length, 1);
    }
  );

  await t.test(
    "15. Critical FK Regression & Kolhapur/Pan-India Tradition Restoration Verification",
    async () => {
      // Verify all 7 Kolhapur/Maharashtra traditions + pan-India traditions are present and connected to places
      const requiredSlugs = [
        "kolhapuri-chappal",
        "powada-and-gondhal",
        "mallakhamb",
        "kolhapuri-saaj",
        "hupari-silverwork",
        "kolhapuri-jaggery-and-culinary-heritage",
        "kushti-and-mardani-khel",
        "chhau-dance",
        "kathakali",
        "odissi",
        "bharatanatyam",
        "garba",
        "bihu",
        "madhubani-painting",
        "warli-painting",
        "pattachitra",
        "patan-patola",
      ];
      for (const slug of requiredSlugs) {
        const res = await api(`/api/v1/public/traditions/${slug}`);
        assert.equal(res.status, 200, `Tradition ${slug} must exist and return 200`);
        assert.equal(res.data.tradition.slug, slug);
        assert.ok(
          res.data.tradition.places.length >= 1,
          `Tradition ${slug} must have at least 1 geographic place association`
        );
      }

      // Verify Hupari place detail exposes Hupari Silverwork tradition
      const hupariDetail = await api("/api/v1/public/places/loc-village-hupari");
      assert.equal(hupariDetail.status, 200);
      assert.ok(
        hupariDetail.data.traditions.some((tr: any) => tr.slug === "hupari-silverwork"),
        "Hupari place detail must include Hupari Silverwork in its connected traditions"
      );

      // Verify updating a record with empty-string nullable FK fields ("") does not violate FK constraints
      const emptyFkPatch = await api(`/api/v1/admin/records/${recordId}`, {
        method: "PATCH",
        token: tokensByRole.FIELD_RESEARCHER,
        body: {
          talukaId: "",
          cityTownId: "",
          traditionId: "",
        },
      });
      assert.equal(emptyFkPatch.status, 200);
    }
  );

  await t.test(
    "16. Art-Mart Marketplace, Seller Storefronts, Simulated Checkout, Order History & Cancellation Stock Restoration",
    async () => {
      const catResp = await api("/api/v1/public/art-mart/products");
      assert.equal(catResp.status, 200);
      assert.ok(catResp.data.products.length >= 12);
      assert.ok(catResp.data.sellers.length >= 6);

      const chappalProd = catResp.data.products.find(
        (p: any) => p.id === "prod-kolhapuri-kapashi-chappal-demo"
      );
      assert.ok(chappalProd);
      const initialStock = chappalProd.stockQuantity;

      // Place a simulated order for 2 units
      const orderResp = await api("/api/v1/art-mart/orders", {
        method: "POST",
        body: {
          buyerName: "Test Cultural Patron (Demo)",
          buyerEmail: "buyer.demo@bharat-culturemap.local",
          shippingCity: "Kolhapur",
          shippingState: "Maharashtra",
          shippingAddressLabel: "Demo Test Lane, Kolhapur",
          items: [
            {
              productId: "prod-kolhapuri-kapashi-chappal-demo",
              quantity: 2,
            },
          ],
        },
      });
      assert.equal(orderResp.status, 201);
      const createdOrderId = orderResp.data.order.id;

      // Verify stock was deducted by 2
      const afterOrderDetail = await api(
        "/api/v1/public/art-mart/products/hand-stitched-kapashi-kolhapuri-chappal-demo"
      );
      assert.equal(afterOrderDetail.status, 200);
      assert.equal(afterOrderDetail.data.product.stockQuantity, initialStock - 2);

      // Cancel the simulated order and verify stock is restored automatically
      const cancelOrderResp = await api(
        `/api/v1/art-mart/orders/${createdOrderId}/status`,
        {
          method: "PATCH",
          body: { status: "CANCELLED_DEMO" },
        }
      );
      assert.equal(cancelOrderResp.status, 200);
      assert.equal(cancelOrderResp.data.order.status, "CANCELLED_DEMO");

      const afterCancelDetail = await api(
        "/api/v1/public/art-mart/products/hand-stitched-kapashi-kolhapuri-chappal-demo"
      );
      assert.equal(afterCancelDetail.data.product.stockQuantity, initialStock);
    }
  );

  await t.test(
    "17. Practitioners Directory, Workshops, Role Editing & Industry-to-Art 6-Step Workflow + Government Resources",
    async () => {
      const practList = await api("/api/v1/public/practitioners");
      assert.equal(practList.status, 200);
      assert.ok(practList.data.practitioners.length >= 10);

      const powadaPract = await api(
        "/api/v1/public/practitioners/shahurao-sawant-powada-gondhal-demo"
      );
      assert.equal(powadaPract.status, 200);
      assert.equal(
        powadaPract.data.practitioner.id,
        "pract-kolhapur-powada-demo"
      );

      const editPract = await api(
        "/api/v1/practitioners/pract-kolhapur-powada-demo",
        {
          method: "PATCH",
          body: {
            availabilityStatus: "OPEN_FOR_WORKSHOPS",
          },
        }
      );
      assert.equal(editPract.status, 200);
      assert.equal(
        editPract.data.practitioner.availabilityStatus,
        "OPEN_FOR_WORKSHOPS"
      );

      // Industry-to-Art 6-step workflow test
      const createMat = await api("/api/v1/industry-materials", {
        method: "POST",
        body: {
          title: "Clean Brass Temple Bell Casting Sprue Offcuts (Demo)",
          industryOrgLabel: "Kolhapur Foundry Cluster (Demo)",
          materialCategory: "Non-Ferrous Metal Offcuts",
          quantityAvailableLabel: "30 kg",
          locationCity: "Kolhapur",
          locationState: "Maharashtra",
        },
      });
      assert.equal(createMat.status, 201);
      assert.equal(
        createMat.data.material.adminReviewStatus,
        "PENDING_ADMIN_REVIEW"
      );
      const matId = createMat.data.material.id;

      const approveMat = await api(
        `/api/v1/industry-materials/${matId}/status`,
        {
          method: "PATCH",
          body: {
            adminReviewStatus: "APPROVED",
            availabilityStatus: "AVAILABLE",
          },
        }
      );
      assert.equal(approveMat.status, 200);
      assert.equal(approveMat.data.material.adminReviewStatus, "APPROVED");

      const createReq = await api("/api/v1/industry-requests", {
        method: "POST",
        body: {
          materialId: matId,
          artisanName: "Smt. Anandibai Potdar (Demo Artisan)",
          traditionTitle: "Kolhapuri Saaj",
          requestedQuantityLabel: "10 kg",
          intendedCraftUse: "Traditional bronze die-stamping blocks.",
        },
      });
      assert.equal(createReq.status, 201);
      const reqId = createReq.data.request.id;

      const advanceReq = await api(
        `/api/v1/industry-requests/${reqId}/status`,
        {
          method: "PATCH",
          body: {
            collaborationStatus: "CRAFT_PRODUCT_LISTED_ON_ART_MART",
            adminReviewerNote: "Linked to Kolhapuri Saaj product on Art-Mart.",
            linkedArtMartProductId: "prod-kolhapuri-saaj-necklace-demo",
          },
        }
      );
      assert.equal(advanceReq.status, 200);
      assert.equal(
        advanceReq.data.request.collaborationStatus,
        "CRAFT_PRODUCT_LISTED_ON_ART_MART"
      );
      assert.equal(
        advanceReq.data.request.linkedArtMartProductSlug,
        "traditional-21-pendant-kolhapuri-saaj-demo"
      );

      // Government & Ecosystem Resources
      const ecoResp = await api("/api/v1/public/ecosystem-resources");
      assert.equal(ecoResp.status, 200);
      assert.ok(ecoResp.data.resources.length >= 8);
    }
  );

  await t.test(
    "18. Canonical Tradition Route & Backward-Compatible Alias Regression (/traditions/powada-and-gondhal)",
    async () => {
      const canonicalResp = await api("/api/v1/public/traditions/powada-and-gondhal");
      assert.equal(canonicalResp.status, 200);
      assert.equal(canonicalResp.data.tradition.id, "trad-gondhal-powada-maharashtra");
      assert.equal(canonicalResp.data.tradition.slug, "powada-and-gondhal");
      assert.ok(
        canonicalResp.data.tradition.nameEn.includes("Powada") &&
          canonicalResp.data.tradition.nameEn.includes("Gondhal"),
        "Must return Powada & Gondhal tradition detail"
      );
      assert.ok(
        canonicalResp.data.tradition.places.length >= 1,
        "Powada & Gondhal must include geographic place associations"
      );

      // Verify backward-compatible legacy slug alias also resolves to the canonical tradition
      const aliasResp = await api("/api/v1/public/traditions/powada-and-gondhal-oral-balladry");
      assert.equal(aliasResp.status, 200);
      assert.equal(aliasResp.data.tradition.id, "trad-gondhal-powada-maharashtra");
      assert.equal(aliasResp.data.tradition.slug, "powada-and-gondhal");
    }
  );

  await t.test(
    "19. Least-Privileged Account Registration, Persona/Role Separation, Profile Editing & Production Auth Hardening",
    async () => {
      // 1. Attempting to register with a privileged staff role (e.g. SUPER_ADMIN or LANGUAGE_REVIEWER) must be rejected (403)
      const privAttempt = await api("/api/v1/auth/register", {
        method: "POST",
        body: {
          email: "attacker-superadmin@example.org",
          fullName: "Privilege Escalation Attempt",
          password: "StrongPassword#2026",
          role: "SUPER_ADMIN",
          accountType: "SUPER_ADMIN",
        },
      });
      assert.equal(
        privAttempt.status,
        403,
        "Public registration must reject staff role escalation attempts with 403"
      );

      // 2. Weak password must be rejected (400)
      const weakPass = await api("/api/v1/auth/register", {
        method: "POST",
        body: {
          email: "weakpass@example.org",
          fullName: "Weak Password User",
          password: "123",
          accountType: "BUYER",
        },
      });
      assert.equal(weakPass.status, 400, "Weak password must fail validation");

      // 3. Registering as BUYER, ARTISAN_SELLER, PRACTITIONER, and HERCRAFT_ENTREPRENEUR must ALWAYS assign role = PUBLIC_USER
      const personas = [
        { persona: "BUYER", email: "buyer.public@example.org", fullName: "Public Buyer" },
        { persona: "ARTISAN_SELLER", email: "seller.public@example.org", fullName: "Public Seller" },
        { persona: "PRACTITIONER", email: "practitioner.public@example.org", fullName: "Public Practitioner" },
        { persona: "HERCRAFT_ENTREPRENEUR", email: "hercraft.public@example.org", fullName: "Public HerCraft" },
      ] as const;

      let buyerToken = "";
      let buyerUserId = "";

      for (const item of personas) {
        const reg = await api("/api/v1/auth/register", {
          method: "POST",
          body: {
            email: item.email,
            fullName: item.fullName,
            password: "SecurePassword#2026",
            accountType: item.persona,
            locationLabel: "Kolhapur, Maharashtra",
          },
        });
        assert.equal(reg.status, 201, `Registration for ${item.persona} must succeed`);
        assert.equal(
          reg.data.user.role,
          "PUBLIC_USER",
          `Public ${item.persona} must receive least-privileged role PUBLIC_USER, never a staff role`
        );
        assert.equal(
          reg.data.user.accountType,
          item.persona,
          `Public ${item.persona} must retain their selected accountType persona`
        );

        if (item.persona === "BUYER") {
          buyerToken = reg.data.token;
          buyerUserId = reg.data.user.id;
        }

        // Verify none of these public personas can access staff /api/v1/admin/* endpoints
        const adminCheck = await api("/api/v1/admin/traditions", {
          token: reg.data.token,
        });
        assert.equal(
          adminCheck.status,
          403,
          `Public ${item.persona} (PUBLIC_USER) must be blocked from /api/v1/admin/*`
        );
      }

      // 4. Verify profile editing works for authenticated user & blocks self-role escalation
      const selfEscalate = await api("/api/v1/auth/profile", {
        method: "PATCH",
        token: buyerToken,
        body: {
          fullName: "Escalated Buyer",
          role: "SUPER_ADMIN",
        },
      });
      assert.equal(
        selfEscalate.status,
        403,
        "Profile update must block any attempt to modify staff authorization roles"
      );

      const profileUpdate = await api("/api/v1/auth/profile", {
        method: "PATCH",
        token: buyerToken,
        body: {
          fullName: "Updated Public Buyer",
          accountType: "HERCRAFT_ENTREPRENEUR",
          organisationOrGuild: "Karveer Women Craft Circle",
          locationLabel: "Kolhapur, Maharashtra",
          bio: "Coordinating local craft exhibitions in Kolhapur.",
        },
      });
      assert.equal(profileUpdate.status, 200);
      assert.equal(profileUpdate.data.user.fullName, "Updated Public Buyer");
      assert.equal(profileUpdate.data.user.role, "PUBLIC_USER");
      assert.equal(profileUpdate.data.user.accountType, "HERCRAFT_ENTREPRENEUR");
      assert.equal(profileUpdate.data.user.organisationOrGuild, "Karveer Women Craft Circle");

      // 5. Verify only SUPER_ADMIN can upgrade/assign staff roles via PATCH /api/v1/admin/users/:id
      const nonAdminUpgrade = await api(`/api/v1/admin/users/${buyerUserId}`, {
        method: "PATCH",
        token: buyerToken,
        body: { role: "LANGUAGE_REVIEWER" },
      });
      assert.equal(nonAdminUpgrade.status, 403);

      const superAdminUpgrade = await api(`/api/v1/admin/users/${buyerUserId}`, {
        method: "PATCH",
        token: superAdminToken,
        body: { role: "LANGUAGE_REVIEWER" },
      });
      assert.equal(superAdminUpgrade.status, 200);
      assert.equal(superAdminUpgrade.data.user.role, "LANGUAGE_REVIEWER");

      // Downgrade back to PUBLIC_USER
      const superAdminDowngrade = await api(`/api/v1/admin/users/${buyerUserId}`, {
        method: "PATCH",
        token: superAdminToken,
        body: { role: "PUBLIC_USER" },
      });
      assert.equal(superAdminDowngrade.status, 200);
      assert.equal(superAdminDowngrade.data.user.role, "PUBLIC_USER");

      // 6. Verify production mode disables demo accounts by default & enforces SESSION_SECRET
      const prevNodeEnv = process.env.NODE_ENV;
      const prevDemoFlag = process.env.ENABLE_DEMO_ACCOUNTS;
      const prevSecret = process.env.SESSION_SECRET;
      try {
        process.env.NODE_ENV = "production";
        delete process.env.ENABLE_DEMO_ACCOUNTS;
        process.env.SESSION_SECRET = "prod-secret-at-least-32-chars-long-998877665544332211";

        const prodDemoList = await api("/api/v1/auth/demo-accounts");
        assert.equal(prodDemoList.status, 200);
        assert.equal(prodDemoList.data.demoModeEnabled, false);
        assert.equal(
          prodDemoList.data.demoAccounts.length,
          0,
          "Production mode must not expose public demo accounts when ENABLE_DEMO_ACCOUNTS is unset"
        );

        const prodDemoLogin = await api("/api/v1/auth/demo-login", {
          method: "POST",
          body: { email: "admin@bharatculturemap.in" },
        });
        assert.equal(
          prodDemoLogin.status,
          403,
          "One-click demo login must return 403 in production when demo mode is disabled"
        );
      } finally {
        process.env.NODE_ENV = prevNodeEnv;
        if (prevDemoFlag === undefined) {
          delete process.env.ENABLE_DEMO_ACCOUNTS;
        } else {
          process.env.ENABLE_DEMO_ACCOUNTS = prevDemoFlag;
        }
        if (prevSecret === undefined) {
          delete process.env.SESSION_SECRET;
        } else {
          process.env.SESSION_SECRET = prevSecret;
        }
      }
    }
  );

  await t.test(
    "20. Dedicated HerCraft Module (/api/v1/public/hercraft, Detail, Submission & Admin Review Workflow)",
    async () => {
      // 1. Public directory listing
      const dirResp = await api("/api/v1/public/hercraft");
      assert.equal(dirResp.status, 200);
      assert.ok(
        dirResp.data.enterprises.length >= 7,
        "Expected at least 7 published/approved fictional DEMO_SAMPLE HerCraft enterprises"
      );
      assert.ok(
        dirResp.data.opportunities.length >= 6,
        "Expected at least 6 sourced government schemes and opportunities"
      );
      for (const ent of dirResp.data.enterprises) {
        assert.equal(
          ent.recordOrigin,
          "DEMO_SAMPLE",
          "All seeded HerCraft profiles must be explicitly labelled DEMO_SAMPLE"
        );
        assert.ok(
          ent.demoDisclaimer && ent.demoDisclaimer.includes("DEMONSTRATION"),
          "Each HerCraft profile must carry an explicit fictional demo disclaimer"
        );
      }

      // 2. State & District filtering (Kolhapur / Hupari / Karveer)
      const kolhapurResp = await api(
        "/api/v1/public/hercraft?stateName=Maharashtra&districtName=Kolhapur"
      );
      assert.equal(kolhapurResp.status, 200);
      assert.ok(
        kolhapurResp.data.enterprises.length >= 3,
        "Expected Kolhapur HerCraft enterprises (Karveer Veni, Hupari Chandi, Panchganga Collective)"
      );

      // 3. Enterprise detail page with linked Art-Mart products & workshops
      const detailResp = await api(
        "/api/v1/public/hercraft/karvir-bhagini-kolhapuri-veni-leather-shg-demo"
      );
      assert.equal(detailResp.status, 200);
      assert.equal(
        detailResp.data.enterprise.enterpriseName,
        "Karvir Bhagini Kolhapuri Veni & Leather Craft SHG (Demo Enterprise)"
      );
      assert.ok(
        detailResp.data.relatedProducts.length >= 1,
        "Expected linked Art-Mart products for Karvir Bhagini SHG"
      );
      assert.ok(
        detailResp.data.enterprise.trainingAndWorkshops.length >= 1,
        "Expected training/workshop schedule on HerCraft enterprise detail"
      );

      // 4. Public user submission enters PENDING_REVIEW / DRAFT
      const publicReg = await api("/api/v1/auth/register", {
        method: "POST",
        body: {
          email: "shg.founder@example.org",
          fullName: "Test SHG Founder",
          password: "SecurePassword#2026",
          accountType: "HERCRAFT_ENTREPRENEUR",
        },
      });
      assert.equal(publicReg.status, 201);
      const founderToken = publicReg.data.token;

      const submitEnt = await api("/api/v1/hercraft/enterprises", {
        method: "POST",
        token: founderToken,
        body: {
          enterpriseName: "Rankala Handloom Women Collective (Fictional Demo Submission)",
          enterpriseType: "WOMEN_SHG",
          leaderOrCollectiveLabel: "Illustrative 15-Weaver Women Collective (Demo Sample)",
          womenArtisansCount: 15,
          stateName: "Maharashtra",
          districtName: "Kolhapur District",
          cityName: "Kolhapur",
          placeId: "loc-taluka-karveer",
          craftCategory: "Handloom & Textile Heritage",
          traditionSlug: "kolhapuri-saaj",
          traditionTitle: "Kolhapuri Saaj",
          shortSummary: "Women-led handloom collective in Karveer Taluka producing ceremonial cotton borders.",
          storyNarrative: "Fictional demonstration submission for testing HerCraft moderation.",
        },
      });
      assert.equal(submitEnt.status, 201);
      assert.equal(submitEnt.data.enterprise.approvalStatus, "PENDING_REVIEW");
      assert.equal(submitEnt.data.enterprise.publicationStatus, "DRAFT");
      assert.equal(submitEnt.data.enterprise.recordOrigin, "DEMO_SAMPLE");
      const createdId = submitEnt.data.enterprise.id;

      // 5. Public founder cannot self-approve their submission (403)
      const selfApprove = await api(`/api/v1/hercraft/enterprises/${createdId}`, {
        method: "PATCH",
        token: founderToken,
        body: { approvalStatus: "APPROVED", publicationStatus: "PUBLISHED" },
      });
      assert.equal(selfApprove.status, 403);

      // 6. Staff reviewer can approve and publish the HerCraft enterprise
      const adminApprove = await api(`/api/v1/hercraft/enterprises/${createdId}`, {
        method: "PATCH",
        token: superAdminToken,
        body: {
          approvalStatus: "APPROVED",
          publicationStatus: "PUBLISHED",
        },
      });
      assert.equal(adminApprove.status, 200);
      assert.equal(adminApprove.data.enterprise.approvalStatus, "APPROVED");
      assert.equal(adminApprove.data.enterprise.publicationStatus, "PUBLISHED");
    }
  );
});
