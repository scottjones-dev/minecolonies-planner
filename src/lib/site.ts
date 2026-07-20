export const siteConfig = {
  name: "MineColonies Planner",
  shortName: "Colony Planner",
  description:
    "Plan MineColonies settlements with source-backed blueprints, block-accurate footprints, square chunk claims, commute checks, and guard coverage.",
  repositoryUrl: "https://github.com/scottjones-dev/minecolonies-planner",
  author: {
    name: "Scott William Jones",
    url: "https://github.com/scottjones-dev",
    website: "https://alicesystems.co.uk",
  },
} as const;

export function getSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    try {
      return new URL(configuredUrl);
    } catch {
      // A safe local URL keeps metadata generation working while configuration
      // errors remain visible in the deployment checklist.
    }
  }

  return new URL("http://localhost:3000");
}
