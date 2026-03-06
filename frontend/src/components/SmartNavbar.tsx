"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { LogOut, LayoutDashboard, Settings, Menu, Sparkles, History } from "lucide-react";

export function SmartNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, logout } = useAuth();
    const [isHoverExpanded, setIsHoverExpanded] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();
    const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 150) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    });

    const isEntryFlow = pathname === "/" || pathname?.startsWith("/auth");

    const clearCollapseTimer = () => {
        if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
        }
    };

    const handleMouseEnter = () => {
        clearCollapseTimer();
        setIsHoverExpanded(true);
    };

    const handleMouseLeave = () => {
        clearCollapseTimer();
        collapseTimerRef.current = setTimeout(() => {
            setIsHoverExpanded(false);
        }, 140);
    };

    useEffect(() => {
        return () => {
            clearCollapseTimer();
        };
    }, []);

    const isExpanded = !isScrolled || isHoverExpanded;

    const authenticatedItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Setup Interview", href: "/setup", icon: Sparkles },
        { name: "History", href: "/history", icon: History }
    ];

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

    const handleBrandClick = () => {
        if (isLoggedIn) {
            router.push("/?next=dashboard");
            return;
        }
        router.push("/");
    };

    return (
        <motion.nav className="fixed top-8 inset-x-0 z-50 flex justify-center pointer-events-none">
            <motion.div
                layout
                className="pointer-events-auto bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-border dark:border-white/10 rounded-full shadow-2xl flex items-center"
                animate={{
                    paddingLeft: isExpanded ? 8 : 10,
                    paddingRight: isExpanded ? 8 : 10,
                    paddingTop: isExpanded ? 8 : 9,
                    paddingBottom: isExpanded ? 8 : 9,
                    gap: isExpanded ? 8 : 2
                }}
                transition={{ type: "spring", stiffness: 340, damping: 28, mass: 0.7 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <motion.div
                    layoutId="brand-logo"
                    className="flex items-center gap-2 px-4 cursor-pointer"
                    onClick={handleBrandClick}
                    transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
                >
                    <span className="inline-block pb-[2px] text-[18px] font-bold tracking-[0.02em] bg-gradient-to-b from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent drop-shadow-sm transition-colors duration-300">
                        InterviewFlow
                    </span>
                </motion.div>

                <AnimatePresence mode="wait" initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, width: 0, filter: "blur(2px)" }}
                            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
                            exit={{ opacity: 0, width: 0, filter: "blur(1px)" }}
                            transition={{
                                width: { type: "spring", stiffness: 320, damping: 30, mass: 0.7 },
                                opacity: { duration: 0.18, ease: "easeOut" },
                                filter: { duration: 0.16, ease: "easeOut" }
                            }}
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
                                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${isActive("/setup") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                                    >
                                        Setup Interview
                                    </Link>
                                    {!isLoggedIn && (
                                        <Link
                                            href="/auth/register"
                                            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${isActive("/auth/register") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                                        >
                                            Sign Up
                                        </Link>
                                    )}
                                </>
                            ) : (
                                authenticatedItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${isActive(item.href)
                                            ? "bg-secondary text-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                            }`}
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
                                        className={`p-2 rounded-full transition-colors ${isActive("/settings") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                            }`}
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
                            ) : pathname !== "/auth/login" ? (
                                <Link
                                    href="/auth/login"
                                    className="px-6 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
                                >
                                    Login
                                </Link>
                            ) : (
                                <div className="px-6 py-2 bg-secondary text-foreground rounded-full text-sm font-bold opacity-50 cursor-default">
                                    Login
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isExpanded && (
                    <motion.div
                        key="collapsed-indicator"
                        initial={{ opacity: 0, scale: 0.86, y: 2 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 1 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="px-3"
                    >
                        <Menu className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                )}
            </motion.div>
        </motion.nav>
    );
}
