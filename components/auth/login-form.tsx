"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Check, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "code";

type LoginFormProps = {
  continueUrl?: string;
  migrateAfterSignIn?: boolean;
};

export function LoginForm({ continueUrl = "/dashboard", migrateAfterSignIn = false }: LoginFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!migrateAfterSignIn) {
      return;
    }

    let active = true;
    setIsLoading(true);
    void fetch("/api/auth/migrate-guest-data", { method: "POST" })
      .catch((error) => {
        console.error("Failed to migrate guest drafts after OAuth sign-in", error);
      })
      .finally(() => {
        if (active) {
          window.location.assign(continueUrl);
        }
      });

    return () => {
      active = false;
    };
  }, [continueUrl, migrateAfterSignIn]);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "We could not send your code. Please try again.");
        return;
      }
      setStep("code");
    } catch {
      setError("We could not send your code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      code,
      redirect: false,
      callbackUrl: continueUrl,
    });

    if (result?.error) {
      setError("That code is invalid or expired. Request a new one and try again.");
      setIsLoading(false);
      return;
    }
    try {
      const migrationResponse = await fetch("/api/auth/migrate-guest-data", { method: "POST" });
      if (!migrationResponse.ok) {
        console.error("Failed to migrate guest drafts after email sign-in", migrationResponse.status);
      }
    } catch (error) {
      console.error("Failed to migrate guest drafts after email sign-in", error);
    }
    window.location.assign(result?.url ?? continueUrl);
  }

  async function continueWithGoogle() {
    setError("");
    setIsLoading(true);
    await signIn("google", {
      callbackUrl: `/login?continue=${encodeURIComponent(continueUrl)}&migrate=1`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">1</span>
        <span className={step === "code" ? "text-muted-foreground" : "font-medium text-foreground"}>Your email</span>
        <span className="h-px flex-1 bg-border" />
        <span className={step === "code" ? "font-medium text-foreground" : ""}>Verification</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${step === "code" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>
          {step === "code" ? <Check className="h-4 w-4" aria-hidden="true" /> : "2"}
        </span>
      </div>

      {step === "email" ? (
        <form className="space-y-5" onSubmit={requestCode}>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-11" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <p className="text-sm text-muted-foreground">We&apos;ll send a six-digit code. No password to remember.</p>
          </div>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            {isLoading ? "Sending code" : "Continue with email"}
          </Button>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={verifyCode}>
          <div className="space-y-2">
            <Label htmlFor="code">Verification code</Label>
            <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" className="text-center text-xl tracking-[0.3em]" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required />
            <p className="text-sm text-muted-foreground">Check {email} for your code. It expires in 10 minutes.</p>
          </div>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isLoading || code.length !== 6}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            {isLoading ? "Checking code" : "Sign in"}
          </Button>
          <Button variant="ghost" className="w-full" type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }}>
            Use a different email
          </Button>
        </form>
      )}

      <div className="relative flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="w-full" type="button" onClick={continueWithGoogle} disabled={isLoading}>
        <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center text-sm font-semibold">G</span>
        Continue with Google
      </Button>
    </div>
  );
}
