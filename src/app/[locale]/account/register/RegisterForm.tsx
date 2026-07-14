"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {Button} from "@/components/Button";
import {registerAction, type RegisterState} from "../actions";

export function RegisterForm({locale}: {locale: string}) {
  const t = useTranslations("account");
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-navy"
        >
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="w-full rounded-lg border border-stone/60 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition-soft focus:border-teal focus:ring-2 focus:ring-teal/30"
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-navy"
        >
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-stone/60 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition-soft focus:border-teal focus:ring-2 focus:ring-teal/30"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-navy"
        >
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-stone/60 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition-soft focus:border-teal focus:ring-2 focus:ring-teal/30"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="mb-1.5 block text-sm font-medium text-navy"
        >
          {t("confirmPassword")}
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-stone/60 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition-soft focus:border-teal focus:ring-2 focus:ring-teal/30"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {t(state.error)}
        </p>
      )}

      <Button type="submit" variant="gold" size="lg" disabled={pending}>
        {pending ? t("loading") : t("registerBtn")}
      </Button>

      <p className="text-center text-sm text-muted">
        {t("haveAccount")}{" "}
        <Link
          href="/account/login"
          className="font-medium text-teal underline-offset-2 hover:underline"
        >
          {t("loginBtn")}
        </Link>
      </p>
    </form>
  );
}
