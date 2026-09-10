import { createHash, timingSafeEqual } from "node:crypto";
export function hashToken(value: string) { return createHash("sha256").update(value).digest("hex"); }
function sameSecret(expected: string | undefined, received: string) { if (!expected || !received) return false; const left = Buffer.from(expected); const right = Buffer.from(received); return left.length === right.length && timingSafeEqual(left, right); }
export function isAdmin(request: Request) { return sameSecret(process.env.ADMIN_KEY, request.headers.get("x-admin-key") || ""); }
export function validAccessCode(value: string) { return process.env.SUBMISSION_ACCESS_CODE ? sameSecret(process.env.SUBMISSION_ACCESS_CODE, value) : true; }
