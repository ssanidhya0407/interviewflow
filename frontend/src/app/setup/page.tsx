"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startInterview, getSettings } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ArrowRight, Edit2, Check, FileText, Briefcase, Zap, Upload, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import clsx from "clsx";

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
    { code: "ja", name: "日本語", flag: "🇯🇵" }
];

export default function SetupPage() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [config, setConfig] = useState({
        role: "Software Engineer",
        experience_level: "Mid-Level",
        interview_type: "Mixed" as "Mixed" | "Behavioral" | "Technical" | "System Design",
        resume_context: "",
        job_description: "",
        max_questions: 5,
        enable_timer: false,
        time_per_question: 120,
        language: "en"
    });

    useEffect(() => {
        if (isLoggedIn) {
            getSettings().then(settings => {
                setConfig(prev => ({
                    ...prev,
                    enable_timer: settings.enable_timer,
                    time_per_question: settings.time_per_question,
                    language: settings.language
                }));
            }).catch(e => console.error("Failed to load settings:", e));
        }
    }, [isLoggedIn]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResumeFile(file);
            // Read file content for context
            const reader = new FileReader();
            reader.onload = (event) => {
                setConfig({ ...config, resume_context: event.target?.result as string || "" });
            };
            reader.readAsText(file);
        }
    };

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

    const STEPS = ["Role", "Level", "Style", "Language", "AI Context", "Summary"];

    const CardWrapper = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
        <div className={clsx("bg-card dark:bg-[#0C0C0C] rounded-[40px] border border-border dark:border-white/5 p-10 shadow-sm dark:shadow-none", className)}>
            {children}
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 transition-colors duration-300 pt-32">

            {/* Progress Pill - Moved down below navbar */}
            <div className="fixed top-28 left-1/2 -translate-x-1/2 z-40 bg-background/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full px-4 py-2 text-sm font-medium border border-border dark:border-white/10 flex items-center gap-3 shadow-sm">
                <span className="text-muted-foreground">Step</span>
                <span className="text-foreground">{step + 1}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{STEPS.length}</span>
            </div>

            {/* Back Button */}
            {
                step > 0 && (
                    <button onClick={() => setStep(s => s - 1)} className="fixed top-8 left-6 z-50 p-2 text-muted-foreground hover:text-foreground transition-colors bg-background/50 rounded-full border border-border/50 dark:border-white/5">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )
            }

            <main className="w-full max-w-2xl mt-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        {/* Step 0: Role */}
                        {step === 0 && (
                            <CardWrapper>
                                <h1 className="text-3xl font-bold mb-2 text-center text-foreground">Target Role</h1>
                                <p className="text-muted-foreground text-base mb-8 text-center">What job are you interviewing for?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {ROLES.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => { setConfig({ ...config, role }); setStep(1); }}
                                            className={clsx(
                                                "p-5 rounded-2xl text-base font-medium transition-all text-center border",
                                                config.role === role
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-secondary dark:bg-[#111] text-muted-foreground hover:bg-secondary/80 dark:hover:bg-[#1a1a1a] border-transparent dark:border-white/5"
                                            )}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </CardWrapper>
                        )}

                        {/* Step 1: Level */}
                        {step === 1 && (
                            <CardWrapper>
                                <h1 className="text-3xl font-bold mb-2 text-center text-foreground">Experience</h1>
                                <p className="text-muted-foreground text-base mb-8 text-center">What's your seniority?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {LEVELS.map(level => (
                                        <button
                                            key={level}
                                            onClick={() => { setConfig({ ...config, experience_level: level }); setStep(2); }}
                                            className={clsx(
                                                "p-5 rounded-2xl text-base font-medium transition-all text-center flex items-center justify-center gap-2 border",
                                                config.experience_level === level
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-secondary dark:bg-[#111] text-muted-foreground hover:bg-secondary/80 dark:hover:bg-[#1a1a1a] border-transparent dark:border-white/5"
                                            )}
                                        >
                                            {level}
                                            {config.experience_level === level && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </CardWrapper>
                        )}

                        {/* Step 2: Style */}
                        {step === 2 && (
                            <CardWrapper>
                                <h1 className="text-3xl font-bold mb-2 text-center text-foreground">Interview Style</h1>
                                <p className="text-muted-foreground text-base mb-8 text-center">How should we challenge you?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {TYPES.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => { setConfig({ ...config, interview_type: type }); setStep(3); }}
                                            className={clsx(
                                                "p-5 rounded-2xl text-base font-medium transition-all text-center border",
                                                config.interview_type === type
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-secondary dark:bg-[#111] text-muted-foreground hover:bg-secondary/80 dark:hover:bg-[#1a1a1a] border-transparent dark:border-white/5"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </CardWrapper>
                        )}

                        {/* Step 3: Language */}
                        {step === 3 && (
                            <CardWrapper>
                                <h1 className="text-3xl font-bold mb-2 text-center text-foreground">Language</h1>
                                <p className="text-muted-foreground text-base mb-8 text-center">Choose your interview language</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { setConfig({ ...config, language: lang.code }); setStep(4); }}
                                            className={clsx(
                                                "p-5 rounded-2xl text-base font-medium transition-all text-center border flex items-center justify-center gap-3",
                                                config.language === lang.code
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-secondary dark:bg-[#111] text-muted-foreground hover:bg-secondary/80 dark:hover:bg-[#1a1a1a] border-transparent dark:border-white/5"
                                            )}
                                        >
                                            <span className="text-xl">{lang.flag}</span>
                                            <span>{lang.name}</span>
                                            {config.language === lang.code && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </CardWrapper>
                        )}

                        {/* Step 4: AI Context (Optional) */}
                        {step === 4 && (
                            <CardWrapper>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Zap className="w-6 h-6 text-purple-500" />
                                    <h1 className="text-3xl font-bold text-foreground">AI Context</h1>
                                </div>
                                <p className="text-muted-foreground text-base mb-8 text-center">Optional: Personalize your interview</p>

                                <div className="space-y-4 mb-6">
                                    {/* Resume Upload */}
                                    <div className="bg-secondary dark:bg-[#111] rounded-2xl p-5 border border-transparent dark:border-white/5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm font-medium text-foreground">Resume</span>
                                        </div>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept=".txt,.pdf,.doc,.docx"
                                            className="hidden"
                                        />

                                        {resumeFile ? (
                                            <div className="flex items-center justify-between bg-background/50 dark:bg-black/50 rounded-lg p-3 border border-border dark:border-white/10">
                                                <span className="text-sm text-foreground truncate">{resumeFile.name}</span>
                                                <button onClick={() => { setResumeFile(null); setConfig({ ...config, resume_context: "" }); }} className="text-muted-foreground hover:text-foreground">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full h-20 border-2 border-dashed border-border dark:border-white/10 rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                                            >
                                                <Upload className="w-5 h-5" />
                                                <span className="text-xs">Upload Resume</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Job Description */}
                                    <div className="bg-secondary dark:bg-[#111] rounded-2xl p-5 border border-transparent dark:border-white/5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Briefcase className="w-4 h-4 text-green-500" />
                                            <span className="text-sm font-medium text-foreground">Job Description</span>
                                        </div>
                                        <textarea
                                            value={config.job_description}
                                            onChange={(e) => setConfig({ ...config, job_description: e.target.value })}
                                            placeholder="Paste the job description here..."
                                            className="w-full h-20 bg-background/50 dark:bg-black/50 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none border border-border dark:border-white/5 focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(5)}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
                                >
                                    Continue
                                </button>
                                <button
                                    onClick={() => setStep(5)}
                                    className="w-full py-3 text-muted-foreground text-sm mt-2 hover:text-foreground transition-colors"
                                >
                                    Skip for now
                                </button>
                            </CardWrapper>
                        )}

                        {/* Step 5: Summary */}
                        {step === 5 && (
                            <CardWrapper>
                                <h1 className="text-3xl font-bold mb-2 text-center text-foreground">Summary</h1>
                                <p className="text-muted-foreground text-base mb-8 text-center">Review your configuration.</p>

                                <div className="bg-secondary dark:bg-[#111] rounded-2xl divide-y divide-border dark:divide-white/5 mb-8 border border-transparent dark:border-white/5">
                                    <div className="p-5 flex justify-between items-center">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Role</div>
                                            <div className="text-base font-medium text-foreground">{config.role}</div>
                                        </div>
                                        <button onClick={() => setStep(0)} className="p-2 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="p-5 flex justify-between items-center">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Level</div>
                                            <div className="text-base font-medium text-foreground">{config.experience_level}</div>
                                        </div>
                                        <button onClick={() => setStep(1)} className="p-2 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Style</div>
                                            <div className="text-sm font-medium text-foreground">{config.interview_type}</div>
                                        </div>
                                        <button onClick={() => setStep(2)} className="p-2 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Language</div>
                                            <div className="text-sm font-medium text-foreground">
                                                {LANGUAGES.find(l => l.code === config.language)?.flag} {LANGUAGES.find(l => l.code === config.language)?.name || 'English'}
                                            </div>
                                        </div>
                                        <button onClick={() => setStep(3)} className="p-2 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                    {(resumeFile || config.job_description) && (
                                        <div className="p-4 flex justify-between items-center">
                                            <div>
                                                <div className="text-xs text-muted-foreground">AI Context</div>
                                                <div className="text-sm font-medium text-purple-500">
                                                    {resumeFile ? "Resume" : ""}{resumeFile && config.job_description ? " + " : ""}{config.job_description ? "JD" : ""} added
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(4)} className="p-2 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleStart}
                                    disabled={loading}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {loading ? "Starting..." : "Begin Interview"} <ArrowRight className="w-4 h-4" />
                                </button>
                            </CardWrapper>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div >
    );
}
