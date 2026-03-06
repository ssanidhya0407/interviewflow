"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getInterviews, InterviewRecord } from "@/lib/api";
import { ThemeToggleButton } from "@/components/ui/ThemeToggle";
import {
    Calendar,
    Target,
    ArrowUpRight,
    Loader2,
    Zap,
    ChevronLeft
} from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
    const router = useRouter();
    const { isLoading: authLoading, isLoggedIn } = useAuth();
    const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/auth/login");
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (isLoggedIn) {
            loadData();
        }
    }, [isLoggedIn]);

    const loadData = async () => {
        try {
            // Fetch more interviews (e.g., 50)
            const interviewsData = await getInterviews(50);
            // Sort by Date Descending
            const sortedInterviews = [...interviewsData].sort((a, b) =>
                new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
            );
            setInterviews(sortedInterviews);
        } catch (error) {
            console.error("Failed to load history data:", error);
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

            {/* Theme Toggle */}
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggleButton />
            </div>

            <main className="max-w-4xl mx-auto px-6 pb-12 relative z-10">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/dashboard" className="w-10 h-10 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center hover:bg-secondary/80 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Interview History</h1>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {interviews.length === 0 ? (
                            <div className="text-center py-16 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] border border-border dark:border-white/10">
                                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No interviews found.</p>
                            </div>
                        ) : (
                            interviews.map((interview, i) => (
                                <Link key={interview.session_id} href={`/report?session_id=${interview.session_id}`}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex items-center justify-between p-6 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-border dark:border-white/10 hover:border-primary/20 dark:hover:border-primary/20 hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all cursor-pointer shadow-sm"
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
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
