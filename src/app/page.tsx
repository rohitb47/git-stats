import { auth } from "@/auth";
import { fetchCommits } from "@/lib/fetch-commits";
import StatsView from "@/components/stats-view";
import SignInButton from "@/components/sign-in-button";

export default async function Home() {
  const session = await auth();

  if (!session?.accessToken) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-xl font-medium tracking-tight">
          git stats
        </h1>
        <p className="text-sm opacity-55 max-w-xs text-center">
          see your commit activity across all your GitHub repos
        </p>
        <SignInButton />
      </main>
    );
  }

  const [data, nowMs] = await Promise.all([
    fetchCommits(session.accessToken),
    Promise.resolve(Date.now()),
  ]);

  return (
    <StatsView
      initialData={data}
      userImage={session.user?.image ?? null}
      userLogin={session.user?.login ?? data.login}
      nowMs={nowMs}
    />
  );
}
