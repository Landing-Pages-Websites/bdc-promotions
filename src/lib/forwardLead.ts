import { siteConfig } from "@/site.config";
import type { LeadContext } from "@/lib/megaLeadContext";
import type { ValidatedLeadFields } from "@/lib/leadValidation";

const SUBMIT_ENDPOINT = "https://analytics.gomega.ai/submission/submit";

export interface KeystoneSubmitResult {
  ok: boolean;
  id?: string;
}

export async function forwardLeadToKeystone(
  fields: ValidatedLeadFields,
  context: LeadContext,
): Promise<KeystoneSubmitResult> {
  const payload = {
    ...context,
    customer_id: siteConfig.megaCustomerId,
    site_id: siteConfig.megaSiteId,
    source_provider: siteConfig.sourceProvider,
    form_data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      phone: fields.phone,
      ...fields.extra,
    },
  };

  const response = await fetch(SUBMIT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Keystone HTTP ${response.status}`);
  }

  const json: unknown = await response.json();
  if (
    typeof json !== "object" ||
    json === null ||
    !("ok" in json) ||
    (json as { ok: unknown }).ok !== true
  ) {
    throw new Error("Keystone rejected the submission");
  }
  const id =
    "id" in json && typeof (json as { id: unknown }).id === "string"
      ? (json as { id: string }).id
      : undefined;
  return { ok: true, id };
}
