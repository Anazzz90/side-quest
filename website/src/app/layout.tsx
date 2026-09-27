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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      {/* suppressHydrationWarning: browser extensions like Grammarly inject
          attributes (data-gr-ext-installed, etc.) onto <body> before React
          hydrates. That's a real DOM difference but not one our own code
          causes or needs to react to, so it's a false-positive warning
          for this element specifically. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
