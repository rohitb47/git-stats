import { auth } from "@/auth";
import { fetchCommits } from "@/lib/fetch-commits";
import StatsView from "@/components/stats-view";
import SignInButton from "@/components/sign-in-button";

export default async function Home() {
  const session = await auth();

  if (!session?.accessToken) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-sm font-medium opacity-40 tracking-tight">
          git stats
        </h1>
        <p className="text-xs opacity-30 max-w-xs text-center">
          see your commit activity across all your GitHub repos
        </p>
        <SignInButton />
      </main>
    );
  }

  const data = await fetchCommits(session.accessToken);

  return (
    <StatsView
      initialData={data}
      userImage={session.user?.image ?? null}
      userLogin={session.user?.login ?? data.login}
    />
  );
}
