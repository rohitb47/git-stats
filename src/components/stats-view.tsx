"use client";

import { useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import type { CommitData, Commit } from "@/lib/fetch-commits";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHourShort(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

function formatHourFull(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

function localDateStr(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

// ─── Daily chart ──────────────────────────────────────────────────────────────

function DailyChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0)
    return (
      <div className="h-32 flex items-center text-xs opacity-70">no data</div>
    );

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const W = 560;
  const H = 200;
  const padL = 28;
  const padR = 8;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const pts = data.map((d, i) => ({
    x:
      padL + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
    y: padT + innerH - (d.value / maxVal) * innerH,
    label: d.label,
    value: d.value,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L${pts[pts.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)}` +
    ` L${pts[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  const gridValues = [
    Math.round(maxVal * 0.25),
    Math.round(maxVal * 0.5),
    Math.round(maxVal * 0.75),
    maxVal,
  ];

  const showEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ overflow: "visible" }}
    >
      {gridValues.map((v, gi) => {
        const y = padT + innerH - (v / maxVal) * innerH;
        return (
          <g key={gi}>
            <line
              x1={padL}
              y1={y}
              x2={padL + innerW}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeDasharray="3 3"
            />
            <text
              x={padL - 5}
              y={y + 3}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.55}
            >
              {v}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="#10b981" fillOpacity={0.1} />
      <path
        d={linePath}
        stroke="#10b981"
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.value > 0 ? 3 : 2}
            fill={p.value > 0 ? "#10b981" : "currentColor"}
            fillOpacity={p.value > 0 ? 1 : 0.1}
          />
          {p.value > 0 && (
            <text
              x={p.x}
              y={p.y - 7}
              textAnchor="middle"
              fontSize={10}
              fill="#10b981"
              fillOpacity={0.7}
            >
              {p.value}
            </text>
          )}
          <title>
            {p.label}: {p.value}
          </title>
          {(i === 0 || i === pts.length - 1 || i % showEvery === 0) && (
            <text
              x={p.x}
              y={H - 6}
              textAnchor={
                i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"
              }
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.55}
            >
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Hourly chart ─────────────────────────────────────────────────────────────

function HourlyChart({
  data,
  peakStart,
}: {
  data: { label: string; value: number }[];
  peakStart: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const W = 560;
  const H = 200;
  const padL = 28;
  const padR = 8;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const barSlot = innerW / 24;
  const barW = barSlot * 0.6;
  const peakHours = new Set([
    peakStart,
    (peakStart + 1) % 24,
    (peakStart + 2) % 24,
  ]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ overflow: "visible" }}
    >
      {[Math.round(maxVal * 0.5), maxVal].map((v, gi) => {
        const y = padT + innerH - (v / maxVal) * innerH;
        return (
          <g key={gi}>
            <line
              x1={padL}
              y1={y}
              x2={padL + innerW}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeDasharray="3 3"
            />
            <text
              x={padL - 5}
              y={y + 3}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.55}
            >
              {v}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padL + i * barSlot + (barSlot - barW) / 2;
        const barH = (d.value / maxVal) * innerH;
        const y = padT + innerH - barH;
        const inPeak = peakHours.has(i);
        return (
          <g key={i}>
            <rect
              x={x}
              y={barH > 0 ? y : padT + innerH - 1}
              width={barW}
              height={barH > 0 ? barH : 1}
              fill={inPeak ? "#10b981" : "currentColor"}
              fillOpacity={
                inPeak ? (d.value > 0 ? 0.85 : 0.08) : d.value > 0 ? 0.18 : 0.05
              }
              rx={1}
            />
            {d.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill={inPeak ? "#10b981" : "currentColor"}
                fillOpacity={inPeak ? 0.95 : 0.6}
              >
                {d.value}
              </text>
            )}
            <title>
              {formatHourFull(i)}: {d.value}
            </title>
            {i % 3 === 0 && (
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.55}
              >
                {formatHourShort(i)}
              </text>
            )}
          </g>
        );
      })}
      {(() => {
        if (peakStart + 2 >= 24) return null;
        const x1 = padL + peakStart * barSlot + (barSlot - barW) / 2 - 2;
        const x2 =
          padL +
          ((peakStart + 2) % 24) * barSlot +
          (barSlot - barW) / 2 +
          barW +
          2;
        const y = padT + innerH + 10;
        return (
          <g>
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="#10b981"
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />
            <line
              x1={x1}
              y1={y - 3}
              x2={x1}
              y2={y + 3}
              stroke="#10b981"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            <line
              x1={x2}
              y1={y - 3}
              x2={x2}
              y2={y + 3}
              stroke="#10b981"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          </g>
        );
      })()}
    </svg>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: "10d" as const, label: "10 days", days: 10 },
  { id: "7d" as const, label: "7 days", days: 7 },
  { id: "today" as const, label: "today", days: 0 },
];

type Filter = (typeof FILTERS)[number]["id"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`text-4xl font-light tabular-nums leading-none ${accent ? "text-emerald-500" : ""}`}
      >
        {value}
      </div>
      <div className="text-sm opacity-70 mt-2">{label}</div>
    </div>
  );
}

function ChartLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm tracking-wide opacity-70 mb-4">{children}</p>;
}

// ─── StatsView ────────────────────────────────────────────────────────────────

export default function StatsView({
  initialData,
  userImage,
  userLogin,
  nowMs,
}: {
  initialData: CommitData;
  userImage: string | null;
  userLogin: string;
  nowMs: number;
}) {
  const [data, setData] = useState<CommitData>(initialData);
  const [filter, setFilter] = useState<Filter>("10d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/git-stats");
      const json = (await res.json()) as CommitData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "fetch failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
    }
  }

  const { dailyData, hourlyData, stats } = useMemo(() => {
    const commits: Commit[] = data.commits;
    // Use viewer's local timezone for all date math
    const nowLocal = new Date(nowMs);
    nowLocal.setHours(0, 0, 0, 0);
    const todayStr = localDateStr(nowLocal.getTime());
    const filterDef = FILTERS.find((f) => f.id === filter)!;

    let filtered: Commit[];
    if (filter === "today") {
      filtered = commits.filter((c) => localDateStr(c.timestamp) === todayStr);
    } else {
      const cutoff = new Date(nowLocal);
      cutoff.setDate(cutoff.getDate() - filterDef.days + 1);
      filtered = commits.filter((c) => c.timestamp >= cutoff.getTime());
    }

    const dayMap = new Map<string, number>();
    if (filter !== "today") {
      for (let i = filterDef.days - 1; i >= 0; i--) {
        const d = new Date(nowLocal);
        d.setDate(d.getDate() - i);
        dayMap.set(localDateStr(d.getTime()), 0);
      }
      for (const c of filtered) {
        const key = localDateStr(c.timestamp);
        dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
    }
    const dailyData = Array.from(dayMap.entries()).map(([date, value]) => ({
      label: formatDate(date),
      value,
    }));

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      label: formatHourShort(i),
      value: 0,
    }));
    for (const c of filtered)
      hourlyData[new Date(c.timestamp).getHours()].value++;

    let peakStart = 0;
    let peakSum = 0;
    for (let h = 0; h < 24; h++) {
      const sum =
        hourlyData[h].value +
        hourlyData[(h + 1) % 24].value +
        hourlyData[(h + 2) % 24].value;
      if (sum > peakSum) {
        peakSum = sum;
        peakStart = h;
      }
    }
    const peakBracket =
      peakSum > 0
        ? `${formatHourFull(peakStart)} – ${formatHourFull((peakStart + 3) % 24)}`
        : null;

    const total = filtered.length;
    const repos = new Set(filtered.map((c) => c.repo)).size;

    let peakDay = "";
    let peakDayCount = 0;
    for (const [date, count] of dayMap.entries()) {
      if (count > peakDayCount) {
        peakDayCount = count;
        peakDay = date;
      }
    }

    return {
      dailyData,
      hourlyData,
      stats: {
        total,
        repos,
        peakBracket,
        peakStart,
        peakDay: peakDay ? formatDate(peakDay) : null,
        peakDayCount,
      },
    };
  }, [data, filter, nowMs]);

  return (
    <main className="container mx-auto px-12 py-14 space-y-10">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-medium tracking-tight">git-stats</h1>
        <div className="flex items-center gap-3">
          {userImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={userLogin}
              className="w-7 h-7 rounded-full opacity-70"
            />
          )}
          <span className="text-sm opacity-70 font-mono">{userLogin}</span>
          <button
            onClick={() => signOut()}
            className="text-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          >
            sign out
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-sm opacity-70 hover:opacity-100 transition-opacity disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "loading…" : "refresh"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 opacity-80">{error}</p>}

      <p className="text-sm opacity-70 -mt-6">
        {data.repoCount} repos scanned &middot; {data.commits.length} commits in
        past 10 days
      </p>

      {/* filter tabs */}
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 text-sm rounded transition-all cursor-pointer ${
              filter === f.id
                ? "bg-emerald-500/10 text-emerald-500"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* stats row */}
      <div className="grid grid-cols-4 gap-10 pt-2 pb-4 border-b border-current/5">
        <Stat value={stats.total} label="commits" />
        <Stat value={stats.repos} label="repos" />
        <Stat
          value={stats.peakBracket ?? "—"}
          label="peak bracket"
          accent={!!stats.peakBracket}
        />
        <Stat
          value={stats.peakDay ?? "—"}
          label={
            stats.peakDayCount > 0
              ? `busiest · ${stats.peakDayCount} commits`
              : "busiest day"
          }
        />
      </div>

      {/* charts */}
      <div
        className={`grid gap-10 ${filter !== "today" ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {filter !== "today" && (
          <div>
            <ChartLabel>commits per day</ChartLabel>
            <DailyChart data={dailyData} />
          </div>
        )}
        <div>
          <ChartLabel>commits by hour of day</ChartLabel>
          <HourlyChart data={hourlyData} peakStart={stats.peakStart} />
        </div>
      </div>
    </main>
  );
}
