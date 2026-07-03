import { siteRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import { siteConfig } from "@/site.config";

/** Serves /llms.txt — a machine-readable site summary for LLM crawlers. */
export function GET(): Response {
  const pageLines = siteRoutes.map(
    (route) => `- [${route.title}](${absoluteUrl(route.path)})`,
  );

  const body = [
    `# ${siteConfig.businessName}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## Pages",
    "",
    ...pageLines,
    "",
    "## Contact",
    "",
    `- Email: ${siteConfig.contact.email}`,
    `- Phone: ${siteConfig.contact.phone}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
