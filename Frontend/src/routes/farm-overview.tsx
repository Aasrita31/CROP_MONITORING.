import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Target, Leaf, Sprout, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";

export const Route = createFileRoute("/farm-overview")({
  component: FarmOverview,
});

function FarmOverview() {
  const { farm, crop, activeFarm } = useApp();

  const totalFields = activeFarm?.fields?.length || 0;
  const avgHealth = activeFarm?.kpis?.find((k: any) => k.label.includes("Health"))?.value || 85;
  const avgYield = activeFarm?.kpis?.find((k: any) => k.label.includes("Yield"))?.value || "N/A";

  // Simulate crop status distribution
  const statusData = [
    { name: "Healthy", value: 65, color: "#10b981" },
    { name: "Water Stress", value: 15, color: "#3b82f6" },
    { name: "Nutrient Deficit", value: 12, color: "#f59e0b" },
    { name: "Disease Risk", value: 8, color: "#f43f5e" },
  ];

  // Simulate field performance
  const fieldData = activeFarm?.fields?.map((f: any) => ({
    name: f.id,
    health: f.health,
    potential: f.health + (Math.random() * 10),
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary shadow-inner">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Farm Overview</h1>
            <p className="text-muted-foreground text-sm">Aggregate analytics for {farm} ({crop})</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4 hover:-translate-y-1 transition">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center"><Target className="h-6 w-6" /></div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Total Zones</div>
            <div className="text-2xl font-bold">{totalFields} Fields</div>
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4 hover:-translate-y-1 transition">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center"><Leaf className="h-6 w-6" /></div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Avg Canopy Health</div>
            <div className="text-2xl font-bold text-primary">{avgHealth}/100</div>
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4 hover:-translate-y-1 transition">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-500 grid place-items-center"><TrendingUp className="h-6 w-6" /></div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase">Est. Base Yield</div>
            <div className="text-2xl font-bold">{avgYield} {activeFarm?.cropUnit}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
          <h3 className="font-semibold text-lg tracking-tight mb-4">Crop Status Distribution</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Field Performance Benchmarks */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
          <h3 className="font-semibold text-lg tracking-tight mb-4">Zone Performance Index</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fieldData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="health" name="Current Health" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="potential" name="Potential" fill="#3b82f6" opacity={0.5} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
