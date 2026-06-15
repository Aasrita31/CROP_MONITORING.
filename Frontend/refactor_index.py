import re

filepath = r"c:\Aasritha\AgriTwin\Frontend\src\routes\index.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add useApp import
if "useApp" not in content:
    content = content.replace('import { INDIA_STATES_DATA } from "@/components/india-states-data";',
                              'import { INDIA_STATES_DATA } from "@/components/india-states-data";\nimport { useApp } from "@/context/AppContext";')

# 2. Update Dashboard function
dashboard_old = r"""function Dashboard\(\) \{
  const \[collapsed, setCollapsed\] = useState\(false\);
  const \[selected, setSelected\] = useState<string \| null>\("B"\);
  const \[time, setTime\] = useState\(50\); // 0 past \.\. 50 now \.\. 100 future
  const \[farm, setFarm\] = useState\("Punjab Wheat Belt"\);
  const \[crop, setCrop\] = useState\("Wheat"\);
  const \[aiOpen, setAiOpen\] = useState\(false\);
  const \[addFieldOpen, setAddFieldOpen\] = useState\(false\);

  // New map state variables
  const \[mapMode, setMapMode\] = useState<"farm" \| "national">\("farm"\);
  const \[resolution, setResolution\] = useState<"10m" \| "3m" \| "30m">\("10m"\);
  const \[spectralLayer, setSpectralLayer\] = useState<"natural" \| "ndvi" \| "ndwi" \| "thermal">\("ndvi"\);
  const \[hoveredState, setHoveredState\] = useState<any>\(null\);
  const \[tooltipPos, setTooltipPos\] = useState\(\{ x: 0, y: 0 \}\);

  // Dynamically sync crops when farm changes
  useEffect\(\(\) => \{.*?\}, \[farm\]\);

  const \[activeFarmData, setActiveFarmData\] = useState<any>\(null\);
  const \[weatherData, setWeatherData\] = useState<any>\(null\);
  const \[nationalNdvi, setNationalNdvi\] = useState<any>\(null\);

  useEffect\(\(\) => \{.*?\}, \[\]\);

  useEffect\(\(\) => \{.*?\}, \[farm\]\);

  const activeFarm = activeFarmData;"""

dashboard_new = """function Dashboard() {
  const [selected, setSelected] = useState<string | null>("B");
  const [time, setTime] = useState(50);

  // New map state variables
  const [mapMode, setMapMode] = useState<"farm" | "national">("farm");
  const [resolution, setResolution] = useState<"10m" | "3m" | "30m">("10m");
  const [spectralLayer, setSpectralLayer] = useState<"natural" | "ndvi" | "ndwi" | "thermal">("ndvi");
  const [hoveredState, setHoveredState] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { farm, setFarm, crop, activeFarm, weatherData, nationalNdvi } = useApp();
"""

content = re.sub(dashboard_old, dashboard_new, content, flags=re.DOTALL)

# 3. Update Dashboard return JSX (remove Header, Sidebar, Wrapper, Drawer, Modal)
return_old = r"""  return \(
    \(!activeFarm \|\| !weatherData\) \? <div className="min-h-screen bg-background flex items-center justify-center">Loading\.\.\.</div> :
    <div className="min-h-screen bg-background text-foreground" style=\{\{ fontFamily: "Inter, ui-sans-serif" \}\}>
      <Header .*?/>

      <div className="flex">
        <Sidebar collapsed=\{collapsed\} setCollapsed=\{setCollapsed\} />

        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">"""

return_new = """  return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">"""

content = re.sub(return_old, return_new, content, flags=re.DOTALL)

# 4. Remove closing tags for Dashboard JSX
closing_old = r"""        </main>
      </div>

      \{aiOpen && <AiAssistantDrawer onClose=\{\(\) => setAiOpen\(false\)\} farm=\{farm\} crop=\{crop\} />\}
      \{addFieldOpen && <AddFieldModal onClose=\{\(\) => setAddFieldOpen\(false\)\} />\}
    </div>
  \);"""

closing_new = """        </div>
  );"""

content = re.sub(closing_old, closing_new, content, flags=re.DOTALL)

# 5. Remove Header, Sidebar, Select, DateFilter, WeatherChip Components
header_sidebar_pattern = r"/\* ---------------- Header Component ---------------- \*/.*?/\* ---------------- KPI Card Component ---------------- \*/"
content = re.sub(header_sidebar_pattern, "/* ---------------- KPI Card Component ---------------- */", content, flags=re.DOTALL)


# Write back
with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("index.tsx refactored.")
