import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const storageRoot = path.resolve(
  process.env.DOCUMENT_STORAGE_PATH || path.join(process.cwd(), "storage", "documents"),
);
const maxFileSize = Number(process.env.MAX_DOCUMENT_SIZE_BYTES || 10 * 1024 * 1024);

export function getMaxDocumentSize() {
  return maxFileSize;
}

export function isPdf(buffer) {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function savePdf(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || !isPdf(buffer)) {
    throw new Error("The uploaded file is not a valid PDF");
  }
  if (buffer.length > maxFileSize) {
    throw new Error("The uploaded file exceeds the maximum allowed size");
  }
  await mkdir(storageRoot, { recursive: true });
  const storageKey = `${randomUUID()}.pdf`;
  const absolutePath = path.resolve(storageRoot, storageKey);
  await writeFile(absolutePath, buffer, { flag: "wx" });
  return { storageKey, absolutePath };
}

export function resolveStoragePath(storageKey) {
  if (typeof storageKey !== "string" || path.basename(storageKey) !== storageKey) {
    throw new Error("Invalid document storage key");
  }
  const resolved = path.resolve(storageRoot, storageKey);
  if (path.dirname(resolved) !== storageRoot) {
    throw new Error("Invalid document storage path");
  }
  return resolved;
}

export async function removePdf(storageKey) {
  await rm(resolveStoragePath(storageKey), { force: true });
}

export async function getPdfInfo(storageKey) {
  const absolutePath = resolveStoragePath(storageKey);
  const metadata = await stat(absolutePath);
  return { absolutePath, size: metadata.size };
}

export function streamPdf(absolutePath) {
  return createReadStream(absolutePath);
}

export async function readPdf(storageKey) {
  return readFile(resolveStoragePath(storageKey));
}
