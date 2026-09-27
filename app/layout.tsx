import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../src/style.css";
export const metadata: Metadata = {
  title: "Postly — Your ideas, worth sharing.",
  description:
    "Turn your ideas, experiences, and images into thoughtful LinkedIn posts.",
};
export const viewport: Viewport = { themeColor: "#f7f8f5" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=Manrope:wght@400;500;600;650;700;750;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
