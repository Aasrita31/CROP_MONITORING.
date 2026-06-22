import React, { useState, useEffect } from "react";
import {
  Droplets, Leaf, TrendingUp, Layers, Bot, CheckCircle2,
  AlertTriangle, AlertCircle, XCircle, Sprout, Wheat, Calendar,
  Activity, Thermometer, Target, ChevronDown, ChevronUp, Globe,
  Microscope, CloudRain, Sun
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Pure derivation helpers — all inputs come from real Copernicus satellite data
// ─────────────────────────────────────────────────────────────────────────────

function deriveNdviAssessment(ndvi: number) {
  if (ndvi >= 0.75) return { label: "Excellent Crop", color: "#10b981", bgClass: "bg-emerald-500/10 border-emerald-500/20", textClass: "text-emerald-600", interpretation: "Dense, healthy canopy. Photosynthesis activity is at peak. No intervention required.", icon: "🌾" };
  if (ndvi >= 0.60) return { label: "Healthy Crop",   color: "#22c55e", bgClass: "bg-green-500/10 border-green-500/20",   textClass: "text-green-600",   interpretation: "Good vegetation density. Crop is growing as expected. Monitor weekly.",          icon: "🌱" };
  if (ndvi >= 0.45) return { label: "Moderate Stress", color: "#eab308", bgClass: "bg-yellow-500/10 border-yellow-500/20", textClass: "text-yellow-600", interpretation: "Vegetation activity is moderate. Check irrigation and soil nutrients.",               icon: "⚠️" };
  if (ndvi >= 0.25) return { label: "Water Stress",   color: "#f97316", bgClass: "bg-orange-500/10 border-orange-500/20", textClass: "text-orange-600", interpretation: "Significant stress detected. Irrigate immediately and inspect the field.",          icon: "💧" };
  return                { label: "Critical",          color: "#ef4444", bgClass: "bg-red-500/10 border-red-500/20",       textClass: "text-red-600",     interpretation: "Severe vegetation loss. Immediate field visit required.",                       icon: "🚨" };
}

function deriveNdmiAssessment(ndmi: number) {
  if (ndmi >= 0.40)  return { label: "Well Irrigated",      color: "#3b82f6", textClass: "text-blue-500",   interpretation: "Optimal water content. No irrigation needed for 5–7 days.", urgency: "none" };
  if (ndmi >= 0.20)  return { label: "Adequate Moisture",   color: "#60a5fa", textClass: "text-blue-400",   interpretation: "Acceptable moisture. Light irrigation within 3–4 days.",    urgency: "low"  };
  if (ndmi >= 0.00)  return { label: "Mild Water Stress",   color: "#f59e0b", textClass: "text-amber-500",  interpretation: "Moisture declining. Irrigate within 2 days.",                urgency: "medium" };
  if (ndmi >= -0.20) return { label: "Moderate Stress",     color: "#f97316", textClass: "text-orange-500", interpretation: "Significant moisture deficit. Irrigate today.",               urgency: "high" };
  return                    { label: "Severe Water Stress",  color: "#ef4444", textClass: "text-red-500",    interpretation: "Critical dryness detected. Emergency irrigation required.",   urgency: "critical" };
}

function deriveEviAssessment(evi: number) {
  if (evi >= 0.55) return { stage: "Grain Filling",         progress: 90, color: "#10b981", interpretation: "Crop approaching maturity. Prepare for harvest in 2–3 weeks." };
  if (evi >= 0.40) return { stage: "Panicle Initiation",   progress: 72, color: "#22c55e", interpretation: "Flowering initiated. Maintain stable irrigation and avoid stress." };
  if (evi >= 0.28) return { stage: "Vegetative Growth",    progress: 52, color: "#84cc16", interpretation: "Active growth phase. Ensure adequate nitrogen availability." };
  if (evi >= 0.15) return { stage: "Tillering",            progress: 30, color: "#eab308", interpretation: "Tillering stage. Consider top-dressing urea if soil N is low." };
  return                  { stage: "Seedling / Early",     progress: 12, color: "#f97316", interpretation: "Early crop establishment. Ensure proper water and fertilizer supply." };
}

function deriveSaviAssessment(cropCoverPct: number, bareSoilPct: number) {
  if (cropCoverPct >= 80) return { coverage: "Excellent", color: "#10b981", interpretation: "Field is fully covered. Excellent crop establishment." };
  if (cropCoverPct >= 65) return { coverage: "Good",       color: "#22c55e", interpretation: "Good crop coverage. Minor bare patches may need attention." };
  if (cropCoverPct >= 50) return { coverage: "Moderate",   color: "#eab308", interpretation: "Moderate coverage. Inspect patchy areas for germination failure." };
  if (cropCoverPct >= 30) return { coverage: "Sparse",     color: "#f97316", interpretation: "Sparse coverage detected. Re-sowing may be required in affected areas." };
  return                         { coverage: "Critical",   color: "#ef4444", interpretation: "Poor crop establishment. Urgent field inspection and corrective action needed." };
}

function computeOverallScore(ndvi: number, ndmi: number, evi: number, savi: number): number {
  // Weighted score: NDVI 40%, NDMI 25%, EVI 20%, SAVI 15%
  const ndviScore  = Math.min(100, Math.max(0, ((ndvi + 0.2) / 1.2) * 100));
  const ndmiScore  = Math.min(100, Math.max(0, ((ndmi + 0.5) / 1.5) * 100));
  const eviScore   = Math.min(100, Math.max(0, (evi / 0.8) * 100));
  const saviScore  = Math.min(100, Math.max(0, (savi / 0.8) * 100));
  return Math.round(ndviScore * 0.40 + ndmiScore * 0.25 + eviScore * 0.20 + saviScore * 0.15);
}

function overallRating(score: number): { label: string; emoji: string; color: string; textClass: string } {
  if (score >= 85) return { label: "Excellent",  emoji: "🏆", color: "#10b981", textClass: "text-emerald-500" };
  if (score >= 70) return { label: "Good",        emoji: "✅", color: "#22c55e", textClass: "text-green-500"   };
  if (score >= 55) return { label: "Moderate",    emoji: "⚠️", color: "#eab308", textClass: "text-yellow-500"  };
  if (score >= 35) return { label: "Poor",        emoji: "❗", color: "#f97316", textClass: "text-orange-500"  };
  return                  { label: "Critical",    emoji: "🚨", color: "#ef4444", textClass: "text-red-500"     };
}

function buildRecommendations(
  ndvi: number, ndmiAss: ReturnType<typeof deriveNdmiAssessment>,
  eviAss: ReturnType<typeof deriveEviAssessment>, saviAss: ReturnType<typeof deriveSaviAssessment>,
  villageName: string
): Array<{ priority: "high" | "medium" | "low"; title: string; body: string; icon: React.ReactNode }> {
  const recs: Array<{ priority: "high" | "medium" | "low"; title: string; body: string; icon: React.ReactNode }> = [];

  if (ndmiAss.urgency === "critical" || ndmiAss.urgency === "high") {
    recs.push({ priority: "high", title: "Irrigate Immediately", body: `${villageName} shows significant water stress (NDMI ${ndmiAss.label}). Turn on irrigation channels within 24 hours to prevent yield loss.`, icon: <Droplets className="h-4 w-4 text-blue-500" /> });
  } else if (ndmiAss.urgency === "medium") {
    recs.push({ priority: "medium", title: "Schedule Irrigation Soon", body: "Moderate water deficit detected. Plan irrigation within the next 2–3 days.", icon: <CloudRain className="h-4 w-4 text-blue-400" /> });
  }

  if (ndvi < 0.40) {
    recs.push({ priority: "high", title: "Field Inspection Required", body: "Low vegetation index (NDVI) indicates crop stress or failure. Walk the field to identify affected patches.", icon: <AlertCircle className="h-4 w-4 text-red-500" /> });
  } else if (ndvi >= 0.70) {
    recs.push({ priority: "low", title: "Crop Health is Strong", body: "Excellent vegetation activity detected. Maintain current management practices.", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  }

  if (eviAss.stage === "Tillering" || eviAss.stage === "Seedling / Early") {
    recs.push({ priority: "medium", title: "Apply Top-Dressing Fertilizer", body: "Crop is in early development stage. Apply urea at 20 kg/acre to boost nitrogen and support tillering.", icon: <Sprout className="h-4 w-4 text-green-500" /> });
  }

  if (eviAss.stage === "Grain Filling") {
    recs.push({ priority: "medium", title: "Prepare for Harvest", body: "Grain filling phase detected. Monitor grain moisture and coordinate harvesting equipment in the next 10–20 days.", icon: <Wheat className="h-4 w-4 text-amber-500" /> });
  }

  if (saviAss.coverage === "Sparse" || saviAss.coverage === "Critical") {
    recs.push({ priority: "high", title: "Re-Sowing Required in Sparse Areas", body: "Bare soil analysis reveals significant unplanted or failed areas. Consider gap filling or re-sowing before the next rain.", icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> });
  }

  if (recs.length === 0) {
    recs.push({ priority: "low", title: "No Immediate Action Required", body: "All satellite indices are within acceptable ranges. Continue current irrigation and fertilizer schedule.", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  }

  return recs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ScoreRing({ score, rating }: { score: number; rating: ReturnType<typeof overallRating> }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
        <circle cx="64" cy="64" r={radius} fill="none" stroke={rating.color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1500 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black" style={{ color: rating.color }}>{score}</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">/100</span>
      </div>
    </div>
  );
}

function IndexCard({
  emoji, title, badge, badgeColor, valueLabel, valueRaw, interpretation, children
}: {
  emoji: string; title: string; badge: string; badgeColor: string;
  valueLabel: string; valueRaw: string; interpretation: string; children?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
            <div className="text-lg font-black text-foreground mt-0.5">{badge}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{valueLabel}</div>
          <div className="text-xl font-black" style={{ color: badgeColor }}>{valueRaw}</div>
        </div>
      </div>
      {children}
      <p className="text-xs leading-relaxed text-foreground/70 border-t border-border/50 pt-3">{interpretation}</p>
    </div>
  );
}

function ProgressBar({ pct, color, label }: { pct: number; color: string; label?: string }) {
  return (
    <div>
      {label && <div className="flex justify-between items-center mb-1"><span className="text-xs text-muted-foreground font-semibold">{label}</span><span className="text-xs font-bold">{Math.round(pct)}%</span></div>}
      <div className="h-2.5 w-full bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function RecommendationCard({ rec, idx }: { rec: any; idx: number }) {
  const borderColor = rec.priority === "high" ? "border-l-red-500" : rec.priority === "medium" ? "border-l-amber-500" : "border-l-emerald-500";
  const bg = rec.priority === "high" ? "bg-red-500/5" : rec.priority === "medium" ? "bg-amber-500/5" : "bg-emerald-500/5";
  const badge = rec.priority === "high" ? "bg-red-500/15 text-red-600" : rec.priority === "medium" ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600";
  return (
    <div className={`border border-border border-l-4 ${borderColor} ${bg} rounded-xl p-4 flex gap-3 animate-in slide-in-from-bottom-2 duration-300`} style={{ animationDelay: `${idx * 100}ms` }}>
      <div className="mt-0.5 shrink-0">{rec.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-foreground">{rec.title}</span>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badge}`}>{rec.priority}</span>
        </div>
        <p className="text-xs text-foreground/70 leading-relaxed">{rec.body}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface FarmerAdvisorPanelProps {
  villageName: string;
  villageAnalysis: any;
  showIndexCards?: boolean; // show the 4 NDVI/NDMI/EVI/SAVI metric cards
}

export function FarmerAdvisorPanel({ villageName, villageAnalysis, showIndexCards = true }: FarmerAdvisorPanelProps) {
  const [showExpert, setShowExpert] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!villageAnalysis) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
        <Globe className="h-12 w-12 text-primary mx-auto mb-4 opacity-60" />
        <h3 className="text-xl font-bold text-foreground mb-2">Search for a village to begin</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Enter any village name in Andhra Pradesh above. Real Copernicus Sentinel-2 satellite data will be fetched and analyzed automatically.
        </p>
      </div>
    );
  }

  // ── Extract all real values from backend response ──
  const ndvi         = villageAnalysis.ndvi         ?? 0;
  const ndmi         = villageAnalysis.ndmi         ?? 0;
  const evi          = villageAnalysis.evi          ?? 0;
  const savi         = villageAnalysis.savi         ?? 0;
  const cropCoverPct = villageAnalysis.cropCoverPct ?? 50;
  const bareSoilPct  = villageAnalysis.bareSoilPct  ?? 50;
  const healthScore  = villageAnalysis.healthScore  ?? 0;
  const waterStress  = villageAnalysis.waterStress  ?? 0;
  const diseaseRisk  = villageAnalysis.diseaseRisk  ?? 0;
  const yieldPred    = villageAnalysis.yieldPrediction ?? 0;
  const captureDate  = villageAnalysis.captureDate  ? new Date(villageAnalysis.captureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
  const source       = villageAnalysis.source       ?? "Copernicus Sentinel-2 L2A";
  const b4           = villageAnalysis.b4           ?? 0;
  const b8           = villageAnalysis.b8           ?? 0;
  const b11          = villageAnalysis.b11          ?? 0;
  const eviMin       = villageAnalysis.eviMin       ?? 0;
  const eviMax       = villageAnalysis.eviMax       ?? 0;
  const ndmiMin      = villageAnalysis.ndmiMin      ?? 0;
  const ndmiMax      = villageAnalysis.ndmiMax      ?? 0;
  const growthStage  = villageAnalysis.growthStage  ?? "";
  const biomass      = villageAnalysis.biomassEstimate ?? 0;
  const meta         = villageAnalysis.copernicusMetadata ?? null;

  // ── Derive all assessments ──
  const ndviAss = deriveNdviAssessment(ndvi);
  const ndmiAss = deriveNdmiAssessment(ndmi);
  const eviAss  = deriveEviAssessment(evi);
  const saviAss = deriveSaviAssessment(cropCoverPct, bareSoilPct);
  const score   = computeOverallScore(ndvi, ndmi, evi, savi);
  const rating  = overallRating(score);
  const recs    = buildRecommendations(ndvi, ndmiAss, eviAss, saviAss, villageName);

  const soilMoisture = Math.max(0, Math.min(100, Math.round(100 - waterStress)));

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* ── Source Badge ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          Live Sentinel-2 Data · <strong>{villageName}</strong>
        </div>
        <div className="text-[10px] font-semibold text-emerald-600/80 bg-emerald-500/20 px-2 py-0.5 rounded">
          {source} · {captureDate}
        </div>
      </div>

      {/* ── Overall Score + Rating ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">🎯 Overall Field Score</div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {mounted && <ScoreRing score={score} rating={rating} />}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{rating.emoji}</span>
              <span className={`text-3xl font-black ${rating.textClass}`}>{rating.label}</span>
            </div>
            <p className="text-sm text-foreground/70">
              Your fields in <strong>{villageName}</strong> are rated <strong>{rating.label}</strong> based on real-time Copernicus Sentinel-2 satellite imagery captured on {captureDate}.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-accent/30 rounded-xl p-3 border border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Est. Yield</div>
                <div className="text-xl font-black text-foreground mt-0.5">{yieldPred} <span className="text-xs font-normal text-muted-foreground">t/ha</span></div>
              </div>
              <div className="bg-accent/30 rounded-xl p-3 border border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Harvest Readiness</div>
                <div className="text-xl font-black text-foreground mt-0.5">{eviAss.stage}</div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ── 4 Index Cards (shown in Farm Advisor panel, hidden in Dashboard) ── */}
      {showIndexCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* NDVI */}
          <IndexCard
            emoji="🌾" title="Crop Health"
            badge={ndviAss.label} badgeColor={ndviAss.color}
            valueLabel="NDVI" valueRaw={ndvi.toFixed(3)}
            interpretation={ndviAss.interpretation}
          >
            <ProgressBar pct={Math.min(100, Math.max(0, ((ndvi + 0.1) / 1.1) * 100))} color={ndviAss.color} />
          </IndexCard>

          {/* NDMI */}
          <IndexCard
            emoji="💧" title="Water Status"
            badge={ndmiAss.label} badgeColor={ndmiAss.color ?? "#3b82f6"}
            valueLabel="NDMI" valueRaw={ndmi.toFixed(3)}
            interpretation={ndmiAss.interpretation}
          >
            <div className="space-y-1.5">
              <ProgressBar pct={soilMoisture} color="#3b82f6" label="Soil Moisture" />
            </div>
          </IndexCard>

          {/* EVI */}
          <IndexCard
            emoji="📈" title="Growth Status"
            badge={eviAss.stage} badgeColor={eviAss.color}
            valueLabel="EVI" valueRaw={evi.toFixed(3)}
            interpretation={eviAss.interpretation}
          >
            <ProgressBar pct={eviAss.progress} color={eviAss.color} label="Growth Progress" />
          </IndexCard>

          {/* SAVI */}
          <IndexCard
            emoji="🟫" title="Soil & Crop Cover"
            badge={saviAss.coverage} badgeColor={saviAss.color}
            valueLabel="SAVI" valueRaw={savi.toFixed(3)}
            interpretation={saviAss.interpretation}
          >
            <div className="space-y-1.5">
              <ProgressBar pct={cropCoverPct} color="#10b981" label="Crop Cover" />
              <ProgressBar pct={bareSoilPct}  color="#a16207" label="Bare Soil"  />
            </div>
          </IndexCard>

        </div>
      )}

      {/* ── Smart Recommendations ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground">What Should I Do Today?</span>
        </div>
        {recs.map((r, i) => <RecommendationCard key={i} rec={r} idx={i} />)}
      </div>

      {/* ── Expert Mode Toggle ── */}
      <button
        onClick={() => setShowExpert(!showExpert)}
        className="w-full flex items-center justify-between px-4 py-3 bg-accent/30 border border-border rounded-xl hover:bg-accent/50 transition text-sm font-semibold text-muted-foreground"
      >
        <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Expert Satellite Data</span>
        {showExpert ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showExpert && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-300 space-y-4">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Raw Spectral Analysis · Copernicus Sentinel-2</div>

          {/* Band reflectance values */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "B04 (Red)",  val: b4,  color: "#ef4444", nm: "665nm" },
              { name: "B08 (NIR)",  val: b8,  color: "#84cc16", nm: "842nm" },
              { name: "B11 (SWIR)", val: b11, color: "#f97316", nm: "1610nm" },
            ].map(b => (
              <div key={b.name} className="bg-accent/20 rounded-xl p-3 border border-border text-center">
                <div className="text-[9px] font-bold uppercase text-muted-foreground">{b.name}</div>
                <div className="text-[9px] text-muted-foreground/60 mb-1">{b.nm}</div>
                <div className="text-lg font-black" style={{ color: b.color }}>{b.val.toFixed(4)}</div>
              </div>
            ))}
          </div>

          {/* Computed indices */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "NDVI", val: ndvi, unit: "Vegetation",  color: "#10b981" },
              { name: "NDMI", val: ndmi, unit: "Moisture",    color: "#3b82f6" },
              { name: "EVI",  val: evi,  unit: "Growth",      color: "#84cc16" },
              { name: "SAVI", val: savi, unit: "Soil Adj.",   color: "#f59e0b" },
            ].map(idx => (
              <div key={idx.name} className="bg-accent/20 rounded-xl p-3 border border-border flex justify-between items-center">
                <div>
                  <div className="text-xs font-black text-foreground">{idx.name}</div>
                  <div className="text-[9px] text-muted-foreground">{idx.unit} Index</div>
                </div>
                <div className="text-xl font-black" style={{ color: idx.color }}>{idx.val.toFixed(3)}</div>
              </div>
            ))}
          </div>

          {/* Biomass + Growth Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-accent/20 rounded-xl p-3 border border-border">
              <div className="text-[9px] font-bold text-muted-foreground uppercase">Biomass Estimate</div>
              <div className="text-base font-black text-foreground mt-0.5">{biomass.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">t/ha DM</span></div>
            </div>
            <div className="bg-accent/20 rounded-xl p-3 border border-border">
              <div className="text-[9px] font-bold text-muted-foreground uppercase">Growth Stage</div>
              <div className="text-base font-black text-foreground mt-0.5">{growthStage}</div>
            </div>
          </div>

          {/* Copernicus metadata */}
          {meta && (
            <div className="border border-border rounded-xl divide-y divide-border/50 text-[11px]">
              {[
                { label: "Product Name",       val: meta.productName,      mono: true  },
                { label: "Sensing Date",        val: meta.sensingDate                   },
                { label: "Cloud Cover",         val: meta.cloudCover,       green: true },
                { label: "Spatial Resolution",  val: meta.spatialResolution             },
                { label: "Processing Level",    val: meta.processingLevel               },
              ].map((row, i) => (
                <div key={i} className="px-3 py-2 flex justify-between items-start gap-4">
                  <span className="text-muted-foreground font-semibold shrink-0">{row.label}</span>
                  <span className={`text-right break-all ${row.mono ? "font-mono text-[9px]" : "font-semibold"} ${row.green ? "text-emerald-500" : "text-foreground"}`}>{row.val || "N/A"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
