import { describe, expect, it } from "vitest";
import { minecraftSeedToBigInt } from "@/lib/seed-terrain";

describe("minecraftSeedToBigInt", () => {
  it("preserves signed numeric Java seeds as 64-bit values", () => {
    expect(minecraftSeedToBigInt("-1")).toBe(BigInt("18446744073709551615"));
    expect(minecraftSeedToBigInt("1234")).toBe(BigInt(1234));
  });

  it("uses Minecraft's Java string hash fallback", () => {
    expect(minecraftSeedToBigInt("hello")).toBe(BigInt(99_162_322));
  });
});
