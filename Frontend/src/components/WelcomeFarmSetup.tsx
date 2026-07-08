import { motion } from "framer-motion";
import { Sprout, ArrowRight, MapPin } from "lucide-react";
import { useDashboardContext } from "@/context/DashboardContext";

export function WelcomeFarmSetup() {
  const { setActivePanel } = useDashboardContext();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-8 border border-emerald-800/30"
      >
        <Sprout className="w-12 h-12 text-emerald-400" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-foreground mb-2"
      >
        Welcome to AgriTwin Intelligence
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-sm mb-8 max-w-md"
      >
        Let's create your first Farm Digital Twin. Register your farm boundaries to start receiving
        satellite analytics, AI recommendations, and precision agriculture insights.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={() => setActivePanel("Farm Registration & Fields")}
        className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:from-emerald-400 hover:to-teal-400 shadow-[0_8px_32px_rgba(16,185,129,0.3)] transition-all duration-300 transform hover:scale-[1.03] group"
      >
        <MapPin className="w-5 h-5" />
        Register Your Farm
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 flex items-center gap-6 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-1">📡 Satellite Connected</span>
        <span className="flex items-center gap-1">🤖 AI Ready</span>
        <span className="flex items-center gap-1">🌾 Farm Twin Engine</span>
      </motion.div>
    </motion.div>
  );
}
