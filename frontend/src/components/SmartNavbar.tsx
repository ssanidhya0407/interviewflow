"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { LayoutDashboard, Settings, LogOut, History, UserPlus, LogIn, Sparkles } from "lucide-react";

export function SmartNavbar() {
    const pathname = usePathname();
    const { isLoggedIn, logout } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 140);
    });

    if (!pathname) return null;

    const hideOnRoutes = ["/interview"];
    if (hideOnRoutes.some(route => pathname.startsWith(route))) {
        return null;
    }

    const isEntryFlow = pathname === "/" || pathname.startsWith("/auth");
    const isExpanded = isHovered || !isScrolled;
    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    const appItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Setup", href: "/setup", icon: Sparkles },
        { name: "History", href: "/history", icon: History }
    ];

    return (
        <motion.nav className="fixed top-8 inset-x-0 z-50 flex justify-center pointer-events-none">
            <motion.div
                layout
                className="pointer-events-auto bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-border dark:border-white/10 rounded-full shadow-2xl flex items-center p-2 gap-2"
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <motion.div
                    layoutId="brand-logo"
                    className="flex items-center gap-2 px-4"
                    transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
                >
                    <Link
                        href="/"
                        className="inline-block pb-[2px] text-[18px] font-bold tracking-[0.02em] bg-gradient-to-b from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent drop-shadow-sm transition-colors duration-300"
                    >
                        InterviewFlow
                    </Link>
                </motion.div>

                <AnimatePresence mode="popLayout">
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center gap-1"
                        >
                            {isEntryFlow ? (
                                <>
                                    <Link
                                        href="/"
                                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${isActive("/") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href="/setup"
                                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${isActive("/setup") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                                    >
                                        Start
                                    </Link>
                                </>
                            ) : (
                                appItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${isActive(item.href) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                                    >
                                        {item.name}
                                    </Link>
                                ))
                            )}

                            <div className="w-px h-6 bg-border mx-2" />

                            {isLoggedIn ? (
                                <>
                                    <Link
                                        href="/settings"
                                        className={`p-2 rounded-full transition-colors ${isActive("/settings") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                                        title="Settings"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className={`p-2 rounded-full transition-colors ${isActive("/auth/login") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                                        title="Login"
                                    >
                                        <LogIn className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${isActive("/auth/register") ? "bg-secondary text-foreground" : "bg-foreground text-background hover:opacity-90"}`}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <UserPlus className="w-4 h-4" />
                                            Sign Up
                                        </span>
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.nav>
    );
}
