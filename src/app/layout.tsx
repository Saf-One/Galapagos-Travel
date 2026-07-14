import type {ReactNode} from "react";
import "./globals.css";

// Minimal root layout. The <html> tag is rendered in the [locale] layout so
// the lang attribute can be set per locale. This just passes children through.
export default function RootLayout({children}: {children: ReactNode}) {
  return children;
}
