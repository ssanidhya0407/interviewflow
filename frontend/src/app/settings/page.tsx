"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  Bell,
  Check,
  Clock,
  Globe,
  Loader2,
  Palette,
  User,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getSettings, updateSettings, UserSettings } from "@/lib/api";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "hi", name: "हिंदी" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const { setTheme } = useTheme();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/auth/login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;

    getSettings()
      .then((data) => {
        setSettings(data);
        setTheme(data.theme);
      })
      .catch((error) => console.error("Failed to load settings:", error))
      .finally(() => setIsLoading(false));
  }, [isLoggedIn, setTheme]);

  const handleUpdate = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await updateSettings(updates);
      setSettings((prev) => (prev ? { ...prev, ...updates } : prev));
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !isLoggedIn || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 pt-32 pb-20 px-6">
      <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <header className="mb-12 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground mb-3">
              Settings <span className="text-blue-500">Preferences</span>
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Customize your InterviewFlow experience, language, timer behavior, and reminders.
            </p>
          </div>

          <div className="hidden md:block">
            {saved ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-bold">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Saved
              </div>
            ) : isSaving ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving
              </div>
            ) : null}
          </div>
        </header>

        <div className="space-y-8">
          <section className="bg-card/50 dark:bg-[#0C0C0C] border border-border dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0">
                <User className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">Profile</h2>
                <p className="text-muted-foreground mb-6">Your account identity in InterviewFlow.</p>

                <div className="p-6 rounded-2xl bg-secondary/50 dark:bg-white/5 border border-border dark:border-white/5 space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Name</div>
                    <div className="text-base font-medium text-foreground">{user?.full_name || "Not set"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Email</div>
                    <div className="text-sm font-mono text-foreground/80">{user?.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card/50 dark:bg-[#0C0C0C] border border-border dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Palette className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">Appearance</h2>
                <p className="text-muted-foreground mb-8">Switch between light and dark mode.</p>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-secondary/50 dark:bg-white/5 border border-border dark:border-white/5">
                  <div>
                    <div className="font-bold text-foreground mb-1">Theme</div>
                    <div className="text-sm text-muted-foreground">Personalize your interface mode</div>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card/50 dark:bg-[#0C0C0C] border border-border dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-sm">
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <Globe className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">Language</h2>
                <p className="text-muted-foreground mb-8">Choose your interview language.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleUpdate({ language: lang.code })}
                      className={clsx(
                        "px-4 py-4 rounded-2xl text-sm font-bold transition-all border text-left",
                        settings?.language === lang.code
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                          : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{lang.code}</div>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card/50 dark:bg-[#0C0C0C] border border-border dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-sm">
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
                <Clock className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-foreground">Interview Timer</h2>
                  <ToggleSwitch enabled={!!settings?.enable_timer} onChange={() => handleUpdate({ enable_timer: !settings?.enable_timer })} />
                </div>
                <p className="text-muted-foreground mb-8">Enable timed questions to simulate real interview pressure.</p>

                {settings?.enable_timer && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Time Per Question</div>
                    <div className="flex flex-wrap gap-3">
                      {[60, 90, 120, 180, 300].map((time) => (
                        <button
                          key={time}
                          onClick={() => handleUpdate({ time_per_question: time })}
                          className={clsx(
                            "px-5 py-3 rounded-xl text-sm font-bold transition-all border",
                            settings?.time_per_question === time
                              ? "bg-violet-500/10 text-violet-400 border-violet-500/50"
                              : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          {time < 60 ? `${time}s` : `${time / 60}m`}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-card/50 dark:bg-[#0C0C0C] border border-border dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-sm">
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                <Bell className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-foreground">Email Reminders</h2>
                  <ToggleSwitch enabled={!!settings?.email_reminders} onChange={() => handleUpdate({ email_reminders: !settings?.email_reminders })} />
                </div>
                <p className="text-muted-foreground mb-8">Receive reminders to keep your interview practice consistent.</p>

                {settings?.email_reminders && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Frequency</div>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                        { value: "monthly", label: "Monthly" },
                      ].map((freq) => (
                        <button
                          key={freq.value}
                          onClick={() => handleUpdate({ reminder_frequency: freq.value })}
                          className={clsx(
                            "px-5 py-3 rounded-xl text-sm font-bold transition-all border",
                            settings?.reminder_frequency === freq.value
                              ? "bg-green-500/10 text-green-400 border-green-500/50"
                              : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </section>
        </div>
      </motion.main>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={enabled} onChange={onChange} />
      <div className="w-11 h-6 bg-secondary dark:bg-neutral-800 rounded-full peer-checked:bg-blue-500 transition-colors" />
      <motion.div
        className="absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
      <span className="sr-only">Toggle</span>
      {enabled && <Check className="absolute right-1.5 w-3 h-3 text-white pointer-events-none" />}
    </label>
  );
}
