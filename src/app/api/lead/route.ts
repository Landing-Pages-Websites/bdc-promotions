import { NextRequest, NextResponse } from "next/server";
import { HONEYPOT_FIELD_NAME, parseLeadFields } from "@/lib/leadValidation";
import { forwardLeadToKeystone } from "@/lib/forwardLead";
import { verifyTurnstileToken } from "@/lib/turnstile";
import type { LeadContext } from "@/lib/megaLeadContext";

export const runtime = "nodejs";

const SUBMIT_ERROR =
  "Something went wrong sending your request. Please check your connection and try again.";

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip");
}

function asLeadContext(value: unknown): LeadContext | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.url !== "string") return null;
  if (typeof record.session_id !== "string") return null;
  if (typeof record.visitor_id !== "string") return null;
  return record as unknown as LeadContext;
}

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  if (typeof body !== "object" || body === null) {
    return jsonError("Invalid request.", 400);
  }
  const payload = body as Record<string, unknown>;

  const honeypot =
    typeof payload[HONEYPOT_FIELD_NAME] === "string"
      ? payload[HONEYPOT_FIELD_NAME].trim()
      : "";
  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const parsed = parseLeadFields(payload);
  if (!parsed.ok) {
    return jsonError(parsed.error, 400);
  }

  const challenge = await verifyTurnstileToken(
    payload.turnstileToken,
    clientIp(request),
  );
  if (!challenge.ok) {
    return jsonError(challenge.error, 403);
  }

  const context = asLeadContext(payload.context);
  if (!context) {
    return jsonError("Invalid request.", 400);
  }

  try {
    const result = await forwardLeadToKeystone(parsed.fields, context);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Keystone lead submit failed", error);
    return jsonError(SUBMIT_ERROR, 502);
  }
}
