"use client";

import { useState } from "react";
import type { Value } from "react-phone-number-input";
import { toast } from "sonner";

import { SiteFooter } from "@/components/website/footer";
import { Navbar } from "@/components/website/navbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type LifeNeed =
  | "additional_income"
  | "like_minded_community"
  | "time_freedom"
  | "work_from_anywhere";

type FormState = {
  name: string;
  email: string;
  instagramUsername: string;
  phone: Value | undefined;
  isOver18: string;
  currentOccupation: string;
  aboutYourself: string;
  whyOnlineWork: string;
  lifeNeeds: LifeNeed[];
  isCoachable: string;
  timeCommitment: string;
  monthlyIncomeGoal: string;
  startupBudget: string;
  discoverySource: string;
  discoverySourceOther: string;
  contactPreference: string;
  contactPreferenceOther: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  instagramUsername: "",
  phone: undefined,
  isOver18: "",
  currentOccupation: "",
  aboutYourself: "",
  whyOnlineWork: "",
  lifeNeeds: [],
  isCoachable: "",
  timeCommitment: "",
  monthlyIncomeGoal: "",
  startupBudget: "",
  discoverySource: "",
  discoverySourceOther: "",
  contactPreference: "",
  contactPreferenceOther: "",
};

type RadioOption = { value: string; label: string };

const LIFE_NEED_OPTIONS: { value: LifeNeed; label: string }[] = [
  { value: "additional_income", label: "Additional Income" },
  { value: "like_minded_community", label: "Like minded community" },
  { value: "time_freedom", label: "Time freedom" },
  { value: "work_from_anywhere", label: "Ability to work from anywhere" },
];

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

