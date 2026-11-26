"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Brain,
  FilePlus2,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { VoiceOrb } from "@/components/chat/VoiceOrb";
import { UrgentCareBanner } from "@/components/safety/UrgentCareBanner";
import { SaheliLogo } from "@/components/ui/SaheliLogo";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { useSaheli } from "@/providers/AppProviders";
import { useSpeech } from "@/lib/speech/useSpeech";
import { saheliApi } from "@/lib/api/client";
import { ChatMessageItem, SafetyAssessment } from "@/types/saheli";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const {
    activeStage,
    language,
    setLanguage,
    profile,
    mode,
    isOnline,
    t,
    chatMessages,
    setStageChatMessages,
    getApiContext,
    setLatestUrgentSafety,
  } = useSaheli();

  const {
    supportedRecognition,
    supportedSynthesis,
    voiceState,
    setVoiceState,
    transcript,
    permissionError,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  } = useSpeech(language);

  const [input, setInput] = useState(initialQuery);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const [chatSafety, setChatSafety] = useState<SafetyAssessment | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stageCfg = LIFE_STAGE_CONFIGS[activeStage];

  useEffect(() => {
    if (initialQuery) setInput(initialQuery);
  }, [initialQuery]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessageItem = {
      id: `user_${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...chatMessages, userMsg];
    setStageChatMessages(activeStage, nextHistory);
    setInput("");

    if (mode === "live" && !isOnline) {
      setStageChatMessages(activeStage, [
        ...nextHistory,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content:
            "You are currently offline. Saheli AI requires an internet connection in Live Mode.",
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
      return;
    }

    setSending(true);
    setVoiceState("processing");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const ctx = await getApiContext();
      const res = await saheliApi.sendChat(
        {
          stage: activeStage,
          message: trimmed,
          locale: language,
          conversation_id: conversationId,
          save_to_memory: profile.consent.store_conversations,
        },
        ctx,
        controller.signal
      );

      setConversationId(res.conversation_id);
      if (res.safety.level === "urgent" || res.safety.level === "consult") {
        setChatSafety(res.safety);
        if (res.safety.level === "urgent") {
          setLatestUrgentSafety(res.safety);
        }
      }

      const botMsg: ChatMessageItem = {
        id: `bot_${Date.now()}`,
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toISOString(),
        safety: res.safety,
        sources: res.sources,
        memoryUsed: res.memory_used,
        memoryContextSummary: res.memory_context_summary,
      };
      setStageChatMessages(activeStage, [...nextHistory, botMsg]);
      setVoiceState("idle");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to reach Saheli AI right now. Please retry.";
      setStageChatMessages(activeStage, [
        ...nextHistory,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: msg,
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
      setVoiceState("error");
    } finally {
      setSending(false);
    }
  };

  const handleOrbClick = () => {
    if (voiceState === "listening") {
      stopListening();
      return;
    }
    if (voiceState === "speaking") {
      stopSpeaking();
      return;
    }
    startListening((spokenText) => {
      setInput(spokenText);
      sendMessage(spokenText);
    });
  };

  const handleRetryLast = () => {
    const lastUser = [...chatMessages].reverse().find((m) => m.role === "user");
    if (lastUser) sendMessage(lastUser.content);
  };

  return (
    <AppShell
      title="Saheli AI"
      subtitle="Hindi, Hinglish & English voice companion"
    >
      {activeStage !== "pregnancy" && (
        <div role="status" className="saheli-soft-card p-3.5 text-xs font-semibold">
          <strong>{t.badges.comingSoon}:</strong> Live Gemini companion is focused on Pregnancy in MVP. {stageCfg.label[language]} returns an informational preview.
        </div>
      )}

      {chatSafety && (chatSafety.level === "urgent" || chatSafety.level === "consult") && (
        <UrgentCareBanner
          safety={chatSafety}
          onDismiss={chatSafety.level === "consult" ? () => setChatSafety(null) : undefined}
        />
      )}

      {/* Signature Voice Companion Canvas (Design Book Page 9) */}
      <section
        className="relative overflow-hidden rounded-[32px] border p-5 sm:p-7 space-y-5 text-center"
        style={{
          borderColor: "var(--stage-border)",
          background:
            "radial-gradient(circle at 50% 35%, var(--stage-muted-accent) 0%, var(--stage-bg) 60%, #FFFFFF 100%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold border"
            style={{
              borderColor: "var(--stage-border)",
              color: profile.consent.store_conversations
                ? "#15803D"
                : "var(--stage-text-muted)",
            }}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                profile.consent.store_conversations ? "bg-emerald-600" : "bg-slate-400"
              }`}
            />
            {profile.consent.store_conversations ? "Memory On" : "Memory Off"}
          </span>

          <select
            aria-label="Assistant language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className="min-h-[38px] rounded-full border bg-white px-3.5 text-xs font-bold"
            style={{ borderColor: "var(--stage-border)" }}
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">हिंदी</option>
            <option value="hi-Latn">Hinglish</option>
          </select>
        </div>

        <VoiceOrb state={voiceState} onClick={handleOrbClick} disabled={sending} />

        <div className="space-y-3">
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold">
            How can I help you today?
          </h2>

          {transcript && voiceState === "listening" && (
            <p className="mx-auto max-w-md rounded-full bg-white px-4 py-2 text-xs font-semibold border" style={{ borderColor: "var(--stage-border)" }}>
              &ldquo;{transcript}&rdquo;
            </p>
          )}
          {permissionError && (
            <p role="alert" className="mx-auto max-w-md rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-950">
              {permissionError}
            </p>
          )}
          {!supportedRecognition && !permissionError && (
            <p className="text-[11px]" style={{ color: "var(--stage-text-muted)" }}>
              Browser speech recognition unavailable; typed companion ready below.
            </p>
          )}

          {/* Stage-specific pill starters */}
          <div className="flex flex-wrap justify-center gap-2">
            {stageCfg.aiPrompts[language].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="min-h-[40px] rounded-full border bg-white/95 px-4 py-2 text-xs font-semibold shadow-xs transition hover:bg-white active:scale-95"
                style={{ borderColor: "var(--stage-border)" }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* 3-Button Voice Dock (Page 9 Bottom) */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              aria-label="Focus text input"
              onClick={() => inputRef.current?.focus()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white border shadow-xs hover:bg-black/5"
              style={{ borderColor: "var(--stage-border)" }}
            >
              <Keyboard className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={voiceState === "listening" ? "Stop recording" : "Start voice input"}
              onClick={handleOrbClick}
              className="saheli-pill-cta flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-white"
            >
              {voiceState === "listening" ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
            <Link
              href="/reports"
              aria-label="Attach or review report"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white border shadow-xs hover:bg-black/5"
              style={{ borderColor: "var(--stage-border)" }}
            >
              <FilePlus2 className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Conversation History (Design Book Page 10) */}
      <section aria-label="Conversation messages" className="space-y-3">
        {chatMessages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="mt-1 shrink-0">
                  <SaheliLogo size={32} />
                </div>
              )}

              <article
                className={`max-w-[85%] sm:max-w-[75%] rounded-[24px] p-4 text-sm space-y-2 ${
                  isUser
                    ? "text-[#292336]"
                    : msg.error
                      ? "border border-red-300 bg-red-50 text-red-950"
                      : "saheli-card"
                }`}
                style={
                  isUser
                    ? { backgroundColor: "var(--stage-muted-accent)" }
                    : undefined
                }
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {msg.memoryUsed && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMemoryId(expandedMemoryId === msg.id ? null : msg.id)
                      }
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
                      style={{
                        backgroundColor: "var(--stage-badge-bg)",
                        color: "var(--stage-badge-text)",
                      }}
                    >
                      <Brain className="h-3 w-3" />
                      Based on your previous check-in
                    </button>
                    {expandedMemoryId === msg.id && msg.memoryContextSummary && (
                      <p className="rounded-xl bg-black/5 p-2 text-xs">
                        {msg.memoryContextSummary}
                      </p>
                    )}
                  </div>
                )}

                {!isUser && !msg.error && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]" style={{ color: "var(--stage-text-muted)" }}>
                    <span>
                      {msg.sources && msg.sources.length > 0
                        ? msg.sources.join(", ")
                        : "Educational support only"}
                    </span>
                    {supportedSynthesis && (
                      <button
                        type="button"
                        onClick={() =>
                          voiceState === "speaking" ? stopSpeaking() : speakText(msg.content)
                        }
                        className="inline-flex min-h-[30px] items-center gap-1 rounded-full px-2.5 font-bold hover:bg-black/5"
                      >
                        {voiceState === "speaking" ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5" /> Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5" /> Read aloud
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {msg.error && (
                  <button
                    type="button"
                    onClick={handleRetryLast}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-red-700 px-3.5 py-1 text-xs font-bold text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t.common.retry}
                  </button>
                )}
              </article>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-center gap-2 text-xs font-semibold px-2" style={{ color: "var(--stage-text-muted)" }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saheli AI is preparing an educational response...
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="underline ml-1"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* Clean Typed Input Pill */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="saheli-card rounded-full p-2 pl-4 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === "hi-IN"
              ? "अपना सवाल यहाँ लिखें..."
              : language === "hi-Latn"
                ? "Type your message in Hinglish or English..."
                : "Type a message..."
          }
          aria-label="Message Saheli AI"
          className="flex-1 min-h-[44px] bg-transparent text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send message"
          className="saheli-pill-cta flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-45"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading Saheli AI...</div>}>
      <ChatContent />
    </Suspense>
  );
}
