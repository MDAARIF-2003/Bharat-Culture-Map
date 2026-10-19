import crypto from "node:crypto";
import type { IncomingMessage } from "node:http";
import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  PUBLIC_REGISTRATION_PERSONAS,
  PublicRegistrationPersona,
  STAFF_ROLES,
  UserRole,
} from "../../../shared/const";
import { AccountPersonaType, UserAccount } from "../../../shared/contracts";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto
    .scryptSync(password, salt, SCRYPT_KEYLEN)
    .toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const [, salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const original = Buffer.from(originalHex, "hex");
  if (derived.length !== original.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, original);
}

/**
 * Validates password strength for user registration, bootstrap, and password changes.
 * Requires at least 8 characters, at least one letter, and at least one number or symbol.
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  reason?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      reason: "Password must be at least 8 characters long.",
    };
  }
  if (password.length > 128) {
    return {
      valid: false,
      reason: "Password must not exceed 128 characters.",
    };
  }
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigitOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(
    password
  );
  if (!hasLetter || !hasDigitOrSymbol) {
    return {
      valid: false,
      reason:
        "Password must include at least one letter and at least one number or special character.",
    };
  }
  return { valid: true };
}

/**
 * Returns the HMAC session secret.
 * In production (`NODE_ENV === "production"`), requires `SESSION_SECRET` to be explicitly
 * configured with at least 32 characters and refuses insecure defaults.
 */
export function getSessionSecret(): string {
  const configured = (process.env.SESSION_SECRET || "").trim();
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    if (
      !configured ||
      configured.length < 32 ||
      configured.includes("dev_ephemeral_secret") ||
      configured.includes("replace_in_production")
    ) {
      throw new Error(
        "SECURITY_CONFIG_ERROR: Production environment requires a strong SESSION_SECRET of at least 32 characters."
      );
    }
    return configured;
  }
  return (
    configured || "dev_ephemeral_secret_replace_in_production_via_env_32b"
  );
}

/**
 * Determines whether demo-account quick-login and public demo credentials are enabled.
 * - In production (`NODE_ENV === "production"`): DISABLED by default unless `ENABLE_DEMO_ACCOUNTS === "true"`.
 * - In development/test: ENABLED by default unless `ENABLE_DEMO_ACCOUNTS === "false"`.
 */
export function isDemoModeEnabled(): boolean {
  const envFlag = (process.env.ENABLE_DEMO_ACCOUNTS || "").trim().toLowerCase();
  if (process.env.NODE_ENV === "production") {
    return envFlag === "true" || envFlag === "1";
  }
  if (envFlag === "false" || envFlag === "0") {
    return false;
  }
  return true;
}

/**
 * Builds an HTTP Set-Cookie header value with HttpOnly, SameSite=Lax, and automatic
 * Secure flag in production or behind an HTTPS proxy.
 */
export function buildSessionCookieHeader(
  token: string,
  maxAgeMs = ONE_YEAR_MS,
  req?: IncomingMessage
): string {
  const maxAgeSec = Math.max(0, Math.floor(maxAgeMs / 1000));
  const protoHeader = String(req?.headers["x-forwarded-proto"] || "").toLowerCase();
  const isSecure =
    process.env.NODE_ENV === "production" || protoHeader === "https";
  const encodedVal = token ? encodeURIComponent(token) : "";
  return `${COOKIE_NAME}=${encodedVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${
    isSecure ? "; Secure" : ""
  }`;
}

// =============================================================================
// IN-MEMORY SLIDING-WINDOW RATE LIMITER FOR AUTH ENDPOINTS
// =============================================================================

interface RateLimitBucket {
  timestamps: number[];
}

const authRateBuckets = new Map<string, RateLimitBucket>();

export function checkAuthRateLimit(
  req: IncomingMessage,
  actionKey: string,
  maxRequests = Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  windowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000)
): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const ip = forwarded || req.socket?.remoteAddress || "127.0.0.1";
  const bucketKey = `${ip}:${actionKey}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  let bucket = authRateBuckets.get(bucketKey);
  if (!bucket) {
    bucket = { timestamps: [] };
    authRateBuckets.set(bucketKey, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - bucket.timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function resetAuthRateLimitBuckets(): void {
  authRateBuckets.clear();
}

export interface SessionTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
  exp: number;
}

export function signSessionToken(
  user: UserAccount,
  ttlMs = 1000 * 60 * 60 * 12
): string {
  const payload: SessionTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionTokenPayload;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(
  cookieHeader?: string
): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const idx = part.indexOf("=");
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      acc[key] = val;
    }
    return acc;
  }, {});
}

export function extractTokenFromRequest(headers: {
  authorization?: string;
  cookie?: string;
}): string | null {
  if (headers.authorization?.startsWith("Bearer ")) {
    return headers.authorization.slice(7).trim();
  }
  const cookies = parseCookieHeader(headers.cookie);
  return cookies[COOKIE_NAME] || null;
}

/**
 * Validates and normalizes a public registration persona.
 * Never permits `SUPER_ADMIN` or `FIELD_RESEARCHER` during public registration.
 */
export function sanitizePublicPersona(
  requested?: string | null
): PublicRegistrationPersona {
  const clean = String(requested || "BUYER")
    .trim()
    .toUpperCase();
  if (
    (PUBLIC_REGISTRATION_PERSONAS as readonly string[]).includes(clean)
  ) {
    return clean as PublicRegistrationPersona;
  }
  return "BUYER";
}

export function defaultPersonaForRole(
  role: UserRole,
  explicitPersona?: AccountPersonaType
): AccountPersonaType {
  if (explicitPersona) return explicitPersona;
  if (role === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (role === "FIELD_RESEARCHER") return "FIELD_RESEARCHER";
  if (role === "PRACTITIONER_APPROVER") return "PRACTITIONER";
  return "VISITOR";
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX (LEAST-PRIVILEGED)
// =============================================================================

export const RBAC = {
  isStaffRole(role: UserRole): boolean {
    return (STAFF_ROLES as readonly string[]).includes(role);
  },
  canCreateOrEditRecord(role: UserRole): boolean {
    return ["SUPER_ADMIN", "FIELD_RESEARCHER"].includes(role);
  },
  canRecordInitialConsent(role: UserRole): boolean {
    return [
      "SUPER_ADMIN",
      "FIELD_RESEARCHER",
      "PRACTITIONER_APPROVER",
    ].includes(role);
  },
  canSubmitLanguageOrFolkloreReview(role: UserRole): boolean {
    return [
      "SUPER_ADMIN",
      "LANGUAGE_REVIEWER",
      "FOLKLORE_REVIEWER",
    ].includes(role);
  },
  canRecordPractitionerApproval(role: UserRole): boolean {
    return ["SUPER_ADMIN", "PRACTITIONER_APPROVER"].includes(role);
  },
  canPublishRecord(role: UserRole): boolean {
    return ["SUPER_ADMIN", "PRACTITIONER_APPROVER"].includes(role);
  },
  canRestrictOrWithdrawRecord(role: UserRole): boolean {
    return [
      "SUPER_ADMIN",
      "PRACTITIONER_APPROVER",
      "FIELD_RESEARCHER",
    ].includes(role);
  },
  canModerateEcosystemOrHerCraft(role: UserRole): boolean {
    return [
      "SUPER_ADMIN",
      "FIELD_RESEARCHER",
      "FOLKLORE_REVIEWER",
      "PRACTITIONER_APPROVER",
    ].includes(role);
  },
  canManageUsers(role: UserRole): boolean {
    return role === "SUPER_ADMIN";
  },
};
