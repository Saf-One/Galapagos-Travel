import {getRequestConfig} from "next-intl/server";
import {routing} from "./routing";

// Loads the correct message catalog per request locale.
// Message files live at project-root messages/<locale>.json.
// next-intl v3 compatible: hasLocale is a v4 API, so we validate manually.
export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale =
    requested && (routing.locales as readonly string[]).includes(requested)
      ? requested
      : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
