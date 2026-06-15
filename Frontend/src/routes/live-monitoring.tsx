import { createFileRoute } from "@tanstack/react-router";
import { Activity, Thermometer, Droplets, FlaskConical, Wind, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";

export const Route = createFileRoute("/live-monitoring")({
  component: LiveMonitoring,
});

function LiveMonitoring() {
  const { farm, crop, activeFarm, weatherData } = useApp();

  // Generate some realistic-looking timeseries data for the charts
  const liveData = Array.from({ length: 24 }).map((_, i) => {
    const time = new Date();
    time.setHours(time.getHours() - (23 - i));
    return {
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moisture: 60 + Math.sin(i / 3) * 15 + Math.random() * 5,
      temperature: 22 + Math.cos(i / 4) * 8 + Math.random() * 2,
      nitrogen: 75 + Math.sin(i / 5) * 5 + Math.random() * 3,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary shadow-inner">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live Telemetry & Monitoring</h1>
            <p className="text-muted-foreground text-sm">Real-time IoT sensor feeds for {farm} ({crop})</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-healthy/10 text-healthy rounded-full text-xs font-bold border border-healthy/20">
          <span className="h-2 w-2 rounded-full bg-healthy animate-ping" />
          SYSTEMS ONLINE
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Canopy Temp", val: `${weatherData?.current?.temp || 28}°C`, icon: Thermometer, color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Soil Moisture", val: "68%", icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Active NPK", val: "Optimal", icon: FlaskConical, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Wind Speed", val: "14 km/h", icon: Wind, color: "text-sky-500", bg: "bg-sky-500/10" },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover:-translate-y-1 transition">
            <div className={`h-10 w-10 rounded-lg grid place-items-center ${m.bg} ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{m.label}</div>
              <div className="text-lg font-bold">{m.val}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg tracking-tight">24-Hour Microclimate Trend</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500/80" /> Moisture</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-500/80" /> Temperature</div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-elevated)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                  labelStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
                <Area type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Nitrogen Uptake</h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line type="monotone" dataKey="nitrogen" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">AI Live Insight</h3>
            </div>
            <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg text-sm text-foreground leading-relaxed">
              Sensors across <span className="font-bold">{activeFarm?.fields?.[0]?.name || "Field A"}</span> detect a slight drop in canopy transpiration rates. Correlating with current temperatures, mild water stress may develop by 14:00.
            </div>
            <button className="mt-4 w-full py-2 bg-card border border-primary/30 text-primary rounded-lg text-xs font-bold hover:bg-primary/10 transition">
              Adjust Irrigation Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
