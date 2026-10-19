import type { IncomingMessage, ServerResponse } from "node:http";
import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  STAFF_ROLES,
  USER_ROLES,
  UserRole,
} from "../shared/const";
import type { UserAccount } from "../shared/contracts";
import {
  CultureMapRepository,
  getRepository,
} from "./db/repository";
import {
  buildSessionCookieHeader,
  checkAuthRateLimit,
  extractTokenFromRequest,
  isDemoModeEnabled,
  RBAC,
  sanitizePublicPersona,
  signSessionToken,
  validatePasswordStrength,
  verifyPassword,
  verifySessionToken,
} from "./modules/auth";
import {
  ConsentGateError,
  evaluatePublicationGate,
} from "./modules/consent-gate";
import { handleImageUpload } from "./routes/uploads.routes";

function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
  extraHeaders?: Record<string, string>
): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(body);
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const maybePreparsed = (req as any).body;
  if (maybePreparsed && typeof maybePreparsed === "object") {
    return maybePreparsed;
  }
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk.toString("utf8");
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function getAuthenticatedUser(
  req: IncomingMessage,
  repo: CultureMapRepository
): UserAccount | null {
  const token = extractTokenFromRequest({
    authorization: req.headers.authorization,
    cookie: req.headers.cookie,
  });
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const user = repo.findUserById(payload.sub);
  if (!user || !user.isActive) return null;
  return user;
}

