import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  discoverJourneyMapTileSets,
  importJourneyMapArchive,
  selectJourneyMapTileSet,
} from "@/lib/journeymap-import";

const png = new Uint8Array([137, 80, 78, 71]);

describe("JourneyMap tile discovery", () => {
  it("discovers signed 512-block tile coordinates by map directory", () => {
    const sets = discoverJourneyMapTileSets({
      "backup/world/overworld/day/-2,3.png": png,
      "backup/world/overworld/day/-1,3.png": png,
      "backup/world/overworld/topo/0,0.png": png,
      "backup/world/waypoints.json": png,
    });

    expect(sets).toHaveLength(2);
    expect(sets[0]).toMatchObject({
      dimension: "overworld",
      mapType: "day",
      minX: -2,
      maxX: -1,
      minZ: 3,
      maxZ: 3,
    });
  });

  it("prefers the day surface for the requested dimension", () => {
    const sets = discoverJourneyMapTileSets({
      "world/overworld/topo/0,0.png": png,
      "world/overworld/day/0,0.png": png,
      "world/the_nether/day/0,0.png": png,
    });
    expect(selectJourneyMapTileSet(sets, "overworld")?.mapType).toBe("day");
    expect(selectJourneyMapTileSet(sets, "nether")?.dimension).toBe("nether");
    expect(selectJourneyMapTileSet(sets, "end")).toBeNull();
  });

  it("reads JourneyMap ZIP paths and reports a missing requested dimension", async () => {
    const archive = zipSync({
      "world/overworld/day/0,0.png": png,
      "world/waypoints.json": new TextEncoder().encode("{}"),
    });
    const file = new File([archive], "journeymap.zip", {
      type: "application/zip",
    });

    await expect(importJourneyMapArchive(file, "nether")).rejects.toThrow(
      "No nether JourneyMap PNG tiles",
    );
  });
});
