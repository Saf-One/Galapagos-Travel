import {setRequestLocale} from "next-intl/server";
import {getTranslations} from "next-intl/server";
import {Container} from "@/components/Container";
import {RegisterForm} from "./RegisterForm";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone/40 bg-cream p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl text-navy">{t("registerTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("createAccount")}</p>
        </div>
        <RegisterForm locale={locale} />
      </div>
    </Container>
  );
}
