import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Leaf, Satellite, Brain, CloudSun, MapPin, Users,
  ArrowRight, ChevronDown, Sparkles, Shield, Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import digitalCropHealthImg from "@/assets/digital-crop-health.png";
import agriDroneScanImg from "@/assets/agri-drone-scan.png";
import { apiClient } from "@/services/apiClient";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});

/* ── Animated Background Seasonal Effects ──────────────────────── */
function RainEffect() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(40)].map((_, i) => {
        const left = `${(i * 7) % 100}%`;
        const delay = (i * 0.15) % 3;
        const duration = 0.8 + (i * 0.1) % 0.6;
        const height = 15 + (i * 5) % 20;
        return (
          <motion.div
            key={i}
            className="absolute w-[1.5px] bg-emerald-500/30 dark:bg-emerald-400/20"
            style={{
              left,
              top: "-5%",
              height: `${height}px`,
            }}
            animate={{
              y: ["0vh", "105vh"],
              x: ["0px", "-20px"],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "linear",
            }}
          />
        );
      })}
    </div>
  );
}

function SunbeamsEffect() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Sun Orb */}
      <motion.div
        className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-amber-400/10 dark:bg-amber-500/5 blur-[8rem]"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Sun Dust */}
      {[...Array(15)].map((_, i) => {
        const left = `${(i * 9) % 100}%`;
        const top = `${(i * 13) % 100}%`;
        const size = 3 + (i * 2) % 6;
        const delay = (i * 0.5) % 4;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-300/30 dark:bg-amber-400/20 blur-[1px]"
            style={{
              left,
              top,
              width: size,
              height: size,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.1, 0.5, 0.1],
            }}
            transition={{
              duration: 6 + (i % 4) * 2,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}

function WindyEffect() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(20)].map((_, i) => {
        const top = `${(i * 11) % 85}%`;
        const delay = (i * 0.3) % 4;
        const duration = 3 + (i * 0.8) % 3;
        const size = 12 + (i * 2) % 16;
        return (
          <motion.div
            key={i}
            className="absolute text-emerald-600/20 dark:text-emerald-400/25 select-none"
            style={{
              top,
              left: "-10%",
              fontSize: `${size}px`,
            }}
            animate={{
              x: ["0vw", "115vw"],
              y: [0, 50, -50, 0],
              rotate: [0, 720],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          >
            {i % 2 === 0 ? "🍃" : "🌾"}
          </motion.div>
        );
      })}
    </div>
  );
}

function SeasonalClouds({ season }: { season: 'sunny' | 'rainy' | 'windy' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  const cloudOpacity = season === 'rainy' ? 'opacity-[0.09] dark:opacity-[0.06] text-slate-500' : 'opacity-[0.03] text-current';
  const count = season === 'rainy' ? 6 : 3;
  const speedMultiplier = season === 'windy' ? 0.6 : 1;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(count)].map((_, i) => {
        const top = `${10 + i * 15}%`;
        const size = 100 + (i * 40) % 80;
        const duration = (30 + i * 12) * speedMultiplier;
        return (
          <motion.div
            key={i}
            className={`absolute ${cloudOpacity} select-none`}
            style={{
              top,
              fontSize: `${size}px`,
            }}
            animate={{
              x: ["-15%", "115%"],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay: i * 6,
              ease: "linear",
            }}
          >
            ☁️
          </motion.div>
        );
      })}
    </div>
  );
}


