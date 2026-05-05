const PENDING = [
  "responsiveness — mobile/tablet layout for all pages",
  "timezone selection — let user pick their timezone for commit activity charts",
  "public stats page — `/[username]` route showing public GitHub stats given a username (no auth required)",
  "copyable components — click-to-copy on stat cards, charts, and code snippets",
];

const DONE = [
  "github oauth + nextauth v5",
  "github rest api (public + private repos)",
  "server/client component split (no flash)",
  "hydration errors fixed (locale, timezone, Date.now())",
  "dark mode only",
  "global footer (home, about, github)",
  "announcement banner (wip + last updated + by rohit bajaj)",
  "about page",
  "opacity audit (subtext at 70)",
  "logo renamed to git-stats",
];

export default function TodoPage() {
  return (
    <main className="flex flex-col gap-8 pt-20 max-w-lg mx-auto px-12">
      <h1 className="text-xl font-medium tracking-tight">todo</h1>

      <section className="flex flex-col gap-3">
        <p className="text-sm opacity-40">pending</p>
        <ul className="flex flex-col gap-2">
          {PENDING.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 opacity-40">○</span>
              <span className="opacity-70">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm opacity-40">done</p>
        <ul className="flex flex-col gap-2">
          {DONE.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 text-emerald-500">✓</span>
              <span className="opacity-40 line-through">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
