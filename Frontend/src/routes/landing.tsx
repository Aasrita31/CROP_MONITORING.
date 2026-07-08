import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Leaf, Satellite, Brain, CloudSun, MapPin, Users,
  ArrowRight, ChevronDown, Sparkles, Shield, Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});

/* ── Animated Background Particles ──────────────────────────────── */
function FloatingLeaves() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-green-500/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${16 + Math.random() * 24}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        >
          🍃
        </motion.div>
      ))}
    </div>
  );
}

function CloudAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-[0.03]"
          style={{
            top: `${15 + i * 20}%`,
            fontSize: "120px",
          }}
          animate={{
            x: ["-10%", "110%"],
          }}
          transition={{
            duration: 40 + i * 15,
            repeat: Infinity,
            delay: i * 8,
            ease: "linear",
          }}
        >
          ☁️
        </motion.div>
      ))}
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
    icon: Leaf,
    title: "AI Crop Monitoring",
    desc: "Real-time disease detection, pest alerts, and precision crop health analysis.",
    gradient: "from-green-500 to-emerald-500",
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
      />
      <div className="relative bg-[#0a1f17]/80 backdrop-blur-xl border border-emerald-900/30 rounded-2xl p-7 h-full hover:border-emerald-500/40 transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} shadow-lg mb-5`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
          {title}
        </h3>
        <p className="text-emerald-200/60 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ── Stats Bar ──────────────────────────────────────────────────── */
function StatsBar() {
  const stats = [
    { value: "10m", label: "Satellite Resolution" },
    { value: "98%", label: "AI Accuracy" },
    { value: "5+", label: "Crop Indices" },
    { value: "24/7", label: "Real-time Monitoring" },
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

  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: "/" });
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-[#040e0a] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}>
      {/* ── Background Effects ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(20,184,166,0.06)_0%,_transparent_50%)]" />
        <FloatingLeaves />
        <CloudAnimation />
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">🌾</div>
          <div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
              AgriTwin Intelligence
            </span>
            <span className="relative flex h-2 w-2 ml-2 inline-flex">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-semibold text-emerald-200 hover:text-white border border-emerald-800/50 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-900/30 transition-all duration-300"
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
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-800/50 bg-emerald-900/20 text-emerald-300 text-xs font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Precision Agriculture Platform
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6 max-w-5xl mx-auto">
            <span className="bg-gradient-to-br from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
              AgriTwin
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl font-medium text-emerald-200/70 mb-4 max-w-2xl mx-auto"
          >
            Smart Insights. Strong Harvests.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-base text-emerald-300/50 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Build your Farm Digital Twin using AI, satellite imagery, and real-time agricultural intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:from-emerald-400 hover:to-teal-400 shadow-[0_8px_32px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.5)] transition-all duration-300 transform hover:scale-[1.03]"
            >
              Login
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold text-emerald-200 border-2 border-emerald-700/50 rounded-2xl hover:border-emerald-500 hover:bg-emerald-900/30 hover:text-white transition-all duration-300"
            >
              Register
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-emerald-400/70 hover:text-emerald-300 transition-colors"
            >
              Learn More
              <ChevronDown className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>

        <StatsBar />
      </section>

      {/* ── Features Section ───────────────────────────────────── */}
      <section id="features" className="relative z-10 px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Precision Agriculture, <span className="text-emerald-400">Reimagined</span>
          </h2>
          <p className="text-emerald-200/50 max-w-lg mx-auto">
            Everything you need to transform your farming with AI-powered intelligence, satellite monitoring, and community collaboration.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
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
