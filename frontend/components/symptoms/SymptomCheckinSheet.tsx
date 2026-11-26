"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { MOTION } from "@/config/motion";
import { useSaheli } from "@/providers/AppProviders";
import { saheliApi } from "@/lib/api/client";
import { SafetyAssessment, SymptomJournalEntry } from "@/types/saheli";
import { UrgentCareBanner } from "@/components/safety/UrgentCareBanner";

interface SymptomCheckinSheetProps {
  open: boolean;
  onClose: () => void;
  initialSymptom?: string;
}

export function SymptomCheckinSheet({
  open,
  onClose,
  initialSymptom,
}: SymptomCheckinSheetProps) {
  const {
    activeStage,
    language,
    mode,
    isOnline,
    t,
    getApiContext,
    addSymptomEntry,
    showToast,
  } = useSaheli();

  const stageCfg = LIFE_STAGE_CONFIGS[activeStage];
  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("moderate");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSafety, setLastSafety] = useState<SafetyAssessment | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setLastSafety(null);
      setSelected(initialSymptom ? [initialSymptom] : []);
    }
  }, [open, initialSymptom, activeStage]);

  const toggleSymptom = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (selected.length === 0 && !notes.trim()) {
      setErrorMsg("Select at least one symptom or add a short note.");
      return;
    }

    if (mode === "live" && !isOnline) {
      setErrorMsg(
        "Safety assessment requires connectivity in Live Mode. Could not assess symptoms while offline."
      );
      return;
    }

    setSubmitting(true);
    try {
      const ctx = await getApiContext();
      const payload = {
        stage: activeStage,
        reported_at: new Date().toISOString(),
        symptoms: selected.length > 0 ? selected : ["other"],
        severity,
        notes: notes.trim() || undefined,
      };
      const res = await saheliApi.logSymptom(payload, ctx);
      const entry: SymptomJournalEntry = {
        entry_id: res.entry_id,
        stage: activeStage,
        reported_at: payload.reported_at,
        symptoms: payload.symptoms,
        severity,
        notes: payload.notes,
        safety: res.safety,
        is_demo: mode === "demo",
      };
      addSymptomEntry(entry);
      setLastSafety(res.safety);
      setSelected([]);
      setNotes("");
      showToast(t.common.saved);
      if (res.safety.level === "informational") {
        onClose();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Symptom safety service is unavailable. Symptoms could not be assessed."
      );
      setLastSafety(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/35 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Daily Check-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={MOTION.page}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] bg-white p-5 sm:p-6 shadow-2xl space-y-5"
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-black/10 sm:hidden" />
            <div className="flex items-center justify-between gap-2">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--stage-text-muted)" }}
                >
                  Daily Check-in • {stageCfg.label[language]}
                </p>
                <h2 className="font-editorial text-2xl font-semibold">
                  How are you feeling today?
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close daily check-in"
                className="flex h-11 w-11 items-center justify-center rounded-full border hover:bg-black/5"
                style={{ borderColor: "var(--stage-border)" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-2.5">
                {stageCfg.symptoms.map((sym) => {
                  const isSelected = selected.includes(sym.id);
                  return (
                    <motion.button
                      key={sym.id}
                      type="button"
                      whileTap={MOTION.buttonTap}
                      aria-pressed={isSelected}
                      onClick={() => toggleSymptom(sym.id)}
                      className="flex min-h-[54px] items-center justify-between gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold transition"
                      style={{
                        borderColor: isSelected
                          ? sym.urgentHint
                            ? "#DC2626"
                            : "var(--stage-primary)"
                          : "var(--stage-border)",
                        backgroundColor: isSelected
                          ? sym.urgentHint
                            ? "#FEF2F2"
                            : "var(--stage-surface-muted)"
                          : "#FFFFFF",
                        color: sym.urgentHint && isSelected ? "#991B1B" : "var(--stage-text)",
                      }}
                    >
                      <span className="leading-snug">{sym.label[language]}</span>
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition"
                        style={{
                          backgroundColor: isSelected
                            ? sym.urgentHint
                              ? "#DC2626"
                              : "var(--stage-primary)"
                            : "transparent",
                          borderColor: isSelected ? "transparent" : "var(--stage-border)",
                          color: "#FFFFFF",
                        }}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--stage-text-muted)" }}
                >
                  Intensity
                </p>
                <div
                  className="grid grid-cols-3 gap-2 rounded-2xl p-1"
                  style={{ backgroundColor: "var(--stage-surface-muted)" }}
                >
                  {(["mild", "moderate", "severe"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`min-h-[42px] rounded-xl text-xs sm:text-sm font-bold capitalize transition ${
                        severity === lvl ? "text-white shadow-sm" : ""
                      }`}
                      style={
                        severity === lvl
                          ? { backgroundColor: "var(--stage-primary)" }
                          : undefined
                      }
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--stage-text-muted)" }}
                >
                  Add a note (optional)
                </span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="When did it start, or what helped?"
                  className="w-full rounded-2xl border p-3 text-sm"
                  style={{ borderColor: "var(--stage-border)" }}
                />
              </label>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-900"
                >
                  {errorMsg}
                </div>
              )}

              {lastSafety && (lastSafety.level === "urgent" || lastSafety.level === "consult") && (
                <UrgentCareBanner safety={lastSafety} />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="saheli-pill-cta flex w-full min-h-[50px] items-center justify-center gap-2 rounded-full text-sm font-bold transition active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.common.saving}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Save Check-in {selected.length > 0 ? `(${selected.length})` : ""}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
