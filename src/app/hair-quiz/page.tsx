"use client";

import { useState } from "react";
import type { Value } from "react-phone-number-input";
import { toast } from "sonner";

import { SiteFooter } from "@/components/website/footer";
import { Navbar } from "@/components/website/navbar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInputField } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  name: string;
  email: string;
  whatsapp: Value | undefined;
  instagramUsername: string;
  hairThickness: string;
  hairTexture: string;
  rootType: string;
  endsType: string;
  hasDandruffOrItchyScalp: string;
  washFrequencyPerWeek: string;
  getsFrizzy: string;
  hotToolsFrequency: string;
  hairlossConcern: string;
  currentProducts: string;
  isColorTreated: string;
  ultimateHairGoal: string;
  budget: string;
  contactPreference: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  whatsapp: undefined,
  instagramUsername: "",
  hairThickness: "",
  hairTexture: "",
  rootType: "",
  endsType: "",
  hasDandruffOrItchyScalp: "",
  washFrequencyPerWeek: "",
  getsFrizzy: "",
  hotToolsFrequency: "",
  hairlossConcern: "",
  currentProducts: "",
  isColorTreated: "",
  ultimateHairGoal: "",
  budget: "",
  contactPreference: "",
};

type RadioOption = { value: string; label: string };

function flattenApiFieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== "object") return {};
  const fieldErrors = (details as { fieldErrors?: Record<string, string[]> })
    .fieldErrors;
  if (!fieldErrors) return {};

  const mapped: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) mapped[key] = messages[0];
  }
  return mapped;
}

