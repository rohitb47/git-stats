const GH_API = "https://api.github.com";
export const DAYS = 10;
const CONCURRENCY = 8;

export type Commit = {
  hash: string;
  repo: string;
  date: string;
  hour: number;
  message: string;
  timestamp: number;
};

export type CommitData = {
  commits: Commit[];
  repoCount: number;
  login: string;
};

type GHRepo = {
  full_name: string;
  name: string;
  pushed_at: string;
};

type GHCommit = {
  sha: string;
  commit: { author: { date: string }; message: string };
};

export async function fetchCommits(accessToken: string): Promise<CommitData> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const userRes = await fetch(`${GH_API}/user`, { headers });
  if (!userRes.ok) throw new Error("Failed to fetch GitHub user");
  const ghUser = (await userRes.json()) as { login: string };
  const login = ghUser.login;

  const sinceMs = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  const since = new Date(sinceMs).toISOString();

  const reposRes = await fetch(
    `${GH_API}/user/repos?type=all&sort=pushed&per_page=100`,
    { headers },
  );
  if (!reposRes.ok) throw new Error("Failed to fetch repos");
  const allRepos = (await reposRes.json()) as GHRepo[];

  const activeRepos = allRepos.filter(
    (r) => new Date(r.pushed_at).getTime() > sinceMs,
  );

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
            date: d.toISOString().substring(0, 10), // UTC; client re-derives from timestamp
            hour: d.getUTCHours(), // UTC; client re-derives from timestamp
            message: c.commit.message.split("\n")[0].substring(0, 100),
            timestamp: d.getTime(),
          };
        });
      }),
    );
    for (const r of results) commits.push(...r);
  }

  commits.sort((a, b) => b.timestamp - a.timestamp);
  return { commits, repoCount: activeRepos.length, login };
}
