import createMiddleware from "next-intl/middleware";
import {routing} from "./i18n/routing";

// Redirects unprefixed paths to the default (or best-matching) locale.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
