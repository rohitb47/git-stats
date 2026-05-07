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

export async function fetchCommits(
  accessToken: string,
  /** If provided, fetch only commits for this local date (YYYY-MM-DD).
   *  We treat it as a UTC day window for the GitHub API. */
  date?: string,
): Promise<CommitData> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const userRes = await fetch(`${GH_API}/user`, { headers });
  if (!userRes.ok) throw new Error("Failed to fetch GitHub user");
  const ghUser = (await userRes.json()) as { login: string };
  const login = ghUser.login;

  let sinceMs: number;
  let until: string | undefined;

  if (date) {
    // single-day window: midnight–midnight UTC for the given date
    sinceMs = new Date(date + "T00:00:00Z").getTime();
    until = new Date(date + "T23:59:59Z").toISOString();
  } else {
    sinceMs = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  }
  const since = new Date(sinceMs).toISOString();

  const reposRes = await fetch(
    `${GH_API}/user/repos?type=all&sort=pushed&per_page=100`,
    { headers },
  );
  if (!reposRes.ok) throw new Error("Failed to fetch repos");
  const allRepos = (await reposRes.json()) as GHRepo[];

  const activeRepos = allRepos.filter(
    (r) => new Date(r.pushed_at).getTime() > sinceMs - 24 * 60 * 60 * 1000,
  );

  const commits: Commit[] = [];

  for (let i = 0; i < activeRepos.length; i += CONCURRENCY) {
    const batch = activeRepos.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (repo) => {
        let url = `${GH_API}/repos/${repo.full_name}/commits?author=${login}&since=${since}&per_page=100`;
        if (until) url += `&until=${until}`;
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
            hour: d.getUTCHours(),
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

/** Returns a sorted array of unique YYYY-MM-DD dates (local to the server/UTC)
 *  on which the authenticated user made at least one commit, going back `days`. */
export async function fetchActiveDates(
  accessToken: string,
  days = 365,
): Promise<string[]> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const userRes = await fetch(`${GH_API}/user`, { headers });
  if (!userRes.ok) throw new Error("Failed to fetch GitHub user");
  const login = ((await userRes.json()) as { login: string }).login;

  const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;
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

  const dateSet = new Set<string>();

  for (let i = 0; i < activeRepos.length; i += CONCURRENCY) {
    const batch = activeRepos.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (repo) => {
        const url = `${GH_API}/repos/${repo.full_name}/commits?author=${login}&since=${since}&per_page=100`;
        const res = await fetch(url, { headers });
        if (!res.ok) return [] as string[];
        const data = await res.json();
        if (!Array.isArray(data)) return [] as string[];
        return (data as GHCommit[]).map((c) =>
          new Date(c.commit.author.date).toISOString().substring(0, 10),
        );
      }),
    );
    for (const dates of results) for (const d of dates) dateSet.add(d);
  }

  return Array.from(dateSet).sort();
}
