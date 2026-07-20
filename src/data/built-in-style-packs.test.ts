import { describe, expect, it } from "vitest";
import {
  builtInStylePackManifest,
  getStylePackById,
  isBuiltInStylePackId,
  loadBuiltInStylePack,
} from "@/data";

describe("built-in MineColonies style packs", () => {
  it("lists all source packs without eagerly adapting every catalogue", () => {
    expect(builtInStylePackManifest).toHaveLength(23);
    expect(builtInStylePackManifest.map((stylePack) => stylePack.id)).toContain(
      "fortress",
    );
    expect(builtInStylePackManifest.map((stylePack) => stylePack.id)).toContain(
      "pagoda",
    );
    expect(isBuiltInStylePackId("ancientathens")).toBe(true);
    expect(isBuiltInStylePackId("not-a-pack")).toBe(false);
  });

  it("loads a selected pack on demand and registers it synchronously", async () => {
    expect(getStylePackById("pagoda")).toBeUndefined();

    const pagoda = await loadBuiltInStylePack("pagoda");

    expect(pagoda).toMatchObject({
      id: "pagoda",
      name: "Pagoda",
      source: "built-in",
    });
    expect(pagoda?.variants.length).toBeGreaterThan(100);
    expect(getStylePackById("pagoda")).toBe(pagoda);
  });
});
