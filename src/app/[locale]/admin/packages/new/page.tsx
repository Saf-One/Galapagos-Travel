import {setRequestLocale, getTranslations} from "next-intl/server";
import {Container} from "@/components/Container";
import {createPackageAction} from "../actions";
import {PackageForm} from "../PackageForm";

// New package form page.
export const dynamic = "force-dynamic";

export default async function AdminNewPackagePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl text-navy">{t("newPackage")}</h2>
      <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm">
        <PackageForm action={createPackageAction} />
      </div>
    </div>
  );
}
