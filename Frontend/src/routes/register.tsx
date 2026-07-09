import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Mail, Phone, Lock, MapPin, Globe, ArrowRight, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const STATES = [
  "Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Kerala",
  "Maharashtra", "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh",
  "Bihar", "West Bengal", "Odisha", "Punjab", "Haryana", "Other",
];

const LANGUAGES = ["English", "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi"];

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

function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    state: "Andhra Pradesh",
    district: "",
    village: "",
    preferred_language: "English",
    visibility: "village",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const password = formData.password.trim();
    const confirm_password = formData.confirm_password.trim();

    if (password !== confirm_password) {
      setError("Passwords do not match");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,64}$/;
    if (!passwordRegex.test(password)) {
      setError("Your password must be 8–64 characters and include uppercase, lowercase, a number, and a special character.");
      return;
    }

    setLoading(true);
    try {
      const submitData = { ...formData, password, confirm_password };
      await register(submitData);
      setSuccess(true);
      setTimeout(() => router.navigate({ to: "/login" }), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background text-foreground dark:bg-[#040e0a] dark:text-white flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <CheckCircle className="w-20 h-20 text-emerald-500 dark:text-emerald-400 mx-auto mb-6 animate-pulse" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground dark:text-emerald-300/60 mb-4">Redirecting to login page...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-[#040e0a] dark:text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
      
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
        className="relative z-10 w-full max-w-lg my-8"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/landing" className="inline-flex items-center gap-2 mb-3 group">
            <span className="text-3xl animate-bounce duration-1000">🌾</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              AgriTwin Intelligence
            </span>
          </Link>
          <p className="text-muted-foreground dark:text-emerald-300/50 text-sm">Create your farmer account</p>
        </div>

        {/* Form Card */}
        <div className="bg-card/90 dark:bg-[#0a1f17]/80 backdrop-blur-2xl border border-border dark:border-emerald-900/40 rounded-3xl p-8 shadow-lg dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm px-4 py-3 rounded-xl font-medium"
              >
                {error}
              </motion.div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/50 dark:text-emerald-500/50" />
                <input name="full_name" value={formData.full_name} onChange={handleChange} required
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/50 dark:text-emerald-500/50" />
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/50 dark:text-emerald-500/50" />
                  <input name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full pl-10 pr-4 py-2.5 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/50 dark:text-emerald-500/50" />
                  <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600/50 dark:text-emerald-500/50 hover:text-emerald-500">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/50 dark:text-emerald-500/50" />
                  <input name="confirm_password" type={showPassword ? "text" : "password"} value={formData.confirm_password} onChange={handleChange} required
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-4 py-2.5 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">State</label>
                <select name="state" value={formData.state} onChange={handleChange}
                  className="w-full py-2.5 px-3 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-all appearance-none">
                  {STATES.map((s) => <option key={s} value={s} className="bg-card dark:bg-[#0a1f17] text-foreground dark:text-white">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">District</label>
                <input name="district" value={formData.district} onChange={handleChange}
                  placeholder="District"
                  className="w-full py-2.5 px-3 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">Village</label>
                <input name="village" value={formData.village} onChange={handleChange}
                  placeholder="Village"
                  className="w-full py-2.5 px-3 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white placeholder-muted-foreground/50 dark:placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
              </div>
            </div>

            {/* Language & Visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">Preferred Language</label>
                <select name="preferred_language" value={formData.preferred_language} onChange={handleChange}
                  className="w-full py-2.5 px-3 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-all appearance-none">
                  {LANGUAGES.map((l) => <option key={l} value={l} className="bg-card dark:bg-[#0a1f17] text-foreground dark:text-white">{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">Visibility</label>
                <select name="visibility" value={formData.visibility} onChange={handleChange}
                  className="w-full py-2.5 px-3 bg-background/80 dark:bg-emerald-950/40 border border-border dark:border-emerald-800/40 rounded-xl text-foreground dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-all appearance-none">
                  <option value="village" className="bg-card dark:bg-[#0a1f17] text-foreground dark:text-white">🏘️ Village (Default)</option>
                  <option value="private" className="bg-card dark:bg-[#0a1f17] text-foreground dark:text-white">🔒 Private</option>
                  <option value="public" className="bg-card dark:bg-[#0a1f17] text-foreground dark:text-white">🌐 Public</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-400 hover:to-teal-400 shadow-md disabled:opacity-50 transition-all duration-300"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground dark:text-emerald-300/40 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-semibold transition-colors">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
