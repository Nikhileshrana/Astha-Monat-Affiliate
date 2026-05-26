"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { checkPhoneAndSendOtp, signUpWithPhoneAndEmailOTP } from "@/lib/auth/auth-actions";

type Mode = "signin" | "signup";

function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [step, setStep] = useState<1 | 2>(1);

  // sign-in state
  const [phone, setPhone] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [rawEmail, setRawEmail] = useState("");

  // sign-up state
  const [name, setName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPhone, setSuPhone] = useState("");

  // shared
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── helpers ────────────────────────────────────────────────────────────────

  const switchMode = (next: Mode) => {
    if (next === mode && step === 1) return;
    setMode(next);
    setStep(1);
    setError("");
    setOtp("");
  };

  const goBack = () => {
    setStep(1);
    setError("");
    setOtp("");
  };

  // ── sign-in handlers ───────────────────────────────────────────────────────

  const handleSignInPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await checkPhoneAndSendOtp(phone);
    if (!result.success) {
      setError(result.error || "Something went wrong.");
    } else {
      setMaskedEmail(result.maskedEmail || "");
      setRawEmail(result.email || "");
      setStep(2);
    }
    setLoading(false);
  };

  const handleSignInOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: err } = await authClient.signIn.emailOtp({ email: rawEmail, otp });
      if (err) setError(err.message || "Invalid OTP code.");
      else router.push("/protected");
    } catch (e: any) {
      setError(e.message || "Unexpected error.");
    }
    setLoading(false);
  };

  // ── sign-up handlers ───────────────────────────────────────────────────────

  const handleSignUpForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signUpWithPhoneAndEmailOTP(name, suEmail, suPhone);
    if (!result.success) setError(result.error || "Failed to create account.");
    else setStep(2);
    setLoading(false);
  };

  const handleSignUpOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: err } = await authClient.signIn.emailOtp({
        email: suEmail,
        otp,
        name,
        phoneNumber: suPhone,
      });
      if (err) setError(err.message || "Invalid code.");
      else router.push("/protected");
    } catch (e: any) {
      setError(e.message || "Unexpected error.");
    }
    setLoading(false);
  };

  // ── derived ────────────────────────────────────────────────────────────────

  const contentKey = `${mode}-${step}`;

  const title =
    mode === "signin"
      ? step === 1 ? "Welcome back" : "Check your inbox"
      : step === 1 ? "Create an account" : "Check your inbox";

  const description =
    mode === "signin"
      ? step === 1 ? "Enter your phone number to continue" : `We've sent a code to ${maskedEmail}`
      : step === 1 ? "Fill in your details to get started" : `We've sent a code to ${suEmail}`;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      {/* Card — motion.div so layout animation handles height changes */}
      <motion.div
        layout
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="w-full rounded-2xl border border-border/40 bg-background shadow-xl overflow-hidden"
      >
        <div className="p-7 sm:p-8">

          {/* ── Tab toggle ── */}
          <div className="mb-6 flex justify-center">
            <div className="flex gap-0.5 rounded-xl bg-muted p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`flex-1 ${
                  mode === "signin"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-foreground hover:bg-muted/70"
                }`}
                onClick={() => switchMode("signin")}
              >
                Sign in
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`flex-1 ${
                  mode === "signup"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-foreground hover:bg-muted/70"
                }`}
                onClick={() => switchMode("signup")}
              >
                Sign up
              </Button>
            </div>
          </div>

          {/* ── Animated content ── */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={contentKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {/* Title */}
              <div className="mb-5">
                <h1 className="text-xl tracking-tight text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* ── Sign-in step 1 ── */}
              {mode === "signin" && step === 1 && (
                <form onSubmit={handleSignInPhone} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="si-phone" className="text-sm text-foreground/80">Phone Number</Label>
                    <Input
                      id="si-phone" type="tel" placeholder="9876543210"
                      value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      required pattern="[0-9]{10}" maxLength={10}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Spinner /> : "Continue"}
                  </Button>
                </form>
              )}

              {/* ── Sign-in step 2 (OTP) ── */}
              {mode === "signin" && step === 2 && (
                <form onSubmit={handleSignInOtp} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="si-otp" className="text-sm text-foreground/80">One-Time Password</Label>
                      <Button type="button" variant="link" size="sm" onClick={goBack}>
                        Change phone?
                      </Button>
                    </div>
                    <Input
                      id="si-otp" type="text" placeholder="000000"
                      value={otp} onChange={(e) => setOtp(e.target.value)}
                      required maxLength={6}
                      className="text-center font-mono tracking-[0.5em]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Spinner /> : "Verify & Sign in"}
                  </Button>
                </form>
              )}

              {/* ── Sign-up step 1 ── */}
              {mode === "signup" && step === 1 && (
                <form onSubmit={handleSignUpForm} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="su-name" className="text-sm text-foreground/80">Full Name</Label>
                    <Input
                      id="su-name" type="text" placeholder="John Doe"
                      value={name} onChange={(e) => setName(e.target.value)} required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="su-phone" className="text-sm text-foreground/80">Phone Number</Label>
                    <Input
                      id="su-phone" type="tel" placeholder="9876543210"
                      value={suPhone} onChange={(e) => setSuPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      required pattern="[0-9]{10}" maxLength={10}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="su-email" className="text-sm text-foreground/80">Email</Label>
                    <Input
                      id="su-email" type="email" placeholder="name@example.com"
                      value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Spinner /> : "Sign up"}
                  </Button>
                </form>
              )}

              {/* ── Sign-up step 2 (OTP) ── */}
              {mode === "signup" && step === 2 && (
                <form onSubmit={handleSignUpOtp} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="su-otp" className="text-sm text-foreground/80">Login Code</Label>
                      <Button type="button" variant="link" size="sm" onClick={goBack}>
                        Change details?
                      </Button>
                    </div>
                    <Input
                      id="su-otp" type="text" placeholder="000000"
                      value={otp} onChange={(e) => setOtp(e.target.value)}
                      required maxLength={6}
                      className="text-center font-mono tracking-[0.5em]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Spinner /> : "Verify & Finish"}
                  </Button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <Suspense fallback={<div className="w-full max-w-sm h-72 animate-pulse rounded-2xl bg-muted" />}>
        <AuthCard />
      </Suspense>
    </main>
  );
}
