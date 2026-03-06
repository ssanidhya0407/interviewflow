"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Edit2,
  FileText,
  Upload,
  X,
  Zap,
} from "lucide-react";

import { getSettings, startInterview } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const ROLES = ["Software Engineer", "Frontend", "Backend", "Full Stack", "Data Scientist", "Product Manager", "DevOps"];
const LEVELS = ["Intern", "Junior", "Mid-Level", "Senior", "Lead"];
const TYPES: Array<"Mixed" | "Behavioral" | "Technical" | "System Design"> = ["Mixed", "Behavioral", "Technical", "System Design"];
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
];

const STEPS = [
  { title: "Role", subtitle: "Pick your interview target." },
  { title: "Experience", subtitle: "Set your current level." },
  { title: "Style", subtitle: "Choose challenge mode." },
  { title: "Language", subtitle: "Choose interview language." },
  { title: "AI Context", subtitle: "Optional resume and JD context." },
  { title: "Summary", subtitle: "Review and begin." },
];

export default function SetupPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [config, setConfig] = useState({
    role: "Software Engineer",
    experience_level: "Mid-Level",
    interview_type: "Mixed" as "Mixed" | "Behavioral" | "Technical" | "System Design",
    resume_context: "",
    job_description: "",
    max_questions: 5,
    enable_timer: false,
    time_per_question: 120,
    language: "en",
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    getSettings()
      .then((settings) => {
        setConfig((prev) => ({
          ...prev,
          enable_timer: settings.enable_timer,
          time_per_question: settings.time_per_question,
          language: settings.language,
        }));
      })
      .catch((e) => console.error("Failed to load settings:", e));
  }, [isLoggedIn]);

  const currentLanguage = useMemo(() => {
    return LANGUAGES.find((l) => l.code === config.language) || LANGUAGES[0];
  }, [config.language]);

  const progress = STEPS.length > 1 ? (step / (STEPS.length - 1)) * 100 : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setConfig((prev) => ({ ...prev, resume_context: (event.target?.result as string) || "" }));
    };
    reader.readAsText(file);
  };

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const handleStart = async () => {
    if (!isLoggedIn) {
      localStorage.setItem("pendingSessionConfig", JSON.stringify(config));
      router.push("/auth/register?flow=setup");
      return;
    }

    setLoading(true);
    try {
      const data = await startInterview(config);
      if (typeof window !== "undefined" && data?.session_id && data?.message) {
        sessionStorage.setItem(`initialInterviewMessage:${data.session_id}`, data.message);
      }
      router.push(`/interview?session_id=${data.session_id}`);
    } catch {
      alert("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-20">
      <main className="max-w-7xl mx-auto px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Build Your <span className="text-blue-600">Interview Session</span>
          </h1>
        </header>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] gap-10 lg:gap-14">
          <aside className="lg:sticky lg:top-28 h-fit">
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-6">Step {step + 1} of {STEPS.length}</div>

            <div className="relative pl-10 pb-2">
              <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-border/80 rounded-full" />
              <motion.div
                className="absolute left-[15px] top-2 w-[2px] bg-blue-600 rounded-full"
                animate={{ height: `calc(${progress}% - 2px)` }}
                transition={{ type: "spring", stiffness: 180, damping: 24 }}
              />

              <div className="space-y-8">
                {STEPS.map((item, idx) => {
                  const isDone = idx < step;
                  const isActive = idx === step;

                  return (
                    <button
                      key={item.title}
                      onClick={() => setStep(idx)}
                      className="w-full text-left group"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{
                            scale: isActive ? 1.08 : 1,
                            backgroundColor: isDone ? "#16a34a" : isActive ? "#2563eb" : "#0f1115",
                            borderColor: isDone ? "#22c55e" : isActive ? "#3b82f6" : "#2a2e37",
                          }}
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          className="absolute -left-10 top-0 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold"
                        >
                          <motion.span
                            key={`${idx}-${step}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22 }}
                            className={clsx("text-white", !isDone && !isActive && "text-muted-foreground")}
                          >
                            {idx + 1}
                          </motion.span>
                        </motion.div>

                        <motion.div
                          animate={{ opacity: isActive || isDone ? 1 : 0.65, x: isActive ? 3 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={clsx("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.subtitle}</div>
                        </motion.div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-h-[520px]"
              >
                <div className="mb-7">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{STEPS[step].title}</h2>
                  <p className="text-muted-foreground">{STEPS[step].subtitle}</p>
                </div>

                {step === 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ROLES.map((role) => (
                      <ChoiceButton
                        key={role}
                        active={config.role === role}
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, role }));
                          goNext();
                        }}
                      >
                        {role}
                      </ChoiceButton>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {LEVELS.map((level) => (
                      <ChoiceButton
                        key={level}
                        active={config.experience_level === level}
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, experience_level: level }));
                          goNext();
                        }}
                      >
                        {level}
                      </ChoiceButton>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-2 gap-3">
                    {TYPES.map((type) => (
                      <ChoiceButton
                        key={type}
                        active={config.interview_type === type}
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, interview_type: type }));
                          goNext();
                        }}
                      >
                        {type}
                      </ChoiceButton>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.map((lang) => (
                      <ChoiceButton
                        key={lang.code}
                        active={config.language === lang.code}
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, language: lang.code }));
                          goNext();
                        }}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </ChoiceButton>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-[10px] font-semibold uppercase tracking-[0.14em] mb-4">
                      <Zap className="w-3.5 h-3.5" /> Optional
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                          <FileText className="w-4 h-4 text-blue-400" /> Resume
                        </div>

                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.pdf,.doc,.docx" className="hidden" />

                        {resumeFile ? (
                          <div className="rounded-xl border border-border/60 bg-card/80 p-3 flex items-center justify-between min-h-[88px]">
                            <span className="text-sm truncate">{resumeFile.name}</span>
                            <button
                              onClick={() => {
                                setResumeFile(null);
                                setConfig((prev) => ({ ...prev, resume_context: "" }));
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full rounded-xl border border-dashed border-border/70 h-24 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                          >
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-xs">Upload Resume</span>
                          </button>
                        )}
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                          <Briefcase className="w-4 h-4 text-emerald-400" /> Job Description
                        </div>
                        <textarea
                          value={config.job_description}
                          onChange={(e) => setConfig((prev) => ({ ...prev, job_description: e.target.value }))}
                          placeholder="Paste the job description here..."
                          className="w-full h-24 rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm resize-none outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <div className="rounded-2xl border border-border/60 bg-background/60 divide-y divide-border/60 mb-7">
                      <SummaryRow label="Role" value={config.role} onEdit={() => setStep(0)} />
                      <SummaryRow label="Experience" value={config.experience_level} onEdit={() => setStep(1)} />
                      <SummaryRow label="Style" value={config.interview_type} onEdit={() => setStep(2)} />
                      <SummaryRow label="Language" value={`${currentLanguage.flag} ${currentLanguage.name}`} onEdit={() => setStep(3)} />
                      {(resumeFile || config.job_description) && (
                        <SummaryRow
                          label="AI Context"
                          value={`${resumeFile ? "Resume" : ""}${resumeFile && config.job_description ? " + " : ""}${config.job_description ? "JD" : ""}`}
                          onEdit={() => setStep(4)}
                        />
                      )}
                    </div>

                    <button
                      onClick={handleStart}
                      disabled={loading}
                      className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? "Starting..." : "Begin Interview"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {step < 5 && (
                  <div className="mt-10 pt-6 border-t border-border/60 flex items-center justify-between">
                    <button
                      onClick={goPrev}
                      disabled={step === 0}
                      className="h-10 px-4 rounded-full border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 inline-flex items-center gap-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <button
                      onClick={goNext}
                      className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2"
                    >
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </main>
    </div>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "h-14 rounded-2xl border transition-colors px-4 text-sm font-medium flex items-center justify-center gap-2",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-secondary/60 dark:bg-[#111] border-border/50 text-foreground hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
      <button onClick={onEdit} className="w-8 h-8 rounded-full border border-border/60 bg-card/70 hover:bg-card flex items-center justify-center">
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
