"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  Check,
  FileText,
  Loader2,
  MapPin,
  PhoneCall,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { UrgentCareBanner } from "@/components/safety/UrgentCareBanner";
import { useSaheli } from "@/providers/AppProviders";
import { saheliApi } from "@/lib/api/client";
import { CareSummaryResponse, SafetyAssessment } from "@/types/saheli";

const WARNING_CHECKS = [
  { id: "bleeding", label: "Vaginal bleeding or fluid leakage" },
  { id: "headache", label: "Severe headache with blurred vision" },
  { id: "swelling", label: "Sudden swelling in face or hands" },
  { id: "movement", label: "Noticeably reduced baby movements" },
];

export default function CarePage() {
  const {
    activeStage,
    appointments,
    addAppointment,
    reports,
    mode,
    getApiContext,
    showToast,
  } = useSaheli();

  const [checkedSigns, setCheckedSigns] = useState<string[]>([]);
  const [prepChecklist, setPrepChecklist] = useState<Record<string, boolean>>({
    reports: true,
    questions: false,
    medicines: false,
  });
  const [apptTitle, setApptTitle] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptClinician, setApptClinician] = useState("");
  const [manualArea, setManualArea] = useState("");
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<CareSummaryResponse | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const toggleWarningCheck = (id: string) => {
    setCheckedSigns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const quickCheckSafety: SafetyAssessment | null =
    checkedSigns.length > 0
      ? {
          level: "urgent",
          message:
            "You checked one or more pregnancy warning signs. Please contact your obstetrician or visit the nearest emergency maternity unit right away.",
          rule_ids: ["PREG_WARNING_SELF_CHECK"],
          next_steps: [
            "Call India emergency helpline 108 / 102 or your maternity clinic immediately.",
            "Bring your recent ultrasound reports and Clinician Summary below.",
          ],
        }
      : null;

  const handleAddAppt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptTitle.trim() || !apptDate) return;
    addAppointment({
      id: `appt_${Date.now()}`,
      title: apptTitle.trim(),
      date: new Date(apptDate).toISOString(),
      clinician: apptClinician.trim() || "Obstetrician / Clinic",
      location: "User-entered clinic",
      notes: "Added via Care & Appointments",
    });
    setApptTitle("");
    setApptDate("");
    setApptClinician("");
    showToast("Appointment saved");
  };

  const handleQuickSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const ctx = await getApiContext();
      const stageReports = reports
        .filter((r) => r.stage === activeStage && r.status === "completed")
        .map((r) => r.report_id);
      const res = await saheliApi.generateCareSummary(
        { stage: activeStage, report_ids: stageReports, include_symptoms: true },
        ctx
      );
      setSummaryResult(res);
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Could not prepare clinician summary."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice("Geolocation unavailable. Enter your city or PIN code below.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationNotice(
          `Coordinates captured (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}). Google Maps Places API is not configured, so Saheli will not fabricate hospital listings—use Open Maps or call 108 / 102.`
        );
      },
      () => {
        setLocationNotice(
          "Location permission declined. Enter your city/PIN code below or call India emergency maternal helplines (108 / 102)."
        );
      }
    );
  };

  return (
    <AppShell
      title="Care & Support"
      subtitle="Safety check, clinician summary & appointments"
    >
      {quickCheckSafety && <UrgentCareBanner safety={quickCheckSafety} />}

      {/* Editorial Urgent Care Banner (Design Book Page 15) */}
      <section className="relative overflow-hidden rounded-[32px] border-2 border-[#D98296] bg-[#FFF4F6] p-5 sm:p-7 text-[#3F121D]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#BE294D] text-white">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold">
                Immediate Safety Check
              </h2>
            </div>
            <p className="text-xs sm:text-sm opacity-90">
              Tap any symptom you are experiencing right now to see immediate care guidance:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WARNING_CHECKS.map((item) => {
                const selected = checkedSigns.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleWarningCheck(item.id)}
                    className={`flex min-h-[46px] items-center gap-2.5 rounded-2xl border px-3.5 py-2 text-left text-xs font-bold transition ${
                      selected
                        ? "border-[#BE294D] bg-[#BE294D] text-white"
                        : "border-[#EAC8D0] bg-white hover:bg-white/80"
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current/30">
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <a
                href="tel:108"
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#A62447] px-5 text-xs sm:text-sm font-bold text-white shadow-sm"
              >
                <PhoneCall className="h-4 w-4" /> Call Emergency (108)
              </a>
              <button
                type="button"
                disabled={summaryLoading}
                onClick={handleQuickSummary}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[#D98296] bg-white px-5 text-xs sm:text-sm font-bold text-[#3F121D]"
              >
                {summaryLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Create Clinician Summary ({mode === "demo" ? "Demo" : "Live"})
              </button>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-4 justify-end">
            <img
              src="/illustrations/clinician-care.jpg"
              alt="Doctor support illustration"
              className="h-52 w-52 rounded-3xl object-cover shadow-sm"
            />
          </div>
        </div>
      </section>

      {summaryError && (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-900">
          {summaryError}
        </div>
      )}

      {summaryResult && (
        <section className="saheli-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-xl font-semibold">Clinician Summary Ready</h3>
            <Link href="/symptoms#clinician-summary" className="text-xs font-bold underline" style={{ color: "var(--stage-primary-dark)" }}>
              Download / Copy in Journal →
            </Link>
          </div>
          <pre className="saheli-soft-card p-4 whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
            {summaryResult.summary}
          </pre>
          <p className="text-xs font-bold opacity-75">{summaryResult.medical_disclaimer}</p>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Appointments & Visit Prep Checklist */}
        <section className="saheli-card p-5 space-y-4">
          <h3 className="font-editorial text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: "var(--stage-primary)" }} />
            Appointments &amp; Visit Prep
          </h3>

          <div className="saheli-soft-card p-3.5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
              Pre-Visit Checklist
            </p>
            {[
              { id: "reports", label: "Latest ultrasound / blood test PDFs" },
              { id: "questions", label: "Written questions for your doctor" },
              { id: "medicines", label: "Current supplements / prescription list" },
            ].map((item) => (
              <label key={item.id} className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(prepChecklist[item.id])}
                  onChange={(e) =>
                    setPrepChecklist((prev) => ({
                      ...prev,
                      [item.id]: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--stage-primary)]"
                />
                <span className={prepChecklist[item.id] ? "line-through opacity-60" : ""}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-2.5">
            {appointments.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-white p-3.5 space-y-1" style={{ borderColor: "var(--stage-border)" }}>
                <p className="font-bold text-sm">{a.title}</p>
                <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                  {new Date(a.date).toLocaleString("en-IN")} • {a.clinician}
                </p>
                <p className="text-xs opacity-85">{a.notes}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddAppt} className="space-y-2.5 pt-2 border-t" style={{ borderColor: "var(--stage-border)" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--stage-text-muted)" }}>
              Add Appointment
            </p>
            <input
              type="text"
              required
              placeholder="Visit title (e.g., Week 28 Checkup)"
              value={apptTitle}
              onChange={(e) => setApptTitle(e.target.value)}
              className="w-full min-h-[44px] rounded-2xl border px-3 text-sm bg-white"
              style={{ borderColor: "var(--stage-border)" }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="datetime-local"
                required
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full min-h-[44px] rounded-2xl border px-3 text-sm bg-white"
                style={{ borderColor: "var(--stage-border)" }}
              />
              <input
                type="text"
                placeholder="Doctor / Clinic name"
                value={apptClinician}
                onChange={(e) => setApptClinician(e.target.value)}
                className="w-full min-h-[44px] rounded-2xl border px-3 text-sm bg-white"
                style={{ borderColor: "var(--stage-border)" }}
              />
            </div>
            <button
              type="submit"
              className="saheli-pill-cta inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-5 text-xs font-bold"
            >
              <Plus className="h-4 w-4" /> Save Appointment
            </button>
          </form>
        </section>

        {/* Nearby Maternity Care */}
        <section className="saheli-card p-5 space-y-4">
          <h3 className="font-editorial text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" style={{ color: "var(--stage-primary)" }} />
            Nearby Maternity Care
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--stage-text-muted)" }}>
            Location is requested only with your permission. Saheli AI never fabricates clinic names or distances when Google Maps Places API is not configured.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRequestLocation}
              className="w-full min-h-[46px] rounded-full border bg-white px-4 text-xs sm:text-sm font-bold hover:bg-black/[0.03]"
              style={{ borderColor: "var(--stage-border)" }}
            >
              Use Current Location (Permission Required)
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter city or PIN code"
                value={manualArea}
                onChange={(e) => setManualArea(e.target.value)}
                className="flex-1 min-h-[46px] rounded-full border px-4 text-sm bg-white"
                style={{ borderColor: "var(--stage-border)" }}
              />
              <a
                href={
                  manualArea.trim()
                    ? `https://www.google.com/maps/search/maternity+hospital+near+${encodeURIComponent(manualArea.trim())}`
                    : "https://www.google.com/maps/search/maternity+hospital+near+me"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="saheli-pill-cta inline-flex min-h-[46px] items-center rounded-full px-5 text-xs font-bold"
              >
                Open Maps
              </a>
            </div>

            {locationNotice && (
              <p className="saheli-soft-card p-3.5 text-xs leading-relaxed">
                {locationNotice}
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
