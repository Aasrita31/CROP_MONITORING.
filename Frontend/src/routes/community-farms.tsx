import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Leaf, Droplets, TrendingUp, Search, Star } from "lucide-react";
import { communityApi } from "@/services/communityApi";

export const Route = createFileRoute("/community-farms")({
  component: CommunityFarmsPage,
});

function HealthBadge({ score, rating }: { score: number; rating: string }) {
  const color = score >= 80 ? "emerald" : score >= 55 ? "amber" : "red";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-${color}-500/15 text-${color}-400 border border-${color}-500/20`}>
      {score}% · {rating}
    </span>
  );
}

function YieldStars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "" : "opacity-20"}>★</span>
      ))}
    </span>
  );
}

interface Farm {
  id: string;
  name: string;
  crop: string;
  variety: string;
  area_acres: number;
  village: string;
  district: string;
  health_score: number;
  health_rating: string;
  health_tone: string;
  ndvi: number;
  growth_stage: string;
  water_status: string;
  yield_rating: number;
  yield_label: string;
  harvest_estimate: string;
  ai_summary: string;
  color: string;
  centroid: number[] | null;
}

function CommunityFarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  useEffect(() => {
    communityApi.getCommunityFarms()
      .then(setFarms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = farms.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.crop.toLowerCase().includes(search.toLowerCase()) ||
    (f.village || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-400" />
            Community Farm Explorer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Explore farms across your village and compare crop conditions</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farms, crops, villages..."
            className="w-full pl-9 pr-4 py-2.5 bg-sidebar border border-sidebar-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 transition"
          />
        </div>
      </motion.div>

      {/* Farm count */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" /> <span className="text-xs text-muted-foreground">Healthy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" /> <span className="text-xs text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" /> <span className="text-xs text-muted-foreground">Needs Attention</span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} farms found</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((farm, i) => (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedFarm(selectedFarm?.id === farm.id ? null : farm)}
              className={`bg-sidebar border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedFarm?.id === farm.id
                  ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  : "border-sidebar-border hover:border-emerald-800/50"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${farm.color === "green" ? "bg-green-500" : farm.color === "yellow" ? "bg-yellow-500" : "bg-red-500"}`} />
                  <h3 className="font-semibold text-sm text-foreground truncate max-w-[180px]">{farm.name}</h3>
                </div>
                <HealthBadge score={farm.health_score} rating={farm.health_rating} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Crop</span>
                  <p className="text-foreground font-medium">{farm.crop}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Variety</span>
                  <p className="text-foreground font-medium">{farm.variety}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Area</span>
                  <p className="text-foreground font-medium">{farm.area_acres} ac</p>
                </div>
                <div>
                  <span className="text-muted-foreground">NDVI</span>
                  <p className={`font-medium ${farm.ndvi >= 0.6 ? "text-emerald-400" : farm.ndvi >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                    {farm.ndvi.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Growth Stage</span>
                  <p className="text-foreground font-medium">{farm.growth_stage}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Water</span>
                  <p className="text-foreground font-medium">{farm.water_status}</p>
                </div>
              </div>

              {/* Yield */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-sidebar-border">
                <div>
                  <span className="text-xs text-muted-foreground">Yield Rating</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <YieldStars rating={farm.yield_rating} />
                    <span className="text-xs text-muted-foreground">{farm.yield_label}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Harvest</span>
                  <p className="text-xs font-medium text-foreground">{farm.harvest_estimate}</p>
                </div>
              </div>

              {/* Expanded AI Summary */}
              {selectedFarm?.id === farm.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 pt-3 border-t border-sidebar-border"
                >
                  <span className="text-xs text-muted-foreground">AI Summary</span>
                  <p className="text-xs text-foreground mt-1">{farm.ai_summary}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No community farms found. Register farms to see them here.</p>
        </div>
      )}
    </div>
  );
}
