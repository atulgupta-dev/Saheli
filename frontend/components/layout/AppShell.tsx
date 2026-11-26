"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarHeart,
  FileSearch,
  Globe,
  Home,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { useSaheli } from "@/providers/AppProviders";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { SaheliLogo } from "@/components/ui/SaheliLogo";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { LifeStageSwitcher } from "@/components/layout/LifeStageSwitcher";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { UrgentCareBanner } from "@/components/safety/UrgentCareBanner";
import { AppLanguage } from "@/types/saheli";

const LANGUAGES: { id: AppLanguage; short: string; label: string }[] = [
  { id: "en-IN", short: "EN", label: "English" },
  { id: "hi-IN", short: "हिं", label: "हिंदी" },
  { id: "hi-Latn", short: "Hinglish", label: "Hinglish" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    t,
    mode,
    language,
    setLanguage,
    activeStage,
    symptoms,
    reports,
    profile,
    latestUrgentSafety,
    clearLatestUrgentSafety,
    toast,
  } = useSaheli();

  const stageCfg = LIFE_STAGE_CONFIGS[activeStage];
  const stageSymptomsCount = symptoms.filter((s) => s.stage === activeStage).length;
  const stageReportsCount = reports.filter((r) => r.stage === activeStage).length;

  const desktopNav = [
    { href: "/dashboard", label: t.nav.home, icon: Home },
    { href: "/journey", label: t.nav.journey, icon: CalendarHeart },
    { href: "/chat", label: t.nav.ai, icon: Sparkles },
    { href: "/symptoms", label: t.nav.symptoms, icon: Activity },
    { href: "/reports", label: t.nav.reports, icon: FileSearch },
    { href: "/care", label: t.nav.care, icon: PhoneCall },
    { href: "/profile", label: t.nav.profile, icon: UserCircle2 },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Compact Branded Desktop Sidebar */}
      <aside
        aria-label="Desktop navigation"
        className="hidden lg:flex lg:w-68 lg:shrink-0 lg:flex-col lg:justify-between p-5 border-r"
        style={{
          backgroundColor: "var(--stage-surface)",
          borderColor: "var(--stage-border)",
        }}
      >
        <div className="space-y-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <SaheliLogo size={40} />
            <div>
              <p className="font-editorial text-xl font-semibold tracking-tight">Saheli AI</p>
              <p className="text-[11px]" style={{ color: "var(--stage-text-muted)" }}>
                Women&apos;s Health Companion
              </p>
            </div>
          </Link>

          <div className="space-y-2">
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--stage-text-muted)" }}
            >
              Life Stage
            </p>
            <LifeStageSwitcher compact />
          </div>

          <nav className="space-y-1" aria-label="Sidebar links">
            {desktopNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    active ? "text-white shadow-sm" : "hover:bg-black/[0.04]"
                  }`}
                  style={
                    active
                      ? { backgroundColor: "var(--stage-primary)" }
                      : { color: "var(--stage-text)" }
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                  {activeStage !== "pregnancy" &&
                    (item.href === "/chat" || item.href === "/reports") && (
                      <span className="ml-auto rounded-full bg-black/10 px-2 py-0.5 text-[10px]">
                        Preview
                      </span>
                    )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t" style={{ borderColor: "var(--stage-border)" }}>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
              <Globe className="h-4 w-4" aria-hidden="true" /> Language
            </span>
            <div className="flex gap-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLanguage(l.id)}
                  className={`min-h-[34px] rounded-xl px-2.5 text-xs font-bold transition ${
                    language === l.id ? "text-white" : "hover:bg-black/5"
                  }`}
                  style={
                    language === l.id
                      ? { backgroundColor: "var(--stage-primary)" }
                      : undefined
                  }
                >
                  {l.short}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl px-3.5 py-2.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--stage-badge-bg)",
              color: "var(--stage-badge-text)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">
                {mode === "demo" ? t.badges.demoMode : t.badges.liveMode}
              </span>
              <Link href="/profile#privacy" className="underline">
                <ShieldCheck className="inline h-3.5 w-3.5 mr-0.5" />
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur-lg lg:px-8"
          style={{
            backgroundColor: "rgba(255,255,255,0.84)",
            borderColor: "var(--stage-border)",
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/dashboard" className="lg:hidden shrink-0">
              <SaheliLogo size={36} />
            </Link>
            <div className="min-w-0">
              {subtitle && (
                <p className="truncate text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                  {subtitle}
                </p>
              )}
              {title ? (
                <h1 className="font-editorial truncate text-lg sm:text-xl font-semibold tracking-tight">
                  {title}
                </h1>
              ) : (
                <p className="font-editorial truncate text-lg font-semibold">Saheli AI</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mode === "demo" && (
              <span
                className="hidden sm:inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold"
                style={{
                  backgroundColor: "var(--stage-badge-bg)",
                  color: "var(--stage-badge-text)",
                }}
              >
                {t.badges.demoMode}
              </span>
            )}

            <select
              aria-label="Select language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as AppLanguage)}
              className="min-h-[40px] rounded-full border bg-white px-3 text-xs font-bold lg:hidden"
              style={{ borderColor: "var(--stage-border)" }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>

            <Link
              href="/care"
              aria-label="Care and safety alerts"
              className="flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm hover:bg-black/5"
              style={{ borderColor: "var(--stage-border)" }}
            >
              <Bell className="h-[18px] w-[18px]" style={{ color: "var(--stage-primary)" }} />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pb-12">
          <OfflineIndicator />
          <InstallAppPrompt />
          {latestUrgentSafety && (
            <UrgentCareBanner
              safety={latestUrgentSafety}
              onDismiss={clearLatestUrgentSafety}
            />
          )}
          {children}
        </main>
      </div>

      {/* Wide Desktop Contextual Companion Panel (Section 10) */}
      <aside
        aria-label="Contextual companion snapshot"
        className="hidden xl:flex xl:w-76 xl:shrink-0 xl:flex-col gap-4 p-5 border-l"
        style={{
          backgroundColor: "var(--stage-surface)",
          borderColor: "var(--stage-border)",
        }}
      >
        <div className="saheli-soft-card p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
            Active Companion Context
          </p>
          <p className="font-editorial text-xl font-semibold">{stageCfg.label[language]}</p>
          <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
            {stageSymptomsCount} symptom log{stageSymptomsCount === 1 ? "" : "s"} •{" "}
            {stageReportsCount} report{stageReportsCount === 1 ? "" : "s"}
          </p>
          <p className="text-xs font-semibold">
            Memory: {profile.consent.store_conversations ? "Consented On" : "Off"}
          </p>
        </div>

        <div className="rounded-3xl border p-4 space-y-2.5" style={{ borderColor: "var(--stage-border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
            Quick Actions
          </p>
          <Link
            href="/chat"
            className="saheli-pill-cta flex min-h-[42px] items-center justify-between rounded-full px-4 text-xs font-bold"
          >
            <span>Open Saheli Voice</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/symptoms#clinician-summary"
            className="flex min-h-[42px] items-center justify-between rounded-full border bg-white px-4 text-xs font-bold hover:bg-black/[0.02]"
            style={{ borderColor: "var(--stage-border)" }}
          >
            <span>Clinician Summary</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/care"
            className="flex min-h-[42px] items-center justify-between rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-900 hover:bg-rose-100"
          >
            <span>Urgent Safety Guide</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <p className="mt-auto text-[11px] leading-relaxed" style={{ color: "var(--stage-text-muted)" }}>
          {t.badges.educationalOnly}
        </p>
      </aside>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 right-4 z-50 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg"
          style={{ backgroundColor: "var(--stage-primary-dark)" }}
        >
          {toast}
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
