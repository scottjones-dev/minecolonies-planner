import { describe, expect, it } from "vitest";
import { CONTACT_LIMITS, validateContactMessage } from "@/lib/contact";

describe("validateContactMessage", () => {
  it("normalizes and accepts a complete message", () => {
    expect(
      validateContactMessage({
        name: "  Scott Jones  ",
        email: "  SCOTT@example.com ",
        message: "  I found a blueprint that needs another look.  ",
        website: "",
      }),
    ).toEqual({
      ok: true,
      data: {
        name: "Scott Jones",
        email: "scott@example.com",
        message: "I found a blueprint that needs another look.",
        website: "",
      },
    });
  });

  it("preserves a honeypot value for the route to discard", () => {
    const result = validateContactMessage({
      name: "Scott Jones",
      email: "scott@example.com",
      message: "This message is long enough to pass validation.",
      website: "https://spam.example",
    });

    expect(result.ok && result.data.website).toBe("https://spam.example");
  });

  it.each([
    [null, "Please complete the contact form."],
    [
      {},
      `Name must be ${CONTACT_LIMITS.nameMin}–${CONTACT_LIMITS.nameMax} characters.`,
    ],
    [
      {
        name: "Scott",
        email: "not-an-email",
        message: "A message that is definitely long enough.",
      },
      "Enter a valid email address.",
    ],
    [
      { name: "Scott", email: "scott@example.com", message: "Too short" },
      `Message must be ${CONTACT_LIMITS.messageMin}–${CONTACT_LIMITS.messageMax.toLocaleString()} characters.`,
    ],
  ])("rejects invalid input %#", (payload, message) => {
    expect(validateContactMessage(payload)).toEqual({ ok: false, message });
  });
});
