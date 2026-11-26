"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SymptomJournalEntry } from "@/types/saheli";

interface InteractiveCalendarProps {
  entries: SymptomJournalEntry[];
  loggedPeriodDays?: number[];
  estimatedPeriodDays?: number[];
}

export function InteractiveCalendar({
  entries,
  loggedPeriodDays = [],
  estimatedPeriodDays = [],
}: InteractiveCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = new Date(2026, 10 + monthOffset, 1);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const [selectedDay, setSelectedDay] = useState<number>(26);

  const entriesByDay = useMemo(() => {
    const map = new Map<number, SymptomJournalEntry[]>();
    for (const entry of entries) {
      const d = new Date(entry.reported_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map.set(day, [...(map.get(day) ?? []), entry]);
      }
    }
    return map;
  }, [entries, year, month]);

  const monthLabel = baseDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const selectedEntries = entriesByDay.get(selectedDay) ?? [];

  return (
    <div className="saheli-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-extrabold">Health Calendar</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthOffset((m) => m - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-black/5"
            style={{ borderColor: "var(--stage-border)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[128px] text-center text-sm font-bold">
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthOffset((m) => m + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-black/5"
            style={{ borderColor: "var(--stage-border)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold opacity-60">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`pad-${idx}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const isSelected = day === selectedDay;
          const hasSymptom = entriesByDay.has(day);
          const isPeriod = monthOffset === 0 && loggedPeriodDays.includes(day);
          const isEstimated = monthOffset === 0 && estimatedPeriodDays.includes(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              aria-label={`${day} ${monthLabel}${hasSymptom ? ", has symptom log" : ""}`}
              className={`relative flex min-h-[42px] flex-col items-center justify-center rounded-xl text-xs font-bold transition ${
                isSelected
                  ? "text-white shadow-sm"
                  : isPeriod
                    ? "bg-rose-100 text-rose-900"
                    : isEstimated
                      ? "border border-dashed border-rose-400 bg-rose-50/60 text-rose-900"
                      : "hover:bg-black/5"
              }`}
              style={isSelected ? { backgroundColor: "var(--stage-primary)" } : undefined}
            >
              <span>{day}</span>
              {hasSymptom && (
                <span
                  className="mt-0.5 h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? "#FFFFFF" : "var(--stage-primary-dark)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {(loggedPeriodDays.length > 0 || estimatedPeriodDays.length > 0) && (
        <div className="flex flex-wrap gap-3 text-[11px] font-semibold opacity-80">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-200 inline-block" /> Logged period
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-dashed border-rose-400 inline-block" />{" "}
            Estimated window (not guaranteed)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full inline-block"
              style={{ backgroundColor: "var(--stage-primary-dark)" }}
            />{" "}
            Symptom logged
          </span>
        </div>
      )}

      <div className="saheli-soft-card p-3.5 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide opacity-70">
          Entries for {selectedDay} {monthLabel}
        </p>
        {selectedEntries.length === 0 ? (
          <p className="text-xs opacity-75">
            No symptoms recorded on this date. Use Daily Check-in to add one.
          </p>
        ) : (
          selectedEntries.map((entry) => (
            <div key={entry.entry_id} className="rounded-xl bg-white p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>{entry.symptoms.join(", ")}</span>
                <span className="capitalize opacity-70">{entry.severity}</span>
              </div>
              {entry.notes && <p className="opacity-80">{entry.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
