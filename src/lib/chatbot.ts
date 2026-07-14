import type {AppLocale} from "./config";

// === CONFIGURABLE VALUES ===
// Simple rule-based intent responder. This is the fallback when no LLM key
// is set. A later wave can wrap an LLM and fall back to this function.

type Intent = "pricing" | "bestTime" | "booking" | "payment" | "contact" | "fallback";

const INTENTS: Record<Intent, RegExp> = {
  pricing: /(price|cost|how much|pricing|tarif|precio|cuánto|价格|多少钱|费用)/i,
  bestTime: /(best time|when to go|weather|season|cuándo|mejor época|气候|最佳|季节)/i,
  booking: /(book|reserve|availability|reserva|reservar|disponibil|预订|预定|预约)/i,
  payment: /(pay|payment|stripe|paypal|card|pagar|pago|支付|付款|信用卡)/i,
  contact: /(contact|whatsapp|wechat|weixin|email|reach|contacto|联系|微信)/i,
  fallback: /.*/,
};

function detectIntent(message: string): Intent {
  for (const key of ["pricing", "bestTime", "booking", "payment", "contact"] as const) {
    if (INTENTS[key].test(message)) return key;
  }
  return "fallback";
}

const RESPONSES: Record<AppLocale, Record<Intent, string>> = {
  en: {
    pricing:
      "Our Galapagos packages start from around $1,200 per person for a 5-day land and sea expedition. Exact pricing depends on duration, vessel, and season. Browse our packages for details.",
    bestTime:
      "The Galapagos is a year-round destination. June to November is cooler and great for diving; December to May is warmer with calm seas and ideal for snorkeling. Wildlife is present in every month.",
    booking:
      "You can book directly from any package page. Choose your dates and guest count, and we will hold availability for 20 minutes while you pay. Need help? Message us on WhatsApp.",
    payment:
      "We accept Stripe (cards) and PayPal. All payments are processed securely. A deposit confirms your spot, with the balance due before arrival.",
    contact:
      "Reach us on WhatsApp or WeChat using the links in the footer, or email hello@galapagos.example. We usually reply within a few hours.",
    fallback:
      "Thanks for your message! For bookings, pricing, or travel advice, feel free to ask, or contact us on WhatsApp or WeChat.",
  },
  es: {
    pricing:
      "Nuestros paquetes de Galápagos empiezan desde unos $1,200 por persona para una expedición de 5 días en tierra y mar. El precio exacto depende de la duración, el barco y la temporada. Explora nuestros paquetes para más detalles.",
    bestTime:
      "Las Galápagos se puede visitar todo el año. De junio a noviembre hace más fresco y es ideal para bucear; de diciembre a mayo hace más calor, con mares tranquilas, perfecto para snorkel. La fauna está presente cada mes.",
    booking:
      "Puedes reservar directamente desde cualquier página de paquete. Elige tus fechas y número de viajeros, y mantendremos disponibilidad 20 minutos mientras pagas. ¿Necesitas ayuda? Escríbenos por WhatsApp.",
    payment:
      "Aceptamos Stripe (tarjetas) y PayPal. Todos los pagos se procesan de forma segura. Un depósito confirma tu lugar; el saldo se paga antes de la llegada.",
    contact:
      "Contáctanos por WhatsApp o WeChat con los enlaces del pie de página, o por correo a hello@galapagos.example. Normalmente respondemos en pocas horas.",
    fallback:
      "¡Gracias por tu mensaje! Para reservas, precios o consejos de viaje, pregúntanos, o contáctanos por WhatsApp o WeChat.",
  },
  zh: {
    pricing:
      "我们的加拉帕戈斯套餐从每人约 $1,200 起，包含 5 天海陆探险。具体价格取决于行程长度、船只与季节。请浏览套餐页面了解详情。",
    bestTime:
      "加拉帕戈斯全年都适合旅行。6 月至 11 月较凉爽，适合潜水；12 月至次年 5 月较温暖、海面平静，适合浮潜。每个月都能看到丰富的野生动物。",
    booking:
      "你可以直接在任意套餐页面预订。选择日期与人数后，我们会在你付款期间为你保留 20 分钟名额。需要帮助？欢迎通过 WhatsApp 联系我们。",
    payment:
      "我们支持 Stripe（信用卡）与 PayPal，所有支付均安全处理。支付定金即可确认名额，余款在抵达前结清。",
    contact:
      "你可以通过页脚的 WhatsApp 或微信联系我们，也可以发送邮件至 hello@galapagos.example。我们通常会在数小时内回复。",
    fallback:
      "感谢你的留言！如需预订、报价或旅行建议，欢迎随时询问，或通过 WhatsApp、微信联系我们。",
  },
};

export function getBotReply(message: string, locale: AppLocale = "en"): string {
  const intent = detectIntent(message);
  const table = RESPONSES[locale] ?? RESPONSES.en;
  return table[intent];
}
