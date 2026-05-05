/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react-hooks/purity */
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Providers from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "git-stats",
  description: "GitHub commit activity viewer",
};

async function getLastCommit(): Promise<{
  sha: string;
  message: string;
  date: string;
} | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/rohitb47/git-stats/commits?per_page=1",
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const [commit] = await res.json();
    return {
      sha: commit.sha.slice(0, 7),
      message: commit.commit.message.split("\n")[0],
      date: commit.commit.author.date,
    };
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lastCommit = await getLastCommit();
  const now = Date.now();
  const timeAgo = lastCommit
    ? (() => {
        const diff = now - new Date(lastCommit.date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          {/* announcement banner */}
          <div className="w-full border-b border-current/8 py-2.5 px-4 flex items-center justify-center gap-3 text-sm">
            <span>work in progress</span>
            {timeAgo && (
              <>
                <span className="opacity-50">·</span>
                <span className="opacity-70">last updated {timeAgo}</span>
              </>
            )}
            <span className="opacity-50">·</span>
            <a
              href="https://github.com/rohitb47"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              by rohit bajaj
            </a>
          </div>
          {/* mobile / tablet — not yet responsive */}
          <div className="flex lg:hidden min-h-[70vh] items-center justify-center px-8 text-center">
            <p className="text-sm opacity-60 max-w-xs leading-relaxed">
              we&apos;re working on making git-stats responsive for smaller
              screens. for now, it&apos;s only available on larger screens.
            </p>
          </div>
          {/* desktop content */}
          <div className="hidden lg:block">{children}</div>
          <footer className="py-8 flex items-center justify-center gap-6 text-sm opacity-70 2xl:text-base">
            <a href="/" className="hover:opacity-80 transition-opacity">
              home
            </a>
            <a href="/about" className="hover:opacity-80 transition-opacity">
              about
            </a>
            <a href="/todo" className="hover:opacity-80 transition-opacity">
              todo
            </a>
            <a
              href="https://github.com/rohitb47/git-stats"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity flex items-center gap-1.5"
            >
              <svg
                height="14"
                width="14"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              github
            </a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
