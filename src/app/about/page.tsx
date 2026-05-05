export default function AboutPage() {
  return (
    <main className="flex flex-col gap-6 pt-40 max-w-lg mx-auto px-12">
      <h1 className="text-xl font-medium tracking-tight">about</h1>

      <p className="text-sm opacity-70 leading-relaxed">
        git-stats lets you explore useful stats from your GitHub — commits per
        day, busiest hours, most active repos, and more. connects to your
        account (public and private) via OAuth so you see the full picture.
      </p>

      <p className="text-sm opacity-70 leading-relaxed">
        i&apos;m working on adding copyable stat components you can drop
        directly onto your personal site — so you can share your GitHub activity
        beautifully without building it from scratch.
      </p>

      <p className="text-sm opacity-70 leading-relaxed">
        this started out of frustration. i wanted a way to show meaningful
        GitHub stats on my portfolio but nothing out there looked good or was
        easy to embed. so i built this.
      </p>

      <p className="text-sm opacity-70 leading-relaxed">
        work in progress.{" "}
        <a
          href="https://github.com/rohitb47/git-stats"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-100 transition-opacity"
        >
          follow along on github
        </a>
        .
      </p>
    </main>
  );
}
