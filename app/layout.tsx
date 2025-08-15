import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CiteCheck",
  description: "Verify legal citations against CourtListener",
  robots: { index: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

