import {setRequestLocale, getTranslations} from "next-intl/server";
import {prisma} from "@/lib/prisma";
import {
  createPromotionAction,
  togglePromotionAction,
  deletePromotionAction,
} from "./actions";
import {CreatePromotionForm} from "./CreatePromotionForm";

// Request-time promotions management: list + create + toggle/delete.
export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  let promotions: Array<{
    id: string;
    code: string;
    label: string;
    discountPercent: number;
    startDate: Date;
    endDate: Date;
    active: boolean;
  }> = [];

  try {
    promotions = await prisma.promotion.findMany({
      orderBy: {startDate: "desc"},
    });
  } catch {
    // DB offline -> empty list.
  }

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium"}).format(new Date(d));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-xl text-navy">
          {t("newPromotion")}
        </h2>
        <CreatePromotionForm action={createPromotionAction} />
      </div>

      <div className="lg:col-span-2">
        <h2 className="mb-4 font-serif text-xl text-navy">
          {t("navPromotions")}
        </h2>
        {promotions.length === 0 ? (
          <p className="rounded-2xl border border-stone/40 bg-white p-8 text-center text-muted">
            {t("noPromotions")}
          </p>
        ) : (
          <div className="space-y-3">
            {promotions.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone/40 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-navy">
                    {p.code}
                  </p>
                  <p className="text-sm text-navy">{p.label}</p>
                  <p className="text-xs text-muted">
                    {p.discountPercent}% · {fmtDate(p.startDate)} →{" "}
                    {fmtDate(p.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {p.active ? t("active") : t("cancel")}
                  </span>
                  <form action={togglePromotionAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-navy hover:text-teal hover:underline"
                    >
                      {t("toggleActive")}
                    </button>
                  </form>
                  <form action={deletePromotionAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-rose-700 hover:underline"
                    >
                      {t("delete")}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
