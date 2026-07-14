"use client";

import {useTransition, useActionState} from "react";
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {Button} from "@/components/Button";
import type {PromotionFormState} from "./actions";

// Client form to create a promotion.
export function CreatePromotionForm({
  action,
}: {
  action: (
    prev: PromotionFormState,
    formData: FormData
  ) => Promise<PromotionFormState>;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, dispatch] = useActionState(action, {ok: false});

  const field =
    "mt-1 w-full rounded-lg border border-stone/50 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/60";
  const labelCls = "block text-sm font-medium text-navy";

  return (
    <form
      action={dispatch}
      className="space-y-4"
      onSubmit={(e) => {
        // Let the server action handle submission; on success refresh.
        startTransition(() => router.refresh());
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="code">
            {t("promotionCode")}
          </label>
          <input
            id="code"
            name="code"
            required
            className={field}
            placeholder="SUMMER25"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="discountPercent">
            {t("discountPercent")}
          </label>
          <input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min={0}
            max={100}
            defaultValue={10}
            required
            className={field}
          />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="label">
          {t("promotionLabel")}
        </label>
        <input id="label" name="label" required className={field} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="startDate">
            {t("startDate")}
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className={field}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="endDate">
            {t("endDate")}
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            className={field}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          name="active"
          defaultChecked
          className="h-4 w-4 rounded border-stone/50"
        />
        {t("active")}
      </label>

      <Button type="submit" variant="gold" disabled={pending}>
        {t("createPromotion")}
      </Button>
    </form>
  );
}
