import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const siteUrl = "https://git-stats.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "git-stats — Flex your programmer stats",
    template: "%s | git-stats",
  },
  description:
    "Visualize and share your GitHub contribution stats. See your commit streaks, top languages, and activity at a glance.",
  keywords: [
    "github stats",
    "git stats",
    "developer stats",
    "github contributions",
    "coding activity",
    "programmer portfolio",
  ],
  authors: [{ name: "git-stats" }],
  creator: "git-stats",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "git-stats",
    title: "git-stats — Flex your programmer stats",
    description:
      "Visualize and share your GitHub contribution stats. See your commit streaks, top languages, and activity at a glance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "git-stats — Flex your programmer stats",
    description:
      "Visualize and share your GitHub contribution stats. See your commit streaks, top languages, and activity at a glance.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
