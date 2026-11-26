"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PetalItem {
  id: string;
  label: string;
  loggedCount: number;
  note: string;
}

export function WellnessFlower({
  items,
}: {
  items: PetalItem[];
}) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "sleep");
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          role="img"
          aria-label="Botanical wellness flower showing logged recovery categories"
        >
          {items.map((item, idx) => {
            const angle = (idx * 360) / items.length;
            const active = item.id === selectedId;
            return (
              <motion.g
                key={item.id}
                transform={`rotate(${angle} 100 100)`}
                whileHover={{ scale: 1.04 }}
                onClick={() => setSelectedId(item.id)}
                className="cursor-pointer"
              >
                <ellipse
                  cx="100"
                  cy="54"
                  rx={active ? "22" : "19"}
                  ry={active ? "36" : "33"}
                  fill={item.loggedCount > 0 ? "#659B83" : "#DCE8DF"}
                  opacity={active ? 0.95 : 0.72}
                  stroke={active ? "#29382F" : "#FFFFFF"}
                  strokeWidth={active ? "2.5" : "1.5"}
                />
              </motion.g>
            );
          })}
          <circle cx="100" cy="100" r="24" fill="#E9DDCA" stroke="#659B83" strokeWidth="3" />
          <text
            x="100"
            y="104"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#29382F"
          >
            {items.filter((i) => i.loggedCount > 0).length}/{items.length}
          </text>
        </svg>
      </div>

      <div className="flex-1 space-y-3 w-full">
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`min-h-[38px] rounded-2xl px-3 py-1.5 text-xs font-bold transition ${
                item.id === selectedId ? "text-white" : "bg-white border"
              }`}
              style={
                item.id === selectedId
                  ? { backgroundColor: "var(--stage-primary)" }
                  : { borderColor: "var(--stage-border)" }
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        {selected && (
          <div className="saheli-soft-card p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{selected.label}</p>
              <span className="text-xs font-semibold opacity-75">
                {selected.loggedCount} recent check-in{selected.loggedCount === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-xs sm:text-sm opacity-80">{selected.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
