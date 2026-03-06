"use client";

import { ReactNode, useCallback, useEffect, useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowUpRight,
    BarChart3,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Flame,
    Loader2,
    Play,
    Settings,
    Target,
    TrendingUp
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { getInterviews, getDashboardStats, InterviewRecord, DashboardStats, startInterview } from "@/lib/api";

type RingKey = "communication" | "technical" | "problem_solving" | "culture_fit";

type RingStat = {
    key: RingKey;
    label: string;
    value: number;
    color: string;
    hint: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isLoggedIn } = useAuth();
    const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

    const completionRate = useMemo(() => {
        if (!stats?.total_interviews) return 0;
        return Math.round((stats.completed_interviews / stats.total_interviews) * 100);
    }, [stats?.completed_interviews, stats?.total_interviews]);

    const currentStreak = useMemo(() => computeCurrentStreak(interviews), [interviews]);

    const checkPendingSession = useCallback(async () => {
        const pending = localStorage.getItem("pendingSessionConfig");
        if (!pending) return;

        try {
            const config = JSON.parse(pending);
            localStorage.removeItem("pendingSessionConfig");
            setIsLoading(true);
            const data = await startInterview(config);
            if (typeof window !== "undefined" && data?.session_id && data?.message) {
                sessionStorage.setItem(`initialInterviewMessage:${data.session_id}`, data.message);
            }
            router.push(`/interview?session_id=${data.session_id}`);
        } catch (error) {
            console.error("Failed to start pending session", error);
        }
    }, [router]);

    const loadData = useCallback(async () => {
        try {
            const [interviewsData, statsData] = await Promise.all([
                getInterviews(100),
                getDashboardStats()
            ]);
            const sortedInterviews = [...interviewsData].sort(
                (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
            );
            setInterviews(sortedInterviews);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/auth/login");
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!isLoggedIn) return;
        checkPendingSession();
        loadData();
    }, [checkPendingSession, isLoggedIn, loadData]);

    if (authLoading || !isLoggedIn) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <span className="text-zinc-500 text-sm font-medium tracking-widest uppercase">Loading dashboard</span>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-blue-400";
        if (score >= 40) return "text-amber-400";
        return "text-rose-400";
    };

    const recentInterviews = interviews.slice(0, 3);

    return (
        <div className="min-h-screen bg-background text-foreground pt-32 pb-20 selection:bg-blue-500/30">
            <main className="max-w-6xl mx-auto px-6 space-y-6">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-7 mb-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <h1 className="text-5xl md:text-[62px] leading-[0.98] font-bold tracking-tight text-foreground">
                            Hello <span className="text-blue-600">Sanidhya</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl">
                            Practice deliberately, measure progress, and ship better interview performance every week.
                        </p>
                    </motion.div>
                    <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-full border border-border bg-card/50 backdrop-blur-md shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Signed in</span>
                        <div className="w-px h-3 bg-border" />
                        <span className="text-sm font-semibold text-foreground">{user?.email}</span>
                    </div>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        <div className="md:col-span-2 h-[260px] rounded-[28px] border border-border/60 bg-card/40" />
                        <div className="h-[260px] rounded-[28px] border border-border/60 bg-card/40" />
                        <div className="md:col-span-3 h-[360px] rounded-[28px] border border-border/60 bg-card/40" />
                        <div className="h-[190px] rounded-[28px] border border-border/60 bg-card/40" />
                        <div className="h-[190px] rounded-[28px] border border-border/60 bg-card/40" />
                        <div className="h-[190px] rounded-[28px] border border-border/60 bg-card/40" />
                    </div>
                ) : (
                    <>
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Link href="/setup" className="md:col-span-2 group block">
                                <motion.div whileHover={{ y: -2 }} className="relative min-h-[260px] rounded-[28px] border border-border/60 bg-card dark:bg-[#0C0C0C] overflow-hidden p-7">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-transparent to-cyan-500/10 opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        <div>
                                            <div className="w-14 h-14 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center mb-7">
                                                <Play className="w-7 h-7" />
                                            </div>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-blue-500/10 text-blue-400">
                                                Practice Arena
                                            </span>
                                            <h2 className="text-3xl md:text-[38px] leading-[1.02] font-bold tracking-tight mt-4 mb-3">Start New Interview</h2>
                                            <p className="text-muted-foreground max-w-lg">
                                                Generate role-specific sessions and get instant scoring on communication, technical depth, and clarity.
                                            </p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 font-semibold text-foreground group-hover:gap-3 transition-all">
                                            Begin session <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>

                            <motion.div whileHover={{ y: -2 }} className="min-h-[260px] rounded-[28px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-7 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                        <BarChart3 className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Snapshot</span>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Completion Rate</p>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${completionRate}%` }}
                                                transition={{ duration: 0.9, ease: "easeOut" }}
                                                className="h-full bg-emerald-500"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">{completionRate}% completed</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 pt-5 border-t border-border/70">
                                        <Metric label="Total" value={stats?.total_interviews ?? 0} />
                                        <Metric label="Avg" value={`${stats?.average_score ?? 0}%`} tone={getScoreColor(stats?.average_score ?? 0)} />
                                        <Metric label="Best" value={`${stats?.best_score ?? 0}%`} tone={getScoreColor(stats?.best_score ?? 0)} />
                                    </div>
                                </div>
                            </motion.div>
                        </section>

                        <section className="rounded-[28px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-7">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Recent Interviews</h3>
                                        <p className="text-sm text-muted-foreground">Last {recentInterviews.length} sessions</p>
                                    </div>
                                </div>
                                <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                                    View all <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {recentInterviews.length === 0 ? (
                                <div className="h-[190px] flex flex-col items-center justify-center text-center">
                                    <Target className="w-10 h-10 text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground mb-1">No interviews yet</p>
                                    <p className="text-xs text-muted-foreground">Start your first mock session to unlock insights.</p>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {recentInterviews.map((interview, index) => {
                                        const rings = toRingStats(interview);
                                        const expanded = expandedSessionId === interview.session_id;

                                        return (
                                            <motion.div
                                                key={interview.session_id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="rounded-2xl border border-border/60 bg-background/70 p-4 md:p-5"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="min-w-0 flex items-center gap-4">
                                                        <div className="shrink-0">
                                                            <FitnessRings stats={rings} size={30} stroke={10} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold truncate">{interview.role}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(interview.started_at).toLocaleDateString()}</span>
                                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                                                <span>{interview.experience_level}</span>
                                                                {interview.score !== undefined && interview.score !== null && (
                                                                    <>
                                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                                                        <span className={getScoreColor(interview.score)}>{interview.score}% overall</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            {rings.map((ring) => (
                                                                <button
                                                                    key={ring.key}
                                                                    type="button"
                                                                    onClick={() => setExpandedSessionId(expanded ? null : interview.session_id)}
                                                                    className="w-9 h-9 rounded-full border border-border/60 bg-card/70 hover:bg-card transition-colors flex items-center justify-center"
                                                                    aria-label={`Toggle ${ring.label} details`}
                                                                >
                                                                    <FitnessRings stats={[ring]} size={24} stroke={12} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <Link
                                                            href={`/report?session_id=${interview.session_id}`}
                                                            className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-colors"
                                                            aria-label="Open interview report"
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>

                                                {expanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="mt-4 rounded-[999px] border border-border/60 bg-card/60 p-2 md:p-3"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                                                            {rings.map((ring) => (
                                                                <RingPill key={ring.key} ring={ring} />
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <motion.div whileHover={{ y: -2 }} className="rounded-[28px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-7 min-h-[260px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center">
                                        <Flame className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Consistency</span>
                                </div>
                                <div className="mt-7">
                                    <h3 className="text-[46px] leading-none font-semibold tracking-tight">{currentStreak}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">Consecutive active days</p>
                                </div>
                                <div className="pt-4 border-t border-border/70 text-2xl font-semibold leading-none">Streak <span className="text-base text-muted-foreground ml-1">day{currentStreak === 1 ? "" : "s"}</span></div>
                            </motion.div>

                            <SimpleCard
                                href="/settings"
                                title="Settings"
                                description="Adjust reminders, interview defaults, and preferences."
                                icon={<Settings className="w-6 h-6" />}
                                tone="bg-violet-500/10 text-violet-400"
                            />

                            <SimpleCard
                                href="https://tryalgoflow.vercel.app"
                                title="DSA Practice"
                                description="Go to AlgoFlow for DSA practice and structured problem drills."
                                icon={<TrendingUp className="w-6 h-6" />}
                                tone="bg-blue-500/10 text-blue-400"
                                external
                            />
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

function computeCurrentStreak(interviews: InterviewRecord[]) {
    if (!interviews.length) return 0;

    const uniqueDays = new Set(
        interviews
            .filter((item) => !!item.started_at)
            .map((item) => toLocalDayKey(new Date(item.started_at)))
    );

    const today = startOfDay(new Date());
    const yesterday = addDays(today, -1);

    let cursor = today;
    if (!uniqueDays.has(toLocalDayKey(today))) {
        if (!uniqueDays.has(toLocalDayKey(yesterday))) return 0;
        cursor = yesterday;
    }

    let streak = 0;
    while (uniqueDays.has(toLocalDayKey(cursor))) {
        streak += 1;
        cursor = addDays(cursor, -1);
    }
    return streak;
}

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return next;
}

function toLocalDayKey(d: Date) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function toRingStats(interview: InterviewRecord): RingStat[] {
    return [
        {
            key: "communication",
            label: "Communication",
            value: clamp(interview.communication_score ?? 0),
            color: "#ff0a78",
            hint: "Clarity, articulation, and structure"
        },
        {
            key: "technical",
            label: "Technical",
            value: clamp(interview.technical_score ?? 0),
            color: "#b6ff00",
            hint: "Technical depth and correctness"
        },
        {
            key: "problem_solving",
            label: "Problem Solving",
            value: clamp(interview.problem_solving_score ?? 0),
            color: "#23e9de",
            hint: "Approach, reasoning, and trade-offs"
        },
        {
            key: "culture_fit",
            label: "Culture Fit",
            value: clamp(interview.culture_fit_score ?? 0),
            color: "#ffa31a",
            hint: "Collaboration, ownership, and alignment"
        }
    ];
}

function clamp(value: number) {
    return Math.max(0, Math.min(100, value));
}

function FitnessRings({ stats, size = 52, stroke = 10 }: { stats: RingStat[]; size?: number; stroke?: number }) {
    const idBase = useId().replace(/:/g, "");
    const center = 50;
    const rings = stats.slice(0, 4);
    const ringRadii = [42, 32, 22, 12];
    const ringStroke = stroke;

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-[104deg]">
            <defs>
                {rings.map((ring) => {
                    const stops =
                        ring.key === "communication"
                            ? { start: "#ff5ca8", end: "#ff0066" }
                            : ring.key === "technical"
                                ? { start: "#dbff3f", end: "#b7ff00" }
                                : ring.key === "problem_solving"
                                    ? { start: "#48efe6", end: "#21e1d9" }
                                    : { start: "#ffc15a", end: "#ff9f0a" };

                    return (
                        <linearGradient
                            key={`${ring.key}-gradient`}
                            id={`${idBase}-${ring.key}-gradient`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor={stops.start} />
                            <stop offset="100%" stopColor={stops.end} />
                        </linearGradient>
                    );
                })}
            </defs>
            <g>
                {rings.map((ring, index) => {
                    const radius = ringRadii[index] ?? (42 - index * 12);
                    if (radius <= 0) return null;

                    const progress = ring.value / 100;
                    const circumference = 2 * Math.PI * radius;

                    return (
                        <g key={ring.key}>
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke={`url(#${idBase}-${ring.key}-gradient)`}
                                strokeWidth={ringStroke}
                                opacity={0.28}
                            />
                            <motion.circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke={`url(#${idBase}-${ring.key}-gradient)`}
                                strokeWidth={ringStroke}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}

function RingPill({ ring }: { ring: RingStat }) {
    return (
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/70 px-3 py-2">
            <FitnessRings stats={[ring]} size={36} stroke={10} />
            <div className="leading-tight">
                <div className="text-xs font-semibold">{ring.label} <span className="text-muted-foreground">{ring.value}%</span></div>
                <div className="text-[11px] text-muted-foreground">{ring.hint}</div>
            </div>
        </div>
    );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
    return (
        <div>
            <div className={`text-2xl font-bold leading-none ${tone || "text-foreground"}`}>{value}</div>
            <div className="mt-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
        </div>
    );
}

function SimpleCard({
    href,
    title,
    description,
    icon,
    tone,
    external
}: {
    href: string;
    title: string;
    description: string;
    icon: ReactNode;
    tone: string;
    external?: boolean;
}) {
    return (
        <motion.div whileHover={{ y: -2 }} className="relative rounded-[28px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-7 min-h-[260px] flex flex-col justify-between">
            <Link
                href={href}
                aria-label={title}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="absolute top-6 right-6 w-10 h-10 rounded-full border border-border/60 bg-background/70 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-colors"
            >
                <ArrowUpRight className="w-4 h-4" />
            </Link>

            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tone}`}>{icon}</div>
            <div className="mt-7 pr-12">
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="pt-4 border-t border-border/70 text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                {external ? "Open in new tab" : "Open"}
            </div>
        </motion.div>
    );
}
