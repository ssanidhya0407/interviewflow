"use client";

import { Suspense, useMemo, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle,
  Download,
  Loader2,
  MessageSquare,
  Mic,
  Trophy,
  Volume2,
} from "lucide-react";

import { exportPDF, FeedbackData, getFeedback } from "@/lib/api";

type RingStat = {
  key: "communication" | "technical" | "problem_solving" | "culture_fit";
  label: string;
  value: number;
  color: string;
  hint: string;
};

function ReportContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    getFeedback(sessionId)
      .then((res) => setData(typeof res === "string" ? JSON.parse(res) : res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const rings = useMemo<RingStat[]>(() => {
    if (!data) return [];
    return [
      {
        key: "communication",
        label: "Communication",
        value: clamp(data.communication_score || 0),
        color: "#ff0a78",
        hint: "Clarity and articulation",
      },
      {
        key: "technical",
        label: "Technical",
        value: clamp(data.technical_score || 0),
        color: "#b6ff00",
        hint: "Depth and correctness",
      },
      {
        key: "problem_solving",
        label: "Problem Solving",
        value: clamp(data.problem_solving_score || 0),
        color: "#23e9de",
        hint: "Approach and reasoning",
      },
      {
        key: "culture_fit",
        label: "Culture Fit",
        value: clamp(data.culture_fit_score || 0),
        color: "#ffa31a",
        hint: "Team alignment and ownership",
      },
    ];
  }, [data]);

  const handleDownloadPDF = async () => {
    if (!sessionId) return;
    setDownloading(true);
    try {
      const blob = await exportPDF(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm uppercase tracking-widest">Generating analysis</p>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Failed to load report.</div>;
  }

  const categoryScores = [
    { label: "Communication", value: data.communication_score || 0 },
    { label: "Technical Knowledge", value: data.technical_score || 0 },
    { label: "Problem Solving", value: data.problem_solving_score || 0 },
    { label: "Culture Fit", value: data.culture_fit_score || 0 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-6">
        <header className="relative rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8 md:p-10 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold bg-yellow-500/10 text-yellow-400 mb-4">
                <Trophy className="w-3.5 h-3.5" /> Interview Complete
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-2">Performance Report</h1>
              <p className="text-muted-foreground max-w-2xl">A structured breakdown of your latest session with actionable next steps.</p>
            </div>
            <div className="text-right text-xs text-muted-foreground uppercase tracking-widest">
              <div className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date().toLocaleDateString()}</div>
              <div className="mt-2">Session {sessionId?.slice(0, 8)}</div>
            </div>
          </div>

          <div className="hidden md:flex absolute right-8 bottom-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-2 backdrop-blur-sm">
              <div className="w-7 h-7 flex items-center justify-center">
                <FitnessRings stats={rings} size={24} stroke={12} />
              </div>
              {rings.map((ring) => (
                <div key={ring.key} className="w-7 h-7 flex items-center justify-center">
                  <FitnessRings stats={[ring]} size={24} stroke={12} />
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8 flex flex-col items-center justify-center text-center min-h-[260px]">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-5">Overall Score</p>
            <div className={`text-7xl font-bold tracking-tight leading-none ${getScoreTone(data.score)}`}>{data.score}</div>
            <div className="text-muted-foreground mt-2">/100 overall</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2 min-h-[260px] rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-3">Executive Summary</h3>
            <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
          </motion.div>
        </section>

        <section className="rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8">
          <h3 className="text-xl font-semibold mb-6">Category Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-5">
              {categoryScores.map((item) => (
                <ScoreBar key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold">Clustered View</div>
                <div className="text-xs text-muted-foreground">All 4 dimensions</div>
              </div>
              <div className="flex justify-center py-4">
                <FitnessRings stats={rings} size={140} stroke={10} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8">
            <h3 className="text-xl font-semibold mb-5 flex items-center gap-2 text-emerald-400"><Award className="w-5 h-5" />Key Strengths</h3>
            <ul className="space-y-3">
              {data.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5"><CheckCircle className="w-4 h-4 text-emerald-400" /></div>
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8">
            <h3 className="text-xl font-semibold mb-5 flex items-center gap-2 text-amber-400"><AlertCircle className="w-5 h-5" />Areas to Improve</h3>
            <ul className="space-y-3">
              {data.improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5"><div className="w-2 h-2 rounded-full bg-amber-400" /></div>
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {data.improvement_tips && data.improvement_tips.length > 0 && (
          <section className="rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8">
            <h3 className="text-xl font-semibold mb-5">Action Plan</h3>
            <ol className="space-y-3">
              {data.improvement_tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-semibold shrink-0">{i + 1}</span>
                  <span className="text-sm text-foreground/90 pt-1">{tip}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {data.voice_metrics && (
          <section className="rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8">
            <h3 className="text-xl font-semibold mb-5 flex items-center gap-2"><Mic className="w-5 h-5 text-blue-400" />Speaking Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <MetricCard label="Pace" value={data.voice_metrics.pace_rating} />
              <MetricCard label="WPM" value={data.voice_metrics.words_per_minute.toString()} />
              <MetricCard label="Filler" value={data.voice_metrics.filler_word_count.toString()} />
              <MetricCard label="Confidence" value={`${data.voice_metrics.confidence_score}%`} />
            </div>

            {data.voice_metrics.feedback && data.voice_metrics.feedback.length > 0 && (
              <ul className="space-y-2">
                {data.voice_metrics.feedback.map((fb, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-blue-400" />
                    {fb}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {data.transcript && data.transcript.length > 0 && (
          <section className="rounded-[32px] border border-border/60 bg-card dark:bg-[#0C0C0C] p-8">
            <h3 className="text-xl font-semibold mb-5 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-400" />Interview Transcript</h3>
            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-2">
              {data.transcript.map((msg, i) => {
                if (msg.role === "system") return null;
                const isUser = msg.role === "user";
                const audioUrl = data.audio_urls && data.audio_urls[i.toString()];
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 border ${isUser ? "bg-blue-500/10 border-blue-500/20" : "bg-background/70 border-border/60"}`}>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{isUser ? "You" : "Interviewer"}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {isUser && audioUrl && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="inline-flex items-center gap-1.5 text-xs text-blue-400 mb-2"><Volume2 className="w-3.5 h-3.5" /> Recording</div>
                          <audio controls className="w-full h-8">
                            <source src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${audioUrl}`} type="audio/webm" />
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="h-12 px-6 rounded-full border border-border/60 bg-card/70 hover:bg-card transition-colors font-semibold inline-flex items-center justify-center gap-2"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PDF
          </button>

          <Link href="/setup" className="h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            Start New Session <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getScoreTone(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-rose-400";
}

function FitnessRings({ stats, size = 52, stroke = 10 }: { stats: RingStat[]; size?: number; stroke?: number }) {
  const center = 50;
  const rings = stats.slice(0, 4);
  const ringRadii = [42, 32, 22, 12];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-[104deg]">
      {rings.map((ring, index) => {
        const radius = ringRadii[index] ?? (42 - index * 12);
        if (radius <= 0) return null;

        const progress = ring.value / 100;
        const circumference = 2 * Math.PI * radius;

        return (
          <g key={ring.key}>
            <circle cx={center} cy={center} r={radius} fill="none" stroke={ring.color} strokeWidth={stroke} opacity={0.28} />
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

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className={`h-full ${color}`} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-3 text-center">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading report...</div>}>
      <ReportContent />
    </Suspense>
  );
}
