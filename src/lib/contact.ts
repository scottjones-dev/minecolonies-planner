export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 254,
  messageMin: 20,
  messageMax: 5_000,
} as const;

export type ContactMessage = {
  name: string;
  email: string;
  message: string;
  website: string;
};

export type ContactValidationResult =
  | { ok: true; data: ContactMessage }
  | { ok: false; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateContactMessage(
  payload: unknown,
): ContactValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "Please complete the contact form." };
  }

  const record = payload as Record<string, unknown>;
  const data: ContactMessage = {
    name: readString(record.name),
    email: readString(record.email).toLowerCase(),
    message: readString(record.message),
    website: readString(record.website),
  };

  if (
    data.name.length < CONTACT_LIMITS.nameMin ||
    data.name.length > CONTACT_LIMITS.nameMax
  ) {
    return {
      ok: false,
      message: `Name must be ${CONTACT_LIMITS.nameMin}–${CONTACT_LIMITS.nameMax} characters.`,
    };
  }

  if (
    data.email.length > CONTACT_LIMITS.emailMax ||
    !emailPattern.test(data.email)
  ) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (
    data.message.length < CONTACT_LIMITS.messageMin ||
    data.message.length > CONTACT_LIMITS.messageMax
  ) {
    return {
      ok: false,
      message: `Message must be ${CONTACT_LIMITS.messageMin}–${CONTACT_LIMITS.messageMax.toLocaleString()} characters.`,
    };
  }

  return { ok: true, data };
}
