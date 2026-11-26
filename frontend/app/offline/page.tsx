import Link from "next/link";
import { AlertTriangle, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="saheli-card max-w-md w-full p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
            <WifiOff className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">You are currently offline</h1>
            <p className="text-xs opacity-75">
              Saheli AI cached educational reference remains available.
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed opacity-85">
          AI chat responses, symptom safety sync, and medical report extraction require an active internet connection.
        </p>

        <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-xs space-y-1.5 text-red-950">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Urgent Pregnancy Warning Signs
          </p>
          <p>
            If you experience vaginal bleeding, severe headache with blurred vision, sudden facial/hand swelling, or reduced baby movements, seek emergency maternity care immediately (India helpline: 108 / 102).
          </p>
        </section>

        <Link
          href="/dashboard"
          className="flex min-h-[44px] items-center justify-center rounded-2xl px-4 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--stage-primary)" }}
        >
          Return to App Shell
        </Link>
      </div>
    </main>
  );
}
