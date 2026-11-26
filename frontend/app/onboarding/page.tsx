"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useSaheli } from "@/providers/AppProviders";
import { SaheliLogo } from "@/components/ui/SaheliLogo";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { STAGE_THEMES } from "@/config/themes";
import { MOTION } from "@/config/motion";
import { AppLanguage, LifeStage } from "@/types/saheli";

const STEPS = ["language", "stage", "personalise", "consent"] as const;

const STAGE_ART: Record<LifeStage, string> = {
  menstrual: "/illustrations/stage-menstrual.jpg",
  pregnancy: "/illustrations/stage-pregnancy.jpg",
  postpartum: "/illustrations/stage-menopause.jpg",
};

export default function OnboardingPage() {
  const router = useRouter();
  const {
    t,
    language,
    setLanguage,
    activeStage,
    setStage,
    profile,
    updateProfile,
    updateConsent,
    completeOnboarding,
    resetDemo,
    switchMode,
  } = useSaheli();

  const [stepIdx, setStepIdx] = useState(0);
  const [pregWeek, setPregWeek] = useState<string>(
    String(profile.stage_profiles.pregnancy?.gestational_week ?? 24)
  );
  const [lastPeriod, setLastPeriod] = useState<string>(
    profile.stage_profiles.menstrual?.last_period_date ?? ""
  );
  const [cycleLen, setCycleLen] = useState<string>(
    String(profile.stage_profiles.menstrual?.typical_cycle_length ?? 28)
  );
  const [postpartumWeeks, setPostpartumWeeks] = useState<string>(
    String(profile.stage_profiles.postpartum?.weeks_postpartum ?? 6)
  );

  const step = STEPS[stepIdx];

  const handleSavePersonalAndNext = () => {
    updateProfile((prev) => ({
      ...prev,
      stage_profiles: {
        ...prev.stage_profiles,
        pregnancy: {
          ...prev.stage_profiles.pregnancy,
          gestational_week: Number(pregWeek) || 24,
          trimester:
            (Number(pregWeek) || 24) <= 13
              ? 1
              : (Number(pregWeek) || 24) <= 27
                ? 2
                : 3,
        },
        menstrual: {
          ...prev.stage_profiles.menstrual,
          last_period_date: lastPeriod || undefined,
          typical_cycle_length: Number(cycleLen) || 28,
        },
        postpartum: {
          ...prev.stage_profiles.postpartum,
          weeks_postpartum: Number(postpartumWeeks) || 6,
        },
      },
    }));
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };

  const handleFinishDemo = () => {
    resetDemo(activeStage);
    completeOnboarding();
    router.push("/dashboard");
  };

  const handleFinishLive = () => {
    switchMode("live");
    completeOnboarding();
    router.push("/dashboard");
  };

  const langCards: { id: AppLanguage; title: string; sample: string }[] = [
    { id: "en-IN", title: "English", sample: "Clear everyday English for reports & care" },
    { id: "hi-IN", title: "हिंदी (Hindi)", sample: "आसान हिंदी में बातचीत और स्वास्थ्य जानकारी" },
    { id: "hi-Latn", title: "Hinglish", sample: "Simple Hindi written in English script" },
  ];

  const stageOrder: LifeStage[] = ["menstrual", "pregnancy", "postpartum"];

  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-4 py-6 sm:py-10">
      {/* Header Progress */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {stepIdx > 0 ? (
            <button
              type="button"
              aria-label={t.backBtn}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border shadow-xs"
              style={{ borderColor: "var(--stage-border)" }}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <SaheliLogo size={36} />
          )}
          <span className="font-editorial text-lg font-semibold">Saheli AI</span>
        </div>

        <div className="flex items-center gap-1.5" aria-label={`Step ${stepIdx + 1} of ${STEPS.length}`}>
          {STEPS.map((s, idx) => (
            <span
              key={s}
              className="h-2 rounded-full transition-all"
              style={{
                width: idx === stepIdx ? 28 : 10,
                backgroundColor:
                  idx <= stepIdx ? "var(--stage-primary)" : "var(--stage-border)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Step Card */}
      <div className="w-full max-w-2xl my-6">
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={MOTION.page}
            className="saheli-card p-6 sm:p-8 space-y-6"
          >
            {step === "language" && (
              <div className="space-y-5">
                <div>
                  <h1 className="font-editorial text-3xl font-semibold">
                    {t.onboarding.langTitle}
                  </h1>
                  <p className="mt-1 text-sm" style={{ color: "var(--stage-text-muted)" }}>
                    {t.onboarding.langSubtitle}
                  </p>
                </div>
                <div className="space-y-3">
                  {langCards.map((item) => {
                    const selected = language === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        whileTap={MOTION.buttonTap}
                        onClick={() => setLanguage(item.id)}
                        className="w-full flex min-h-[68px] items-center justify-between gap-3 rounded-3xl border-2 p-4 text-left transition"
                        style={{
                          borderColor: selected
                            ? "var(--stage-primary)"
                            : "var(--stage-border)",
                          backgroundColor: selected
                            ? "var(--stage-surface-muted)"
                            : "#FFFFFF",
                        }}
                      >
                        <div>
                          <p className="font-bold text-base">{item.title}</p>
                          <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                            {item.sample}
                          </p>
                        </div>
                        {selected && (
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                            style={{ backgroundColor: "var(--stage-primary)" }}
                          >
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "stage" && (
              <div className="space-y-5">
                <div>
                  <h1 className="font-editorial text-3xl sm:text-4xl font-semibold leading-tight">
                    Choose your health journey
                  </h1>
                  <p className="mt-1 text-sm" style={{ color: "var(--stage-text-muted)" }}>
                    {t.onboarding.stageSubtitle}
                  </p>
                </div>

                {/* Three Illustrated Stage Cards (Design Book Page 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {stageOrder.map((id) => {
                    const cfg = LIFE_STAGE_CONFIGS[id];
                    const tokens = STAGE_THEMES[id];
                    const selected = activeStage === id;
                    return (
                      <motion.button
                        key={id}
                        type="button"
                        whileTap={MOTION.buttonTap}
                        onClick={() => setStage(id)}
                        className="relative overflow-hidden rounded-[26px] border-2 text-left transition flex flex-col"
                        style={{
                          borderColor: selected ? tokens.primary : tokens.border,
                          backgroundColor: tokens.mutedAccent,
                          boxShadow: selected
                            ? `0 14px 32px -12px ${tokens.primary}`
                            : undefined,
                        }}
                      >
                        <div className="relative h-44 w-full overflow-hidden">
                          <img
                            src={STAGE_ART[id]}
                            alt={cfg.label[language]}
                            className="h-full w-full object-cover object-top"
                          />
                          {selected && (
                            <span
                              className="absolute right-3 bottom-3 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md"
                              style={{ backgroundColor: tokens.primary }}
                            >
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        <div className="p-4 space-y-1 bg-white/85 backdrop-blur-xs flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-editorial text-lg font-semibold leading-tight" style={{ color: tokens.text }}>
                              {cfg.label[language]}
                            </p>
                          </div>
                          <p className="text-xs font-medium" style={{ color: tokens.textMuted }}>
                            {cfg.subtitle[language]}
                          </p>
                          {!cfg.mvpLive && (
                            <span
                              className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                backgroundColor: tokens.badgeBg,
                                color: tokens.badgeText,
                              }}
                            >
                              {t.badges.comingSoon}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "personalise" && (
              <div className="space-y-5">
                <div>
                  <h1 className="font-editorial text-3xl font-semibold">
                    {t.onboarding.personalTitle}
                  </h1>
                  <p className="mt-1 text-sm" style={{ color: "var(--stage-text-muted)" }}>
                    {t.onboarding.personalSubtitle}
                  </p>
                </div>

                {activeStage === "pregnancy" && (
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold">
                      Current pregnancy week (optional, 1–40)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={pregWeek}
                      onChange={(e) => setPregWeek(e.target.value)}
                      className="w-full min-h-[48px] rounded-2xl border px-4 text-base bg-white"
                      style={{ borderColor: "var(--stage-border)" }}
                    />
                  </label>
                )}

                {activeStage === "menstrual" && (
                  <div className="space-y-4">
                    <label className="block space-y-1.5">
                      <span className="text-sm font-semibold">
                        Last period start date (optional)
                      </span>
                      <input
                        type="date"
                        value={lastPeriod}
                        onChange={(e) => setLastPeriod(e.target.value)}
                        className="w-full min-h-[48px] rounded-2xl border px-4 text-base bg-white"
                        style={{ borderColor: "var(--stage-border)" }}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-semibold">
                        Typical cycle length in days (optional)
                      </span>
                      <input
                        type="number"
                        min={20}
                        max={45}
                        value={cycleLen}
                        onChange={(e) => setCycleLen(e.target.value)}
                        className="w-full min-h-[48px] rounded-2xl border px-4 text-base bg-white"
                        style={{ borderColor: "var(--stage-border)" }}
                      />
                    </label>
                  </div>
                )}

                {activeStage === "postpartum" && (
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold">
                      Wellness focus stage duration (weeks, optional)
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={104}
                      value={postpartumWeeks}
                      onChange={(e) => setPostpartumWeeks(e.target.value)}
                      className="w-full min-h-[48px] rounded-2xl border px-4 text-base bg-white"
                      style={{ borderColor: "var(--stage-border)" }}
                    />
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => setStepIdx((i) => i + 1)}
                  className="text-sm font-semibold underline opacity-75 hover:opacity-100"
                >
                  {t.skip}
                </button>
              </div>
            )}

            {step === "consent" && (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: "var(--stage-primary)" }}
                  >
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="font-editorial text-3xl font-semibold">
                      {t.onboarding.consentTitle}
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--stage-text-muted)" }}>
                      {t.onboarding.consentSubtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border p-4 cursor-pointer"
                    style={{ borderColor: "var(--stage-border)" }}
                  >
                    <div>
                      <p className="text-sm font-bold">Remember conversation context</p>
                      <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                        Off by default until you opt in.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.consent.store_conversations}
                      onChange={(e) =>
                        updateConsent({ store_conversations: e.target.checked })
                      }
                      className="h-5 w-5 accent-[var(--stage-primary)]"
                    />
                  </label>

                  <label
                    className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border p-4 cursor-pointer"
                    style={{ borderColor: "var(--stage-border)" }}
                  >
                    <div>
                      <p className="text-sm font-bold">Save uploaded reports in history</p>
                      <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                        Keep extracted summaries only when opted in.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.consent.store_reports}
                      onChange={(e) => updateConsent({ store_reports: e.target.checked })}
                      className="h-5 w-5 accent-[var(--stage-primary)]"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleFinishDemo}
                    className="saheli-pill-cta flex min-h-[50px] items-center justify-center gap-2 rounded-full px-5 text-sm sm:text-base font-bold transition active:scale-[0.98]"
                  >
                    Explore Synthetic Demo
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishLive}
                    className="flex min-h-[48px] items-center justify-center rounded-full border px-5 text-sm font-bold hover:bg-black/5"
                    style={{ borderColor: "var(--stage-border)" }}
                  >
                    Continue in Live Mode
                  </button>
                </div>
              </div>
            )}

            {step !== "consent" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={
                    step === "personalise"
                      ? handleSavePersonalAndNext
                      : () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))
                  }
                  className="saheli-pill-cta flex w-full min-h-[50px] items-center justify-center gap-2 rounded-full text-sm sm:text-base font-bold"
                >
                  {t.continueBtn}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <p className="text-xs text-center max-w-md" style={{ color: "var(--stage-text-muted)" }}>
        {t.badges.educationalOnly}
      </p>
    </main>
  );
}
