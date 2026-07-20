import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/contact/route";

const originalEnvironment = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function request(body: unknown, options: { origin?: string; ip: string }) {
  return new Request("https://planner.example.com/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: options.origin ?? "https://planner.example.com",
      "x-forwarded-for": options.ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  it("rejects a cross-origin request", async () => {
    const response = await POST(
      request({}, { origin: "https://attacker.example", ip: "test-origin" }),
    );
    expect(response.status).toBe(403);
  });

  it("returns validation errors without contacting Resend", async () => {
    const response = await POST(request({}, { ip: "test-validation" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Name must be 2–80 characters.",
    });
  });

  it("fails safely when production email settings are absent", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_TO_EMAIL;
    delete process.env.CONTACT_FROM_EMAIL;

    const response = await POST(
      request(
        {
          name: "Scott Jones",
          email: "scott@example.com",
          message: "This is a valid project message for the contact form.",
          website: "",
        },
        { ip: "test-config" },
      ),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: "Contact email is not configured yet. Please try again later.",
    });
  });

  it("silently accepts honeypot submissions", async () => {
    const response = await POST(
      request(
        {
          name: "Spam Bot",
          email: "spam@example.com",
          message: "This automated message is long enough to look valid.",
          website: "https://spam.example",
        },
        { ip: "test-honeypot" },
      ),
    );

    expect(response.status).toBe(200);
  });

  it("throttles the sixth submission from one client", async () => {
    const payload = {
      name: "Spam Bot",
      email: "spam@example.com",
      message: "This automated message is long enough to look valid.",
      website: "https://spam.example",
    };

    for (let index = 0; index < 5; index += 1) {
      const response = await POST(request(payload, { ip: "test-throttle" }));
      expect(response.status).toBe(200);
    }

    const response = await POST(request(payload, { ip: "test-throttle" }));
    expect(response.status).toBe(429);
  });
});
