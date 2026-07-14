import {CONFIG} from "./config";

// === CONFIGURABLE VALUES ===
// Creates a HubSpot contact if HUBSPOT_API_KEY is set. Otherwise no-ops (logs)
// so the build and runtime never fail. The seed/lead-sync wave will call this.

const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/contacts";

export async function createHubspotContact(
  email: string,
  name?: string,
  props: Record<string, string | number | boolean> = {}
): Promise<{ok: boolean; created: boolean}> {
  const apiKey = CONFIG.hubspot.apiKey;
  if (!apiKey) {
    // No key configured: log and skip. Safe for offline builds.
    console.log(
      `[hubspot] no-op: would create contact ${email} with props`,
      props
    );
    return {ok: true, created: false};
  }

  try {
    const res = await fetch(HUBSPOT_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          email,
          ...(name ? {firstname: name} : {}),
          ...props,
        },
      }),
    });
    return {ok: res.ok, created: res.ok};
  } catch (err) {
    console.error("[hubspot] contact create failed", err);
    return {ok: false, created: false};
  }
}
