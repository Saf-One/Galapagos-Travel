"use client";

import {useTransition, useActionState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {Button} from "@/components/Button";
import type {PackageFormState} from "./actions";

// Reusable package form. `action` is the bound server action (create or
// update). `initial` supplies values when editing.
export function PackageForm({
  action,
  initial,
}: {
  action: (
    prev: PackageFormState,
    formData: FormData
  ) => Promise<PackageFormState>;
  initial?: {
    title: string;
    slug: string;
    summary: string;
    description: string;
    priceInCents: number;
    currency: string;
    durationDays: number;
    location: string;
    maxGuests: number;
    featured: boolean;
  };
}) {
  const t = useTranslations("admin");
  const [pending] = useTransition();
  const [state, dispatch] = useActionState(action, {ok: false});

  const field = (_name: string) =>
    `mt-1 w-full rounded-lg border border-stone/50 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/60`;
  const labelCls = "block text-sm font-medium text-navy";

  return (
    <form action={dispatch} className="space-y-5">
      {state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t(state.error)}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="title">
            {t("packageTitle")}
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={initial?.title ?? ""}
            className={field("title")}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="slug">
            {t("packageTitle")} slug
          </label>
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            defaultValue={initial?.slug ?? ""}
            className={field("slug")}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="summary">
          {t("summary")}
        </label>
        <input
          id="summary"
          name="summary"
          required
          defaultValue={initial?.summary ?? ""}
          className={field("summary")}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="description">
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          defaultValue={initial?.description ?? ""}
          className={field("description")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label className={labelCls} htmlFor="priceInCents">
            {t("price")} (cents)
          </label>
          <input
            id="priceInCents"
            name="priceInCents"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initial?.priceInCents ?? 0}
            className={field("priceInCents")}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="currency">
            {t("currency")}
          </label>
          <input
            id="currency"
            name="currency"
            maxLength={3}
            required
            defaultValue={initial?.currency ?? "USD"}
            className={field("currency")}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="durationDays">
            {t("durationDays")}
          </label>
          <input
            id="durationDays"
            name="durationDays"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={initial?.durationDays ?? 1}
            className={field("durationDays")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="location">
            {t("location")}
          </label>
          <input
            id="location"
            name="location"
            required
            defaultValue={initial?.location ?? ""}
            className={field("location")}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="maxGuests">
            {t("maxGuests")}
          </label>
          <input
            id="maxGuests"
            name="maxGuests"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={initial?.maxGuests ?? 1}
            className={field("maxGuests")}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={initial?.featured ?? false}
          className="h-4 w-4 rounded border-stone/50"
        />
        {t("featured")}
      </label>

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {t("save")}
        </Button>
        <Link
          href="/admin/packages"
          className="inline-flex items-center justify-center rounded-full border border-navy px-5 py-2.5 text-sm font-medium text-navy transition-soft hover:bg-navy hover:text-cream"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
