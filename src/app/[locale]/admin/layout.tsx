import {setRequestLocale, getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {Container} from "@/components/Container";
import {getCurrentUser} from "@/lib/auth";
import {AdminNav} from "./AdminNav";
import type {ReactNode} from "react";

// === CONFIGURABLE VALUES ===
// Admin back-office shell. Guarded to ADMIN role: any other (or anonymous)
// user is redirected to the login page. Renders a responsive sidebar nav.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect(`/${locale}/account/login`);
  }

  const t = await getTranslations("admin");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      <AdminNav locale={locale} userName={user.name ?? user.email ?? ""} />
      <main className="flex-1 bg-sand/30">
        <Container className="py-8">
          <h1 className="font-serif text-3xl text-navy">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
          <div className="mt-6">{children}</div>
        </Container>
      </main>
    </div>
  );
}
