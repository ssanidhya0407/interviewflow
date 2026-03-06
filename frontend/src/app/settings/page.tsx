"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { getSettings, updateSettings, UserSettings } from "@/lib/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
    Clock,
    Globe,
    Bell,
    Palette,
    Loader2,
} from "lucide-react";
import clsx from "clsx";

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "hi", name: "हिंदी" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" }
];

export default function SettingsPage() {
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const { setTheme } = useTheme();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/auth/login");
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (isLoggedIn) {
            loadSettings();
        }
    }, [isLoggedIn]);

    const loadSettings = async () => {
        try {
            const data = await getSettings();
            setSettings(data);
            setTheme(data.theme);
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (updates: Partial<UserSettings>) => {
        if (!settings) return;

        try {
            await updateSettings(updates);
            setSettings({ ...settings, ...updates });
        } catch (error) {
            console.error("Failed to update settings:", error);
        }
    };

    if (authLoading || !isLoggedIn || isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pt-32">
            <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
                <section className="bg-card dark:bg-[#111] border border-border dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 mb-6">
                        <Palette className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Appearance</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                        </div>
                        <ThemeToggle />
                    </div>
                </section>

                <section className="bg-card dark:bg-[#111] border border-border dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 mb-6">
                        <Globe className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Language</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleUpdate({ language: lang.code })}
                                className={clsx(
                                    "px-4 py-3 rounded-xl text-sm font-medium transition-colors border",
                                    settings?.language === lang.code
                                        ? "bg-primary/10 text-primary border-primary"
                                        : "bg-secondary dark:bg-white/5 border-transparent hover:bg-secondary/80 dark:hover:bg-white/10"
                                )}
                            >
                                {lang.name}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="bg-card dark:bg-[#111] border border-border dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Interview Timer</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Enable Timer</p>
                                <p className="text-sm text-muted-foreground">Add time pressure to practice</p>
                            </div>
                            <button
                                onClick={() => handleUpdate({ enable_timer: !settings?.enable_timer })}
                                className={clsx(
                                    "w-12 h-7 rounded-full p-1 transition-colors",
                                    settings?.enable_timer ? "bg-primary" : "bg-secondary dark:bg-white/10"
                                )}
                            >
                                <motion.div
                                    className="w-5 h-5 rounded-full bg-white shadow"
                                    animate={{ x: settings?.enable_timer ? 20 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>

                        {settings?.enable_timer && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                            >
                                <p className="text-sm text-muted-foreground mb-3">Time per question (seconds)</p>
                                <div className="flex gap-2">
                                    {[60, 90, 120, 180, 300].map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => handleUpdate({ time_per_question: time })}
                                            className={clsx(
                                                "px-4 py-2 rounded-xl text-sm font-medium transition-colors border",
                                                settings?.time_per_question === time
                                                    ? "bg-primary/10 text-primary border-primary"
                                                    : "bg-secondary dark:bg-white/5 border-transparent hover:bg-secondary/80 dark:hover:bg-white/10"
                                            )}
                                        >
                                            {time < 60 ? `${time}s` : `${time / 60}m`}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </section>

                <section className="bg-card dark:bg-[#111] border border-border dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Notifications</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Email Reminders</p>
                                <p className="text-sm text-muted-foreground">Get reminded to practice</p>
                            </div>
                            <button
                                onClick={() => handleUpdate({ email_reminders: !settings?.email_reminders })}
                                className={clsx(
                                    "w-12 h-7 rounded-full p-1 transition-colors",
                                    settings?.email_reminders ? "bg-primary" : "bg-secondary dark:bg-white/10"
                                )}
                            >
                                <motion.div
                                    className="w-5 h-5 rounded-full bg-white shadow"
                                    animate={{ x: settings?.email_reminders ? 20 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>

                        {settings?.email_reminders && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                            >
                                <p className="text-sm text-muted-foreground mb-3">Frequency</p>
                                <div className="flex gap-2">
                                    {["daily", "weekly", "monthly"].map((freq) => (
                                        <button
                                            key={freq}
                                            onClick={() => handleUpdate({ reminder_frequency: freq })}
                                            className={clsx(
                                                "px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize border",
                                                settings?.reminder_frequency === freq
                                                    ? "bg-primary/10 text-primary border-primary"
                                                    : "bg-secondary dark:bg-white/5 border-transparent hover:bg-secondary/80 dark:hover:bg-white/10"
                                            )}
                                        >
                                            {freq}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
