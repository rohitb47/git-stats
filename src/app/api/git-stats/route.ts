import { NextRequest } from "next/server";
import { spawnSync } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";

type Commit = {
  hash: string;
  repo: string;
  date: string;
  hour: number;
  message: string;
  timestamp: number;
};

// GET — return the global git user.name so the UI can pre-fill the author field
export async function GET() {
  const result = spawnSync("git", ["config", "--global", "user.name"], {
    encoding: "utf8",
  });
  const name = result.stdout?.trim() ?? "";
  return Response.json({ name });
}

// POST — scan a directory tree for git repos and return commits from the last 10 days
export async function POST(request: NextRequest) {
  const body = await request.json();
  const basePath: string = body.basePath ?? "~/Documents/GitHub";
  const author: string = body.author ?? "";

  // resolve ~ safely without shell expansion
  const resolved = basePath.startsWith("~/")
    ? path.join(os.homedir(), basePath.slice(2))
    : basePath.startsWith("~")
      ? os.homedir()
      : basePath;

  if (!fs.existsSync(resolved)) {
    return Response.json(
      { error: `Path not found: ${basePath}` },
      { status: 400 },
    );
  }

  // find all .git directories — use spawnSync with args array to avoid shell injection
  const findResult = spawnSync(
    "find",
    [
      resolved,
      "-maxdepth",
      "5",
      "-name",
      ".git",
      "-type",
      "d",
      "-not",
      "-path",
      "*/node_modules/*",
      "-not",
      "-path",
      "*/.git/*",
    ],
    { encoding: "utf8", timeout: 15000 },
  );

  if (findResult.error) {
    return Response.json(
      { error: "Failed to scan directory" },
      { status: 500 },
    );
  }

  const repoDirs = (findResult.stdout ?? "")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((p) => path.dirname(p));

  const commits: Commit[] = [];

  for (const repoDir of repoDirs) {
    const args = [
      "-C",
      repoDir,
      "log",
      "--since=10 days ago",
      "--pretty=format:%H\t%ai\t%s",
      "--no-merges",
    ];

    if (author) {
      args.push(`--author=${author}`);
    }

    const logResult = spawnSync("git", args, {
      encoding: "utf8",
      timeout: 5000,
    });

    if (logResult.error || !logResult.stdout?.trim()) continue;

    const repoName = path.basename(repoDir);

    for (const line of logResult.stdout.trim().split("\n")) {
      if (!line) continue;
      const tabIdx = line.indexOf("\t");
      const tab2Idx = line.indexOf("\t", tabIdx + 1);
      if (tabIdx === -1 || tab2Idx === -1) continue;

      const hash = line.substring(0, tabIdx).trim();
      const dateStr = line.substring(tabIdx + 1, tab2Idx).trim();
      const message = line.substring(tab2Idx + 1).trim();

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) continue;

      commits.push({
        hash: hash.substring(0, 8),
        repo: repoName,
        date: d.toISOString().substring(0, 10),
        hour: d.getHours(),
        message: message.substring(0, 100),
        timestamp: d.getTime(),
      });
    }
  }

  return Response.json({ commits, repoCount: repoDirs.length });
}
