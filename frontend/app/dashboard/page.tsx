"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { LifeStageSwitcher } from "@/components/layout/LifeStageSwitcher";
import { PregnancyDashboard } from "@/components/pregnancy/PregnancyDashboard";
import { MenstrualDashboard } from "@/components/menstrual/MenstrualDashboard";
import { PostpartumDashboard } from "@/components/postpartum/PostpartumDashboard";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { useSaheli } from "@/providers/AppProviders";

export default function DashboardPage() {
  const { activeStage, language, profile } = useSaheli();
  const cfg = LIFE_STAGE_CONFIGS[activeStage];

  return (
    <AppShell
      title={`Namaste, ${profile.display_name || "Saheli"}`}
      subtitle={`${cfg.label[language]} • ${cfg.subtitle[language]}`}
    >
      {/* Mobile Stage Switcher */}
      <div className="lg:hidden">
        <LifeStageSwitcher compact />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeStage === "pregnancy" && <PregnancyDashboard />}
          {activeStage === "menstrual" && <MenstrualDashboard />}
          {activeStage === "postpartum" && <PostpartumDashboard />}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
