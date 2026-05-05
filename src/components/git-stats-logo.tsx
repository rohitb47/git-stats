export default function GitStatsLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block bg-white text-black px-2.5 py-1 font-medium tracking-tight ${className ?? ""}`}
    >
      git-stats
    </span>
  );
}
