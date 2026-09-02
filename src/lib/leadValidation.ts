import { MAX_UPLOAD_FILES, UPLOAD_KEYS_FIELD } from "./leadUploads";
/**
 * Website lead-field contract — same email/phone rules as landing-page-forms
 * Hard Rules #4 and #4b. Shared by the form UI, the submit hook, and `/api/lead`.
 */

export const EMAIL_PATTERN =
  "[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}";
export const EMAIL_REGEX = new RegExp(`^${EMAIL_PATTERN}$`);

export const HONEYPOT_FIELD_NAME = "company_website";

export const isValidEmail = (value: unknown): boolean =>
  typeof value === "string" && EMAIL_REGEX.test(value.trim());

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 10;
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export interface ValidatedLeadFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  extra: Record<string, string>;
  /** Storage keys for files already uploaded, in the order they were chosen. */
  uploadKeys: string[];
}

const MAX_NAME = 200;

/**
 * Storage keys the browser reports having uploaded.
 *
 * Only shape is checked. Whether a key really belongs to this site is not
 * knowable here and is not guessed at: MEGA attaches a file to a lead only when
 * the key's own customer segment matches the lead's customer, so a key from
 * anywhere else is discarded there rather than trusted here.
 *
 * Anything unexpected yields no keys, which costs the attachments and never the
 * enquiry.
 */
function parseUploadKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const keys: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    if (entry.length === 0 || entry.length > 512) continue;
    if (!entry.startsWith("lead-uploads/")) continue;
    if (entry.includes("..")) continue;
    keys.push(entry);
    if (keys.length >= MAX_UPLOAD_FILES) break;
  }
  return keys;
}

export function parseLeadFields(input: Record<string, unknown>):
  | {
      ok: true;
      fields: ValidatedLeadFields;
    }
  | { ok: false; error: string } {
  const firstName =
    typeof input.firstName === "string" ? input.firstName.trim() : "";
  const lastName =
    typeof input.lastName === "string" ? input.lastName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phoneRaw = typeof input.phone === "string" ? input.phone : "";

  if (!firstName || firstName.length > MAX_NAME) {
    return { ok: false, error: "Please enter your first name." };
  }
  if (!lastName || lastName.length > MAX_NAME) {
    return { ok: false, error: "Please enter your last name." };
  }
  if (!isValidEmail(email)) {
    return {
      ok: false,
      error: "Enter a valid email address (e.g. you@company.com).",
    };
  }
  if (!isValidPhone(phoneRaw)) {
    return { ok: false, error: "Please enter a valid 10-digit phone number." };
  }

  const reserved = new Set([
    "firstName",
    "lastName",
    "email",
    "phone",
    "turnstileToken",
    "context",
    "uploadKeys",
    "uploadCapability",
    "uploadSignedKeys",
    // Reserved so it can never arrive as an ordinary extra field. Upload keys
    // are forwarded under this name, and a client that could set it directly
    // would be naming stored objects rather than describing its own files.
    UPLOAD_KEYS_FIELD,
    HONEYPOT_FIELD_NAME,
  ]);
  const extra: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (reserved.has(key) || typeof value !== "string") continue;
    extra[key] = value;
  }

  return {
    ok: true,
    fields: {
      firstName,
      lastName,
      email,
      phone: phoneDigits(phoneRaw),
      extra,
      uploadKeys: parseUploadKeys(input.uploadKeys),
    },
  };
}
