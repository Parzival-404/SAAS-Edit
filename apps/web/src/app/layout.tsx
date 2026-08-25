import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAAS-Edit — Clips IA depuis vos vidéos YouTube",
  description:
    "Transformez automatiquement vos vidéos YouTube en clips courts optimisés pour TikTok, Reels et Shorts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
