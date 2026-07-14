"use client";

import {useTranslations} from "next-intl";
import {Button} from "@/components/Button";
import {logoutAction} from "./actions";

export function LogoutButton({locale}: {locale: string}) {
  const t = useTranslations("account");
  return (
    <form action={logoutAction}>
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" variant="secondary" size="sm">
        {t("logout")}
      </Button>
    </form>
  );
}
