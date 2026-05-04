"use client";

import { motion } from "motion/react";
import { GitBranch, Star, Zap, BarChart3, Code2 } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Contribution Stats",
    description: "Visualize your commit activity and contribution graph over time.",
  },
  {
    icon: Star,
    title: "Top Languages",
    description: "See which programming languages dominate your repositories.",
  },
  {
    icon: Zap,
    title: "Streak Tracking",
    description: "Track your longest and current commit streaks.",
  },
  {
    icon: GitBranch,
    title: "Repository Insights",
    description: "Dive into per-repo metrics, stars, forks, and more.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 gap-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 text-sm font-medium text-foreground/60 border border-foreground/10 rounded-full px-4 py-1.5"
        >
          <Code2 size={14} />
          <span>GitHub Stats Dashboard</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-bold tracking-tight"
        >
          Flex your{" "}
          <span className="text-foreground/40">programmer</span> stats
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-foreground/60 leading-relaxed"
        >
          Visualize your GitHub contributions, streaks, top languages, and
          repository insights — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
          >
            <Code2 size={16} />
            Connect GitHub
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full border border-foreground/10 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Learn more
          </a>
        </motion.div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="flex flex-col gap-3 rounded-2xl border border-foreground/8 p-5 bg-foreground/[0.02]"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-foreground/8">
                <Icon size={18} className="text-foreground/70" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold">{feature.title}</h2>
                <p className="text-sm text-foreground/55 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </section>
    </main>
  );
}
