import React, { useState } from "react";
import {
  Droplets, Leaf, TrendingUp, Layers, AlertTriangle, CheckCircle2,
  XCircle, Sprout, Wheat, Activity, Target, Volume2, Play, Pause,
  Loader2, ChevronDown, ChevronUp, Bug, Zap, Sunset
} from "lucide-react";
import { SatelliteEvidencePanel } from "./SatelliteEvidencePanel";
import type { RegisteredField } from "@/context/DashboardContext";

// ── Farmer-language translators ──────────────────────────────────────────────

function ndviMessage(ndvi: number): { icon: string; title: string; body: string; color: string; bg: string } {
  if (ndvi >= 0.70) return { icon: "🌾", title: "Crop is Excellent!", body: "Your crop is dense and very healthy. No action needed — keep current farming practices.", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (ndvi >= 0.55) return { icon: "🌱", title: "Crop is Healthy", body: "Good crop growth detected. Monitor weekly and maintain irrigation schedule.", color: "text-green-600", bg: "bg-green-500/10 border-green-500/20" };
  if (ndvi >= 0.40) return { icon: "⚠️", title: "Crop Growth is Weaker Than Expected", body: "Inspect your field for irrigation gaps and low soil nutrients. Apply fertilizer if needed.", color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/20" };
  if (ndvi >= 0.25) return { icon: "💧", title: "Crop is Stressed — Act Now", body: "Crop is showing significant stress. Irrigate immediately and inspect for disease.", color: "text-orange-600", bg: "bg-orange-500/10 border-orange-500/20" };
  return { icon: "🚨", title: "Crop is Critical — Urgent Help Needed", body: "Severe crop loss detected in your field. Please visit the field and contact an agricultural officer.", color: "text-red-600", bg: "bg-red-500/10 border-red-500/20" };
}

function ndmiMessage(ndmi: number): { icon: string; title: string; body: string; color: string; urgency: string } {
  if (ndmi >= 0.35)  return { icon: "💦", title: "Water Supply is Good",          body: "Your field has enough water. No irrigation needed for the next 5–7 days.",           color: "text-blue-500",   urgency: "none"     };
  if (ndmi >= 0.15)  return { icon: "🚿", title: "Water Supply is Adequate",       body: "Acceptable water level. Plan light irrigation within 3–4 days.",                    color: "text-blue-400",   urgency: "low"      };
  if (ndmi >= 0.00)  return { icon: "⚠️", title: "Water Stress Detected",          body: "Soil moisture is dropping. Provide irrigation within 2 days.",                      color: "text-amber-500",  urgency: "medium"   };
  if (ndmi >= -0.20) return { icon: "💧", title: "Water Stress — Irrigate Today",  body: "Significant water shortage detected. Turn on irrigation channels within 24 hours.", color: "text-orange-500", urgency: "high"     };
  return              { icon: "🔴", title: "Severe Drought — Emergency Irrigation",  body: "Critical dryness. Your crop may die without immediate irrigation. Act now.",         color: "text-red-500",    urgency: "critical" };
}

function eviMessage(evi: number): { icon: string; title: string; body: string; stage: string; progress: number; color: string } {
  if (evi >= 0.55) return { icon: "🌾", title: "Ready for Harvest Soon", body: "Your crop is in grain filling phase. Prepare harvesting equipment for the next 2–3 weeks.", stage: "Grain Filling", progress: 90, color: "#10b981" };
  if (evi >= 0.40) return { icon: "🌸", title: "Crop is Flowering", body: "Flowering initiated. Maintain stable irrigation and avoid any chemical sprays now.", stage: "Flowering", progress: 72, color: "#22c55e" };
  if (evi >= 0.28) return { icon: "🌿", title: "Crop is Growing Actively", body: "Good vegetative growth. Ensure adequate nitrogen is available in the soil.", stage: "Vegetative", progress: 52, color: "#84cc16" };
  if (evi >= 0.15) return { icon: "🌱", title: "Crop is in Tillering Stage", body: "Apply urea top-dressing (20 kg/acre) this week to support early development.", stage: "Tillering", progress: 30, color: "#eab308" };
  return                  { icon: "🌱", title: "Crop is Just Germinating", body: "Early seedling stage. Ensure proper water supply and weed control.", stage: "Seedling", progress: 10, color: "#f97316" };
}

function saviMessage(cropCoverPct: number): { icon: string; title: string; body: string; color: string } {
  if (cropCoverPct >= 75) return { icon: "✅", title: "Field Coverage is Excellent",  body: "Your entire field is well covered with crop. No patchy areas detected.",                                       color: "text-emerald-600" };
  if (cropCoverPct >= 55) return { icon: "🟢", title: "Field Coverage is Good",       body: "Good crop coverage. Small bare patches may exist — check those areas.",                                        color: "text-green-600"   };
  if (cropCoverPct >= 35) return { icon: "🟡", title: "Moderate Field Coverage",      body: "Approximately half the field has crops. Inspect gaps for germination failure.",                                  color: "text-yellow-600"  };
  if (cropCoverPct >= 15) return { icon: "🟠", title: "Many Empty Patches Detected",  body: "Large areas of your field are bare. Re-sowing may be required in affected spots.",                             color: "text-orange-600"  };
  return                        { icon: "🔴", title: "Field is Mostly Empty / Bare",  body: "Very poor crop establishment detected. Consider full re-sowing and consult an agriculture officer.",             color: "text-red-600"     };
}

function diseaseMessage(risk: number): { icon: string; title: string; body: string; color: string } {
  if (risk <= 15) return { icon: "🛡️", title: "Disease Risk is Low",        body: "No significant disease threat detected. Maintain good field hygiene.",              color: "text-emerald-600" };
  if (risk <= 35) return { icon: "👀", title: "Monitor for Diseases",        body: "Moderate disease risk. Check for early signs of blast or leaf blight weekly.",    color: "text-yellow-600"  };
  if (risk <= 60) return { icon: "⚠️", title: "Disease Alert — Check Today", body: "Elevated disease risk detected. Inspect for blast and consider fungicide spray.", color: "text-orange-600"  };
  return                 { icon: "🚨", title: "High Disease Risk — Act Now", body: "High disease threat. Apply copper oxychloride spray and consult an agronomist.",   color: "text-red-600"     };
}

// ── Telugu Voice Advisory ──────────────────────────────────────────────────

function buildTeluguText(analysis: any, fieldName: string): string {
  const ndvi = analysis.ndvi ?? 0;
  const ndmi = analysis.ndmi ?? 0;
  const evi  = analysis.evi  ?? 0;
  let text = `రైతుగారూ, ${fieldName} పొలం విశ్లేషణ పూర్తయింది. `;
  if (ndvi >= 0.55) text += "మీ పంట ఆరోగ్యంగా ఉంది. ";
  else if (ndvi >= 0.4) text += "మీ పంట పెరుగుదల సాధారణంగా ఉంది. ఎరువులు వేయడం మంచిది. ";
  else text += "మీ పంటలో ఒత్తిడి కనిపిస్తోంది. వెంటనే పొలం సందర్శించండి. ";
  if (ndmi < -0.2) text += "మీ పొలంలో నీటి కొరత ఉంది. వెంటనే నీరు అందించండి. ";
  else if (ndmi < 0.0) text += "తేమ కొంత తగ్గింది. రెండు రోజుల్లో నీరు ఇవ్వండి. ";
  if (evi >= 0.4) text += "పంట పెరుగుదల బాగా కొనసాగుతోంది. ";
  else if (evi < 0.15) text += "పంట పెరుగుదల మందగించింది. నైట్రోజన్ ఎరువు వేయండి. ";
  text += "ధన్యవాదాలు.";
  return text;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FarmerMetricCard({ icon, label, value, body, colorClass, bgClass, children }: any) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${bgClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-black text-foreground flex items-center gap-1.5">
            <span>{icon}</span> {label}
          </div>
          <div className={`text-xs font-semibold mt-0.5 ${colorClass}`}>{value}</div>
        </div>
      </div>
      {children}
      <p className={`text-xs leading-relaxed ${colorClass} opacity-80`}>{body}</p>
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2.5 w-full bg-border/50 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Voice Button ───────────────────────────────────────────────────────────

function VoiceButton({ analysis, fieldName }: { analysis: any; fieldName: string }) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (playing && audio) {
      audio.pause();
      setPlaying(false);
      return;
    }
    if (audio) {
      audio.play();
      setPlaying(true);
      return;
    }
    setLoading(true);
    const text = buildTeluguText(analysis, fieldName);
    const url = `http://127.0.0.1:8080/api/tts?text=${encodeURIComponent(text)}&lang=te`;
    const a = new Audio(url);
    a.playbackRate = 1.25;
    a.onended = () => setPlaying(false);
    setAudio(a);
    try {
      await a.play();
      setPlaying(true);
    } catch { /* user gesture guard */ }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center justify-center gap-3 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 relative overflow-hidden"
    >
      {!playing && (
        <div className="absolute inset-0 rounded-xl border-2 border-emerald-400 animate-ping opacity-20 pointer-events-none" />
      )}
      <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </div>
      <div className="text-left">
        <div className="text-[9px] uppercase tracking-widest text-emerald-100 font-bold">{playing ? "Pause Advisory" : "🔊 Listen to Advisory"}</div>
        <div className="text-sm font-black">Telugu Voice Guide</div>
      </div>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface FieldAnalysisPanelProps {
  analysis: any;
  field: RegisteredField;
  loading?: boolean;
}

export function FieldAnalysisPanel({ analysis, field, loading = false }: FieldAnalysisPanelProps) {
  const [showExpert, setShowExpert] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <Leaf className="absolute inset-0 m-auto h-7 w-7 text-emerald-500" />
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-foreground">Fetching Sentinel-2 Data</div>
          <div className="text-xs text-muted-foreground mt-1">Analysing pixels inside your drawn polygon...</div>
        </div>
        <div className="flex flex-col gap-1.5 w-full max-w-xs text-xs text-muted-foreground/70">
          {["Authenticating with Copernicus...", "Downloading B4, B8, B11 bands...", "Calculating NDVI, NDMI, EVI, SAVI...", "Masking to polygon boundary..."].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const ndvi = analysis.ndvi ?? 0;
  const ndmi = analysis.ndmi ?? 0;
  const evi  = analysis.evi  ?? 0;
  const cropCoverPct = analysis.cropCoverPct ?? 0;
  const diseaseRisk  = analysis.diseaseRisk  ?? 0;
  const yieldPred    = analysis.yieldPrediction ?? 0;
  const healthScore  = analysis.healthScore ?? 0;

  const nMsg = ndviMessage(ndvi);
  const wMsg = ndmiMessage(ndmi);
  const gMsg = eviMessage(evi);
  const sMsg = saviMessage(cropCoverPct);
  const dMsg = diseaseMessage(diseaseRisk);

  const captureDate = analysis.captureDate
    ? new Date(analysis.captureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  // Barren land mode
  if (field.landStatus === "barren" && analysis.barrenRecommendation) {
    const rec = analysis.barrenRecommendation;
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">🌾 Barren Land Analysis — Best Crop Recommendation</div>
          <div className="text-3xl font-black text-foreground mb-1">{rec.crop}</div>
          <div className="text-sm text-muted-foreground mb-3">{rec.reason}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Expected Yield</div>
              <div className="text-lg font-black text-foreground mt-0.5">{rec.expectedYield}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Best Sowing Window</div>
              <div className="text-lg font-black text-foreground mt-0.5">{rec.sowingWindow}</div>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl border p-4 ${wMsg.color} bg-blue-500/5 border-blue-500/20`}>
          <div className="font-bold text-sm">{wMsg.icon} {wMsg.title}</div>
          <div className="text-xs mt-1 opacity-80">{wMsg.body}</div>
        </div>
        <SatelliteEvidencePanel meta={analysis.copernicusMetadata} captureDate={analysis.captureDate} source={analysis.source} compact />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* Source badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
          Live Sentinel-2 · <strong>{field.villageName}</strong> · {captureDate}
        </div>
        <div className="text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold text-emerald-600">{field.areaAcres.toFixed(2)} Acres · {field.name}</div>
      </div>

      {/* Health score */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={healthScore >= 70 ? "#10b981" : healthScore >= 50 ? "#eab308" : "#ef4444"} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - healthScore / 100)}`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-black" style={{ color: healthScore >= 70 ? "#10b981" : healthScore >= 50 ? "#eab308" : "#ef4444" }}>{healthScore}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Overall Field Score</div>
            <div className="text-xl font-black text-foreground">{healthScore >= 70 ? "✅ Good" : healthScore >= 50 ? "⚠️ Moderate" : "🚨 Poor"}</div>
            <div className="text-xs text-muted-foreground mt-1">Est. Yield: <strong>{yieldPred} t/ha</strong> · Stage: <strong>{gMsg.stage}</strong></div>
          </div>
        </div>
      </div>

      {/* Voice advisory */}
      <VoiceButton analysis={analysis} fieldName={field.name} />

      {/* Farmer metric cards */}
      <FarmerMetricCard icon={nMsg.icon} label="Crop Health" value={nMsg.title} body={nMsg.body} colorClass={nMsg.color} bgClass={`border ${nMsg.bg}`}>
        <ProgressBar pct={Math.max(0, ndvi * 100)} color={ndvi >= 0.55 ? "#10b981" : ndvi >= 0.4 ? "#eab308" : "#ef4444"} />
      </FarmerMetricCard>

      <FarmerMetricCard icon={wMsg.icon} label="Water Status" value={wMsg.title} body={wMsg.body} colorClass={wMsg.color} bgClass="border border-blue-500/20 bg-blue-500/5">
        <ProgressBar pct={Math.max(0, Math.min(100, (ndmi + 0.5) * 100))} color="#3b82f6" />
      </FarmerMetricCard>

      <FarmerMetricCard icon={gMsg.icon} label="Growth Progress" value={`${gMsg.stage} · ${gMsg.progress}% Complete`} body={gMsg.body} colorClass="text-foreground" bgClass="border border-border bg-card">
        <ProgressBar pct={gMsg.progress} color={gMsg.color} />
      </FarmerMetricCard>

      <FarmerMetricCard icon={sMsg.icon} label="Field Coverage" value={sMsg.title} body={sMsg.body} colorClass={sMsg.color} bgClass="border border-border bg-card">
        <ProgressBar pct={cropCoverPct} color="#f59e0b" />
      </FarmerMetricCard>

      <FarmerMetricCard icon={dMsg.icon} label="Disease Risk" value={dMsg.title} body={dMsg.body} colorClass={dMsg.color} bgClass={`border ${diseaseRisk > 40 ? "border-red-500/20 bg-red-500/5" : "border-border bg-card"}`}>
        <ProgressBar pct={diseaseRisk} color={diseaseRisk > 60 ? "#ef4444" : diseaseRisk > 35 ? "#f97316" : "#10b981"} />
      </FarmerMetricCard>

      {/* Expert toggle */}
      <button onClick={() => setShowExpert(!showExpert)}
        className="w-full flex items-center justify-between px-4 py-3 bg-accent/30 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent/50 transition">
        <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Raw Satellite Data (Expert View)</span>
        {showExpert ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showExpert && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "NDVI", val: ndvi,         unit: "Vegetation",  color: "#10b981" },
              { name: "NDMI", val: ndmi,         unit: "Moisture",    color: "#3b82f6" },
              { name: "EVI",  val: analysis.evi, unit: "Growth",      color: "#84cc16" },
              { name: "SAVI", val: analysis.savi,unit: "Soil Adj.",   color: "#f59e0b" },
            ].map(idx => (
              <div key={idx.name} className="bg-accent/20 rounded-xl p-3 border border-border flex justify-between items-center">
                <div><div className="text-xs font-black text-foreground">{idx.name}</div><div className="text-[9px] text-muted-foreground">{idx.unit}</div></div>
                <div className="text-xl font-black" style={{ color: idx.color }}>{(idx.val ?? 0).toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Satellite evidence */}
      <SatelliteEvidencePanel meta={analysis.copernicusMetadata} captureDate={analysis.captureDate} source={analysis.source} compact />
    </div>
  );
}