export function createApiHandler(
  customRepo?: CultureMapRepository
): (req: IncomingMessage, res: ServerResponse, next?: () => void) => Promise<void> {
  const repo = customRepo || getRepository();

  return async (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
    const rawUrl = req.url || "/";
    if (!rawUrl.startsWith("/api/v1/")) {
      if (next) {
        next();
        return;
      }
      sendJson(res, 404, { error: "Not Found" });
      return;
    }

    const parsedUrl = new URL(rawUrl, "http://localhost");
    const pathname = parsedUrl.pathname;
    const method = (req.method || "GET").toUpperCase();

    try {
      // =======================================================================
      // 1. AUTH & BOOTSTRAP ROUTES
      // =======================================================================
      if (pathname === "/api/v1/auth/status" && method === "GET") {
        const user = getAuthenticatedUser(req, repo);
        sendJson(res, 200, {
          needsBootstrap: repo.countUsers() === 0,
          user,
          driver: repo.driverName,
          demoModeEnabled: isDemoModeEnabled(),
        });
        return;
      }

      if (pathname === "/api/v1/auth/me" && method === "GET") {
        const user = getAuthenticatedUser(req, repo);
        if (!user) {
          sendJson(res, 401, { error: "Authentication required." });
          return;
        }
        sendJson(res, 200, { user });
        return;
      }

      if (pathname === "/api/v1/auth/profile" && method === "PATCH") {
        const user = getAuthenticatedUser(req, repo);
        if (!user) {
          sendJson(res, 401, { error: "Authentication required." });
          return;
        }
        const body = await readJsonBody(req);
        if (body.role !== undefined && body.role !== user.role) {
          sendJson(res, 403, {
            error:
              "Self-service profile updates cannot assign or escalate authorization roles.",
            code: "ROLE_ESCALATION_FORBIDDEN",
          });
          return;
        }
        const updated = repo.updateUserProfile(user.id, {
          fullName: body.fullName ?? body.name,
          bio: body.bio,
          phone: body.phone,
          locationLabel: body.locationLabel,
          organisationOrGuild: body.organisationOrGuild,
          preferredLanguage: body.preferredLanguage,
          accountType: body.accountType,
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        });
        sendJson(res, 200, { user: updated });
        return;
      }

      if (pathname === "/api/v1/auth/bootstrap" && method === "POST") {
        if (repo.countUsers() > 0) {
          sendJson(res, 403, {
            error:
              "Initial Super Admin bootstrap has already been completed. Sign in with an existing account.",
          });
          return;
        }
        const body = await readJsonBody(req);
        const email = String(body.email || "").trim();
        const password = String(body.password || "");
        const fullName = String(body.fullName || "Project Lead").trim();

        const strength = validatePasswordStrength(password);
        if (!email || !email.includes("@") || !strength.valid) {
          sendJson(res, 400, {
            error:
              strength.reason ||
              "Valid email and a strong password of at least 8 characters are required.",
          });
          return;
        }

        const user = repo.createUser({
          email,
          password,
          fullName,
          role: "SUPER_ADMIN",
          accountType: "SUPER_ADMIN",
        });
        const token = signSessionToken(user);
        sendJson(
          res,
          201,
          { user, token },
          {
            "Set-Cookie": buildSessionCookieHeader(token, ONE_YEAR_MS, req),
          }
        );
        return;
      }

      if (pathname === "/api/v1/auth/demo-accounts" && method === "GET") {
        if (!isDemoModeEnabled()) {
          sendJson(res, 200, {
            demoAccounts: [],
            demoModeEnabled: false,
          });
          return;
        }
        sendJson(res, 200, {
          demoAccounts: repo.listDemoAccounts(),
          demoModeEnabled: true,
        });
        return;
      }

      if (pathname === "/api/v1/auth/demo-login" && method === "POST") {
        if (!isDemoModeEnabled()) {
          sendJson(res, 403, {
            error:
              "Demo persona quick-login is disabled in production environments.",
            code: "DEMO_MODE_DISABLED",
          });
          return;
        }
        const rate = checkAuthRateLimit(req, "demo-login");
        if (!rate.allowed) {
          sendJson(
            res,
            429,
            {
              error: "Too many authentication attempts. Please wait before retrying.",
              code: "RATE_LIMIT_EXCEEDED",
            },
            {
              "Retry-After": String(rate.retryAfterSeconds),
              "X-RateLimit-Remaining": "0",
            }
          );
          return;
        }
        const body = await readJsonBody(req);
        const email = String(body.email || "").trim();
        if (!email) {
          sendJson(res, 400, { error: "Demo account email is required." });
          return;
        }
        const user = repo.loginOrProvisionDemoAccount(email);
        const token = signSessionToken(user);
        sendJson(
          res,
          200,
          { user, token },
          {
            "Set-Cookie": buildSessionCookieHeader(token, ONE_YEAR_MS, req),
            "X-RateLimit-Remaining": String(rate.remaining),
          }
        );
        return;
      }

      if (pathname === "/api/v1/auth/register" && method === "POST") {
        const rate = checkAuthRateLimit(req, "register");
        if (!rate.allowed) {
          sendJson(
            res,
            429,
            {
              error: "Too many registration attempts. Please try again later.",
              code: "RATE_LIMIT_EXCEEDED",
            },
            {
              "Retry-After": String(rate.retryAfterSeconds),
              "X-RateLimit-Remaining": "0",
            }
          );
          return;
        }
        const body = await readJsonBody(req);
        const email = String(body.email || "").trim();
        const password = String(body.password || "");
        const fullName = String(body.fullName || body.name || "").trim();
        const rawRequestedRole = String(body.role || "").trim().toUpperCase();
        const rawRequestedPersona = String(body.accountType || "BUYER")
          .trim()
          .toUpperCase();

        if (
          (rawRequestedRole &&
            rawRequestedRole !== "PUBLIC_USER" &&
            (STAFF_ROLES as readonly string[]).includes(rawRequestedRole)) ||
          rawRequestedPersona === "SUPER_ADMIN" ||
          rawRequestedPersona === "FIELD_RESEARCHER"
        ) {
          sendJson(res, 403, {
            error:
              "Public registration cannot create SUPER_ADMIN or staff governance accounts. Administrative permissions can only be granted by a Super Administrator.",
            code: "PRIVILEGED_REGISTRATION_FORBIDDEN",
          });
          return;
        }

        const strength = validatePasswordStrength(password);
        if (!email || !email.includes("@") || !fullName || !strength.valid) {
          sendJson(res, 400, {
            error:
              strength.reason ||
              "Full name, a valid email address, and a strong password (min 8 chars with letters and numbers/symbols) are required.",
          });
          return;
        }

        const safePersona = sanitizePublicPersona(rawRequestedPersona);

        // Least-privileged design: all public registrations receive PUBLIC_USER role
        const user = repo.createUser({
          email,
          password,
          fullName,
          role: "PUBLIC_USER",
          accountType: safePersona,
          bio: body.bio ? String(body.bio) : "",
          phone: body.phone ? String(body.phone) : "",
          locationLabel: body.locationLabel ? String(body.locationLabel) : "",
          organisationOrGuild: body.organisationOrGuild
            ? String(body.organisationOrGuild)
            : "",
          preferredLanguage: body.preferredLanguage
            ? String(body.preferredLanguage)
            : "English",
          linkedPractitionerId: null,
          linkedSellerId: null,
          linkedHerCraftId: null,
        });
        const token = signSessionToken(user);
        sendJson(
          res,
          201,
          { user, token },
          {
            "Set-Cookie": buildSessionCookieHeader(token, ONE_YEAR_MS, req),
            "X-RateLimit-Remaining": String(rate.remaining),
          }
        );
        return;
      }

      if (pathname === "/api/v1/auth/login" && method === "POST") {
        const rate = checkAuthRateLimit(req, "login");
        if (!rate.allowed) {
          sendJson(
            res,
            429,
            {
              error: "Too many sign-in attempts. Please wait before trying again.",
              code: "RATE_LIMIT_EXCEEDED",
            },
            {
              "Retry-After": String(rate.retryAfterSeconds),
              "X-RateLimit-Remaining": "0",
            }
          );
          return;
        }
        const body = await readJsonBody(req);
        const email = String(body.email || "").trim();
        const password = String(body.password || "");
        let found = repo.findUserByEmail(email);
        if (
          !found &&
          isDemoModeEnabled() &&
          repo
            .listDemoAccounts()
            .some((a) => a.email.toLowerCase() === email.toLowerCase())
        ) {
          repo.loginOrProvisionDemoAccount(email);
          found = repo.findUserByEmail(email);
        }

        if (
          !found ||
          !found.isActive ||
          !verifyPassword(password, found.passwordHash)
        ) {
          sendJson(
            res,
            401,
            { error: "Invalid email or password." },
            { "X-RateLimit-Remaining": String(rate.remaining) }
          );
          return;
        }

        const { passwordHash: _omitted, ...user } = found;
        const token = signSessionToken(user);
        sendJson(
          res,
          200,
          { user, token },
          {
            "Set-Cookie": buildSessionCookieHeader(token, ONE_YEAR_MS, req),
            "X-RateLimit-Remaining": String(rate.remaining),
          }
        );
        return;
      }

      if (pathname === "/api/v1/auth/logout" && method === "POST") {
        sendJson(
          res,
          200,
          { success: true },
          {
            "Set-Cookie": buildSessionCookieHeader("", 0, req),
          }
        );
        return;
      }

      // =======================================================================
      // 2. PUBLIC DISCOVERY ROUTES (Consent-Gated & Privacy-Masked)
      // =======================================================================
      if (pathname === "/api/v1/public/locations" && method === "GET") {
        sendJson(res, 200, { locations: repo.listLocations() });
        return;
      }

      if (pathname === "/api/v1/public/map" && method === "GET") {
        const includeDemo =
          parsedUrl.searchParams.get("includeDemo") !== "false";
        sendJson(res, 200, repo.getMapDiscoveryPayload(includeDemo));
        return;
      }

      if (pathname === "/api/v1/public/records" && method === "GET") {
        const originParam = parsedUrl.searchParams.get("origin") as
          | "FIELD_VERIFIED"
          | "DEMO_REFERENCE"
          | null;
        const category = parsedUrl.searchParams.get("category") || undefined;
        const stateId = parsedUrl.searchParams.get("stateId") || undefined;
        const districtId =
          parsedUrl.searchParams.get("districtId") || undefined;
        const cityTownId =
          parsedUrl.searchParams.get("cityTownId") || undefined;

        const records = repo.listPublicRecords({
          origin: originParam || undefined,
          category,
          stateId,
          districtId,
          cityTownId,
        });
        sendJson(res, 200, { records });
        return;
      }

      const publicRecordMatch = pathname.match(
        /^\/api\/v1\/public\/records\/([^/]+)$/
      );
      if (publicRecordMatch && method === "GET") {
        const slug = decodeURIComponent(publicRecordMatch[1]);
        const record = repo.getPublicRecordBySlug(slug);
        if (!record) {
          sendJson(res, 404, {
            error:
              "Cultural record not found or not currently cleared for public viewing.",
          });
          return;
        }
        sendJson(res, 200, { record });
        return;
      }

      if (pathname === "/api/v1/public/geography-metadata" && method === "GET") {
        sendJson(res, 200, { metadata: repo.getGeographyMetadata() });
        return;
      }

      const publicPlaceMatch = pathname.match(
        /^\/api\/v1\/public\/places\/([^/]+)$/
      );
      if (publicPlaceMatch && method === "GET") {
        const placeId = decodeURIComponent(publicPlaceMatch[1]);
        const detail = repo.getPlaceDetail(placeId);
        if (!detail) {
          sendJson(res, 404, {
            error: `Geographic place "${placeId}" was not found in the directory.`,
          });
          return;
        }
        sendJson(res, 200, detail);
        return;
      }

      if (pathname === "/api/v1/public/events" && method === "GET") {
        const stateId = parsedUrl.searchParams.get("stateId") || undefined;
        const districtId =
          parsedUrl.searchParams.get("districtId") || undefined;
        const category = parsedUrl.searchParams.get("category") || undefined;
        sendJson(res, 200, {
          events: repo.listPublicEvents({ stateId, districtId, category }),
        });
        return;
      }

      if (pathname === "/api/v1/public/calendar" && method === "GET") {
        const payload = repo.queryPublicCalendar({
          stateId: parsedUrl.searchParams.get("stateId") || undefined,
          districtId: parsedUrl.searchParams.get("districtId") || undefined,
          placeId: parsedUrl.searchParams.get("placeId") || undefined,
          category: parsedUrl.searchParams.get("category") || undefined,
          scheduleStatus:
            parsedUrl.searchParams.get("scheduleStatus") || undefined,
          visitorInterest:
            parsedUrl.searchParams.get("visitorInterest") || undefined,
          dateFrom: parsedUrl.searchParams.get("dateFrom") || undefined,
          dateTo: parsedUrl.searchParams.get("dateTo") || undefined,
          includePast: parsedUrl.searchParams.get("includePast") !== "false",
          includeCancelled:
            parsedUrl.searchParams.get("includeCancelled") !== "false",
          onlyRecurring:
            parsedUrl.searchParams.get("onlyRecurring") === "true",
          q: parsedUrl.searchParams.get("q") || undefined,
          page: parsedUrl.searchParams.get("page")
            ? Number(parsedUrl.searchParams.get("page"))
            : 1,
          pageSize: parsedUrl.searchParams.get("pageSize")
            ? Number(parsedUrl.searchParams.get("pageSize"))
            : 12,
        });
        sendJson(res, 200, payload);
        return;
      }

      if (pathname === "/api/v1/public/calendar/submit" && method === "POST") {
        const body = await readJsonBody(req);
        const titleEn = String(body.titleEn || "").trim();
        const startDate = String(body.startDate || "").trim();
        const submittedByPublicName = String(
          body.submittedByPublicName || ""
        ).trim();
        const submittedByPublicContact = String(
          body.submittedByPublicContact || ""
        ).trim();
        if (
          !titleEn ||
          !startDate ||
          !submittedByPublicName ||
          !submittedByPublicContact
        ) {
          sendJson(res, 400, {
            error:
              "titleEn, startDate, submittedByPublicName, and submittedByPublicContact are required.",
          });
          return;
        }
        const created = repo.submitPublicCulturalEvent({
          ...body,
          titleEn,
          startDate,
          submittedByPublicName,
          submittedByPublicContact,
        });
        sendJson(res, 201, {
          eventId: created.id,
          status: created.status,
          message:
            "Event submitted to moderation queue. It will remain hidden from the public calendar until source attribution, visitor access, and community boundaries are verified.",
        });
        return;
      }

      const publicCalendarDetailMatch = pathname.match(
        /^\/api\/v1\/public\/calendar\/([^/]+)$/
      );
      if (publicCalendarDetailMatch && method === "GET") {
        const eventId = decodeURIComponent(publicCalendarDetailMatch[1]);
        const event = repo.getPublicEventById(eventId);
        if (!event) {
          sendJson(res, 404, {
            error:
              "Cultural event not found or not currently cleared for public viewing.",
          });
          return;
        }
        const linkedRecord = event.culturalRecordSlug
          ? repo.getPublicRecordBySlug(event.culturalRecordSlug)
          : null;
        sendJson(res, 200, { event, linkedRecord });
        return;
      }

      if (
        pathname === "/api/v1/public/trip-planner/generate" &&
        method === "POST"
      ) {
        const body = await readJsonBody(req);
        const plan = repo.generateTripPlan({
          title: body.title,
          startDate: String(body.startDate || new Date().toISOString().slice(0, 10)),
          durationDays: body.durationDays ? Number(body.durationDays) : 3,
          endDate: body.endDate,
          stateId: body.stateId || "loc-state-maharashtra",
          districtId: body.districtId || null,
          placeId: body.placeId || null,
          categories: Array.isArray(body.categories) ? body.categories : [],
          visitorInterests: Array.isArray(body.visitorInterests)
            ? body.visitorInterests
            : [],
          confirmedOnly: Boolean(body.confirmedOnly),
        });
        sendJson(res, 200, { plan });
        return;
      }

      if (pathname === "/api/v1/public/trip-plans" && method === "POST") {
        const body = await readJsonBody(req);
        if (!body.startDate) {
          sendJson(res, 400, { error: "startDate is required." });
          return;
        }
        const saved = repo.saveTripPlan(body);
        sendJson(res, 201, { plan: saved });
        return;
      }

      const publicTripPlanMatch = pathname.match(
        /^\/api\/v1\/public\/trip-plans\/([^/]+)$/
      );
      if (publicTripPlanMatch) {
        const planId = decodeURIComponent(publicTripPlanMatch[1]);
        if (method === "GET") {
          const plan = repo.getTripPlanById(planId);
          if (!plan) {
            sendJson(res, 404, { error: "Saved trip plan not found." });
            return;
          }
          sendJson(res, 200, { plan });
          return;
        }
        if (method === "PUT") {
          const body = await readJsonBody(req);
          const updated = repo.updateTripPlan(planId, body);
          sendJson(res, 200, { plan: updated });
          return;
        }
      }

      if (pathname === "/api/v1/public/traditions" && method === "GET") {
        const payload = repo.queryPublicTraditions({
          q: parsedUrl.searchParams.get("q") || undefined,
          traditionCategory:
            (parsedUrl.searchParams.get("traditionCategory") as any) ||
            undefined,
          legacyCategory:
            parsedUrl.searchParams.get("legacyCategory") || undefined,
          stateId: parsedUrl.searchParams.get("stateId") || undefined,
          districtId: parsedUrl.searchParams.get("districtId") || undefined,
          placeId: parsedUrl.searchParams.get("placeId") || undefined,
          language: parsedUrl.searchParams.get("language") || undefined,
          evidenceStatus:
            (parsedUrl.searchParams.get("evidenceStatus") as any) || undefined,
          hasVerifiedMedia:
            parsedUrl.searchParams.get("hasVerifiedMedia") === "true",
          page: parsedUrl.searchParams.get("page")
            ? Number(parsedUrl.searchParams.get("page"))
            : 1,
          pageSize: parsedUrl.searchParams.get("pageSize")
            ? Number(parsedUrl.searchParams.get("pageSize"))
            : 24,
        });
        sendJson(res, 200, payload);
        return;
      }

      const publicTraditionMatch = pathname.match(
        /^\/api\/v1\/public\/traditions\/([^/]+)$/
      );
      if (publicTraditionMatch && method === "GET") {
        const slug = decodeURIComponent(publicTraditionMatch[1]);
        const tradition = repo.getPublicTraditionBySlug(slug);
        if (!tradition) {
          sendJson(res, 404, {
            error:
              "Tradition not found or not currently cleared for public viewing.",
          });
          return;
        }
        sendJson(res, 200, { tradition });
        return;
      }

      if (pathname === "/api/v1/public/sources" && method === "GET") {
        const traditionId =
          parsedUrl.searchParams.get("traditionId") || undefined;
        const culturalRecordId =
          parsedUrl.searchParams.get("culturalRecordId") || undefined;
        sendJson(res, 200, {
          sources: repo.listPublicSources({ traditionId, culturalRecordId }),
        });
        return;
      }

      if (pathname === "/api/v1/public/media-assets" && method === "GET") {
        const traditionId =
          parsedUrl.searchParams.get("traditionId") || undefined;
        const culturalRecordId =
          parsedUrl.searchParams.get("culturalRecordId") || undefined;
        const mediaType =
          (parsedUrl.searchParams.get("mediaType") as any) || undefined;
        sendJson(res, 200, {
          mediaAssets: repo.listPublicMediaAssets({
            traditionId,
            culturalRecordId,
            mediaType,
          }),
        });
        return;
      }

      if (pathname === "/api/v1/public/enquiries" && method === "POST") {
        const body = await readJsonBody(req);
        const senderName = String(body.senderName || "").trim();
        const senderContact = String(body.senderContact || "").trim();
        const message = String(body.message || "").trim();
        if (!senderName || !senderContact || !message) {
          sendJson(res, 400, {
            error: "senderName, senderContact, and message are required.",
          });
          return;
        }
        const enquiry = repo.createCommunityEnquiry({
          enquiryType: body.enquiryType || "WORKSHOP_ENQUIRY",
          culturalRecordId: body.culturalRecordId || null,
          locationId: body.locationId || null,
          eventId: body.eventId || null,
          senderName,
          senderContact,
          message,
        });
        sendJson(res, 201, { enquiry });
        return;
      }

      // =======================================================================
      // 2B. PRACTITIONERS, ART-MART, INDUSTRY-TO-ART & ECOSYSTEM ROUTES
      // =======================================================================
      if (pathname === "/api/v1/public/practitioners" && method === "GET") {
        const practitioners = repo.listPractitioners({
          q: parsedUrl.searchParams.get("q") || undefined,
          stateName: parsedUrl.searchParams.get("stateName") || undefined,
          traditionSlug:
            parsedUrl.searchParams.get("traditionSlug") || undefined,
          availabilityStatus:
            parsedUrl.searchParams.get("availabilityStatus") || undefined,
          includeUnpublished:
            parsedUrl.searchParams.get("includeUnpublished") === "true",
        });
        sendJson(res, 200, { practitioners });
        return;
      }

      const publicPractitionerMatch = pathname.match(
        /^\/api\/v1\/public\/practitioners\/([^/]+)$/
      );
      if (publicPractitionerMatch && method === "GET") {
        const slug = decodeURIComponent(publicPractitionerMatch[1]);
        const practitioner = repo.getPractitionerBySlug(slug);
        if (!practitioner) {
          sendJson(res, 404, { error: "Practitioner profile not found." });
          return;
        }
        const relatedProducts = repo
          .listArtMartProducts()
          .filter(
            (p) =>
              practitioner.traditionSlugs.includes(p.traditionSlug || "") ||
              p.stateName === practitioner.stateName
          )
          .slice(0, 6);
        sendJson(res, 200, { practitioner, relatedProducts });
        return;
      }

      if (pathname === "/api/v1/practitioners" && method === "POST") {
        const body = await readJsonBody(req);
        const created = repo.createPractitioner(body);
        sendJson(res, 201, { practitioner: created });
        return;
      }

      const updatePractitionerMatch = pathname.match(
        /^\/api\/v1\/practitioners\/([^/]+)$/
      );
      if (updatePractitionerMatch && method === "PATCH") {
        const idOrSlug = decodeURIComponent(updatePractitionerMatch[1]);
        const body = await readJsonBody(req);
        const updated = repo.updatePractitioner(idOrSlug, body);
        sendJson(res, 200, { practitioner: updated });
        return;
      }

      if (pathname === "/api/v1/public/art-mart/sellers" && method === "GET") {
        sendJson(res, 200, { sellers: repo.listArtMartSellers() });
        return;
      }

      const publicSellerMatch = pathname.match(
        /^\/api\/v1\/public\/art-mart\/sellers\/([^/]+)$/
      );
      if (publicSellerMatch && method === "GET") {
        const slug = decodeURIComponent(publicSellerMatch[1]);
        const seller = repo.getArtMartSellerBySlug(slug);
        if (!seller) {
          sendJson(res, 404, { error: "Seller storefront not found." });
          return;
        }
        const products = repo.listArtMartProducts({
          sellerId: seller.id,
          includeUnpublished: true,
        });
        sendJson(res, 200, { seller, products });
        return;
      }

      if (pathname === "/api/v1/public/art-mart/products" && method === "GET") {
        const products = repo.listArtMartProducts({
          q: parsedUrl.searchParams.get("q") || undefined,
          category: parsedUrl.searchParams.get("category") || undefined,
          stateName: parsedUrl.searchParams.get("stateName") || undefined,
          traditionSlug:
            parsedUrl.searchParams.get("traditionSlug") || undefined,
          sellerId: parsedUrl.searchParams.get("sellerId") || undefined,
          sortBy: parsedUrl.searchParams.get("sortBy") || undefined,
          includeUnpublished:
            parsedUrl.searchParams.get("includeUnpublished") === "true",
        });
        sendJson(res, 200, {
          products,
          sellers: repo.listArtMartSellers(),
        });
        return;
      }

      const publicProductMatch = pathname.match(
        /^\/api\/v1\/public\/art-mart\/products\/([^/]+)$/
      );
      if (publicProductMatch && method === "GET") {
        const slug = decodeURIComponent(publicProductMatch[1]);
        const product = repo.getArtMartProductBySlug(slug);
        if (!product) {
          sendJson(res, 404, { error: "Art-Mart product not found." });
          return;
        }
        const seller = repo.getArtMartSellerBySlug(product.sellerId);
        const relatedProducts = repo
          .listArtMartProducts()
          .filter(
            (p) =>
              p.id !== product.id &&
              (p.category === product.category ||
                p.traditionSlug === product.traditionSlug ||
                p.stateName === product.stateName)
          )
          .slice(0, 4);
        sendJson(res, 200, { product, seller, relatedProducts });
        return;
      }

      if (pathname === "/api/v1/art-mart/products" && method === "POST") {
        const body = await readJsonBody(req);
        const product = repo.createArtMartProduct(body);
        sendJson(res, 201, { product });
        return;
      }

      const updateProductMatch = pathname.match(
        /^\/api\/v1\/art-mart\/products\/([^/]+)$/
      );
      if (updateProductMatch && method === "PATCH") {
        const idOrSlug = decodeURIComponent(updateProductMatch[1]);
        const body = await readJsonBody(req);
        const product = repo.updateArtMartProduct(idOrSlug, body);
        sendJson(res, 200, { product });
        return;
      }

      if (pathname === "/api/v1/art-mart/orders" && method === "GET") {
        const buyerEmail =
          parsedUrl.searchParams.get("buyerEmail") || undefined;
        sendJson(res, 200, { orders: repo.listArtMartOrders(buyerEmail) });
        return;
      }

      if (pathname === "/api/v1/art-mart/orders" && method === "POST") {
        const body = await readJsonBody(req);
        const order = repo.createArtMartOrder({
          buyerName: String(body.buyerName || "Demo Patron"),
          buyerEmail: String(
            body.buyerEmail || "buyer.demo@bharat-culturemap.local"
          ),
          shippingCity: String(body.shippingCity || "Kolhapur"),
          shippingState: String(body.shippingState || "Maharashtra"),
          shippingAddressLabel: String(
            body.shippingAddressLabel || "Demo Delivery Address"
          ),
          paymentMethodLabel: body.paymentMethodLabel
            ? String(body.paymentMethodLabel)
            : undefined,
          items: Array.isArray(body.items) ? body.items : [],
        });
        sendJson(res, 201, { order });
        return;
      }

      const updateOrderStatusMatch = pathname.match(
        /^\/api\/v1\/art-mart\/orders\/([^/]+)\/status$/
      );
      if (updateOrderStatusMatch && method === "PATCH") {
        const orderId = decodeURIComponent(updateOrderStatusMatch[1]);
        const body = await readJsonBody(req);
        const order = repo.updateArtMartOrderStatus(
          orderId,
          body.status || "CONFIRMED"
        );
        sendJson(res, 200, { order });
        return;
      }

      if (
        pathname === "/api/v1/public/industry-materials" &&
        method === "GET"
      ) {
        const materials = repo.listIndustryMaterials({
          q: parsedUrl.searchParams.get("q") || undefined,
          materialCategory:
            parsedUrl.searchParams.get("materialCategory") || undefined,
          includePending:
            parsedUrl.searchParams.get("includePending") !== "false",
        });
        sendJson(res, 200, { materials });
        return;
      }

      if (pathname === "/api/v1/industry-materials" && method === "POST") {
        const body = await readJsonBody(req);
        const material = repo.createIndustryMaterial(body);
        sendJson(res, 201, { material });
        return;
      }

      const updateIndustryMatMatch = pathname.match(
        /^\/api\/v1\/industry-materials\/([^/]+)\/status$/
      );
      if (updateIndustryMatMatch && method === "PATCH") {
        const matId = decodeURIComponent(updateIndustryMatMatch[1]);
        const body = await readJsonBody(req);
        const material = repo.updateIndustryMaterialStatus(
          matId,
          body.adminReviewStatus || "APPROVED",
          body.availabilityStatus
        );
        sendJson(res, 200, { material });
        return;
      }

      if (pathname === "/api/v1/public/industry-requests" && method === "GET") {
        const materialId =
          parsedUrl.searchParams.get("materialId") || undefined;
        sendJson(res, 200, {
          requests: repo.listIndustryRequests(materialId),
        });
        return;
      }

      if (pathname === "/api/v1/industry-requests" && method === "POST") {
        const body = await readJsonBody(req);
        if (!body.materialId || !body.artisanName || !body.intendedCraftUse) {
          sendJson(res, 400, {
            error:
              "materialId, artisanName, and intendedCraftUse are required.",
          });
          return;
        }
        const requestItem = repo.createIndustryRequest(body);
        sendJson(res, 201, { request: requestItem });
        return;
      }

      const updateIndustryReqMatch = pathname.match(
        /^\/api\/v1\/industry-requests\/([^/]+)\/status$/
      );
      if (updateIndustryReqMatch && method === "PATCH") {
        const reqId = decodeURIComponent(updateIndustryReqMatch[1]);
        const body = await readJsonBody(req);
        const requestItem = repo.updateIndustryRequestStatus(
          reqId,
          body.collaborationStatus || "REVIEWED_BY_ADMIN_OR_INDUSTRY",
          body.adminReviewerNote,
          body.linkedArtMartProductId
        );
        sendJson(res, 200, { request: requestItem });
        return;
      }

      if (
        pathname === "/api/v1/public/ecosystem-resources" &&
        method === "GET"
      ) {
        const resources = repo.listEcosystemResources({
          q: parsedUrl.searchParams.get("q") || undefined,
          organisationType:
            parsedUrl.searchParams.get("organisationType") || undefined,
          relationshipStatus:
            parsedUrl.searchParams.get("relationshipStatus") || undefined,
          stateScope: parsedUrl.searchParams.get("stateScope") || undefined,
        });
        sendJson(res, 200, { resources });
        return;
      }

      if (pathname === "/api/v1/ecosystem-resources" && method === "POST") {
        const body = await readJsonBody(req);
        const resource = repo.createEcosystemResource(body);
        sendJson(res, 201, { resource });
        return;
      }

      const updateEcoResMatch = pathname.match(
        /^\/api\/v1\/ecosystem-resources\/([^/]+)$/
      );
      if (updateEcoResMatch && method === "PATCH") {
        const resId = decodeURIComponent(updateEcoResMatch[1]);
        const body = await readJsonBody(req);
        const resource = repo.updateEcosystemResource(resId, body);
        sendJson(res, 200, { resource });
        return;
      }


      // =======================================================================
      // 2C. HERCRAFT — WOMEN-LED CULTURAL ENTERPRISES & OPPORTUNITIES ROUTES
      // =======================================================================
      if (pathname === "/api/v1/public/hercraft" && method === "GET") {
        const actor = getAuthenticatedUser(req, repo);
        const wantPending =
          parsedUrl.searchParams.get("includePending") === "true" &&
          Boolean(actor && RBAC.canModerateEcosystemOrHerCraft(actor.role));
        const payload = repo.queryHerCraftDirectory({
          q: parsedUrl.searchParams.get("q") || undefined,
          craftCategory:
            parsedUrl.searchParams.get("craftCategory") || undefined,
          enterpriseType:
            parsedUrl.searchParams.get("enterpriseType") || undefined,
          stateName: parsedUrl.searchParams.get("stateName") || undefined,
          districtName: parsedUrl.searchParams.get("districtName") || undefined,
          traditionSlug:
            parsedUrl.searchParams.get("traditionSlug") || undefined,
          opportunityType:
            parsedUrl.searchParams.get("opportunityType") || undefined,
          includePending: wantPending,
        });
        sendJson(res, 200, payload);
        return;
      }

      const publicHerCraftDetailMatch = pathname.match(
        /^\/api\/v1\/public\/hercraft\/([^/]+)$/
      );
      if (publicHerCraftDetailMatch && method === "GET") {
        const slug = decodeURIComponent(publicHerCraftDetailMatch[1]);
        const actor = getAuthenticatedUser(req, repo);
        const includePending = Boolean(
          actor && RBAC.canModerateEcosystemOrHerCraft(actor.role)
        );
        const detail = repo.getHerCraftEnterpriseBySlug(slug, includePending);
        if (!detail) {
          sendJson(res, 404, {
            error: "HerCraft enterprise profile not found or pending review.",
          });
          return;
        }
        sendJson(res, 200, detail);
        return;
      }

      if (pathname === "/api/v1/hercraft/enterprises" && method === "POST") {
        const actor = getAuthenticatedUser(req, repo);
        const body = await readJsonBody(req);
        if (!body.enterpriseName || !(body.shortSummary || body.summary)) {
          sendJson(res, 400, {
            error: "enterpriseName and shortSummary are required.",
          });
          return;
        }
        const enterprise = repo.createHerCraftEnterprise({ ...body, shortSummary: body.shortSummary || body.summary }, actor);
        sendJson(res, 201, { enterprise });
        return;
      }

      const updateHerCraftEntMatch = pathname.match(
        /^\/api\/v1\/hercraft\/enterprises\/([^/]+)$/
      );
      if (updateHerCraftEntMatch && method === "PATCH") {
        const actor = getAuthenticatedUser(req, repo);
        const idOrSlug = decodeURIComponent(updateHerCraftEntMatch[1]);
        const body = await readJsonBody(req);
        if (
          (body.approvalStatus !== undefined ||
            body.publicationStatus !== undefined) &&
          (!actor || !RBAC.canModerateEcosystemOrHerCraft(actor.role))
        ) {
          sendJson(res, 403, {
            error:
              "Only authorized staff reviewers can approve or change publication status of HerCraft enterprises.",
            code: "FORBIDDEN_ROLE",
          });
          return;
        }
        const enterprise = repo.updateHerCraftEnterprise(idOrSlug, body, actor);
        sendJson(res, 200, { enterprise });
        return;
      }

      if (pathname === "/api/v1/hercraft/opportunities" && method === "POST") {
        const actor = getAuthenticatedUser(req, repo);
        const body = await readJsonBody(req);
        if (!body.title || !body.eligibilitySummary) {
          sendJson(res, 400, {
            error: "title and eligibilitySummary are required.",
          });
          return;
        }
        const opportunity = repo.createHerCraftOpportunity(body, actor);
        sendJson(res, 201, { opportunity });
        return;
      }

      const updateHerCraftOppMatch = pathname.match(
        /^\/api\/v1\/hercraft\/opportunities\/([^/]+)$/
      );
      if (updateHerCraftOppMatch && method === "PATCH") {
        const actor = getAuthenticatedUser(req, repo);
        if (!actor || !RBAC.canModerateEcosystemOrHerCraft(actor.role)) {
          sendJson(res, 403, {
            error:
              "Only authorized staff reviewers can moderate HerCraft opportunities.",
            code: "FORBIDDEN_ROLE",
          });
          return;
        }
        const oppId = decodeURIComponent(updateHerCraftOppMatch[1]);
        const body = await readJsonBody(req);
        const opportunity = repo.updateHerCraftOpportunity(oppId, body, actor);
        sendJson(res, 200, { opportunity });
        return;
      }

      // =======================================================================
      // 3. ADMIN ROUTES (Require Authentication & Role Enforcement)
      // =======================================================================
      if (pathname.startsWith("/api/v1/admin/")) {
        const actor = getAuthenticatedUser(req, repo);
        if (!actor) {
          sendJson(res, 401, {
            error: "Authentication required to access the Admin Panel.",
          });
          return;
        }
        if (!RBAC.isStaffRole(actor.role)) {
          sendJson(res, 403, {
            error:
              "Staff authorization role required. Public account personas do not have administrative privileges.",
            code: "STAFF_ROLE_REQUIRED",
          });
          return;
        }

        // =====================================================================
        // ADMIN IMAGE UPLOAD
        // =====================================================================
        if (pathname === "/api/v1/admin/upload" && method === "POST") {
          try {
            const body = await readJsonBody(req);
            const uploaded = await handleImageUpload(body, actor);
            sendJson(res, 201, uploaded);
          } catch (err: any) {
            sendJson(res, 400, { error: err?.message || "Image upload failed." });
          }
          return;
        }

        // =====================================================================
        // ADMIN DELETE ENDPOINTS
        // =====================================================================
        const adminDeleteRecordMatch = pathname.match(/^\/api\/v1\/admin\/records\/([^/]+)$/);
        if (adminDeleteRecordMatch && method === "DELETE") {
          const recId = decodeURIComponent(adminDeleteRecordMatch[1]);
          const success = repo.deleteCulturalRecord(recId, actor);
          sendJson(res, success ? 200 : 404, { success, id: recId });
          return;
        }

        const adminDeleteTradMatch = pathname.match(/^\/api\/v1\/admin\/traditions\/([^/]+)$/);
        if (adminDeleteTradMatch && method === "DELETE") {
          const tradId = decodeURIComponent(adminDeleteTradMatch[1]);
          const success = repo.deleteTradition(tradId, actor);
          sendJson(res, success ? 200 : 404, { success, id: tradId });
          return;
        }

        const adminDeleteEventMatch = pathname.match(/^\/api\/v1\/admin\/events\/([^/]+)$/);
        if (adminDeleteEventMatch && method === "DELETE") {
          const evtId = decodeURIComponent(adminDeleteEventMatch[1]);
          const success = repo.deleteCulturalEvent(evtId, actor);
          sendJson(res, success ? 200 : 404, { success, id: evtId });
          return;
        }

        const adminDeletePractMatch = pathname.match(/^\/api\/v1\/admin\/practitioners\/([^/]+)$/);
        if (adminDeletePractMatch && method === "DELETE") {
          const practId = decodeURIComponent(adminDeletePractMatch[1]);
          const success = repo.deletePractitioner(practId, actor);
          sendJson(res, success ? 200 : 404, { success, id: practId });
          return;
        }

        const adminDeleteProdMatch = pathname.match(/^\/api\/v1\/admin\/art-mart\/products\/([^/]+)$/);
        if (adminDeleteProdMatch && method === "DELETE") {
          const prodId = decodeURIComponent(adminDeleteProdMatch[1]);
          const success = repo.deleteArtMartProduct(prodId, actor);
          sendJson(res, success ? 200 : 404, { success, id: prodId });
          return;
        }

        const adminDeleteHerCraftMatch = pathname.match(/^\/api\/v1\/admin\/hercraft\/enterprises\/([^/]+)$/);
        if (adminDeleteHerCraftMatch && method === "DELETE") {
          const entId = decodeURIComponent(adminDeleteHerCraftMatch[1]);
          const success = repo.deleteHerCraftEnterprise(entId, actor);
          sendJson(res, success ? 200 : 404, { success, id: entId });
          return;
        }

        const adminDeleteMediaMatch = pathname.match(/^\/api\/v1\/admin\/media-assets\/([^/]+)$/);
        if (adminDeleteMediaMatch && method === "DELETE") {
          const medId = decodeURIComponent(adminDeleteMediaMatch[1]);
          const success = repo.deleteMediaAsset(medId, actor);
          sendJson(res, success ? 200 : 404, { success, id: medId });
          return;
        }

        const adminDeleteSrcMatch = pathname.match(/^\/api\/v1\/admin\/sources\/([^/]+)$/);
        if (adminDeleteSrcMatch && method === "DELETE") {
          const srcId = decodeURIComponent(adminDeleteSrcMatch[1]);
          const success = repo.deleteSourceCitation(srcId, actor);
          sendJson(res, success ? 200 : 404, { success, id: srcId });
          return;
        }

        const adminDeleteUserMatch = pathname.match(/^\/api\/v1\/admin\/users\/([^/]+)$/);
        if (adminDeleteUserMatch && method === "DELETE") {
          const targetId = decodeURIComponent(adminDeleteUserMatch[1]);
          try {
            const success = repo.deleteUser(targetId, actor);
            sendJson(res, success ? 200 : 404, { success, id: targetId });
          } catch (err: any) {
            sendJson(res, 400, { error: err?.message || "Cannot delete user." });
          }
          return;
        }

        const adminUpdateUserMatch = pathname.match(
          /^\/api\/v1\/admin\/users\/([^/]+)$/
        );
        if (adminUpdateUserMatch && method === "PATCH") {
          if (!RBAC.canManageUsers(actor.role)) {
            sendJson(res, 403, {
              error: "Only SUPER_ADMIN can assign or upgrade user authorization roles.",
              code: "FORBIDDEN_ROLE",
            });
            return;
          }
          const targetUserId = decodeURIComponent(adminUpdateUserMatch[1]);
          const body = await readJsonBody(req);
          if (body.role !== undefined && !USER_ROLES.includes(body.role)) {
            sendJson(res, 400, { error: `Invalid role '${body.role}'.` });
            return;
          }
          const updated = repo.adminUpdateUser(targetUserId, {
            role: body.role,
            accountType: body.accountType,
            linkedPractitionerId: body.linkedPractitionerId,
            linkedSellerId: body.linkedSellerId,
            linkedHerCraftId: body.linkedHerCraftId,
            isActive: body.isActive,
            fullName: body.fullName ?? body.name,
          });
          sendJson(res, 200, { user: updated });
          return;
        }

        if (pathname === "/api/v1/admin/users" && method === "GET") {
          if (!RBAC.canManageUsers(actor.role)) {
            sendJson(res, 403, {
              error: "Only SUPER_ADMIN can list or manage user accounts.",
            });
            return;
          }
          sendJson(res, 200, { users: repo.listUsers() });
          return;
        }

        if (pathname === "/api/v1/admin/users" && method === "POST") {
          if (!RBAC.canManageUsers(actor.role)) {
            sendJson(res, 403, {
              error: "Only SUPER_ADMIN can create user accounts.",
            });
            return;
          }
          const body = await readJsonBody(req);
          const role = body.role as UserRole;
          if (!USER_ROLES.includes(role)) {
            sendJson(res, 400, { error: `Invalid role '${role}'.` });
            return;
          }
          if (!body.email || String(body.password || "").length < 8) {
            sendJson(res, 400, {
              error: "Email and password (min 8 chars) are required.",
            });
            return;
          }
          const created = repo.createUser({
            email: String(body.email),
            password: String(body.password),
            fullName: String(body.fullName || body.email),
            role,
          });
          sendJson(res, 201, { user: created });
          return;
        }

        if (pathname === "/api/v1/admin/records" && method === "GET") {
          const origin = parsedUrl.searchParams.get("origin") as any;
          const status = parsedUrl.searchParams.get("status") as any;
          const records = repo
            .listAdminRecords({
              origin: origin || undefined,
              status: status || undefined,
            })
            .map((r) => ({
              ...r,
              publicationGate: evaluatePublicationGate(r),
            }));
          sendJson(res, 200, { records });
          return;
        }

        if (pathname === "/api/v1/admin/records" && method === "POST") {
          if (!RBAC.canCreateOrEditRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role '${actor.role}' is not permitted to create cultural records.`,
            });
            return;
          }
          const body = await readJsonBody(req);
          if (!body.titleEn || !body.summaryEn || !body.practitionerChosenName) {
            sendJson(res, 400, {
              error:
                "titleEn, summaryEn, and practitionerChosenName are required.",
            });
            return;
          }
          const created = repo.createCulturalRecord(
            {
              slug: body.slug,
              traditionId: body.traditionId || null,
              traditionSlug: body.traditionSlug || null,
              recordOrigin: body.recordOrigin || "FIELD_VERIFIED",
              unescoDomain:
                body.unescoDomain || "Traditional craftsmanship",
              category: body.category || "Craft",
              isWomenLed: Boolean(body.isWomenLed),
              isSacredOrRestricted: Boolean(body.isSacredOrRestricted),
              practitionerFullNamePrivate: body.practitionerFullNamePrivate,
              practitionerChosenName: body.practitionerChosenName,
              practitionerCommunityName: body.practitionerCommunityName,
              practitionerVillagePrivate: body.practitionerVillagePrivate,
              practitionerTaluka: body.practitionerTaluka,
              practitionerPhonePrivate: body.practitionerPhonePrivate,
              practitionerAddressPrivate: body.practitionerAddressPrivate,
              stateId: body.stateId || "loc-state-maharashtra",
              districtId:
                body.districtId !== undefined
                  ? body.districtId
                  : "loc-district-kolhapur-district",
              talukaId:
                body.talukaId !== undefined ? body.talukaId : null,
              cityTownId:
                body.cityTownId !== undefined
                  ? body.cityTownId
                  : "loc-city-kolhapur",
              sourceAttribution:
                body.sourceAttribution !== undefined
                  ? body.sourceAttribution
                  : null,
              sourceUrl:
                body.sourceUrl !== undefined ? body.sourceUrl : null,
              exactLatPrivate:
                body.exactLatPrivate !== undefined
                  ? body.exactLatPrivate
                  : null,
              exactLngPrivate:
                body.exactLngPrivate !== undefined
                  ? body.exactLngPrivate
                  : null,
              titleEn: body.titleEn,
              titleMr: body.titleMr,
              subtitleEn: body.subtitleEn,
              summaryEn: body.summaryEn,
              summaryMr: body.summaryMr,
              practiceContextEn: body.practiceContextEn,
              practiceContextMr: body.practiceContextMr,
              tags: Array.isArray(body.tags) ? body.tags : [],
              heroImageUrl: body.heroImageUrl,
              originalVoiceLanguage: body.originalVoiceLanguage,
              originalVoiceAudioUrl: body.originalVoiceAudioUrl,
              originalVoiceTranscriptMr: body.originalVoiceTranscriptMr,
              mediationM1SubtitlesEn: body.mediationM1SubtitlesEn,
              mediationM2SyntheticContextText:
                body.mediationM2SyntheticContextText,
              mediationM3HumanStoryCompanionText:
                body.mediationM3HumanStoryCompanionText,
              mediationM3NarratorCredit: body.mediationM3NarratorCredit,
              storyCompanionPrompts: body.storyCompanionPrompts,
              vocabulary: body.vocabulary,
            },
            actor
          );
          sendJson(res, 201, {
            record: {
              ...created,
              publicationGate: evaluatePublicationGate(created),
            },
          });
          return;
        }

        const adminRecordMatch = pathname.match(
          /^\/api\/v1\/admin\/records\/([^/]+)$/
        );
        if (adminRecordMatch) {
          const recordId = decodeURIComponent(adminRecordMatch[1]);
          if (method === "GET") {
            const rec = repo.getAdminRecordById(recordId);
            if (!rec) {
              sendJson(res, 404, { error: "Record not found." });
              return;
            }
            sendJson(res, 200, {
              record: {
                ...rec,
                publicationGate: evaluatePublicationGate(rec),
              },
            });
            return;
          }

          if (method === "PATCH") {
            if (
              !RBAC.canCreateOrEditRecord(actor.role) &&
              !RBAC.canSubmitLanguageOrFolkloreReview(actor.role)
            ) {
              sendJson(res, 403, {
                error: `Role '${actor.role}' is not permitted to edit record content.`,
              });
              return;
            }
            const body = await readJsonBody(req);
            const updated = repo.updateCulturalRecord(recordId, body, actor);
            sendJson(res, 200, {
              record: {
                ...updated,
                publicationGate: evaluatePublicationGate(updated),
              },
            });
            return;
          }
        }

        const passportMatch = pathname.match(
          /^\/api\/v1\/admin\/records\/([^/]+)\/rights-passport$/
        );
        if (passportMatch && method === "PUT") {
          if (!RBAC.canRecordInitialConsent(actor.role)) {
            sendJson(res, 403, {
              error: `Role '${actor.role}' is not authorized to modify the Cultural Rights Passport.`,
            });
            return;
          }
          const recordId = decodeURIComponent(passportMatch[1]);
          const body = await readJsonBody(req);
          const updated = repo.updateRightsPassport(recordId, body, actor);
          sendJson(res, 200, {
            record: {
              ...updated,
              publicationGate: evaluatePublicationGate(updated),
            },
          });
          return;
        }

        const reviewMatch = pathname.match(
          /^\/api\/v1\/admin\/records\/([^/]+)\/review$/
        );
        if (reviewMatch && method === "POST") {
          if (!RBAC.canSubmitLanguageOrFolkloreReview(actor.role)) {
            sendJson(res, 403, {
              error: `Role '${actor.role}' is not authorized to submit language or folklore review sign-off.`,
            });
            return;
          }
          const recordId = decodeURIComponent(reviewMatch[1]);
          const body = await readJsonBody(req);
          const stepType =
            body.stepType === "TRANSCRIBED" ||
            body.stepType === "TRANSLATED" ||
            body.stepType === "NARRATED"
              ? body.stepType
              : "TRANSLATED";

          const updated = repo.addProvenanceStep(recordId, {
            stepType,
            performedByUserId: actor.id,
            performedByRole: actor.role,
            performedByDisplay: `${actor.fullName} (${actor.role})`,
            practitionerApproved: Boolean(body.practitionerApproved),
            versionLabel: body.versionLabel || "v2-reviewed",
            notes:
              body.notes ||
              `Completed ${stepType.toLowerCase()} verification review.`,
          });
          sendJson(res, 200, {
            record: {
              ...updated,
              publicationGate: evaluatePublicationGate(updated),
            },
          });
          return;
        }

        const approvalMatch = pathname.match(
          /^\/api\/v1\/admin\/records\/([^/]+)\/practitioner-approval$/
        );
        if (approvalMatch && method === "POST") {
          if (!RBAC.canRecordPractitionerApproval(actor.role)) {
            sendJson(res, 403, {
              error: `Role '${actor.role}' is not authorized to record final practitioner approval.`,
            });
            return;
          }
          const recordId = decodeURIComponent(approvalMatch[1]);
          const body = await readJsonBody(req);
          const updated = repo.addProvenanceStep(recordId, {
            stepType: "APPROVED",
            performedByUserId: actor.id,
            performedByRole: actor.role,
            performedByDisplay: `${actor.fullName} (${actor.role})`,
            practitionerApproved: true,
            versionLabel: body.versionLabel || "v3-approved",
            notes:
              body.notes ||
              "Practitioner reviewed and approved the complete record and Rights Passport for public release.",
          });
          sendJson(res, 200, {
            record: {
              ...updated,
              publicationGate: evaluatePublicationGate(updated),
            },
          });
          return;
        }

        const publishMatch = pathname.match(
          /^\/api\/v1\/admin\/records\/([^/]+)\/publish$/
        );
        if (publishMatch && method === "POST") {
          if (!RBAC.canPublishRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role '${actor.role}' is not authorized to publish cultural records.`,
            });
            return;
          }
          const recordId = decodeURIComponent(publishMatch[1]);
          const body = await readJsonBody(req);
          try {
            const published = repo.publishCulturalRecord(
              recordId,
              actor,
              body.notes
            );
            sendJson(res, 200, {
              record: {
                ...published,
                publicationGate: evaluatePublicationGate(published),
              },
            });
          } catch (err) {
            if (err instanceof ConsentGateError) {
              sendJson(res, 403, {
                error: err.message,
                code: "CONSENT_GATE_BLOCKED",
                reasons: err.reasons,
              });
              return;
            }
            throw err;
          }
          return;
        }

        const restrictMatch = pathname.match(
          /^\/api\/v1\/admin\/records\/([^/]+)\/restrict$/
        );
        if (restrictMatch && method === "POST") {
          if (!RBAC.canRestrictOrWithdrawRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role '${actor.role}' is not authorized to restrict or withdraw records.`,
            });
            return;
          }
          const recordId = decodeURIComponent(restrictMatch[1]);
          const body = await readJsonBody(req);
          const action =
            body.action === "WITHDRAWN" ? "WITHDRAWN" : "RESTRICTED";
          const reason =
            String(body.reason || "").trim() ||
            `Record ${action.toLowerCase()} via Cultural Rights Passport control.`;
          const updated = repo.restrictOrWithdrawRecord(
            recordId,
            action,
            actor,
            reason
          );
          sendJson(res, 200, {
            record: {
              ...updated,
              publicationGate: evaluatePublicationGate(updated),
            },
          });
          return;
        }

        if (pathname === "/api/v1/admin/locations" && method === "POST") {
          if (!RBAC.canCreateOrEditRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to create geographic locations.`,
            });
            return;
          }
          const body = await readJsonBody(req);
          if (
            !body.nameEn ||
            !body.level ||
            body.centerLat === undefined ||
            body.centerLng === undefined
          ) {
            sendJson(res, 400, {
              error: "nameEn, level, centerLat, and centerLng are required.",
            });
            return;
          }
          const location = repo.createLocation({
            id: body.id,
            level: body.level,
            nameEn: String(body.nameEn),
            nameMr: body.nameMr ? String(body.nameMr) : undefined,
            abbr: body.abbr ? String(body.abbr) : undefined,
            parentId: body.parentId || null,
            centerLat: Number(body.centerLat),
            centerLng: Number(body.centerLng),
            defaultZoom:
              body.defaultZoom !== undefined
                ? Number(body.defaultZoom)
                : undefined,
          });
          sendJson(res, 201, { location });
          return;
        }

        if (pathname === "/api/v1/admin/events" && method === "GET") {
          sendJson(res, 200, { events: repo.listAdminEvents() });
          return;
        }

        if (pathname === "/api/v1/admin/events" && method === "POST") {
          if (!RBAC.canCreateOrEditRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to create cultural events.`,
            });
            return;
          }
          const body = await readJsonBody(req);
          if (!body.titleEn || !body.startDate) {
            sendJson(res, 400, {
              error: "titleEn and startDate are required.",
            });
            return;
          }
          const event = repo.createCulturalEvent(body, actor);
          sendJson(res, 201, { event });
          return;
        }

        const adminEventPublishMatch = pathname.match(
          /^\/api\/v1\/admin\/events\/([^/]+)\/publish$/
        );
        if (adminEventPublishMatch && method === "POST") {
          if (
            !RBAC.canPublishRecord(actor.role) &&
            !RBAC.canSubmitLanguageOrFolkloreReview(actor.role)
          ) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not authorized to publish cultural events.`,
              code: "FORBIDDEN_ROLE",
            });
            return;
          }
          const eventId = decodeURIComponent(adminEventPublishMatch[1]);
          try {
            const event = repo.publishCulturalEvent(eventId, actor);
            sendJson(res, 200, { event });
          } catch (err) {
            if (err instanceof ConsentGateError) {
              sendJson(res, 403, {
                error: err.message,
                code: "EVENT_PUBLICATION_BLOCKED",
                reasons: err.reasons,
              });
              return;
            }
            throw err;
          }
          return;
        }

        const adminEventStatusMatch = pathname.match(
          /^\/api\/v1\/admin\/events\/([^/]+)\/status$/
        );
        if (adminEventStatusMatch && method === "POST") {
          if (
            !RBAC.canPublishRecord(actor.role) &&
            !RBAC.canSubmitLanguageOrFolkloreReview(actor.role) &&
            !RBAC.canCreateOrEditRecord(actor.role)
          ) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to change event status.`,
            });
            return;
          }
          const eventId = decodeURIComponent(adminEventStatusMatch[1]);
          const body = await readJsonBody(req);
          if (
            body.status === "PUBLISHED" &&
            !RBAC.canPublishRecord(actor.role) &&
            !RBAC.canSubmitLanguageOrFolkloreReview(actor.role)
          ) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not authorized to publish cultural events.`,
              code: "FORBIDDEN_ROLE",
            });
            return;
          }
          try {
            const updated = repo.updateCulturalEventStatus(
              eventId,
              body.status || "DRAFT",
              body.scheduleStatus,
              body.cancellationReason
            );
            sendJson(res, 200, { event: updated });
          } catch (err) {
            if (err instanceof ConsentGateError) {
              sendJson(res, 403, {
                error: err.message,
                code: "EVENT_PUBLICATION_BLOCKED",
                reasons: err.reasons,
              });
              return;
            }
            throw err;
          }
          return;
        }

        const adminEventMatch = pathname.match(
          /^\/api\/v1\/admin\/events\/([^/]+)$/
        );
        if (adminEventMatch) {
          const eventId = decodeURIComponent(adminEventMatch[1]);
          if (method === "GET") {
            const evt = repo.getAdminEventById(eventId);
            if (!evt) {
              sendJson(res, 404, { error: "Cultural event not found." });
              return;
            }
            sendJson(res, 200, { event: evt });
            return;
          }

          if (method === "PATCH") {
            if (
              !RBAC.canCreateOrEditRecord(actor.role) &&
              !RBAC.canSubmitLanguageOrFolkloreReview(actor.role)
            ) {
              sendJson(res, 403, {
                error: `Role "${actor.role}" is not permitted to update cultural events.`,
              });
              return;
            }
            const body = await readJsonBody(req);
            const updated = repo.updateCulturalEvent(eventId, body, actor);
            sendJson(res, 200, { event: updated });
            return;
          }
        }

        if (pathname === "/api/v1/admin/enquiries" && method === "GET") {
          sendJson(res, 200, { enquiries: repo.listCommunityEnquiries() });
          return;
        }

        const adminEnquiryMatch = pathname.match(
          /^\/api\/v1\/admin\/enquiries\/([^/]+)$/
        );
        if (adminEnquiryMatch && method === "PATCH") {
          const enquiryId = decodeURIComponent(adminEnquiryMatch[1]);
          const body = await readJsonBody(req);
          const updated = repo.updateCommunityEnquiryStatus(
            enquiryId,
            body.status || "REVIEWED"
          );
          sendJson(res, 200, { enquiry: updated });
          return;
        }

        if (pathname === "/api/v1/admin/traditions" && method === "GET") {
          sendJson(res, 200, { traditions: repo.listAdminTraditions() });
          return;
        }

        if (pathname === "/api/v1/admin/traditions" && method === "POST") {
          if (!RBAC.canCreateOrEditRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to create traditions.`,
            });
            return;
          }
          const body = await readJsonBody(req);
          if (!body.nameEn || !body.summary) {
            sendJson(res, 400, {
              error: "nameEn and summary are required.",
            });
            return;
          }
          const tradition = repo.createTradition(body, actor);
          sendJson(res, 201, { tradition });
          return;
        }

        const adminTraditionPlacesMatch = pathname.match(
          /^\/api\/v1\/admin\/traditions\/([^/]+)\/places$/
        );
        if (adminTraditionPlacesMatch && method === "POST") {
          if (!RBAC.canCreateOrEditRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to link tradition places.`,
            });
            return;
          }
          const traditionId = decodeURIComponent(adminTraditionPlacesMatch[1]);
          const body = await readJsonBody(req);
          if (!body.locationId || !body.stateId) {
            sendJson(res, 400, {
              error: "locationId and stateId are required.",
            });
            return;
          }
          const association = repo.addTraditionPlaceAssociation({
            traditionId,
            locationId: String(body.locationId),
            stateId: String(body.stateId),
            districtId: body.districtId ? String(body.districtId) : null,
            relationshipRole:
              body.relationshipRole || "PRIMARY_PRACTICE_REGION",
            regionalVariantName: String(body.regionalVariantName || ""),
            notes: String(body.notes || ""),
            isPrimary: Boolean(body.isPrimary),
          });
          sendJson(res, 201, { association });
          return;
        }

        const adminTradPlaceDeleteMatch = pathname.match(
          /^\/api\/v1\/admin\/tradition-places\/([^/]+)$/
        );
        if (adminTradPlaceDeleteMatch && method === "DELETE") {
          if (!RBAC.canCreateOrEditRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to remove tradition places.`,
            });
            return;
          }
          const assocId = decodeURIComponent(adminTradPlaceDeleteMatch[1]);
          repo.removeTraditionPlaceAssociation(assocId);
          sendJson(res, 200, { success: true });
          return;
        }

        const adminTraditionMatch = pathname.match(
          /^\/api\/v1\/admin\/traditions\/([^/]+)$/
        );
        if (adminTraditionMatch && method === "PATCH") {
          if (
            !RBAC.canCreateOrEditRecord(actor.role) &&
            !RBAC.canSubmitLanguageOrFolkloreReview(actor.role)
          ) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to update traditions.`,
            });
            return;
          }
          const traditionId = decodeURIComponent(adminTraditionMatch[1]);
          const body = await readJsonBody(req);
          const tradition = repo.updateTradition(traditionId, body, actor);
          sendJson(res, 200, { tradition });
          return;
        }

        if (pathname === "/api/v1/admin/sources" && method === "GET") {
          sendJson(res, 200, { sources: repo.listAdminSources() });
          return;
        }

        if (pathname === "/api/v1/admin/sources" && method === "POST") {
          if (
            !RBAC.canCreateOrEditRecord(actor.role) &&
            !RBAC.canSubmitLanguageOrFolkloreReview(actor.role)
          ) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to add source citations.`,
            });
            return;
          }
          const body = await readJsonBody(req);
          if (!body.sourceTitle || !body.sourceUrl) {
            sendJson(res, 400, {
              error: "sourceTitle and sourceUrl are required.",
            });
            return;
          }
          const source = repo.createSourceCitation(body, actor);
          sendJson(res, 201, { source });
          return;
        }

        if (pathname === "/api/v1/admin/media-assets" && method === "GET") {
          sendJson(res, 200, { mediaAssets: repo.listAdminMediaAssets() });
          return;
        }

        if (pathname === "/api/v1/admin/media-assets" && method === "POST") {
          if (!RBAC.canCreateOrEditRecord(actor.role)) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to register media assets.`,
            });
            return;
          }
          const body = await readJsonBody(req);
          if (!body.title) {
            sendJson(res, 400, {
              error: "Media asset title is required.",
            });
            return;
          }
          const mediaAsset = repo.createMediaAsset(body, actor);
          sendJson(res, 201, { mediaAsset });
          return;
        }

        const adminMediaMatch = pathname.match(
          /^\/api\/v1\/admin\/media-assets\/([^/]+)$/
        );
        if (adminMediaMatch && method === "PATCH") {
          if (
            !RBAC.canCreateOrEditRecord(actor.role) &&
            !RBAC.canPublishRecord(actor.role)
          ) {
            sendJson(res, 403, {
              error: `Role "${actor.role}" is not permitted to update media assets.`,
            });
            return;
          }
          const mediaId = decodeURIComponent(adminMediaMatch[1]);
          const body = await readJsonBody(req);
          try {
            const mediaAsset = repo.updateMediaAsset(mediaId, body, actor);
            sendJson(res, 200, { mediaAsset });
          } catch (err) {
            if (err instanceof ConsentGateError) {
              sendJson(res, 403, {
                error: err.message,
                code: "MEDIA_PUBLICATION_BLOCKED",
                reasons: err.reasons,
              });
              return;
            }
            throw err;
          }
          return;
        }
      }

      sendJson(res, 404, { error: `API endpoint not found: ${method} ${pathname}` });
    } catch (err: any) {
      sendJson(res, 500, {
        error: err?.message || "Internal server error",
      });
    }
  };
}
