import {setRequestLocale} from "next-intl/server";
import {getTranslations} from "next-intl/server";
import {Container} from "@/components/Container";
import {LoginForm} from "./LoginForm";

export default async function LoginPage({
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
          <h1 className="font-serif text-3xl text-navy">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("welcomeBack")}</p>
        </div>
        <LoginForm locale={locale} />
      </div>
    </Container>
  );
}
