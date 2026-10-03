import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "spoticristo-recording-session";
const SESSION_SECONDS = 30 * 60;

function secret() {
  const value = process.env.RECORDING_AUTH_SECRET;
  if (!value) throw new Error("RECORDING_AUTH_SECRET não foi configurado.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function verify(value: string, signature: string) {
  const expected = sign(value);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function verifyPassword(password: unknown) {
  const expected = process.env.RECORDING_PASSWORD;
  if (!expected || typeof password !== "string") return false;
  const expectedBuffer = Buffer.from(expected);
  const passwordBuffer = Buffer.from(password);
  return expectedBuffer.length === passwordBuffer.length && timingSafeEqual(expectedBuffer, passwordBuffer);
}

export function createSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `session.${expiresAt}`;
  return { value: `${payload}.${sign(payload)}`, expiresAt };
}

export function hasValidSession(value?: string) {
  if (!value) return false;
  const [kind, expiresAt, signature] = value.split(".");
  if (kind !== "session" || !expiresAt || !signature || Number(expiresAt) < Date.now() / 1000) return false;
  return verify(`${kind}.${expiresAt}`, signature);
}

export function createOwnershipProof(albumId: string, recordId: string) {
  const payload = `record.${albumId}.${recordId}`;
  return `${payload}.${sign(payload)}`;
}

export function hasValidOwnershipProof(proof: unknown, albumId: string, recordId: string) {
  if (typeof proof !== "string") return false;
  const [kind, proofAlbumId, proofRecordId, signature] = proof.split(".");
  if (kind !== "record" || proofAlbumId !== albumId || proofRecordId !== recordId || !signature) return false;
  return verify(`${kind}.${proofAlbumId}.${proofRecordId}`, signature);
}

export { COOKIE_NAME, SESSION_SECONDS };
