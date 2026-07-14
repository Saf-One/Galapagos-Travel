import {CONFIG} from "../config";

// === CONFIGURABLE VALUES ===
// PayPal client initialization with env fallback. When credentials are the
// placeholder, helpers return a fake order id so build/runtime never crash.

const configured =
  CONFIG.paypal.clientId !== "placeholder" &&
  CONFIG.paypal.clientSecret !== "placeholder";

function baseUrl() {
  return CONFIG.paypal.mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

// Fetches an OAuth token (only when configured). Returns null otherwise.
async function getAccessToken(): Promise<string | null> {
  if (!configured) return null;
  const basic = Buffer.from(
    `${CONFIG.paypal.clientId}:${CONFIG.paypal.clientSecret}`
  ).toString("base64");

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {access_token?: string};
  return json.access_token ?? null;
}

// Creates a PayPal order or a fallback fake order when unconfigured.
export async function createPaypalOrder(params: {
  amountCents: number;
  currency: string;
  reference: string;
}) {
  const token = await getAccessToken();
  if (!token) {
    const fakeId = `PAYID-FALLBACK-${params.reference}`;
    return {id: fakeId, url: `https://www.paypal.com/checkoutnow?token=${fakeId}`};
  }

  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.reference,
          amount: {
            currency_code: params.currency,
            value: (params.amountCents / 100).toFixed(2),
          },
        },
      ],
    }),
  });
  const json = (await res.json()) as {id?: string};
  return {
    id: json.id ?? "unknown",
    url: `https://www.paypal.com/checkoutnow?token=${json.id ?? ""}`,
  };
}
