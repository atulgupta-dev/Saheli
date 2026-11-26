"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarHeart,
  ChevronRight,
  Globe,
  LogIn,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LifeStageSwitcher } from "@/components/layout/LifeStageSwitcher";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { useSaheli } from "@/providers/AppProviders";
import { AppLanguage } from "@/types/saheli";

export default function ProfilePage() {
  const {
    profile,
    activeStage,
    language,
    setLanguage,
    mode,
    switchMode,
    resetDemo,
    updateConsent,
    firebaseUser,
    firebaseConfigured,
    backendConfigured,
    loginGoogle,
    loginEmail,
    registerEmail,
    logout,
    t,
  } = useSaheli();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const stageCfg = LIFE_STAGE_CONFIGS[activeStage];

  const handleEmailAuth = async (isRegister: boolean) => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      if (isRegister) {
        await registerEmail(email, password);
      } else {
        await loginEmail(email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await loginGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <AppShell title="My Profile" subtitle="Preferences, consent & account controls">
      {/* Profile Identity Header (Design Book Page 16) */}
      <section className="saheli-card p-5 sm:p-6 flex items-center gap-4">
        <img
          src="/illustrations/avatar-priya.jpg"
          alt="User profile avatar"
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover ring-4 ring-[var(--stage-muted-accent)] shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-editorial text-2xl font-semibold truncate">
            {firebaseUser?.displayName || profile.display_name || "Meera (Demo)"}
          </h2>
          <p className="text-xs sm:text-sm truncate" style={{ color: "var(--stage-text-muted)" }}>
            {firebaseUser?.email ||
              (mode === "demo" ? "Synthetic demo session • No real health data" : "Live mode")}
          </p>
        </div>
      </section>

      {/* Restrained Settings List (Design Book Page 16) */}
      <section className="saheli-card divide-y overflow-hidden" style={{ borderColor: "var(--stage-border)" }}>
        <Link
          href="/journey"
          className="flex min-h-[64px] items-center justify-between gap-3 px-5 py-3.5 hover:bg-black/[0.02]"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-primary)" }}>
              <CalendarHeart className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">My Health Journey</p>
              <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                {stageCfg.label[language]}
                {activeStage === "pregnancy"
                  ? ` — Week ${profile.stage_profiles.pregnancy?.gestational_week ?? 24}`
                  : ""}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </Link>

        <div className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-primary)" }}>
              <Globe className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold">Language</p>
          </div>
          <select
            aria-label="Language setting"
            value={language}
            onChange={(e) => setLanguage(e.target.value as AppLanguage)}
            className="min-h-[40px] rounded-full border bg-white px-4 text-xs font-bold"
            style={{ borderColor: "var(--stage-border)" }}
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">हिंदी</option>
            <option value="hi-Latn">Hinglish</option>
          </select>
        </div>

        <label className="flex min-h-[64px] items-center justify-between gap-3 px-5 py-3.5 cursor-pointer">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-primary)" }}>
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">AI Memory</p>
              <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                {profile.consent.store_conversations
                  ? "On (with consent)"
                  : "Off — no history stored"}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={profile.consent.store_conversations}
            onChange={(e) => updateConsent({ store_conversations: e.target.checked })}
            className="h-5 w-5 accent-[var(--stage-primary)]"
          />
        </label>

        <Link
          href="/care"
          className="flex min-h-[64px] items-center justify-between gap-3 px-5 py-3.5 hover:bg-black/[0.02]"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-primary)" }}>
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Safety &amp; Appointments</p>
              <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                Urgent-care guidance &amp; clinic visits
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </Link>

        <label
          id="privacy"
          className="flex min-h-[64px] items-center justify-between gap-3 px-5 py-3.5 cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-primary)" }}>
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Privacy &amp; Report Storage</p>
              <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                {profile.consent.store_reports
                  ? "Saving uploaded report summaries"
                  : "Reports not saved after session"}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={profile.consent.store_reports}
            onChange={(e) => updateConsent({ store_reports: e.target.checked })}
            className="h-5 w-5 accent-[var(--stage-primary)]"
          />
        </label>
      </section>

      {/* Life Stage Switcher */}
      <section className="saheli-card p-5 space-y-3">
        <h3 className="font-editorial text-lg font-semibold">Switch Life Stage</h3>
        <LifeStageSwitcher compact />
      </section>

      {/* Synthetic Demo Profiles & Mode Switcher */}
      <section className="saheli-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-editorial text-lg font-semibold">Demo &amp; Live Mode</h3>
            <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
              Live mode never substitutes synthetic data when backend requests fail.
            </p>
          </div>
          <div className="inline-flex rounded-full border p-1" style={{ borderColor: "var(--stage-border)" }}>
            {(["demo", "live"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`min-h-[36px] rounded-full px-4 text-xs font-bold ${
                  mode === m ? "text-white" : ""
                }`}
                style={
                  mode === m ? { backgroundColor: "var(--stage-primary)" } : undefined
                }
              >
                {m === "demo" ? "Demo" : "Live"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => resetDemo("menstrual")}
            className="min-h-[44px] rounded-2xl border bg-white px-3 py-2 text-xs font-bold hover:bg-black/[0.02]"
            style={{ borderColor: "var(--stage-border)" }}
          >
            Load Menstrual Demo
          </button>
          <button
            type="button"
            onClick={() => resetDemo("pregnancy")}
            className="min-h-[44px] rounded-2xl border bg-white px-3 py-2 text-xs font-bold hover:bg-black/[0.02]"
            style={{ borderColor: "var(--stage-border)" }}
          >
            Load Pregnancy W24
          </button>
          <button
            type="button"
            onClick={() => resetDemo("postpartum")}
            className="min-h-[44px] rounded-2xl border bg-white px-3 py-2 text-xs font-bold hover:bg-black/[0.02]"
            style={{ borderColor: "var(--stage-border)" }}
          >
            Load Menopause Demo
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => resetDemo()}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border bg-white px-4 text-xs font-bold"
            style={{ borderColor: "var(--stage-border)" }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t.common.resetDemo}
          </button>
          <Link
            href="/?start=1"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border bg-white px-4 text-xs font-bold"
            style={{ borderColor: "var(--stage-border)" }}
          >
            Replay Welcome &amp; Onboarding
          </Link>
        </div>
      </section>

      {/* Firebase Auth */}
      <section className="saheli-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-editorial text-lg font-semibold">Firebase Account</h3>
          <span className="text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
            API: {backendConfigured ? "Configured" : "Not configured"}
          </span>
        </div>

        {!firebaseConfigured ? (
          <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
            Configure <code>NEXT_PUBLIC_FIREBASE_*</code> in <code>frontend/.env.local</code> for live Google/Email sign-in.
          </p>
        ) : firebaseUser ? (
          <div className="saheli-soft-card flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-xs sm:text-sm font-bold">
              Signed in as {firebaseUser.displayName || firebaseUser.email}
            </p>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white border px-4 text-xs font-bold"
              style={{ borderColor: "var(--stage-border)" }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              disabled={authBusy}
              onClick={handleGoogleAuth}
              className="saheli-pill-cta inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-xs sm:text-sm font-bold"
            >
              <LogIn className="h-4 w-4" /> Sign in with Google
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[44px] rounded-2xl border px-3 text-sm"
                style={{ borderColor: "var(--stage-border)" }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[44px] rounded-2xl border px-3 text-sm"
                style={{ borderColor: "var(--stage-border)" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={authBusy}
                onClick={() => handleEmailAuth(false)}
                className="min-h-[42px] rounded-full border px-4 text-xs font-bold"
                style={{ borderColor: "var(--stage-border)" }}
              >
                Sign in
              </button>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => handleEmailAuth(true)}
                className="min-h-[42px] rounded-full border px-4 text-xs font-bold"
                style={{ borderColor: "var(--stage-border)" }}
              >
                Create account
              </button>
            </div>
            {authError && (
              <p role="alert" className="text-xs font-semibold text-red-700">
                {authError}
              </p>
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}
