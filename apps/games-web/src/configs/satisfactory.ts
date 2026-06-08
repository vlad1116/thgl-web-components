import { resolveAppConfig } from "@repo/lib";

export const satisfactory = resolveAppConfig({
  name: "satisfactory",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  keywords: ["Mercer Spheres", "Resource Nodes", "Power Slugs", "Hard Drives"],
});