function RadioQuestion({
  id,
  label,
  value,
  onValueChange,
  options,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: RadioOption[];
  error?: string;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldContent>
        <FieldLabel htmlFor={id}>
          {label}
          <span className="text-destructive"> *</span>
        </FieldLabel>
        <RadioGroup
          id={id}
          value={value}
          onValueChange={onValueChange}
          aria-invalid={!!error}
          className="mt-2 gap-2.5"
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-start gap-2.5">
              <RadioGroupItem
                value={option.value}
                id={`${id}-${option.value}`}
                aria-invalid={!!error}
              />
              <Label
                htmlFor={`${id}-${option.value}`}
                className="font-normal normal-case tracking-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}

function getClientContext() {
  if (typeof window === "undefined") return undefined;

  return {
    language: navigator.language,
    languages: [...navigator.languages],
    platform: navigator.platform,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    deviceMemory:
      "deviceMemory" in navigator
        ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
        : undefined,
    hardwareConcurrency: navigator.hardwareConcurrency,
    touchPoints: navigator.maxTouchPoints,
  };
}

export default function HairQuizPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/hair-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          whatsapp: form.whatsapp ?? "",
          currentProducts: form.currentProducts || undefined,
          clientContext: getClientContext(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        const apiErrors = flattenApiFieldErrors(result.details);
        if (Object.keys(apiErrors).length > 0) setErrors(apiErrors);
        throw new Error(result.error || "Submission failed");
      }

      setIsSubmitted(true);
      setForm(INITIAL_FORM);
      toast.success("Thanks! Your hair quiz has been submitted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh bg-background text-foreground antialiased">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Discover Your Plan
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Custom Hair Quiz
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Answer a few questions about your hair so I can recommend the best
            products and routine for you.
          </p>
        </div>

        {isSubmitted ? (
          <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Thank you!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Your responses have been received. I will review your quiz and reach out
              using your preferred contact method soon.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={() => setIsSubmitted(false)}
            >
              Submit another response
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <FieldSet className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
              <FieldGroup>
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">
                    Name
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    aria-invalid={!!errors.name}
                    autoComplete="name"
                  />
                  <FieldError>{errors.name}</FieldError>
                </Field>

                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">
                    Email
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    aria-invalid={!!errors.email}
                    autoComplete="email"
                  />
                  <FieldError>{errors.email}</FieldError>
                </Field>

                <Field data-invalid={!!errors.whatsapp}>
                  <FieldLabel htmlFor="whatsapp">
                    WhatsApp
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <PhoneInputField
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(value) => updateField("whatsapp", value)}
                    placeholder="WhatsApp number"
                    aria-invalid={!!errors.whatsapp}
                  />
                  <FieldError>{errors.whatsapp}</FieldError>
                </Field>

                <Field data-invalid={!!errors.instagramUsername}>
                  <FieldLabel htmlFor="instagramUsername">
                    Instagram username
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Input
                    id="instagramUsername"
                    value={form.instagramUsername}
                    onChange={(e) => updateField("instagramUsername", e.target.value)}
                    placeholder="@yourusername"
                    aria-invalid={!!errors.instagramUsername}
                    autoComplete="username"
                  />
                  <FieldError>{errors.instagramUsername}</FieldError>
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSet className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
              <FieldGroup>
                <RadioQuestion
                  id="hairThickness"
                  label="Is your hair"
                  value={form.hairThickness}
                  onValueChange={(value) => updateField("hairThickness", value)}
                  error={errors.hairThickness}
                  options={[
                    { value: "thin", label: "Thin" },
                    { value: "medium", label: "Medium" },
                    { value: "thick", label: "Thick" },
                  ]}
                />

                <RadioQuestion
                  id="hairTexture"
                  label="Is your hair"
                  value={form.hairTexture}
                  onValueChange={(value) => updateField("hairTexture", value)}
                  error={errors.hairTexture}
                  options={[
                    { value: "wavy", label: "Wavy" },
                    { value: "straight", label: "Straight" },
                    { value: "curly", label: "Curly" },
                  ]}
                />

                <RadioQuestion
                  id="rootType"
                  label="Are your roots"
                  value={form.rootType}
                  onValueChange={(value) => updateField("rootType", value)}
                  error={errors.rootType}
                  options={[
                    { value: "oily_24_48_hours", label: "Oily (within 24–48 hours)" },
                    { value: "dry", label: "Dry" },
                    { value: "oily_3_4_days", label: "Starts to get oily in 3–4 days" },
                  ]}
                />

                <RadioQuestion
                  id="endsType"
                  label="Are your ends"
                  value={form.endsType}
                  onValueChange={(value) => updateField("endsType", value)}
                  error={errors.endsType}
                  options={[
                    { value: "dry", label: "Dry" },
                    { value: "damaged", label: "Damaged" },
                    { value: "thin", label: "Thin" },
                    { value: "split", label: "Split" },
                    { value: "all_of_the_above", label: "All of the above" },
                  ]}
                />

                <RadioQuestion
                  id="hasDandruffOrItchyScalp"
                  label="Do you have dandruff or itchy scalp?"
                  value={form.hasDandruffOrItchyScalp}
                  onValueChange={(value) => updateField("hasDandruffOrItchyScalp", value)}
                  error={errors.hasDandruffOrItchyScalp}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                />

                <Field data-invalid={!!errors.washFrequencyPerWeek}>
                  <FieldLabel htmlFor="washFrequencyPerWeek">
                    How often do you wash your hair in a week?
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Input
                    id="washFrequencyPerWeek"
                    type="number"
                    min={0}
                    max={14}
                    inputMode="numeric"
                    value={form.washFrequencyPerWeek}
                    onChange={(e) => updateField("washFrequencyPerWeek", e.target.value)}
                    aria-invalid={!!errors.washFrequencyPerWeek}
                  />
                  <FieldError>{errors.washFrequencyPerWeek}</FieldError>
                </Field>

                <RadioQuestion
                  id="getsFrizzy"
                  label="Does your hair get frizzy?"
                  value={form.getsFrizzy}
                  onValueChange={(value) => updateField("getsFrizzy", value)}
                  error={errors.getsFrizzy}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                />

                <RadioQuestion
                  id="hotToolsFrequency"
                  label="How often do you use hot tools?"
                  value={form.hotToolsFrequency}
                  onValueChange={(value) => updateField("hotToolsFrequency", value)}
                  error={errors.hotToolsFrequency}
                  options={[
                    { value: "weekly", label: "Weekly" },
                    { value: "every_other_day", label: "Every other day" },
                    { value: "twice_a_month", label: "Twice a month" },
                    { value: "very_rarely", label: "Very rarely" },
                  ]}
                />

                <RadioQuestion
                  id="hairlossConcern"
                  label="Do you have hairfall/hair thinning concerns? If yes, what kind"
                  value={form.hairlossConcern}
                  onValueChange={(value) => updateField("hairlossConcern", value)}
                  error={errors.hairlossConcern}
                  options={[
                    { value: "overall_thinning", label: "Overall thinning" },
                    { value: "postpartum_or_post_covid", label: "Postpartum hairloss / Post Covid" },
                    { value: "bald_spots", label: "Bald spots" },
                    { value: "receding_hairline", label: "Receding hairline" },
                    { value: "none", label: "I don't have hairloss" },
                  ]}
                />

                <Field>
                  <FieldLabel htmlFor="currentProducts">
                    What hair products & company do you use currently?
                  </FieldLabel>
                  <Textarea
                    id="currentProducts"
                    value={form.currentProducts}
                    onChange={(e) => updateField("currentProducts", e.target.value)}
                    rows={3}
                  />
                </Field>

                <RadioQuestion
                  id="isColorTreated"
                  label="Is your hair colour treated?"
                  value={form.isColorTreated}
                  onValueChange={(value) => updateField("isColorTreated", value)}
                  error={errors.isColorTreated}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                />

                <Field data-invalid={!!errors.ultimateHairGoal}>
                  <FieldLabel htmlFor="ultimateHairGoal">
                    What is your ultimate hair goal?
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Textarea
                    id="ultimateHairGoal"
                    value={form.ultimateHairGoal}
                    onChange={(e) => updateField("ultimateHairGoal", e.target.value)}
                    rows={3}
                    aria-invalid={!!errors.ultimateHairGoal}
                  />
                  <FieldError>{errors.ultimateHairGoal}</FieldError>
                </Field>

                <RadioQuestion
                  id="budget"
                  label="What would you say your budget is for products that are going to last you 4–6 months? (4 installments plan option available)"
                  value={form.budget}
                  onValueChange={(value) => updateField("budget", value)}
                  error={errors.budget}
                  options={[
                    { value: "150_170", label: "$150–$170" },
                    { value: "175_200", label: "$175–$200" },
                    { value: "250_plus", label: "$250+" },
                  ]}
                />

                <RadioQuestion
                  id="contactPreference"
                  label="How would you like me to contact you?"
                  value={form.contactPreference}
                  onValueChange={(value) => updateField("contactPreference", value)}
                  error={errors.contactPreference}
                  options={[
                    {
                      value: "instagram",
                      label:
                        "Instagram — please make sure you are following me so I can send you a DM!",
                    },
                    {
                      value: "whatsapp",
                      label: "WhatsApp (provide number above)",
                    },
                  ]}
                />
              </FieldGroup>
            </FieldSet>

            <div className="flex justify-center pb-4">
              <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-48">
                {isSubmitting ? "Submitting..." : "Submit Hair Quiz"}
              </Button>
            </div>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
