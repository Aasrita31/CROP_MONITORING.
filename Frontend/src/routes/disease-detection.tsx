import { createFileRoute } from "@tanstack/react-router";
import { Microscope } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/disease-detection")({
  component: DiseaseDetection,
});

function DiseaseDetection() {
  const { farm, crop, activeFarm } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary">
          <Microscope className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Disease Detection</h1>
          <p className="text-muted-foreground text-sm">Advanced analytics for {farm} ({crop})</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6 min-h-[400px] flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-primary/30 to-transparent group-hover:scale-105 transition duration-1000" />
            <div className="text-center relative z-10">
                <Microscope className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Interactive Disease Detection Visualization</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-2 mx-auto">
                    Aggregating satellite telemetry and IoT sensor data for {crop} fields in {farm}.
                </p>
                <button className="mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-md hover:bg-primary/90 transition">
                    Run Analysis
                </button>
            </div>
        </div>
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Key Metrics</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-accent/40">
                            <span className="text-sm font-medium">Metric 0{i}</span>
                            <span className="text-sm font-bold text-primary">+{(Math.random() * 10).toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">AI Recommendation</h3>
                <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg text-sm text-foreground leading-relaxed">
                    Based on current conditions in {farm}, it is recommended to maintain regular monitoring. No critical anomalies detected in the {crop} canopy.
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
