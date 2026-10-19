import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { CultureMapRepository } from "../db/repository";
import type { UserAccount } from "../../shared/contracts";

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"]);

/**
 * Resolves the upload directory paths.
 * Writes to client/public/uploads in dev, and dist/public/uploads if it exists.
 */
export function getUploadDirectories(): { primaryDir: string; mirrorDir?: string } {
  const primaryDir = path.resolve(process.cwd(), "client", "public", "uploads");
  const mirrorDir = path.resolve(process.cwd(), "dist", "public", "uploads");

  if (!fs.existsSync(primaryDir)) {
    fs.mkdirSync(primaryDir, { recursive: true });
  }

  return {
    primaryDir,
    mirrorDir: fs.existsSync(path.dirname(mirrorDir)) ? mirrorDir : undefined,
  };
}

/**
 * Handles image file upload via base64 JSON payload.
 * Supports up to 20MB files for high-resolution photography.
 */
export async function handleImageUpload(
  body: { fileData?: string; fileName?: string; mimeType?: string },
  user: UserAccount | null
): Promise<UploadResult> {
  if (!body.fileData || typeof body.fileData !== "string") {
    throw new Error("Missing fileData payload (expected base64 data URL)");
  }

  // Extract mime type and base64 string
  const matches = body.fileData.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
  let mimeType = body.mimeType || "image/jpeg";
  let base64Data = body.fileData;

  if (matches && matches[1] && matches[2]) {
    mimeType = matches[1];
    base64Data = matches[2];
  }

  // Determine file extension
  let ext = ".jpg";
  if (mimeType.includes("png")) ext = ".png";
  else if (mimeType.includes("webp")) ext = ".webp";
  else if (mimeType.includes("svg")) ext = ".svg";
  else if (mimeType.includes("gif")) ext = ".gif";
  else if (body.fileName) {
    const rawExt = path.extname(body.fileName).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(rawExt)) {
      ext = rawExt;
    }
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File extension ${ext} is not supported. Use JPG, PNG, WebP, or SVG.`);
  }

  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > 20 * 1024 * 1024) {
    throw new Error("File size exceeds 20MB limit.");
  }

  const safeStem = (body.fileName || "culture")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 32);

  const safeFileName = `${safeStem}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
  const { primaryDir, mirrorDir } = getUploadDirectories();

  const primaryPath = path.join(primaryDir, safeFileName);
  fs.writeFileSync(primaryPath, buffer);

  if (mirrorDir) {
    if (!fs.existsSync(mirrorDir)) {
      fs.mkdirSync(mirrorDir, { recursive: true });
    }
    fs.writeFileSync(path.join(mirrorDir, safeFileName), buffer);
  }

  return {
    url: `/uploads/${safeFileName}`,
    fileName: safeFileName,
    size: buffer.length,
    mimeType,
  };
}
