import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { authApi } from "@/services/authApi";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true);
    try {
      await authApi.resetPassword(email, otp, newPassword);
      setStep(4);
      setTimeout(() => router.navigate({ to: "/login" }), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally { setLoading(false); }
  };

  const stepIndicators = [1, 2, 3, 4];

  return (
    <div className="min-h-screen bg-[#040e0a] flex items-center justify-center px-4 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.08)_0%,_transparent_50%)]" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/landing" className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🌾</span>
            <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">AgriTwin Intelligence</span>
          </Link>
          <p className="text-emerald-300/50 text-sm">Reset your password</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {stepIndicators.map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s <= step ? "bg-emerald-500 w-10" : "bg-emerald-900/40 w-6"}`} />
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#0a1f17]/80 backdrop-blur-2xl border border-emerald-900/40 rounded-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRequestOtp} className="space-y-5">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
                    <Mail className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Enter your email</h3>
                  <p className="text-emerald-300/50 text-sm mt-1">We'll send a verification code</p>
                </div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="farmer@example.com"
                  className="w-full py-3 px-4 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-white placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500/60 transition-all" />
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
                    <KeyRound className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Enter OTP</h3>
                  <p className="text-emerald-300/50 text-sm mt-1">Check your email for the 6-digit code</p>
                  <p className="text-amber-400/60 text-xs mt-2">💡 Dev mode: Use 123456 as universal OTP</p>
                </div>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="Enter 6-digit OTP" maxLength={6}
                  className="w-full py-3 px-4 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-white placeholder-emerald-600/40 text-sm text-center tracking-[0.5em] text-lg focus:outline-none focus:border-emerald-500/60 transition-all" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 text-sm font-medium text-emerald-300/60 border border-emerald-800/30 rounded-xl hover:bg-emerald-900/20 transition-all">
                    <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl disabled:opacity-50 transition-all">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword} className="space-y-5">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
                    <Lock className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">New Password</h3>
                  <p className="text-emerald-300/50 text-sm mt-1">Choose a strong password</p>
                </div>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Min 6 characters"
                  className="w-full py-3 px-4 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-white placeholder-emerald-600/40 text-sm focus:outline-none focus:border-emerald-500/60 transition-all" />
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl disabled:opacity-50 transition-all">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Reset Password <ShieldCheck className="w-4 h-4" /></>}
                </button>
              </motion.form>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                  <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                <p className="text-emerald-300/50 text-sm">Redirecting to login...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-emerald-300/40 mt-6">
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">← Back to Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
