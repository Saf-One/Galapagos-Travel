import {redirect} from "next/navigation";
import {routing} from "@/i18n/routing";

// Root path redirects to the default locale (middleware also handles this,
// but a static redirect keeps the root path predictable).
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
