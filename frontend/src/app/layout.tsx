import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astrology — Birth Chart Calculator",
  description: "Generate your precise 12-house natal birth chart",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