function CheckboxQuestion({
  id,
  label,
  values,
  onValuesChange,
  options,
  error,
}: {
  id: string;
  label: string;
  values: LifeNeed[];
  onValuesChange: (values: LifeNeed[]) => void;
  options: { value: LifeNeed; label: string }[];
  error?: string;
}) {
  const toggleValue = (value: LifeNeed, checked: boolean) => {
    if (checked) {
      onValuesChange([...values, value]);
      return;
    }
    onValuesChange(values.filter((item) => item !== value));
  };

  return (
    <Field data-invalid={!!error}>
      <FieldContent>
        <FieldLabel htmlFor={id}>
          {label}
          <span className="text-destructive"> *</span>
        </FieldLabel>
        <div id={id} className="mt-2 space-y-2.5">
          {options.map((option) => {
            const checked = values.includes(option.value);
            return (
              <div key={option.value} className="flex items-start gap-2.5">
                <Checkbox
                  id={`${id}-${option.value}`}
                  checked={checked}
                  onCheckedChange={(next) =>
                    toggleValue(option.value, next === true)
                  }
                  aria-invalid={!!error}
                />
                <Label
                  htmlFor={`${id}-${option.value}`}
                  className="font-normal normal-case tracking-normal"
                >
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
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

export default function ApplyAffiliatePage() {
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
      const response = await fetch("/api/apply-affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone ?? "",
          discoverySourceOther:
            form.discoverySource === "other" ? form.discoverySourceOther : undefined,
          contactPreferenceOther:
            form.contactPreference === "other" ? form.contactPreferenceOther : undefined,
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
      toast.success("Thanks! Your affiliate application has been submitted.");
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

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Work With Me
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Apply to Join My Team
          </h1>
          <div className="mx-auto mt-4 max-w-2xl space-y-3 text-left text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Hi there! I am so glad to have you here! I have always been active on social
              media but it was 2.5 years ago that I hopped on an opportunity that now helps me
              make an income out of it!
            </p>
            <p>
              This business is for anyone looking for an extra income, full-time income, time
              freedom, the ability to be your own boss and grow as a person while you work
              along a community of women that inspire and empower you!
            </p>
            <p>
              This is a modern partnership that makes sense in the world we live in. We already
              wash our hair &amp; face, we also tend to buy products that our friends, family,
              and influencers recommend us… so why not do that yourself by referring award
              winning products that could earn you an income. &ldquo;Social Selling&rdquo; is
              the way of the future, and I would love to show you how I built my business
              around it.
            </p>
            <p>
              If any of the above goals align with your vision, I cannot wait to welcome you to
              my team &lt;3
            </p>
            <p className="font-medium text-foreground">— Astha :)</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Thank you!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Your application has been received. I will review your responses and reach out
              using your preferred contact method soon.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={() => setIsSubmitted(false)}
            >
              Submit another application
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <FieldSet className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
              <FieldGroup>
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">
                    Full Name
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

                <Field data-invalid={!!errors.instagramUsername}>
                  <FieldLabel htmlFor="instagramUsername">
                    Instagram Handle
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Input
                    id="instagramUsername"
                    value={form.instagramUsername}
                    onChange={(e) => updateField("instagramUsername", e.target.value)}
                    placeholder="@asthasharma28"
                    aria-invalid={!!errors.instagramUsername}
                    autoComplete="username"
                  />
                  <FieldError>{errors.instagramUsername}</FieldError>
                </Field>

                <Field data-invalid={!!errors.phone}>
                  <FieldLabel htmlFor="phone">
                    Phone number. Please add your country code
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <PhoneInputField
                    id="phone"
                    value={form.phone}
                    onChange={(value) => updateField("phone", value)}
                    placeholder="Phone number with country code"
                    aria-invalid={!!errors.phone}
                  />
                  <FieldError>{errors.phone}</FieldError>
                </Field>

                <RadioQuestion
                  id="isOver18"
                  label="Are you 18 years or older?"
                  value={form.isOver18}
                  onValueChange={(value) => updateField("isOver18", value)}
                  error={errors.isOver18}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSet className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
              <FieldGroup>
                <Field data-invalid={!!errors.currentOccupation}>
                  <FieldLabel htmlFor="currentOccupation">
                    What do you currently do for living? i.e. student, stay at home mom, 9–5
                    job, teacher etc.
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Input
                    id="currentOccupation"
                    value={form.currentOccupation}
                    onChange={(e) => updateField("currentOccupation", e.target.value)}
                    aria-invalid={!!errors.currentOccupation}
                  />
                  <FieldError>{errors.currentOccupation}</FieldError>
                </Field>

                <Field data-invalid={!!errors.aboutYourself}>
                  <FieldLabel htmlFor="aboutYourself">
                    Tell me more about yourself in a couple of words? Excited to know you!!
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Textarea
                    id="aboutYourself"
                    value={form.aboutYourself}
                    onChange={(e) => updateField("aboutYourself", e.target.value)}
                    rows={3}
                    aria-invalid={!!errors.aboutYourself}
                  />
                  <FieldError>{errors.aboutYourself}</FieldError>
                </Field>

                <Field data-invalid={!!errors.whyOnlineWork}>
                  <FieldLabel htmlFor="whyOnlineWork">
                    Why does working online interest you?
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Textarea
                    id="whyOnlineWork"
                    value={form.whyOnlineWork}
                    onChange={(e) => updateField("whyOnlineWork", e.target.value)}
                    rows={3}
                    aria-invalid={!!errors.whyOnlineWork}
                  />
                  <FieldError>{errors.whyOnlineWork}</FieldError>
                </Field>

                <CheckboxQuestion
                  id="lifeNeeds"
                  label="Which of the following do you need more of in your life? Check all that apply"
                  values={form.lifeNeeds}
                  onValuesChange={(values) => updateField("lifeNeeds", values)}
                  options={LIFE_NEED_OPTIONS}
                  error={errors.lifeNeeds}
                />

                <RadioQuestion
                  id="isCoachable"
                  label="I am coachable and willing to learn!"
                  value={form.isCoachable}
                  onValueChange={(value) => updateField("isCoachable", value)}
                  error={errors.isCoachable}
                  options={[
                    { value: "true", label: "True" },
                    { value: "false", label: "False" },
                  ]}
                />

                <RadioQuestion
                  id="timeCommitment"
                  label="How much time do you have to dedicate to working from your phone/laptop devoting to MONAT's training and my support?"
                  value={form.timeCommitment}
                  onValueChange={(value) => updateField("timeCommitment", value)}
                  error={errors.timeCommitment}
                  options={[
                    { value: "1_2_hrs_day", label: "1–2 hrs/day" },
                    { value: "part_time", label: "Part-time" },
                    { value: "full_time", label: "Full-time" },
                  ]}
                />

                <RadioQuestion
                  id="monthlyIncomeGoal"
                  label="What are your monthly income goals?"
                  value={form.monthlyIncomeGoal}
                  onValueChange={(value) => updateField("monthlyIncomeGoal", value)}
                  error={errors.monthlyIncomeGoal}
                  options={[
                    { value: "100_500_cad", label: "100–500 CAD$" },
                    { value: "500_1000_cad", label: "500–1000 CAD$" },
                    { value: "1000_2000_cad", label: "1000–2000 CAD$" },
                    { value: "2500_5000_cad", label: "2500–5000 CAD$" },
                    { value: "10000_plus", label: "10,000$+" },
                  ]}
                />

                <RadioQuestion
                  id="startupBudget"
                  label="What budget do you readily have to start the business today? (CAD) The business bundle includes discounted products customized to you, samples to share, your own website, other resources & social media training! (Option to split the payments in 4 interest free)"
                  value={form.startupBudget}
                  onValueChange={(value) => updateField("startupBudget", value)}
                  error={errors.startupBudget}
                  options={[
                    { value: "200_250", label: "200–250$" },
                    { value: "350", label: "350$" },
                    { value: "500_800", label: "500–800$" },
                  ]}
                />

                <RadioQuestion
                  id="discoverySource"
                  label="How did you come across my page?"
                  value={form.discoverySource}
                  onValueChange={(value) => updateField("discoverySource", value)}
                  error={errors.discoverySource}
                  options={[
                    { value: "new_follower", label: "New Follower" },
                    { value: "have_been_following", label: "Have been following you" },
                    { value: "friend", label: "A friend told me about you" },
                    { value: "other", label: "Other" },
                  ]}
                />

                {form.discoverySource === "other" ? (
                  <Field data-invalid={!!errors.discoverySourceOther}>
                    <FieldLabel htmlFor="discoverySourceOther">
                      Please specify
                      <span className="text-destructive"> *</span>
                    </FieldLabel>
                    <Input
                      id="discoverySourceOther"
                      value={form.discoverySourceOther}
                      onChange={(e) => updateField("discoverySourceOther", e.target.value)}
                      aria-invalid={!!errors.discoverySourceOther}
                    />
                    <FieldError>{errors.discoverySourceOther}</FieldError>
                  </Field>
                ) : null}

                <RadioQuestion
                  id="contactPreference"
                  label="How would you like me to contact you?"
                  value={form.contactPreference}
                  onValueChange={(value) => updateField("contactPreference", value)}
                  error={errors.contactPreference}
                  options={[
                    { value: "call", label: "Call" },
                    { value: "whatsapp", label: "WhatsApp" },
                    { value: "instagram_message", label: "Instagram Message" },
                    { value: "other", label: "Other" },
                  ]}
                />

                {form.contactPreference === "other" ? (
                  <Field data-invalid={!!errors.contactPreferenceOther}>
                    <FieldLabel htmlFor="contactPreferenceOther">
                      Please specify
                      <span className="text-destructive"> *</span>
                    </FieldLabel>
                    <Input
                      id="contactPreferenceOther"
                      value={form.contactPreferenceOther}
                      onChange={(e) => updateField("contactPreferenceOther", e.target.value)}
                      aria-invalid={!!errors.contactPreferenceOther}
                    />
                    <FieldError>{errors.contactPreferenceOther}</FieldError>
                  </Field>
                ) : null}
              </FieldGroup>
            </FieldSet>

            <div className="flex justify-center pb-4">
              <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-48">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
