import { auth } from "@/auth";

const GH_API = "https://api.github.com";
const DAYS = 10;
const CONCURRENCY = 8;

type Commit = {
  hash: string;
  repo: string;
  date: string;
  hour: number;
  message: string;
  timestamp: number;
};

type GHRepo = {
  full_name: string;
  name: string;
  pushed_at: string;
};

type GHCommit = {
  sha: string;
  commit: {
    author: { date: string };
    message: string;
  };
};

// GET — fetch the authenticated user's commits from GitHub API (last 10 days)
export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = session.accessToken;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Get authenticated user's login
  const userRes = await fetch(`${GH_API}/user`, { headers });
  if (!userRes.ok) {
    return Response.json({ error: "Failed to fetch GitHub user" }, { status: 502 });
  }
  const ghUser = await userRes.json() as { login: string };
  const login = ghUser.login;

  // Compute the since cutoff
  const sinceMs = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  const since = new Date(sinceMs).toISOString();

  // Get repos sorted by most recently pushed — one page covers most users
  const reposRes = await fetch(
    `${GH_API}/user/repos?type=all&sort=pushed&per_page=100`,
    { headers },
  );
  if (!reposRes.ok) {
    return Response.json({ error: "Failed to fetch repos" }, { status: 502 });
  }
  const allRepos = await reposRes.json() as GHRepo[];

  // Keep only repos pushed to in the last DAYS days
  const activeRepos = allRepos.filter(
    (r) => new Date(r.pushed_at).getTime() > sinceMs,
  );

  // Fetch commits in parallel batches to avoid rate limit spikes
  const commits: Commit[] = [];

  for (let i = 0; i < activeRepos.length; i += CONCURRENCY) {
    const batch = activeRepos.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (repo) => {
        const url = `${GH_API}/repos/${repo.full_name}/commits?author=${login}&since=${since}&per_page=100`;
        const res = await fetch(url, { headers });
        if (!res.ok) return [] as Commit[];
        const data = await res.json();
        if (!Array.isArray(data)) return [] as Commit[];
        return (data as GHCommit[]).map((c) => {
          const d = new Date(c.commit.author.date);
          return {
            hash: c.sha.substring(0, 8),
            repo: repo.name,
            date: d.toISOString().substring(0, 10),
            hour: d.getHours(),
            message: c.commit.message.split("\n")[0].substring(0, 100),
            timestamp: d.getTime(),
          };
        });
      }),
    );
    for (const r of results) commits.push(...r);
  }

  commits.sort((a, b) => b.timestamp - a.timestamp);

  return Response.json({ commits, repoCount: activeRepos.length, login });
}
