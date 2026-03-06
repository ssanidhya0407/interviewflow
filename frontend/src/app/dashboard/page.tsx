"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getInterviews, getDashboardStats, InterviewRecord, DashboardStats, startInterview } from "@/lib/api";
import {
    Play,
    Calendar,
    Award,
    ChevronRight,
    Loader2,
    TrendingUp,
    Target,
    Zap,
    BarChart3,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isLoggedIn } = useAuth();
    const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/auth/login");
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (isLoggedIn) {
            checkPendingSession();
            loadData();
        }
    }, [isLoggedIn]);

    const checkPendingSession = async () => {
        const pending = localStorage.getItem("pendingSessionConfig");
        if (pending) {
            try {
                const config = JSON.parse(pending);
                localStorage.removeItem("pendingSessionConfig");
                setIsLoading(true);
                const data = await startInterview(config);
                if (typeof window !== "undefined" && data?.session_id && data?.message) {
                    sessionStorage.setItem(`initialInterviewMessage:${data.session_id}`, data.message);
                }
                router.push(`/interview?session_id=${data.session_id}`);
            } catch (e) {
                console.error("Failed to start pending session", e);
            }
        }
    };

    const loadData = async () => {
        try {
            const [interviewsData, statsData] = await Promise.all([
                getInterviews(20),
                getDashboardStats()
            ]);
            // Sort by Date Descending (Recent -> Past)
            const sortedInterviews = [...interviewsData].sort((a, b) =>
                new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
            );
            setInterviews(sortedInterviews);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || !isLoggedIn) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-blue-500";
        if (score >= 40) return "text-yellow-500";
        return "text-destructive";
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pt-32 relative overflow-hidden">

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px]" />
            </div>



            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 pb-12">

                {/* Welcome Header */}
                <div className="mb-12 flex items-end justify-between relative z-10">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                            Welcome back, {user?.full_name?.split(" ")[0] || "there"}
                        </h1>
                        <p className="text-muted-foreground text-lg">Here's your interview progress overview.</p>
                    </div>
                    <div className="hidden sm:block">
                        <div className="px-4 py-2 bg-secondary/80 backdrop-blur-md rounded-full text-sm border border-border flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            {user?.email}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Row 1: Main Action + Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">

                            {/* Start Interview - Large Card */}
                            <Link href="/setup" className="md:col-span-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.01 }}
                                    className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[40px] p-10 border border-border dark:border-white/10 min-h-[320px] flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-sm"
                                >
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center mb-8 border border-border dark:border-white/10">
                                            <Play className="w-7 h-7 text-primary" />
                                        </div>
                                        <h2 className="text-3xl font-bold mb-3 text-foreground">Start New Interview</h2>
                                        <p className="text-muted-foreground text-base max-w-sm">
                                            Practice with AI-powered mock interviews tailored to your role and experience.
                                        </p>
                                    </div>

                                    <div className="relative z-10 flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                                        Begin Practice <ChevronRight className="w-5 h-5" />
                                    </div>

                                    {/* Background gradient */}
                                    <div className="absolute right-0 bottom-0 w-full h-full bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-100 pointer-events-none" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </motion.div>
                            </Link>

                            {/* Stats Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="md:col-span-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[40px] p-10 border border-border dark:border-white/10 flex flex-col shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-12 h-12 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-green-500" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Stats</span>
                                </div>

                                <h3 className="text-xl font-bold mb-2">Your Progress</h3>
                                <p className="text-muted-foreground text-sm mb-8">Performance overview</p>

                                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border dark:border-white/5">
                                    <div>
                                        <div className="text-2xl font-bold mb-1">{stats?.total_interviews || 0}</div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</div>
                                    </div>
                                    <div>
                                        <div className={`text-2xl font-bold mb-1 ${getScoreColor(stats?.average_score || 0)}`}>
                                            {stats?.average_score || 0}%
                                        </div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg</div>
                                    </div>
                                    <div>
                                        <div className={`text-2xl font-bold mb-1 ${getScoreColor(stats?.best_score || 0)}`}>
                                            {stats?.best_score || 0}%
                                        </div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Row 2: Recent Interviews */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[40px] p-10 border border-border dark:border-white/10 mb-6 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-secondary dark:bg-[#151515] flex items-center justify-center">
                                        <Award className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Recent Interviews</h3>
                                        <p className="text-muted-foreground text-sm">{interviews.length} sessions</p>
                                    </div>
                                </div>
                            </div>

                            {interviews.length === 0 ? (
                                <div className="text-center py-16">
                                    <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">No interviews yet</p>
                                    <p className="text-xs text-muted-foreground">Start your first interview to see history</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {interviews.slice(0, 5).map((interview, i) => (
                                        <Link key={interview.session_id} href={`/report?session_id=${interview.session_id}`}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="group flex items-center justify-between p-6 rounded-3xl bg-secondary/30 dark:bg-white/5 border border-transparent dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/20 hover:bg-secondary/50 dark:hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-full bg-background dark:bg-white/5 flex items-center justify-center shrink-0 border border-border dark:border-white/5 group-hover:border-primary/20 transition-colors">
                                                        <Target className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg mb-1">{interview.role}</div>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {new Date(interview.started_at).toLocaleDateString()}
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                            <span>{interview.experience_level}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    {interview.score !== undefined && interview.score !== null && (
                                                        <span className={`text-xl font-bold ${getScoreColor(interview.score)}`}>
                                                            {interview.score}%
                                                        </span>
                                                    )}
                                                    <div className="w-10 h-10 rounded-full bg-background dark:bg-white/5 flex items-center justify-center border border-border dark:border-white/5 group-hover:bg-primary group-hover:border-primary transition-all">
                                                        <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {interviews.length > 0 && (
                                <div className="mt-6 text-center">
                                    <Link href="/history" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                        View Full History <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </motion.div>

                        {/* Row 3: Three smaller cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Trend Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[40px] p-8 border border-border dark:border-white/10 hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-colors shadow-sm"
                            >
                                <div className="w-12 h-12 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center mb-6 border border-border dark:border-white/10">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Performance</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                    Your recent trend is {stats?.recent_trend || "neutral"}.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${stats?.recent_trend === "improving" ? "bg-green-500" :
                                        stats?.recent_trend === "declining" ? "bg-red-500" : "bg-zinc-500"
                                        }`} />
                                    <span className="text-sm font-medium capitalize">{stats?.recent_trend || "Neutral"}</span>
                                </div>
                            </motion.div>

                            {/* Quick Tips */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[40px] p-8 border border-border dark:border-white/10 hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-colors shadow-sm"
                            >
                                <div className="w-12 h-12 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center mb-6 border border-border dark:border-white/10">
                                    <Zap className="w-5 h-5 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">AI Tips</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Practice regularly, upload your resume for personalized questions, and review feedback after each session.
                                </p>
                            </motion.div>

                            {/* Quick Action */}
                            <Link href="/settings">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[40px] p-8 border border-border dark:border-white/10 hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-colors cursor-pointer group shadow-sm"
                                >
                                    <div className="w-12 h-12 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center mb-6 border border-border dark:border-white/10">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Settings</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                        Configure reminders and preferences.
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        Customize <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </motion.div>
                            </Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
