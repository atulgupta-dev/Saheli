"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronRight, FileText, ListFilter } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { InteractiveCalendar } from "@/components/symptoms/InteractiveCalendar";
import { useSaheli } from "@/providers/AppProviders";

export default function JourneyPage() {
  const { activeStage, symptoms, reports, appointments } = useSaheli();
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline");
  const [filter, setFilter] = useState<"all" | "symptoms" | "appointments" | "reports">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stageSymptoms = symptoms.filter((s) => s.stage === activeStage);
  const stageReports = reports.filter((r) => r.stage === activeStage);

  const events = useMemo(() => {
    const list: {
      id: string;
      kind: "symptoms" | "appointments" | "reports";
      dateLabel: string;
      title: string;
      subtitle: string;
      detail: string;
      href: string;
    }[] = [];

    for (const s of stageSymptoms) {
      list.push({
        id: s.entry_id,
        kind: "symptoms",
        dateLabel: new Date(s.reported_at).toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        title: `Logged: ${s.symptoms.join(", ")}`,
        subtitle: `Intensity: ${s.severity}`,
        detail: s.safety.message || s.notes || "Recorded in your health journal.",
        href: "/symptoms",
      });
    }

    if (activeStage === "pregnancy") {
      for (const a of appointments) {
        list.push({
          id: a.id,
          kind: "appointments",
          dateLabel: new Date(a.date).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          title: a.title,
          subtitle: a.clinician,
          detail: a.notes,
          href: "/care",
        });
      }
    }

    for (const r of stageReports) {
      list.push({
        id: r.report_id,
        kind: "reports",
        dateLabel: r.extracted.report_date ?? "Recent",
        title: r.file_name,
        subtitle: r.status === "completed" ? "Analysis ready • View insights" : r.status,
        detail: r.explanations[0] || "Open report reader for findings.",
        href: "/reports",
      });
    }

    return filter === "all" ? list : list.filter((e) => e.kind === filter);
  }, [stageSymptoms, activeStage, appointments, stageReports, filter]);

  return (
    <AppShell title="My Journey" subtitle="Timeline, calendar & recorded events">
      {/* View & Filter Controls (Design Book Page 12) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(["all", "symptoms", "appointments", "reports"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`min-h-[38px] rounded-full px-4 text-xs font-bold capitalize transition ${
                filter === f ? "text-white shadow-xs" : "border bg-white"
              }`}
              style={
                filter === f
                  ? { backgroundColor: "var(--stage-primary)" }
                  : { borderColor: "var(--stage-border)" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-full border bg-white p-1" style={{ borderColor: "var(--stage-border)" }}>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`inline-flex min-h-[34px] items-center gap-1 rounded-full px-3 text-xs font-bold ${
              viewMode === "timeline" ? "text-white" : ""
            }`}
            style={
              viewMode === "timeline"
                ? { backgroundColor: "var(--stage-primary)" }
                : undefined
            }
          >
            <ListFilter className="h-3.5 w-3.5" /> Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`inline-flex min-h-[34px] items-center gap-1 rounded-full px-3 text-xs font-bold ${
              viewMode === "calendar" ? "text-white" : ""
            }`}
            style={
              viewMode === "calendar"
                ? { backgroundColor: "var(--stage-primary)" }
                : undefined
            }
          >
            <Calendar className="h-3.5 w-3.5" /> Calendar
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <InteractiveCalendar
          entries={stageSymptoms}
          loggedPeriodDays={activeStage === "menstrual" ? [12, 13, 14, 15, 16] : []}
          estimatedPeriodDays={activeStage === "menstrual" ? [21, 22, 23, 24] : []}
        />
      ) : events.length === 0 ? (
        <div className="saheli-card p-8 text-center space-y-2">
          <p className="font-editorial text-xl font-semibold">No recorded events yet</p>
          <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
            Log symptoms or upload a report to see your timeline build naturally.
          </p>
        </div>
      ) : (
        <div className="relative pl-7 space-y-3.5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--stage-secondary)]">
          {events.map((ev) => {
            const expanded = expandedId === ev.id;
            return (
              <div key={ev.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[25px] top-5 h-3.5 w-3.5 rounded-full ring-4 ring-white"
                  style={{ backgroundColor: "var(--stage-primary)" }}
                />
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : ev.id)}
                  className="saheli-card w-full p-4 sm:p-5 text-left transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {ev.kind === "reports" && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-primary)" }}>
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold" style={{ color: "var(--stage-primary-dark)" }}>
                          {ev.dateLabel}
                        </p>
                        <p className="font-bold text-sm sm:text-base truncate">{ev.title}</p>
                        <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                          {ev.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        expanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                  {expanded && (
                    <div className="mt-3 pt-3 border-t text-xs space-y-2" style={{ borderColor: "var(--stage-border)" }}>
                      <p className="leading-relaxed">{ev.detail}</p>
                      <Link
                        href={ev.href}
                        className="inline-flex items-center gap-1 font-bold underline"
                        style={{ color: "var(--stage-primary-dark)" }}
                      >
                        Open section <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
