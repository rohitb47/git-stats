import { auth } from "@/auth";
import { fetchCommits } from "@/lib/fetch-commits";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await fetchCommits(session.accessToken);
    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}
