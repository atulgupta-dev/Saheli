"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SaheliLogo } from "@/components/ui/SaheliLogo";
import { useSaheli } from "@/providers/AppProviders";
import { MOTION } from "@/config/motion";

export default function WelcomePage() {
  const router = useRouter();
  const { hydrated, hasCompletedOnboarding, t } = useSaheli();

  useEffect(() => {
    const forceStart =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("start") === "1";
    if (hydrated && hasCompletedOnboarding && !forceStart) {
      router.replace("/dashboard");
    }
  }, [hydrated, hasCompletedOnboarding, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF6F2] text-[#38252E] flex items-center justify-center px-4 py-8 sm:px-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION.page}
        className="relative w-full max-w-5xl overflow-hidden rounded-[36px] border border-[#F2DFDA] bg-[#FFF8F5] shadow-[0_24px_64px_-24px_rgba(166,61,98,0.28)]"
      >
        {/* Sculptural Flower Hero Background */}
        <img
          src="/illustrations/welcome-flower.jpg"
          alt="Sculptural luminous botanical flower"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-95"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FFF8F5]/95 via-[#FFF8F5]/80 to-transparent lg:via-[#FFF8F5]/65"
        />

        <div className="relative z-10 flex flex-col justify-between min-h-[560px] p-6 sm:p-10 lg:p-14 max-w-xl space-y-8">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <SaheliLogo size={42} animated />
            <span className="font-editorial text-2xl font-semibold tracking-tight text-[#38252E]">
              Saheli AI
            </span>
          </div>

          {/* Editorial Display Headline */}
          <div className="space-y-4">
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold leading-[1.12] tracking-tight text-[#38252E]">
              Your health.
              <br />
              Your journey.
              <br />
              Your Saheli.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-[#6B545E] max-w-md">
              An AI-powered companion for every phase of a woman&apos;s life — menstrual health, pregnancy, and menopause wellness.
            </p>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="space-y-3 max-w-xs">
            <Link
              href="/onboarding"
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7952B3] to-[#986AD6] px-6 text-base font-bold text-white shadow-[0_12px_28px_-8px_rgba(121,82,179,0.55)] transition hover:brightness-105 active:scale-[0.98]"
            >
              {t.getStarted}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="flex min-h-[50px] items-center justify-center rounded-full border border-[#DFC9D1] bg-white/85 px-6 text-sm font-bold text-[#38252E] backdrop-blur-sm transition hover:bg-white"
            >
              {t.exploreDemo}
            </Link>
            <p className="text-[11px] text-[#826A73] pt-1">
              {t.badges.educationalOnly}
            </p>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
