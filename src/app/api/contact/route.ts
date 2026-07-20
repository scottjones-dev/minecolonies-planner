import { Resend } from "resend";
import { validateContactMessage } from "@/lib/contact";

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1_000;
const MAX_REQUESTS = 5;
const requestLog = new Map<string, number[]>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter(
    (timestamp) => timestamp > now - WINDOW_MS,
  );

  if (recent.length >= MAX_REQUESTS) {
    requestLog.set(key, recent);
    return true;
  }

  recent.push(now);
  requestLog.set(key, recent);
  return false;
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json(
      { message: "Request origin was rejected." },
      { status: 403 },
    );
  }

  if (isRateLimited(clientKey(request))) {
    return Response.json(
      { message: "Too many messages. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  const result = validateContactMessage(payload);
  if (!result.ok) {
    return Response.json({ message: result.message }, { status: 400 });
  }

  // Quietly accept honeypot submissions without sending mail.
  if (result.data.website) {
    return Response.json({ message: "Thanks — your message has been sent." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error("Contact form is missing Resend environment variables.");
    return Response.json(
      {
        message: "Contact email is not configured yet. Please try again later.",
      },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);
  const safeName = result.data.name.replace(/[\r\n]+/g, " ");
  try {
    const { error } = await resend.emails.send(
      {
        from,
        to,
        replyTo: result.data.email,
        subject: `Planner message from ${safeName}`,
        text: [
          `Name: ${result.data.name}`,
          `Email: ${result.data.email}`,
          "",
          result.data.message,
        ].join("\n"),
      },
      { idempotencyKey: crypto.randomUUID() },
    );

    if (!error) {
      return Response.json({ message: "Thanks — your message has been sent." });
    }

    console.error("Resend rejected a contact message:", error.name);
  } catch (error) {
    console.error(
      "Resend contact delivery failed:",
      error instanceof Error ? error.name : "unknown error",
    );
  }

  return Response.json(
    { message: "Your message could not be sent. Please try again." },
    { status: 502 },
  );
}
