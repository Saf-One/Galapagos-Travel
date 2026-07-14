"use client";

import {useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {cn} from "@/lib/utils";
import {defaultWhatsappLink} from "@/lib/whatsapp";
import {Button} from "@/components/Button";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

// Conversation surface for the chatbot. Renders message bubbles, a typing
// indicator, an input, and a WhatsApp hand-off link. Talks to /api/chat.
export function ChatPanel({onClose}: {onClose?: () => void}) {
  const t = useTranslations("chat");
  const locale = useLocale();

  const [messages, setMessages] = useState<Message[]>([
    {role: "assistant", content: t("greeting")},
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || typing) return;

    const next: Message[] = [...messages, {role: "user", content: text}];
    setMessages(next);
    setInput("");
    setTyping(true);
    setError(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          message: text,
          locale,
          transcript: next,
        }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as {reply?: string};
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? t("fallback"),
        },
      ]);
    } catch {
      setError(true);
      setMessages((prev) => [
        ...prev,
        {role: "assistant", content: t("error")},
      ]);
    } finally {
      setTyping(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex h-[28rem] max-h-[80vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-stone/50 bg-cream shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-stone/40 bg-navy px-4 py-3 text-cream">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gold-light" />
          <p className="font-serif text-base">{t("chatTitle")}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="rounded-full p-1 text-cream/80 transition-soft hover:bg-cream/10 hover:text-cream"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <p
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-navy text-cream"
                  : "bg-sand text-ink"
              )}
            >
              {m.content}
            </p>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-sand px-3.5 py-3 text-ink">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp hand-off */}
      <div className="border-t border-stone/30 px-4 pt-3">
        <a
          href={defaultWhatsappLink(t("talkToHumanMsg"))}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button
            variant="gold"
            size="sm"
            className="w-full"
            type="button"
          >
            {t("talkToHuman")}
          </Button>
        </a>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-stone/40 bg-cream px-3 py-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={t("chatPlaceholder")}
          className="max-h-24 flex-1 resize-none rounded-xl border border-stone/50 bg-white px-3 py-2 text-sm text-ink outline-none transition-soft focus:border-teal focus:ring-2 focus:ring-teal/30"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => void send()}
          disabled={!input.trim() || typing}
          aria-label={t("send")}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </Button>
      </div>

      {error && (
        <p className="px-4 pb-2 text-center text-xs text-gold">
          {t("retry")}
        </p>
      )}
    </div>
  );
}
