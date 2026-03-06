"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, BrainCircuit,
  Briefcase, Zap, CheckCircle2
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/components/AuthProvider";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading } = useAuth();
  const [introStage, setIntroStage] = useState<"liquid" | "complete">("liquid");
  const nextRoute = searchParams.get("next");

  useEffect(() => {
    const wantsDashboard = nextRoute === "dashboard";
    if (wantsDashboard && isLoading) {
      return;
    }

    const shouldGoDashboard = wantsDashboard && isLoggedIn;
    const timer = setTimeout(() => {
      if (shouldGoDashboard) {
        router.replace("/dashboard");
        return;
      }
      setIntroStage("complete");
    }, 2300);
    return () => clearTimeout(timer);
  }, [isLoading, isLoggedIn, nextRoute, router]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">

      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(circle,rgba(0,112,243,0.15)_0%,rgba(0,0,0,0)_70%)] blur-[60px]" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(circle,rgba(0,112,243,0.1)_0%,rgba(0,0,0,0)_70%)] blur-[80px]" />
      </div>



      <AnimatePresence>
        {introStage === "liquid" && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-[80] bg-background flex items-center justify-center"
          >
            <div className="relative h-32 md:h-44 flex items-center justify-center">
              <svg className="w-[760px] max-w-[90vw] h-full" viewBox="0 0 640 170" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <mask id="interviewFlowLiquidMask">
                    <text x="50%" y="50%" dy=".34em" textAnchor="middle" className="text-7xl md:text-8xl font-bold fill-white tracking-tighter">
                      InterviewFlow
                    </text>
                  </mask>
                  <linearGradient id="interviewFlowLiquidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" className="[stop-color:theme(colors.blue.400)] dark:[stop-color:theme(colors.blue.500)]" />
                    <stop offset="100%" className="[stop-color:theme(colors.blue.600)] dark:[stop-color:theme(colors.blue.700)]" />
                  </linearGradient>
                </defs>
                <text x="50%" y="50%" dy=".34em" textAnchor="middle" className="text-7xl md:text-8xl font-bold fill-black/[0.04] dark:fill-white/[0.05] tracking-tighter">
                  InterviewFlow
                </text>
                <g mask="url(#interviewFlowLiquidMask)">
                  <motion.rect
                    initial={{ height: 0, y: 170 }}
                    animate={{ height: 170, y: 0 }}
                    transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                    x="0"
                    width="640"
                    fill="url(#interviewFlowLiquidGrad)"
                    fillOpacity="0.92"
                  />
                  <motion.path
                    d="M0 25 C 70 7, 140 43, 210 25 C 280 7, 350 43, 420 25 C 490 7, 560 43, 640 25 V170 H0 Z"
                    fill="rgba(59,130,246,0.35)"
                    initial={{ y: 140 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </g>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 flex flex-col items-center text-center max-w-4xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tight mb-6 leading-[1.05] text-foreground">
            Interview. <br />
            <span className="text-muted-foreground">Redefined.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl font-medium text-muted-foreground mb-12 max-w-xl leading-relaxed"
        >
          Pro-level AI coaching tailored to your story.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-5"
        >
          <Link href="/setup">
            <button className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_-5px_var(--primary)] opacity-90">
              Start Practice
            </button>
          </Link>
          <Link href="#features">
            <button className="px-8 py-4 bg-secondary dark:bg-[#111] text-blue-500 rounded-full font-semibold text-lg hover:bg-secondary/80 dark:hover:bg-[#1a1a1a] transition-colors border border-border dark:border-white/5">
              Learn more
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Bento Grid Features - 2:1 -> 1:2 -> 1 Rhythm */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* --- ROW 1 (2:1) --- */}

          {/* Card 1: Bridging Resume (2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-card dark:bg-[#0C0C0C] rounded-[40px] p-10 flex flex-col justify-between min-h-[400px] border border-border dark:border-white/5 relative group overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-secondary dark:bg-[#111] mb-6 border border-border dark:border-white/10 overflow-hidden flex items-center justify-center">
                <Logo className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-card-foreground">
                Bridging Resume & <br /> Job Description
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                We map your experience directly to the target role's requirements using an advanced knowledge graph.
              </p>
            </div>

            {/* Bottom Stats used to be here, keep simple now? or restore? Restoring simplified stats to fill space */}
            <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border dark:border-white/5">
              <div>
                <div className="text-2xl font-bold text-foreground">5+</div>
                <div className="text-[10px] font-bold text-muted-foreground tracking-wider">FORMATS</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">25+</div>
                <div className="text-[10px] font-bold text-muted-foreground tracking-wider">METRICS</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">98%</div>
                <div className="text-[10px] font-bold text-muted-foreground tracking-wider">MATCH</div>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 w-full h-full bg-gradient-to-t from-primary/5 to-transparent opacity-50 pointer-events-none" />
          </motion.div>

          {/* Card 2: Core Features (1 col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1 bg-card dark:bg-[#0C0C0C] rounded-[40px] p-8 flex flex-col border border-border dark:border-white/5 relative shadow-sm dark:shadow-none"
          >
            <div className="w-12 h-12 rounded-full bg-secondary dark:bg-[#151515] flex items-center justify-center text-green-500 mb-6">
              <BrainCircuit className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold mb-2">Core Features</h3>
            <p className="text-muted-foreground text-sm mb-6">Top tools for your success.</p>

            <div className="flex-1 space-y-3">
              {[
                { title: "Resume Parsing" },
                { title: "Speech Analysis" },
                { title: "Panel Simulation" },
                { title: "Detailed Reports" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary dark:bg-[#111] border border-border dark:border-white/5">
                  <span className="font-semibold text-sm text-foreground">{item.title}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500/80" />
                </div>
              ))}
            </div>
          </motion.div>


          {/* --- ROW 2 (1:2) --- */}

          {/* Card 3: Experience (1 col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-1 bg-card dark:bg-[#0C0C0C] rounded-[40px] p-8 border border-border dark:border-white/5 hover:bg-secondary/50 dark:hover:bg-[#111] transition-colors group shadow-sm dark:shadow-none flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-full bg-secondary dark:bg-[#151515] flex items-center justify-center mb-6">
                <Briefcase className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real Experience</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simulate interviews from top tech firms.
              </p>
            </div>
            <div className="flex gap-3 items-center mt-6 flex-wrap">
              {/* Simplified Logos for 1 col */}
              <div className="w-8 h-8 rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden border border-border">
                <img src="/logos/google.png" alt="G" className="object-contain w-full h-full" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden border border-border">
                <img src="/logos/amazon.png" alt="A" className="object-contain w-full h-full" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden border border-border">
                <img src="/logos/microsoft.png" alt="M" className="object-contain w-full h-full" />
              </div>
            </div>
          </motion.div>

          {/* Card 4: DSA Forge (2 cols) */}
          <Link href="http://localhost:3001" target="_blank" className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-card dark:bg-[#0C0C0C] rounded-[40px] p-10 border border-border dark:border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all h-full flex flex-col md:flex-row items-start md:items-center justify-between group cursor-pointer shadow-sm dark:shadow-none relative overflow-hidden"
            >


              <div className="relative z-10 max-w-md">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-500" fill="currentColor" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold uppercase tracking-wider">
                    New App
                  </div>
                </div>

                <h3 className="text-3xl font-bold mb-3">AlgoFlow</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Switch to our dedicated high-performance environment for mastering Data Structures & Algorithms. 45+ Patterns, Execution Engine & Roadmap.
                </p>

                <div className="flex items-center text-purple-500 font-bold group-hover:gap-2 transition-all">
                  Launch AlgoFlow <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </motion.div>
          </Link>


          {/* --- ROW 3 (1) --- */}

          {/* Card 5: Badges & Start (Full Width) */}
          <Link href="/setup" className="md:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-card dark:bg-[#0C0C0C] rounded-[40px] p-8 md:p-12 border border-border dark:border-white/5 hover:bg-secondary/50 dark:hover:bg-[#111] transition-colors relative group shadow-sm dark:shadow-none overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">

                {/* Left: Content */}
                <div className="text-center md:text-left">
                  <h3 className="text-3xl font-bold mb-3">Ready to Earn Your Badges?</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                    Prove your skills in Communication, Technical Knowledge, and Leadership. Start your first simulated interview today.
                  </p>
                </div>

                {/* Right: Visuals & Button */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Badges */}
                  <div className="flex gap-[-10px]">
                    <div className="w-14 h-14 rounded-full bg-secondary dark:bg-[#111] p-1 border-2 border-background shadow-lg -ml-4 first:ml-0 z-0 hover:z-10 transition-all hover:scale-110">
                      <img src="/badges/communication.png" alt="Comm" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-secondary dark:bg-[#111] p-1 border-2 border-background shadow-lg -ml-4 z-10 hover:z-20 transition-all hover:scale-110">
                      <img src="/badges/technical.png" alt="Tech" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-secondary dark:bg-[#111] p-1 border-2 border-background shadow-lg -ml-4 z-20 hover:z-30 transition-all hover:scale-110">
                      <img src="/badges/leadership.png" alt="Lead" className="w-full h-full object-cover rounded-full" />
                    </div>
                  </div>

                  {/* Button */}
                  <div className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-primary/25 whitespace-nowrap">
                    Start Interview
                  </div>
                </div>

              </div>
            </motion.div>
          </Link>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border mt-auto text-center relative z-10">
        <p className="text-muted-foreground text-sm">© 2026 InterviewFlow</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}
