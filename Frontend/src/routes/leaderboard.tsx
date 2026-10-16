import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Award, Leaf, Droplets, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { communityApi } from "@/services/communityApi";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

const CATEGORIES = [
  { key: "health", label: "Top Healthy Farms", icon: Leaf, color: "emerald" },
  { key: "ndvi", label: "Top NDVI", icon: TrendingUp, color: "green" },
  { key: "water", label: "Best Water Management", icon: Droplets, color: "cyan" },
  { key: "sustainability", label: "Highest Sustainability", icon: Sparkles, color: "violet" },
];

const BADGE_ICONS: Record<string, string> = {
  "Healthy Farm Champion": "🏆",
  "Water Saver": "💧",
  "Sustainable Farmer": "🌱",
  "AI Smart Farm": "🤖",
};

interface LeaderboardEntry {
  rank: number;
  farm_id: string;
  farm_name: string;
  farmer_id: string;
  village: string;
  district: string;
  crop: string;
  score: number;
  health_score: number;
  ndvi: number;
  badges: string[];
}

function LeaderboardPage() {
  const [category, setCategory] = useState("health");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedFarmDetails, setSelectedFarmDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    communityApi.getLeaderboard(category)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const handleRowClick = async (farmId: string) => {
    if (selectedFarmId === farmId) {
      setSelectedFarmId(null);
      setSelectedFarmDetails(null);
      return;
    }
    setSelectedFarmId(farmId);
    setDetailsLoading(true);
    try {
      const details = await communityApi.getFarmDetail(farmId);
      setSelectedFarmDetails(details);
    } catch (e) {
      console.error("Error fetching farm details:", e);
      setSelectedFarmDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Community Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Top performing farms across all categories. Click any farm to view detailed NDVI analytics.</p>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              category === cat.key
                ? `bg-${cat.color}-500/20 text-${cat.color}-400 border border-${cat.color}-500/30`
                : "bg-sidebar border border-sidebar-border text-muted-foreground hover:text-foreground hover:border-emerald-800/50"
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
              {[entries[1], entries[0], entries[2]].map((entry, i) => {
                const rank = [2, 1, 3][i];
                const heights = ["h-24", "h-32", "h-20"];
                const medals = ["🥈", "🥇", "🥉"];
                const sizes = ["text-3xl", "text-4xl", "text-3xl"];

                return (
                  <motion.div
                    key={entry.farm_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    onClick={() => handleRowClick(entry.farm_id)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <span className={`${sizes[i]} mb-2 group-hover:scale-110 transition-transform`}>{medals[i]}</span>
                    <div className={`w-full ${heights[i]} bg-gradient-to-t from-emerald-500/20 to-transparent border border-emerald-800/30 rounded-t-xl flex flex-col items-center justify-end pb-3`}>
                      <p className="text-xs font-bold text-foreground text-center truncate px-2 max-w-full">{entry.farm_name.split("—")[0].trim()}</p>
                      <p className="text-lg font-black text-emerald-400">{entry.score.toFixed(0)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full List */}
          <div className="bg-sidebar border border-sidebar-border rounded-xl overflow-hidden shadow-md">
            <div className="grid grid-cols-[60px_1fr_100px_80px_80px_auto] gap-2 px-4 py-3 border-b border-sidebar-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Rank</span>
              <span>Farm</span>
              <span>Score</span>
              <span>NDVI</span>
              <span>Health</span>
              <span>Badges</span>
            </div>

            {entries.map((entry, i) => {
              const isSelected = selectedFarmId === entry.farm_id;
              return (
                <div key={entry.farm_id} className="border-b border-sidebar-border/30">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => handleRowClick(entry.farm_id)}
                    className={`grid grid-cols-[60px_1fr_100px_80px_80px_auto] gap-2 px-4 py-3.5 items-center text-sm cursor-pointer ${
                      isSelected ? "bg-emerald-950/20" : (i % 2 === 0 ? "bg-sidebar" : "bg-sidebar-accent/30")
                    } hover:bg-sidebar-accent/50 transition-colors`}
                  >
                    <span className={`font-bold ${entry.rank <= 3 ? "text-amber-400 font-extrabold text-base" : "text-muted-foreground"}`}>
                      #{entry.rank}
                    </span>
                    <div>
                      <p className="text-foreground font-semibold truncate">{entry.farm_name.split("—")[0].trim()}</p>
                      <p className="text-xs text-muted-foreground">{entry.village || "Unknown"} · {entry.crop}</p>
                    </div>
                    <span className="text-emerald-400 font-bold">{entry.score.toFixed(1)}</span>
                    <span className={`font-mono font-bold ${entry.ndvi >= 0.6 ? "text-emerald-400" : entry.ndvi >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                      {entry.ndvi.toFixed(2)}
                    </span>
                    <span className="font-semibold">{entry.health_score}%</span>
                    <div className="flex gap-1">
                      {entry.badges.map((badge) => (
                        <span key={badge} title={badge} className="text-base cursor-help">
                          {BADGE_ICONS[badge] || "🏅"}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Expanded NDVI details */}
                  {isSelected && (
                    <div className="px-6 py-5 bg-card/60 border-t border-sidebar-border/40 text-xs text-foreground animate-in fade-in duration-300">
                      {detailsLoading ? (
                        <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                          <span>Fetching Sentinel-2 NDVI details...</span>
                        </div>
                      ) : selectedFarmDetails ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Left Column: Spectral Metrics */}
                          <div className="space-y-3">
                            <h4 className="font-extrabold text-emerald-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <Leaf className="w-3.5 h-3.5" /> Spectral Indices
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-3 bg-sidebar border border-sidebar-border rounded-xl">
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">NDVI (Vigor)</div>
                                <div className={`text-lg font-black mt-0.5 ${selectedFarmDetails.ndvi >= 0.6 ? "text-emerald-400" : selectedFarmDetails.ndvi >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                                  {selectedFarmDetails.ndvi.toFixed(3)}
                                </div>
                              </div>
                              <div className="p-3 bg-sidebar border border-sidebar-border rounded-xl">
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Health Score</div>
                                <div className="text-lg font-black text-emerald-400 mt-0.5">
                                  {selectedFarmDetails.health_score}/100
                                </div>
                              </div>
                              <div className="p-3 bg-sidebar border border-sidebar-border rounded-xl">
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Water Status</div>
                                <div className="text-xs font-bold text-blue-400 mt-1">
                                  {selectedFarmDetails.water_status}
                                </div>
                              </div>
                              <div className="p-3 bg-sidebar border border-sidebar-border rounded-xl">
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Yield Rating</div>
                                <div className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-0.5">
                                  ★ {selectedFarmDetails.yield_rating}/5
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Middle Column: Farm Profile */}
                          <div className="space-y-3">
                            <h4 className="font-extrabold text-emerald-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" /> Farm Profile
                            </h4>
                            <div className="space-y-2 bg-sidebar border border-sidebar-border rounded-xl p-3">
                              <div className="flex justify-between pb-1.5 border-b border-sidebar-border/30">
                                <span className="text-muted-foreground">Crop Type</span>
                                <span className="font-semibold text-foreground">{selectedFarmDetails.crop}</span>
                              </div>
                              <div className="flex justify-between pb-1.5 border-b border-sidebar-border/30">
                                <span className="text-muted-foreground">Variety</span>
                                <span className="font-semibold text-foreground">{selectedFarmDetails.variety}</span>
                              </div>
                              <div className="flex justify-between pb-1.5 border-b border-sidebar-border/30">
                                <span className="text-muted-foreground">Area Size</span>
                                <span className="font-semibold text-foreground">{selectedFarmDetails.area_acres} Acres</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Location</span>
                                <span className="font-semibold text-foreground">{selectedFarmDetails.village}, {selectedFarmDetails.district}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: AI Advisory */}
                          <div className="space-y-3">
                            <h4 className="font-extrabold text-emerald-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> AI Crop Advisory
                            </h4>
                            <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2.5">
                              <p className="text-foreground leading-relaxed font-medium">{selectedFarmDetails.ai_summary}</p>
                              <div className="text-[10px] text-muted-foreground/80 flex gap-3 border-t border-emerald-500/10 pt-2 font-semibold">
                                <span>Irrigation: <strong className="text-emerald-400 font-bold">{selectedFarmDetails.irrigation_type || "N/A"}</strong></span>
                                <span>Stage: <strong className="text-emerald-400 font-bold">{selectedFarmDetails.growth_stage || "N/A"}</strong></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-muted-foreground">Failed to load details.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {entries.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No leaderboard data available yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