/* ── Feature Card ───────────────────────────────────────────────── */
const features = [
  {
    icon: Brain,
    title: "Digital Twin",
    desc: "Create a virtual replica of your farm powered by AI and real-time satellite data.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Satellite,
    title: "Satellite Analytics",
    desc: "Copernicus Sentinel-2 imagery with NDVI, NDMI, EVI & SAVI indices at 10m resolution.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: CloudSun,
    title: "Weather Intelligence",
    desc: "Hyperlocal weather forecasts with irrigation scheduling and rain alerts.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: MapPin,
    title: "Multi Farm Management",
    desc: "Register and monitor multiple fields with per-farm Digital Twins and analytics.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "Community Agriculture",
    desc: "Village-level insights, leaderboards, and collaborative farming intelligence.",
    gradient: "from-pink-500 to-rose-500",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  desc,
  gradient,
  index,
}: {
  icon: any;
  title: string;
  desc: string;
  gradient: string;
  index: number;
}) {
  const col = index % 3;
  let initialX = 0;
  let initialY = 0;
  if (col === 0) {
    initialX = -100; // Fly in from left
  } else if (col === 1) {
    initialY = 100;  // Fly in from bottom
  } else {
    initialX = 100;  // Fly in from right
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX, y: initialY }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ type: "spring", stiffness: 60, damping: 15, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
      />
      <div className="relative bg-card/85 dark:bg-[#0a1f17]/80 backdrop-blur-xl border border-border dark:border-emerald-900/30 rounded-2xl p-7 h-full hover:border-emerald-500/40 transition-all duration-500 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} shadow-lg mb-5`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-foreground dark:text-white mb-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground dark:text-emerald-200/60 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ── Stats Bar ──────────────────────────────────────────────────── */
interface LiveStats {
  districts_count: number;
  villages_count: number;
  fields_count: number;
  total_area_ha: number;
  avg_health_score: number;
}

function StatsBar({ liveStats }: { liveStats: LiveStats | null }) {
  const stats = [
    { value: "10m", label: "Satellite Resolution" },
    { value: "98%", label: "AI Accuracy" },
    { value: "24/7", label: "Real-time Monitoring" },
    { 
      value: liveStats ? `${liveStats.fields_count}` : "...", 
      label: "Active Fields (Live)" 
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16"
    >
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className="text-center"
        >
          <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            {s.value}
          </div>
          <div className="text-xs text-emerald-300/60 mt-1 font-medium uppercase tracking-wider">
            {s.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Main Landing Page ──────────────────────────────────────────── */
function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [season, setSeason] = useState<'sunny' | 'rainy' | 'windy'>('sunny');
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: "/" });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    apiClient.get("/dashboard/overview")
      .then((res) => {
        setLiveStats(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch live stats", err);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeason((prev) => {
        if (prev === 'sunny') return 'rainy';
        if (prev === 'rainy') return 'windy';
        return 'sunny';
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-[#040e0a] dark:text-white transition-colors duration-500 overflow-x-hidden" style={{ fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}>
      {/* ── Background Effects ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0">
        {/* Glowing Blurred Orbs */}
        <div className="absolute top-[10%] left-[15%] w-[35rem] h-[35rem] rounded-full bg-emerald-300/10 dark:bg-emerald-500/5 blur-[8rem] pointer-events-none animate-float-slow" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-[20%] right-[10%] w-[30rem] h-[30rem] rounded-full bg-teal-300/10 dark:bg-teal-500/5 blur-[8rem] pointer-events-none animate-float-slow" style={{ animationDelay: '-5s' }} />
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.12)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/10 via-background to-teal-100/5 dark:from-transparent dark:via-[#040e0a] dark:to-transparent" />
        
        {/* Tech Grid Pattern (Animated/Drifting) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.02)_1px,transparent_1px)] animate-grid-drift" />
        
        {/* Laser Scanner Effect */}
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent dark:via-emerald-400/15 animate-scanning-laser shadow-[0_0_12px_rgba(16,185,129,0.5)] pointer-events-none" />

        {/* Dynamic Seasonal Effects */}
        {season === 'sunny' && <SunbeamsEffect />}
        {season === 'rainy' && <RainEffect />}
        {season === 'windy' && <WindyEffect />}
        <SeasonalClouds season={season} />
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl animate-bounce duration-1000">🌾</div>
          <div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-400 dark:via-green-300 dark:to-teal-400 bg-clip-text text-transparent">
              AgriTwin Intelligence
            </span>
            <span className="relative flex h-2 w-2 ml-2 inline-flex">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/about"
            className="px-4 py-2.5 text-sm font-semibold text-foreground/80 dark:text-emerald-200 hover:text-foreground dark:hover:text-white transition-colors duration-300"
          >
            About
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-semibold text-foreground/80 dark:text-emerald-200 hover:text-foreground dark:hover:text-white border border-border dark:border-emerald-800/50 rounded-xl hover:border-emerald-500/50 hover:bg-accent dark:hover:bg-emerald-900/30 transition-all duration-300"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-400 hover:to-teal-400 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.5)] transition-all duration-300"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32 min-h-[calc(100vh-80px)]">

        {/* BOTTOM LEFT CORNER: Premium Grass Greenery Illustration */}
        <div className="fixed bottom-0 left-0 w-44 md:w-64 h-32 pointer-events-none z-10 opacity-70 dark:opacity-40">
          <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-emerald-600/80 dark:text-emerald-500/50">
            <path d="M10 100C30 70 20 40 40 10C25 45 40 70 45 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M40 100C60 65 50 35 75 5C58 40 68 70 70 100" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            <path d="M80 100C90 75 85 50 105 20C92 50 98 75 95 100" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M120 100C135 60 125 30 145 0C132 35 138 65 140 100" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
            <path d="M160 100C170 70 165 45 185 15C172 45 178 70 175 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

        {/* BOTTOM RIGHT CORNER: Premium Grass Greenery Illustration */}
        <div className="fixed bottom-0 right-0 w-44 md:w-64 h-32 pointer-events-none z-10 opacity-70 dark:opacity-40 scale-x-[-1]">
          <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-emerald-600/80 dark:text-emerald-500/50">
            <path d="M10 100C30 70 20 40 40 10C25 45 40 70 45 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M40 100C60 65 50 35 75 5C58 40 68 70 70 100" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            <path d="M80 100C90 75 85 50 105 20C92 50 98 75 95 100" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M120 100C135 60 125 30 145 0C132 35 138 65 140 100" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
            <path d="M160 100C170 70 165 45 185 15C172 45 178 70 175 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-8 shadow-sm backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            AI-Powered Precision Agriculture Platform
          </motion.div>

          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6 max-w-5xl mx-auto"
            style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
          >
            <span className="bg-gradient-to-br from-foreground via-emerald-800 to-emerald-950 dark:from-white dark:via-emerald-100 dark:to-emerald-300 bg-clip-text text-transparent">
              AgriTwin
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto", animation: "shimmer 3s linear infinite" }}
            >
              Intelligence
            </span>
          </h1>

          <style>{`
            @keyframes shimmer {
              0% { background-position: 0% center; }
              100% { background-position: 200% center; }
            }
          `}</style>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-xl md:text-2xl font-bold text-emerald-800/90 dark:text-emerald-200/70 mb-4 max-w-2xl mx-auto"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Smart Insights. Strong Harvests.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
            className="text-base text-muted-foreground dark:text-emerald-300/50 mb-10 max-w-xl mx-auto leading-relaxed font-medium"
          >
            Build your Farm Digital Twin using AI, satellite imagery, and real-time agricultural intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-5 relative z-10"
          >
            <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="transition-all duration-300">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:from-emerald-400 hover:to-teal-400 shadow-[0_8px_32px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.4)] transition-all duration-300"
              >
                Login
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="transition-all duration-300">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold text-emerald-700 dark:text-emerald-200 border-2 border-emerald-600/30 dark:border-emerald-700/50 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-800 dark:hover:text-white transition-all duration-300 shadow-sm"
              >
                Register
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400/70 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
              >
                Learn More
                <ChevronDown className="w-4 h-4 animate-bounce" />
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        <StatsBar liveStats={liveStats} />
      </section>

      {/* ── Features Section ───────────────────────────────────── */}
      <section id="features" className="relative z-10 px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground dark:text-white mb-4">
            Precision Agriculture, <span className="text-emerald-600 dark:text-emerald-400">Reimagined</span>
          </h2>
          <p className="text-muted-foreground dark:text-emerald-200/50 max-w-lg mx-auto">
            Everything you need to transform your farming with AI-powered intelligence, satellite monitoring, and community collaboration.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <div key={f.title} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust Bar ──────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20 border-t border-emerald-900/20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-emerald-400/60">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400/60">
              <Satellite className="w-5 h-5" />
              <span className="text-sm font-medium">Copernicus Sentinel-2</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400/60">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400/60">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered</span>
            </div>
          </div>

          <p className="text-emerald-300/30 text-xs">
            © {new Date().getFullYear()} AgriTwin Intelligence · Built for Indian Farmers
          </p>
        </motion.div>
      </section>
    </div>
  );
}
