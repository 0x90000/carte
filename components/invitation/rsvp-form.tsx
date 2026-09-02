"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RSVPFormProps = { invitationSlug: string };
type RSVPStatus = "attending" | "declined" | "maybe";
type RSVPFormData = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: RSVPStatus;
  partySize: string;
  dietaryPreferences: string;
  message: string;
};
type RSVPField = keyof RSVPFormData;
type RSVPErrorResponse = { error?: string | { message?: string } };

const initialValues: RSVPFormData = {
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  status: "attending",
  partySize: "1",
  dietaryPreferences: "",
  message: "",
};

function validateForm(values: RSVPFormData) {
  const errors: Partial<Record<RSVPField, string>> = {};
  if (!values.guestName.trim()) {
    errors.guestName = "Name is required.";
  }
  if (values.guestEmail && !/^\S+@\S+\.\S+$/.test(values.guestEmail)) {
    errors.guestEmail = "Enter a valid email address.";
  }
  if (!values.guestEmail.trim() && !values.guestPhone.trim()) {
    errors.guestPhone = "Enter an email or phone number.";
  }
  const partySize = Number(values.partySize);
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
    errors.partySize = "Party size must be between 1 and 20.";
  }
  if (values.message.length > 500) {
    errors.message = "Message must be 500 characters or fewer.";
  }
  return errors;
}

export function RSVPForm({ invitationSlug }: RSVPFormProps) {
  const [values, setValues] = useState<RSVPFormData>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<RSVPField, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue(field: RSVPField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setServerError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, invitationSlug, partySize: Number(values.partySize) }),
      });
      const payload = (await response.json()) as RSVPErrorResponse;
      if (!response.ok) {
        const error = typeof payload.error === "string" ? payload.error : payload.error?.message;
        throw new Error(error ?? "We could not submit your RSVP.");
      }
      setSubmitted(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "We could not submit your RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="rounded-lg bg-white p-6 text-center text-neutral-900 shadow-xl" aria-live="polite">
        <h2 className="text-xl font-semibold">Thank you for your RSVP.</h2>
        <p className="mt-2 text-sm text-neutral-600">Your response has been recorded.</p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg bg-white p-5 text-neutral-900 shadow-xl sm:p-6" noValidate>
      <div>
        <h2 className="text-xl font-semibold">RSVP</h2>
        <p className="mt-1 text-sm text-neutral-600">Let the host know whether you can make it.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="guest-name">Name <span aria-hidden="true">*</span></Label>
          <Input id="guest-name" autoComplete="name" value={values.guestName} onChange={(event) => updateValue("guestName", event.target.value)} aria-invalid={Boolean(errors.guestName)} />
          {errors.guestName ? <p className="text-sm text-red-700" role="alert">{errors.guestName}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="guest-email">Email</Label>
          <Input id="guest-email" type="email" autoComplete="email" value={values.guestEmail} onChange={(event) => updateValue("guestEmail", event.target.value)} aria-invalid={Boolean(errors.guestEmail)} />
          {errors.guestEmail ? <p className="text-sm text-red-700" role="alert">{errors.guestEmail}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest-phone">Phone</Label>
        <Input id="guest-phone" type="tel" autoComplete="tel" value={values.guestPhone} onChange={(event) => updateValue("guestPhone", event.target.value)} aria-invalid={Boolean(errors.guestPhone)} />
        <p className="text-xs text-neutral-500">Email or phone is required.</p>
        {errors.guestPhone ? <p className="text-sm text-red-700" role="alert">{errors.guestPhone}</p> : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Attendance</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {([
            ["attending", "Attending"],
            ["declined", "Unable to attend"],
            ["maybe", "Maybe"],
          ] as const).map(([value, label]) => (
            <label key={value} className="flex min-h-11 items-center gap-2 rounded-md border border-neutral-200 px-3 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50">
              <input type="radio" name="status" value={value} checked={values.status === value} onChange={() => updateValue("status", value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="party-size">Party size</Label>
        <Input id="party-size" type="number" min={1} max={20} value={values.partySize} onChange={(event) => updateValue("partySize", event.target.value)} aria-invalid={Boolean(errors.partySize)} />
        {errors.partySize ? <p className="text-sm text-red-700" role="alert">{errors.partySize}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dietary-preferences">Dietary preferences</Label>
        <Textarea id="dietary-preferences" rows={2} value={values.dietaryPreferences} onChange={(event) => updateValue("dietaryPreferences", event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rsvp-message">Message</Label>
        <Textarea id="rsvp-message" rows={3} maxLength={500} value={values.message} onChange={(event) => updateValue("message", event.target.value)} aria-invalid={Boolean(errors.message)} />
        {errors.message ? <p className="text-sm text-red-700" role="alert">{errors.message}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-red-700" role="alert">{serverError}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit RSVP"}
      </Button>
    </form>
  );
}
