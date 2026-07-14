"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";
import type {ImageFormState} from "./actions";

// Client form to add a PackageImage (url + alt) to a package.
export function AddImageForm({
  action,
  urlLabel,
  altLabel,
  submitLabel,
}: {
  action: (
    prev: ImageFormState,
    formData: FormData
  ) => Promise<ImageFormState>;
  urlLabel: string;
  altLabel: string;
  submitLabel: string;
}) {
  const t = useTranslations("admin");
  const [state, dispatch] = useActionState(action, {ok: false});

  return (
    <form action={dispatch} className="flex flex-wrap items-end gap-3">
      {state.error ? (
        <p className="w-full rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t(state.error)}
        </p>
      ) : null}
      <div className="flex-1">
        <label className="block text-sm font-medium text-navy" htmlFor="url">
          {urlLabel}
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://picsum.photos/seed/galapagos/800/600"
          className="mt-1 w-full rounded-lg border border-stone/50 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/60"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-navy" htmlFor="alt">
          {altLabel}
        </label>
        <input
          id="alt"
          name="alt"
          className="mt-1 w-full rounded-lg border border-stone/50 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/60"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-cream transition-soft hover:bg-gold-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}
