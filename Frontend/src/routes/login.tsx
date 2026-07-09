import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

/* ── Animated Background Particles ──────────────────────────────── */
function FloatingLeaves() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => {
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

function CloudAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-[0.03]"
          style={{
            top: `${20 + i * 25}%`,
            fontSize: "100px",
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

function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ identifier, password, remember_me: rememberMe });
      router.navigate({ to: "/" });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-[#040e0a] dark:text-white flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Dynamic Background Effects */}
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

        <FloatingLeaves />
        <CloudAnimation />
      </div>

      {/* Floating Theme Toggle (Top Right) */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-md my-8"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/landing" className="inline-flex items-center gap-2 mb-4 group">
            <span className="text-3xl animate-bounce duration-1000">🌾</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              AgriTwin Intelligence
            </span>
          </Link>
          <p className="text-muted-foreground dark:text-emerald-300/50 text-sm">Welcome back! Sign in to your account.</p>
        </div>

        {/* Card */}
        <div className="bg-card/90 dark:bg-[#0a1f17]/80 backdrop-blur-2xl border border-border dark:border-emerald-900/40 rounded-3xl p-8 shadow-lg dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm px-4 py-3 rounded-xl font-medium"
              >
                {error}
              </motion.div>
            )}

            {/* Email/Phone */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-2">
                Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-emerald-600/50 dark:text-emerald-500/50" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="farmer@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-emerald-600/50 dark:text-emerald-500/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600/50 dark:text-emerald-500/50 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border dark:border-emerald-800/50 bg-background/80 dark:bg-emerald-950/40 text-emerald-600 focus:ring-emerald-500/30"
                />
                <span className="text-xs text-muted-foreground dark:text-emerald-300/60 group-hover:text-foreground dark:group-hover:text-emerald-300 transition-colors">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-emerald-600 dark:text-emerald-400/70 hover:text-emerald-500 transition-colors font-semibold"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-400 hover:to-teal-400 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.01]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border dark:border-emerald-800/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs text-muted-foreground dark:bg-[#0a1f17] dark:text-emerald-500/40">or continue with</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 text-sm font-medium text-foreground/80 dark:text-emerald-200/70 bg-background/50 dark:bg-emerald-950/30 border border-border dark:border-emerald-800/30 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-700/50 hover:text-foreground dark:hover:text-emerald-200 transition-all"
              onClick={() => alert("Google OAuth coming soon!")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google Login — Coming Soon
            </button>
          </form>
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-muted-foreground dark:text-emerald-300/40 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-semibold transition-colors">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

