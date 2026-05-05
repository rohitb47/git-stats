/* eslint-disable react-hooks/purity */
import { auth } from "@/auth";
import { fetchCommits } from "@/lib/fetch-commits";
import StatsView from "@/components/stats-view";
import SignInButton from "@/components/sign-in-button";

export default async function Home() {
  const session = await auth();

  if (!session?.accessToken) {
    return (
      <main className="flex flex-col items-center gap-6 pt-40">
        <h1 className="text-xl font-medium tracking-tight 2xl:text-3xl">
          git-stats
        </h1>
        <p className="text-sm opacity-70 max-w-xs text-center 2xl:text-base 2xl:max-w-sm">
          your commit activity across all GitHub repos — public and private
        </p>
        <SignInButton />
      </main>
    );
  }

  const nowMs = Date.now();
  const data = await fetchCommits(session.accessToken);

  return (
    <StatsView
      initialData={data}
      userImage={session.user?.image ?? null}
      userLogin={session.user?.login ?? data.login}
      nowMs={nowMs}
    />
  );
}
