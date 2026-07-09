import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Leaf, Satellite, Brain, Shield, ArrowLeft, Heart, Layers, MapPin } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

/* ── Dynamic Background Effects ──────────────────────── */
function SeasonalClouds() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-[0.03] select-none"
          style={{
            top: `${15 + i * 25}%`,
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

function FloatingLeaves() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => {
        const left = `${(i * 13) % 100}%`;
        const top = `${(i * 17) % 100}%`;
        const size = 16 + (i * 3) % 24;
        const delay = (i * 0.7) % 5;
        const duration = 8 + (i * 1.5) % 8;
        return (
          <motion.div
            key={i}
            className="absolute text-emerald-600/15 dark:text-emerald-400/25"
            style={{
              left,
              top,
              fontSize: `${size}px`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, (i % 2 === 0 ? 15 : -15), 0],
              rotate: [0, 360],
              opacity: [0.1, 0.35, 0.1],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          >
            🍃
          </motion.div>
        );
      })}
    </div>
  );
}

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-[#040e0a] dark:text-white transition-colors duration-500 overflow-x-hidden relative" style={{ fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}>
      
      {/* ── Background Effects ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.12)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/10 via-background to-teal-100/5 dark:from-transparent dark:via-[#040e0a] dark:to-transparent" />
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.02)_1px,transparent_1px)] animate-grid-drift" />
        
        {/* Laser Scanner Effect */}
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent dark:via-emerald-400/15 animate-scanning-laser shadow-[0_0_12px_rgba(16,185,129,0.5)] pointer-events-none" />

        <FloatingLeaves />
        <SeasonalClouds />
      </div>

      {/* ── Header / Navigation ─────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto"
      >
        <Link to="/landing" className="inline-flex items-center gap-2 group">
          <span className="text-2xl animate-pulse">🌾</span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            AgriTwin Intelligence
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/landing"
            className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-white border border-border dark:border-emerald-950/40 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </motion.nav>

      {/* ── Content Body ───────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 text-center">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-6 shadow-sm backdrop-blur-sm">
            <Brain className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Empowering Farmers with AI & Space Telemetry
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-foreground to-emerald-900 dark:from-white dark:to-emerald-300 bg-clip-text text-transparent">
            About AgriTwin Intelligence
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground dark:text-emerald-200/70 max-w-2xl mx-auto leading-relaxed mb-12">
            AgriTwin is a state-of-the-art precision agriculture dashboard designed to create virtual duplicates of your crop blocks. By merging satellite telemetry, artificial intelligence, and community-driven collaboration, we help farmers optimize crop yields and identify potential hazards early.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left my-16">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card/75 dark:bg-[#0a1f17]/70 backdrop-blur-md border border-border dark:border-emerald-950/40 rounded-3xl p-6 shadow-sm hover:border-emerald-500/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Satellite className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Satellite Crop Telemetry</h3>
            <p className="text-sm text-muted-foreground dark:text-emerald-200/50 leading-relaxed">
              We leverage raw Copernicus Sentinel-2 satellite imagery to track dynamic crop indices (NDVI, NDMI, EVI, SAVI) at 10-meter spatial resolution. This allows farmers to evaluate crop vigor, canopy ratios, and vegetation density over time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card/75 dark:bg-[#0a1f17]/70 backdrop-blur-md border border-border dark:border-emerald-950/40 rounded-3xl p-6 shadow-sm hover:border-emerald-500/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Digital Twin Modeling</h3>
            <p className="text-sm text-muted-foreground dark:text-emerald-200/50 leading-relaxed">
              By mapping boundaries, soil types, and seed varieties, we formulate a simulated replica of registered fields. This digital model tracks active vegetation development, estimated dry biomass levels, and notifies farmers about optimal harvest windows.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card/75 dark:bg-[#0a1f17]/70 backdrop-blur-md border border-border dark:border-emerald-950/40 rounded-3xl p-6 shadow-sm hover:border-emerald-500/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Disease & Pest Detection</h3>
            <p className="text-sm text-muted-foreground dark:text-emerald-200/50 leading-relaxed">
              Our integrated machine learning models analyze crop telemetry and diagnostic uploads to detect common agricultural threats like blast leaf, brown spots, stem borers, and water stress, providing instant biological and chemical recommendations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card/75 dark:bg-[#0a1f17]/70 backdrop-blur-md border border-border dark:border-emerald-950/40 rounded-3xl p-6 shadow-sm hover:border-emerald-500/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Village Visibility Settings</h3>
            <p className="text-sm text-muted-foreground dark:text-emerald-200/50 leading-relaxed">
              AgriTwin offers distinct privacy controls for fields. Farmers can set fields to private, share them with their localized village network to compare yield benchmarks and coordinate community pest mitigation, or post them publicly for regional insights.
            </p>
          </motion.div>

        </div>

        {/* Action Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Ready to start smart farming?</h2>
          <p className="text-sm text-muted-foreground dark:text-emerald-200/60 max-w-lg mx-auto mb-8 leading-relaxed">
            Create your account today to configure digital twins for your fields, access historical Sentinel-2 data, and consult the AI Crop Doctor.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:from-emerald-400 hover:to-teal-400 shadow-md transition-all duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-emerald-700 dark:text-emerald-200 border-2 border-emerald-600/30 dark:border-emerald-700/50 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-800 dark:hover:text-white transition-all duration-300 shadow-sm"
            >
              Login
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-16 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span>for Indian Farmers · © {new Date().getFullYear()}</span>
        </div>

      </section>
    </div>
  );
}
