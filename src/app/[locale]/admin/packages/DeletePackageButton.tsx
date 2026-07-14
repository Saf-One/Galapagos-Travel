"use client";

import {useTransition} from "react";
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {deletePackageAction} from "./actions";

// Client wrapper for the destructive delete server action.
export function DeletePackageButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={deletePackageAction}
      onSubmit={(e) => {
        if (!confirm(label)) {
          e.preventDefault();
          return;
        }
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "id";
        input.value = id;
        e.currentTarget.appendChild(input);
        startTransition(() => router.refresh());
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-rose-700 hover:underline disabled:opacity-50"
      >
        {t("delete")}
      </button>
    </form>
  );
}
