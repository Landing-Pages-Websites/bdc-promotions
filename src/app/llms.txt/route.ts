import { siteRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import { managedHome } from "@/content/managed-site";

/** Serves /llms.txt — a machine-readable site summary for LLM crawlers. */
export function GET(): Response {
  const { identity, metadata } = managedHome.seo;
  const pageLines = siteRoutes.map(
    (route) => `- [${route.title}](${absoluteUrl(route.path)})`,
  );

  const body = [
    `# ${identity.displayName}`,
    "",
    `> ${metadata.description}`,
    "",
    "## Pages",
    "",
    ...pageLines,
    "",
    "## Contact",
    "",
    `- Email: ${identity.email}`,
    `- Phone: ${identity.telephone}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
