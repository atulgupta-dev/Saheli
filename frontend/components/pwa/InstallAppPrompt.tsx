"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIos && isSafari) {
      setShowIosGuide(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;
  if (!deferredPrompt && !showIosGuide) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="saheli-soft-card flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: "var(--stage-primary)" }}
        >
          {deferredPrompt ? <Download className="h-5 w-5" /> : <Share className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-semibold">Install Saheli AI App</p>
          {deferredPrompt ? (
            <p className="text-xs opacity-75">
              Quick offline-ready access from your home screen.
            </p>
          ) : (
            <p className="text-xs opacity-75">
              Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> on iOS Safari.
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstall}
            className="min-h-[44px] rounded-2xl px-3.5 py-2 text-xs font-semibold text-white transition active:scale-95"
            style={{ backgroundColor: "var(--stage-primary)" }}
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install prompt"
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
