"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getFeedback, exportPDF, FeedbackData } from "@/lib/api";
import { motion } from "framer-motion";
import {
    CheckCircle, AlertCircle, ArrowRight, Award, Trophy, Info,
    Download, MessageSquare, Mic, TrendingUp, Target, Loader2, Volume2
} from "lucide-react";
import { RadarChart } from "@/components/ui/AnalyticsChart";
import Link from "next/link";

function ReportContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [data, setData] = useState<FeedbackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (sessionId) {
            getFeedback(sessionId)
                .then((res) => {
                    if (typeof res === 'string') {
                        setData(JSON.parse(res));
                    } else {
                        setData(res);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [sessionId]);

    const handleDownloadPDF = async () => {
        if (!sessionId) return;
        setDownloading(true);
        try {
            const blob = await exportPDF(sessionId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `interviewflow_report_${sessionId.slice(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF download failed:", error);
            alert("Failed to download PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Generating comprehensive analysis...</p>
        </div>
    );

    if (!data) return <div className="min-h-screen bg-background flex items-center justify-center">Failed to load report.</div>;

    const categoryScores = [
        { label: "Comm", value: data.communication_score || 0 },
        { label: "Tech", value: data.technical_score || 0 },
        { label: "Problem", value: data.problem_solving_score || 0 },
        { label: "Culture", value: data.culture_fit_score || 0 }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <header className="mb-12 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block p-4 rounded-full bg-secondary/80 backdrop-blur-md mb-6 border border-border"
                    >
                        <Trophy className="w-12 h-12 text-yellow-500" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                        Interview Complete
                    </h1>
                    <p className="text-muted-foreground text-lg">Here is your comprehensive performance breakdown.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="md:col-span-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 border border-border dark:border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm"
                    >
                        <div className="relative z-10">
                            <span className={`text-7xl font-bold tracking-tighter ${data.score >= 70 ? "text-green-500" : data.score >= 50 ? "text-yellow-500" : "text-red-500"
                                }`}>{data.score}</span>
                            <span className="text-xl text-muted-foreground font-medium">/100</span>
                            <p className="mt-4 font-semibold text-primary">Overall Score</p>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 border border-border dark:border-white/10 flex flex-col justify-center shadow-sm"
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-500" /> Executive Summary
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            {data.summary}
                        </p>
                    </motion.div>
                </div>

                {(data.communication_score > 0 || data.technical_score > 0) && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 mb-8 border border-border dark:border-white/10 shadow-sm"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Target className="w-6 h-6 text-primary" /> Category Breakdown
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-6">
                                <ScoreBar label="Communication" value={data.communication_score} />
                                <ScoreBar label="Technical Knowledge" value={data.technical_score} />
                                <ScoreBar label="Problem Solving" value={data.problem_solving_score} />
                                <ScoreBar label="Culture Fit" value={data.culture_fit_score} />
                            </div>
                            <div className="hidden md:block">
                                <RadarChart scores={categoryScores} />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 border border-border dark:border-white/10 shadow-sm"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-green-600">
                            <Award className="w-6 h-6" /> Key Strengths
                        </h3>
                        <ul className="space-y-4">
                            {data.strengths.map((str, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                    <span className="text-foreground/90 leading-relaxed">{str}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 border border-border dark:border-white/10 shadow-sm"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-orange-600">
                            <AlertCircle className="w-6 h-6" /> Areas to Improve
                        </h3>
                        <ul className="space-y-4">
                            {data.improvements.map((imp, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    </div>
                                    <span className="text-foreground/90 leading-relaxed">{imp}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {data.improvement_tips && data.improvement_tips.length > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 mb-8 border border-border dark:border-white/10 shadow-sm"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-primary" /> Personalized Action Plan
                        </h3>
                        <ol className="space-y-4">
                            {data.improvement_tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                                        {i + 1}
                                    </span>
                                    <span className="text-foreground/90 pt-1 leading-relaxed">{tip}</span>
                                </li>
                            ))}
                        </ol>
                    </motion.div>
                )}

                {/* Transcript & Audio Playback */}
                {data.transcript && data.transcript.length > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.45 }}
                        className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 mb-8 border border-border dark:border-white/10 shadow-sm"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-primary" /> Interview Recording
                        </h3>
                        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {data.transcript.map((msg, i) => {
                                const isUser = msg.role === 'user';
                                const audioUrl = data.audio_urls && data.audio_urls[i.toString()];

                                if (msg.role === 'system') return null;

                                return (
                                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 ${isUser
                                            ? 'bg-primary/20 text-foreground ml-8'
                                            : 'bg-secondary/50 text-foreground/80 mr-8'
                                            }`}>
                                            <p className="text-xs font-bold mb-1 opacity-50 uppercase tracking-wider">
                                                {isUser ? 'You' : 'Interviewer'}
                                            </p>
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                                            {isUser && audioUrl && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <Volume2 className="w-4 h-4 text-primary" />
                                                        <p className="text-xs font-medium text-primary mb-2">Recording</p>
                                                    </div>
                                                    <audio controls className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity">
                                                        <source src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${audioUrl}`} type="audio/webm" />
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {data.voice_metrics && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-8 mb-8 border border-border dark:border-white/10 shadow-sm"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Mic className="w-6 h-6 text-primary" /> Speaking Analysis
                        </h3>
                        {/* ... rest of voice metrics ... */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <MetricCard label="Pace" value={data.voice_metrics.pace_rating} />
                            <MetricCard label="WPM" value={data.voice_metrics.words_per_minute.toString()} />
                            <MetricCard label="Filler Words" value={data.voice_metrics.filler_word_count.toString()} />
                            <MetricCard label="Confidence" value={`${data.voice_metrics.confidence_score}%`} />
                        </div>

                        {data.voice_metrics.feedback && data.voice_metrics.feedback.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Feedback:</p>
                                <ul className="space-y-2">
                                    {data.voice_metrics.feedback.map((fb, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            {fb}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-16 mb-12">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="px-8 py-4 rounded-full bg-secondary/80 backdrop-blur-md hover:bg-secondary border border-border font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {downloading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Download PDF Report
                    </motion.button>

                    <Link href="/setup">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
                        >
                            Start New Session <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
    const color = value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500";

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${color} rounded-full`}
                />
            </div>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading Report...</div>}>
            <ReportContent />
        </Suspense>
    );
}
