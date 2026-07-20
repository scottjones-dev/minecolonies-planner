import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MineColonies Planner",
    short_name: "Colony Planner",
    description:
      "A block-accurate, local-first MineColonies settlement planner.",
    start_url: "/planner",
    display: "standalone",
    background_color: "#f5f5ef",
    theme_color: "#0c1715",
    categories: ["games", "utilities"],
  };
}
