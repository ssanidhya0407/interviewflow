"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Loader2,
  Search,
  Trophy,
  X,
  Zap,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { getInterviews, InterviewRecord } from "@/lib/api";

type RingData = { label: string; value: number; color: string };

export default function HistoryPage() {
  const router = useRouter();
  const { isLoading: authLoading, isLoggedIn } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [scoreFilter, setScoreFilter] = useState<"All" | "Scored" | "Unscored" | "80+">("All");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;

    getInterviews(80)
      .then((res) => {
        const sorted = [...res].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
        setInterviews(sorted);
      })
      .catch((error) => console.error("Failed to load history:", error))
      .finally(() => setIsLoading(false));
  }, [isLoggedIn]);

  const levels = useMemo(() => {
    const set = new Set(interviews.map((i) => i.experience_level).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [interviews]);

  const interviewTypes = useMemo(() => {
    const set = new Set(interviews.map((i) => i.interview_type).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [interviews]);

  const isFiltering = Boolean(search.trim()) || levelFilter !== "All" || typeFilter !== "All" || scoreFilter !== "All";

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return interviews.filter((item) => {
      const matchesSearch =
        !q ||
        item.role.toLowerCase().includes(q) ||
        item.experience_level.toLowerCase().includes(q) ||
        (item.interview_type || "").toLowerCase().includes(q);

      const matchesLevel = levelFilter === "All" || item.experience_level === levelFilter;
      const matchesType = typeFilter === "All" || item.interview_type === typeFilter;

      const score = item.score;
      const matchesScore =
        scoreFilter === "All" ||
        (scoreFilter === "Scored" && score !== undefined && score !== null) ||
        (scoreFilter === "Unscored" && (score === undefined || score === null)) ||
        (scoreFilter === "80+" && (score ?? 0) >= 80);

      return matchesSearch && matchesLevel && matchesType && matchesScore;
    });
  }, [interviews, search, levelFilter, typeFilter, scoreFilter]);

  if (authLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-600/30 pt-32 pb-20">
      <main className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <header className="mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-blue-600 font-bold uppercase tracking-widest text-xs">Interview Archive</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-5">
              Session <span className="text-blue-600">History</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Browse every completed interview session and open detailed reports instantly.
            </p>
          </motion.div>
        </header>

        <div className="mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role or level..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-card dark:bg-[#0C0C0C] border border-border dark:border-white/5 text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary text-muted-foreground transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="mt-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${levelFilter === level
                    ? "bg-blue-600 text-white"
                    : "bg-card dark:bg-[#0C0C0C] border border-border dark:border-white/5 text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {interviewTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${typeFilter === type
                    ? "bg-blue-600 text-white"
                    : "bg-card dark:bg-[#0C0C0C] border border-border dark:border-white/5 text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["All", "Scored", "Unscored", "80+"] as const).map((score) => (
                <button
                  key={score}
                  onClick={() => setScoreFilter(score)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${scoreFilter === score
                    ? "bg-blue-600 text-white"
                    : "bg-card dark:bg-[#0C0C0C] border border-border dark:border-white/5 text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {score}
                </button>
              ))}

              {isFiltering && (
                <button
                  onClick={() => {
                    setSearch("");
                    setLevelFilter("All");
                    setTypeFilter("All");
                    setScoreFilter("All");
                  }}
                  className="px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="min-h-[240px] rounded-[32px] border border-border dark:border-white/5 bg-card dark:bg-[#0C0C0C] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="min-h-[240px] rounded-[32px] border border-border dark:border-white/5 bg-card dark:bg-[#0C0C0C] flex flex-col items-center justify-center text-center">
            <Zap className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-semibold mb-1">No sessions found</p>
            <p className="text-sm text-muted-foreground">Try another search or start a new interview.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((interview, index) => {
              const rings: RingData[] = [
                { label: "Comm", value: clamp(interview.communication_score ?? 0), color: "#ff0a78" },
                { label: "Tech", value: clamp(interview.technical_score ?? 0), color: "#b7ff00" },
                { label: "PS", value: clamp(interview.problem_solving_score ?? 0), color: "#23e9de" },
                { label: "Culture", value: clamp(interview.culture_fit_score ?? 0), color: "#ffa31a" },
              ];

              return (
                <Link key={interview.session_id} href={`/report?session_id=${interview.session_id}`} className="group block h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -4 }}
                    className="bg-card dark:bg-[#0C0C0C] rounded-[32px] p-7 border border-border dark:border-white/5 hover:border-blue-500/30 transition-all duration-300 h-full flex flex-col justify-between min-h-[270px]"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <AppleRings rings={rings} size={52} stroke={9} />

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {rings.map((ring) => (
                              <MiniProgressRing key={ring.label} value={ring.value} color={ring.color} label={ring.label} />
                            ))}
                          </div>
                          {interview.score !== undefined && interview.score !== null && interview.score >= 80 && (
                            <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-foreground leading-tight mb-3 line-clamp-2">{interview.role}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(interview.started_at).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span>{interview.experience_level}</span>
                      </div>

                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div
                          className={
                            interview.score !== undefined && interview.score !== null && interview.score >= 80
                              ? "h-full bg-emerald-500"
                              : interview.score !== undefined && interview.score !== null && interview.score >= 60
                                ? "h-full bg-blue-500"
                                : interview.score !== undefined && interview.score !== null && interview.score >= 40
                                  ? "h-full bg-amber-500"
                                  : "h-full bg-rose-500"
                          }
                          style={{ width: `${Math.max(0, Math.min(100, interview.score ?? 0))}%` }}
                        />
                      </div>

                      <div className="text-xs text-muted-foreground font-medium">
                        {interview.score !== undefined && interview.score !== null ? `${interview.score}% overall score` : "Not scored yet"}
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-border dark:border-white/5 flex justify-between items-center text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Open report</span>
                      <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function AppleRings({ rings, size = 52, stroke = 9 }: { rings: RingData[]; size?: number; stroke?: number }) {
  const center = 50;
  const radii = [42, 32, 22, 12];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-[104deg]">
      {rings.map((ring, index) => {
        const radius = radii[index] ?? 18;
        const progress = ring.value / 100;
        const circumference = 2 * Math.PI * radius;

        return (
          <g key={ring.label}>
            <circle cx={center} cy={center} r={radius} fill="none" stroke={ring.color} opacity={0.28} strokeWidth={stroke} />
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function MiniProgressRing({ value, color, label }: { value: number; color: string; label: string }) {
  const center = 50;
  const radius = 40;
  const stroke = 14;
  const clamped = clamp(value);
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      whileHover={{ width: 122 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.7 }}
      className="h-8 w-8 rounded-full border border-border/50 bg-background/70 flex items-center justify-start overflow-hidden px-1"
      title={`${label} ${clamped}%`}
      aria-label={`${label} ${clamped}%`}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
        <svg width={24} height={24} viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" className="text-white/15" strokeWidth={stroke} />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
      </div>
      <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{label} {clamped}%</span>
    </motion.div>
  );
}
