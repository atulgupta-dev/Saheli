"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarHeart,
  FileSearch,
  Home,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { useSaheli } from "@/providers/AppProviders";
import { MOTION } from "@/config/motion";

export function BottomNavigation() {
  const pathname = usePathname();
  const { t } = useSaheli();

  const items = [
    { href: "/dashboard", label: t.nav.home, icon: Home, isCenter: false },
    { href: "/journey", label: t.nav.journey, icon: CalendarHeart, isCenter: false },
    { href: "/chat", label: t.nav.ai, icon: Sparkles, isCenter: true },
    { href: "/reports", label: t.nav.reports, icon: FileSearch, isCenter: false },
    { href: "/profile", label: t.nav.profile, icon: UserCircle2, isCenter: false },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
    >
      <div
        className="mx-auto flex max-w-md items-center justify-between rounded-[30px] px-2.5 py-1.5 shadow-[0_12px_36px_-10px_rgba(41,35,54,0.18)] backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.94)",
          border: "1px solid var(--stage-border)",
        }}
      >
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/journey" && pathname === "/symptoms");
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="relative -mt-7 flex min-w-[68px] flex-col items-center justify-center"
              >
                <motion.div
                  whileTap={MOTION.buttonTap}
                  animate={{
                    boxShadow: active
                      ? "0 12px 28px -4px var(--stage-primary)"
                      : "0 10px 22px -6px rgba(41,35,54,0.28)",
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full text-white ring-4 ring-white"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, var(--stage-secondary) 0%, var(--stage-primary) 55%, var(--stage-primary-dark) 100%)",
                  }}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </motion.div>
                <span
                  className="mt-1 text-[11px] font-bold"
                  style={{
                    color: active ? "var(--stage-primary-dark)" : "var(--stage-text-muted)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-[48px] min-w-[54px] flex-col items-center justify-center rounded-2xl px-2 py-1 transition"
            >
              {active && (
                <motion.span
                  layoutId="mobileNavIndicator"
                  className="absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: "var(--stage-badge-bg)" }}
                  transition={MOTION.springNav}
                />
              )}
              <Icon
                className="relative z-10 h-5 w-5"
                style={{
                  color: active ? "var(--stage-primary)" : "var(--stage-text-muted)",
                }}
                aria-hidden="true"
              />
              <span
                className="relative z-10 mt-0.5 text-[11px] font-semibold"
                style={{
                  color: active ? "var(--stage-primary-dark)" : "var(--stage-text-muted)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
