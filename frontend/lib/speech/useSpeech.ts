"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppLanguage } from "@/types/saheli";

export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function mapLanguageToSpeechLocale(language: AppLanguage): string {
  if (language === "hi-IN") return "hi-IN";
  if (language === "hi-Latn") return "en-IN";
  return "en-IN";
}

export function useSpeech(language: AppLanguage) {
  const [supportedRecognition, setSupportedRecognition] = useState(false);
  const [supportedSynthesis, setSupportedSynthesis] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setSupportedRecognition(Boolean(getSpeechConstructor()));
    setSupportedSynthesis(
      typeof window !== "undefined" && "speechSynthesis" in window
    );
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors on inactive recognizer
      }
    }
    setVoiceState((prev) => (prev === "listening" ? "idle" : prev));
  }, []);

  const startListening = useCallback(
    async (onFinalTranscript?: (text: string) => void) => {
      setPermissionError(null);
      const Ctor = getSpeechConstructor();
      if (!Ctor) {
        setVoiceState("error");
        setPermissionError(
          "Voice recognition is not supported in this browser. Please type your message below."
        );
        return;
      }

      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        setVoiceState("error");
        setPermissionError(
          "Microphone access was denied or unavailable. You can still type your question safely below."
        );
        return;
      }

      const recognition = new Ctor();
      recognition.lang = mapLanguageToSpeechLocale(language);
      recognition.interimResults = true;
      recognition.continuous = false;

      let finalBuffer = "";

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const text = event.results[i][0]?.transcript ?? "";
          if (event.results[i].isFinal) {
            finalBuffer += `${text} `;
          } else {
            interim += text;
          }
        }
        setTranscript((finalBuffer + interim).trim());
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        setVoiceState("error");
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setPermissionError(
            "Microphone permission denied. Please enable mic access in browser settings or type below."
          );
        } else if (event.error === "no-speech") {
          setPermissionError("No speech detected. Tap the orb to try again or type below.");
        } else {
          setPermissionError(`Voice input unavailable (${event.error}). Please type below.`);
        }
      };

      recognition.onend = () => {
        const cleaned = finalBuffer.trim();
        setVoiceState("idle");
        if (cleaned && onFinalTranscript) {
          onFinalTranscript(cleaned);
        }
      };

      recognitionRef.current = recognition;
      setTranscript("");
      setVoiceState("listening");
      try {
        recognition.start();
      } catch {
        setVoiceState("error");
        setPermissionError("Could not start microphone listener. Please type below.");
      }
    },
    [language]
  );

  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = mapLanguageToSpeechLocale(language);
      utterance.rate = 0.96;
      utterance.onstart = () => setVoiceState("speaking");
      utterance.onend = () => setVoiceState("idle");
      utterance.onerror = () => setVoiceState("idle");
      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState("idle");
  }, []);

  return {
    supportedRecognition,
    supportedSynthesis,
    voiceState,
    setVoiceState,
    transcript,
    setTranscript,
    permissionError,
    setPermissionError,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  };
}
