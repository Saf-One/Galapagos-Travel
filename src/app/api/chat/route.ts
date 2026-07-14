import {NextRequest, NextResponse} from "next/server";
import {getBotReply} from "@/lib/chatbot";
import {prisma} from "@/lib/prisma";
import {CONFIG, type AppLocale} from "@/lib/config";

// === CONFIGURABLE VALUES ===
// AI chatbot endpoint. Offline-safe: uses the rule-based getBotReply unless an
// LLM key is configured in the environment. If a real OPENAI/LLM key is set,
// we wrap a single completion call; otherwise (the default in this repo) the
// local responder handles everything.
//
// Lead capture: if the visitor supplies an email or explicitly asks to be
// contacted, we store a Lead row (source "chatbot") with a transcript snippet.
// All DB work is wrapped in try/catch so chat never crashes the UI.

export const dynamic = "force-dynamic";

// Basic email detection.
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const CONTACT_RE = /(contact me|email me|reach me|get in touch|call me|contacto|escríbeme|email|邮件|联系)/i;

interface ChatBody {
  message?: string;
  locale?: string;
  transcript?: {role: "user" | "assistant"; content: string}[];
  email?: string;
  name?: string;
}

function isLocale(value: string | undefined): value is AppLocale {
  return value === "en" || value === "es" || value === "zh";
}

// Optional LLM path. Only runs when an API key is present. Returns null when
// the call is not configured or fails, so the caller can fall back to the bot.
async function tryLlmReply(
  message: string,
  locale: AppLocale,
  transcript: ChatBody["transcript"]
): Promise<string | null> {
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.CHAT_API_KEY;
  if (!apiKey) return null;

  try {
    const history = (transcript ?? []).slice(-8).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));
    history.push({role: "user", content: message});

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a friendly travel assistant for ${CONFIG.siteName}, a Galapagos Islands tour operator. Answer in the locale "${locale}". Keep replies under 120 words and focus on bookings, pricing, best time to travel, and contact options.`,
          },
          ...history,
        ],
      }),
      // Fail fast; we fall back to the rule-based bot.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: {message?: {content?: string}}[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || null;
  } catch {
    return null;
  }
}

async function captureLead(body: ChatBody): Promise<void> {
  try {
    const email =
      body.email?.trim() ||
      (body.message ? body.message.match(EMAIL_RE)?.[0] : undefined);
    const wantsContact =
      !email && body.message ? CONTACT_RE.test(body.message) : false;

    if (!email && !wantsContact) return;

    const snippet = (body.transcript ?? [])
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    await prisma.lead.create({
      data: {
        email: email || "unknown@chat.incomplete",
        name: body.name?.trim() || null,
        source: "chatbot",
        payload: JSON.stringify({
          snippet,
          lastMessage: body.message ?? "",
          locale: body.locale ?? "en",
        }),
      },
    });
  } catch {
    // Never let lead capture break the chat response.
  }
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({error: "Invalid JSON"}, {status: 400});
  }

  const message = (body.message ?? "").trim();
  const locale = isLocale(body.locale) ? body.locale : "en";

  if (!message) {
    return NextResponse.json({error: "Empty message"}, {status: 400});
  }

  // Capture lead (best-effort, never throws to caller).
  await captureLead(body);

  // Reply: prefer LLM when configured, else the rule-based bot.
  const reply = (await tryLlmReply(message, locale, body.transcript)) ??
    getBotReply(message, locale);

  return NextResponse.json({reply});
}
