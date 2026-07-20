import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSiteUrl", () => {
  it("uses the configured canonical origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://planner.example.com/path");
    expect(getSiteUrl().toString()).toBe("https://planner.example.com/path");
  });

  it("uses localhost when no deployment URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });

  it("rejects an invalid production URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-url");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getSiteUrl()).toThrow(
      "NEXT_PUBLIC_SITE_URL must be an absolute URL",
    );
  });
});
