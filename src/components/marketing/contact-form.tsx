"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_LIMITS } from "@/lib/contact";

type FormStatus = {
  kind: "idle" | "sending" | "success" | "error";
  message: string;
};

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>({
    kind: "idle",
    message: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus({ kind: "sending", message: "Sending your message…" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "Your message could not be sent.");
      }

      form.reset();
      setStatus({
        kind: "success",
        message: result.message ?? "Thanks — your message has been sent.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Your message could not be sent.",
      });
    }
  }

  const isSending = status.kind === "sending";

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            minLength={CONTACT_LIMITS.nameMin}
            maxLength={CONTACT_LIMITS.nameMax}
            placeholder="Your name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={CONTACT_LIMITS.emailMax}
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <Label htmlFor="contact-website">Website</Label>
        <Input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contact-message">What would you like to share?</Label>
        <Textarea
          id="contact-message"
          name="message"
          className="min-h-36 resize-y rounded-2xl bg-white/70"
          minLength={CONTACT_LIMITS.messageMin}
          maxLength={CONTACT_LIMITS.messageMax}
          placeholder="Tell me about a bug, an idea, or the colony you are planning…"
          required
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={
            status.kind === "error"
              ? "text-sm text-destructive"
              : status.kind === "success"
                ? "text-sm text-emerald-700"
                : "text-sm text-muted-foreground"
          }
          aria-live="polite"
        >
          {status.message || "Messages are delivered securely with Resend."}
        </p>
        <Button type="submit" size="lg" disabled={isSending}>
          {isSending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
          {isSending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
