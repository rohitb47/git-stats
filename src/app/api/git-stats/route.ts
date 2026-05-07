import { auth } from "@/auth";
import { fetchCommits } from "@/lib/fetch-commits";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  // Validate date format to prevent injection
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid date format" }, { status: 400 });
  }

  try {
    const data = await fetchCommits(session.accessToken, date);
    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}
