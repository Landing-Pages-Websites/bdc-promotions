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
}

const MAX_NAME = 200;

export function parseLeadFields(input: Record<string, unknown>): {
  ok: true;
  fields: ValidatedLeadFields;
} | { ok: false; error: string } {
  const firstName = typeof input.firstName === "string" ? input.firstName.trim() : "";
  const lastName = typeof input.lastName === "string" ? input.lastName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phoneRaw = typeof input.phone === "string" ? input.phone : "";

  if (!firstName || firstName.length > MAX_NAME) {
    return { ok: false, error: "Please enter your first name." };
  }
  if (!lastName || lastName.length > MAX_NAME) {
    return { ok: false, error: "Please enter your last name." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address (e.g. you@company.com)." };
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
    },
  };
}
