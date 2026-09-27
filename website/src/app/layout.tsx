import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Side Quest",
  description: "Find small plans and useful connections near you.",
};

export const viewport: Viewport = {
  themeColor: "#f5f7fb",
  width: "device-width",
  initialScale: 1,
};

// Applies the remembered (or device-default) theme before first paint, so
// there's no flash of the wrong theme while React hydrates. Design spec:
// "initial theme follows device appearance... remember a manual choice
// across sessions" (section 5, "Theme").
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("sq-theme");
    var night = stored ? stored === "night" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (night) document.documentElement.classList.add("theme-night");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
