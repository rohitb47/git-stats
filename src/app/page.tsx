"use client";

import { useState, useMemo, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Commit = {
  hash: string;
  repo: string;
  date: string;
  hour: number;
  message: string;
  timestamp: number;
};

type ScanResult = {
  commits: Commit[];
  repoCount: number;
};

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Daily chart (line + area) ────────────────────────────────────────────────

function DailyChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0)
    return (
      <div className="h-32 flex items-center text-xs opacity-20">no data</div>
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
      {/* grid + y labels */}
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
              strokeOpacity={0.07}
              strokeDasharray="3 3"
            />
            <text
              x={padL - 5}
              y={y + 3}
              textAnchor="end"
              fontSize={8}
              fill="currentColor"
              fillOpacity={0.3}
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* area fill */}
      <path d={areaPath} fill="#10b981" fillOpacity={0.07} />

      {/* line */}
      <path
        d={linePath}
        stroke="#10b981"
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* dots + x labels */}
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
              fontSize={8}
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
              fontSize={8}
              fill="currentColor"
              fillOpacity={0.3}
            >
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Hourly chart (bars, peak bracket highlighted) ────────────────────────────

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
  const barCount = 24;
  const barSlot = innerW / barCount;
  const barW = barSlot * 0.6;
  const peakHours = new Set([
    peakStart,
    (peakStart + 1) % 24,
    (peakStart + 2) % 24,
  ]);

  const gridValues = [Math.round(maxVal * 0.5), maxVal];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ overflow: "visible" }}
    >
      {/* grid */}
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
              strokeOpacity={0.07}
              strokeDasharray="3 3"
            />
            <text
              x={padL - 5}
              y={y + 3}
              textAnchor="end"
              fontSize={8}
              fill="currentColor"
              fillOpacity={0.3}
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* bars */}
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
                fontSize={7}
                fill={inPeak ? "#10b981" : "currentColor"}
                fillOpacity={inPeak ? 0.9 : 0.4}
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
                fontSize={8}
                fill="currentColor"
                fillOpacity={0.3}
              >
                {formatHourShort(i)}
              </text>
            )}
          </g>
        );
      })}

      {/* peak bracket underline */}
      {(() => {
        const x1 = padL + peakStart * barSlot + (barSlot - barW) / 2 - 2;
        const x2 =
          padL +
          ((peakStart + 2) % 24) * barSlot +
          (barSlot - barW) / 2 +
          barW +
          2;
        const y = padT + innerH + 10;
        // handle wrap-around: skip bracket if it wraps midnight
        if (peakStart + 2 >= 24) return null;
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
        className={`text-2xl font-light tabular-nums leading-none ${accent ? "text-emerald-500" : ""}`}
      >
        {value}
      </div>
      <div className="text-xs opacity-30 mt-1.5">{label}</div>
    </div>
  );
}

function ChartLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest opacity-20 mb-3">
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [basePath, setBasePath] = useState("~/Documents/GitHub");
  const [author, setAuthor] = useState("");
  const [filter, setFilter] = useState<Filter>("10d");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/git-stats")
      .then((r) => r.json())
      .then((d: { name?: string }) => {
        if (d.name) setAuthor(d.name);
      })
      .catch(() => {});
  }, []);

  async function scan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/git-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basePath, author }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "scan failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "scan failed");
    } finally {
      setLoading(false);
    }
  }

  const { dailyData, hourlyData, stats } = useMemo(() => {
    if (!result) return { dailyData: [], hourlyData: [], stats: null };

    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    const filterDef = FILTERS.find((f) => f.id === filter)!;

    let filtered: Commit[];
    if (filter === "today") {
      filtered = result.commits.filter((c) => c.date === todayStr);
    } else {
      const cutoff = new Date(now);
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - filterDef.days + 1);
      filtered = result.commits.filter((c) => c.timestamp >= cutoff.getTime());
    }

    // daily series
    const dayMap = new Map<string, number>();
    if (filter !== "today") {
      for (let i = filterDef.days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap.set(d.toISOString().substring(0, 10), 0);
      }
      for (const c of filtered) {
        dayMap.set(c.date, (dayMap.get(c.date) ?? 0) + 1);
      }
    }
    const dailyData = Array.from(dayMap.entries()).map(([date, value]) => ({
      label: formatDate(date),
      value,
    }));

    // hourly series
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      label: formatHourShort(i),
      value: 0,
    }));
    for (const c of filtered) {
      hourlyData[c.hour].value++;
    }

    // peak 3-hour bracket (sliding window)
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

    // summary stats
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
  }, [result, filter]);

  return (
    <main className="max-w-5xl mx-auto px-8 py-10 space-y-8">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium opacity-40 tracking-tight">
          git stats
        </h1>
      </div>

      {/* inputs */}
      <div className="flex gap-2">
        <input
          type="text"
          value={basePath}
          onChange={(e) => setBasePath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && scan()}
          className="flex-1 bg-transparent border border-current/10 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-current/25 placeholder:opacity-20"
          placeholder="~/Documents/GitHub"
          spellCheck={false}
        />
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && scan()}
          className="w-56 bg-transparent border border-current/10 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-current/25 placeholder:opacity-20"
          placeholder="author (optional)"
          spellCheck={false}
        />
        <button
          onClick={scan}
          disabled={loading}
          className="px-5 py-1.5 text-sm rounded border border-current/10 hover:border-current/25 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "scanning…" : "scan"}
        </button>
      </div>

      {error && <p className="text-xs opacity-50">{error}</p>}

      {result && (
        <>
          <p className="text-xs opacity-25 -mt-4">
            {result.repoCount} repos scanned &middot; {result.commits.length}{" "}
            commits in past 10 days
          </p>

          {/* filter tabs */}
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 text-xs rounded transition-all cursor-pointer ${
                  filter === f.id
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "opacity-30 hover:opacity-60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* stats row */}
          {stats && (
            <div className="grid grid-cols-4 gap-8 pt-1 pb-2 border-b border-current/5">
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
          )}

          {/* two-column chart grid */}
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
              {stats && (
                <HourlyChart data={hourlyData} peakStart={stats.peakStart} />
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
