import {setRequestLocale, getTranslations} from "next-intl/server";
import {prisma} from "@/lib/prisma";

// Read-only leads table (email, name, source, created, synced to HubSpot).
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  let leads: Array<{
    id: string;
    email: string;
    name: string | null;
    source: string | null;
    createdAt: Date;
    syncedToHubspot: boolean;
  }> = [];

  try {
    leads = await prisma.lead.findMany({orderBy: {createdAt: "desc"}});
  } catch {
    // DB offline -> empty list.
  }

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium"}).format(new Date(d));

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl text-navy">{t("navLeads")}</h2>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-stone/40 bg-white p-8 text-center text-muted">
          {t("noLeads")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone/40 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("email")}</th>
                <th className="px-4 py-3 font-semibold">{t("name")}</th>
                <th className="px-4 py-3 font-semibold">{t("leadsSource")}</th>
                <th className="px-4 py-3 font-semibold">{t("createdAt")}</th>
                <th className="px-4 py-3 font-semibold">HubSpot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/30">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-sand/40">
                  <td className="px-4 py-3 font-semibold text-navy">{l.email}</td>
                  <td className="px-4 py-3 text-navy">{l.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{l.source ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{fmt(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        l.syncedToHubspot
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {l.syncedToHubspot ? t("synced") : t("notSynced")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
