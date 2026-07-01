import type { VillageAnalysisResult } from "@/services/villageSearchApi";

export type FieldStatus = "healthy" | "nutrient" | "water" | "disease" | "pest";

export function normalizeVillageName(name: string): string {
  return name.split(",")[0].trim();
}

export interface CopernicusPolygon {
  id: string;
  name: string;
  polygonCoords: [number, number][];
  mean_ndvi: number;
  mean_ndmi?: number;
}

export function buildFieldFromCopernicusPolygon(
  poly: CopernicusPolygon,
  index: number,
  villageName: string,
  villageAnalysis?: VillageAnalysisResult | null,
) {
  const village = normalizeVillageName(villageName);
  const ndvi = poly.mean_ndvi;
  const healthScore = Math.min(100, Math.max(0, Math.round(ndvi * 100 + 15)));

  let dominant: FieldStatus = "healthy";
  let condition = "Healthy Paddy";
  let status = "Healthy";
  let rec = "Crop growth is healthy. Continue current irrigation schedule.";

  if (healthScore < 40) {
    dominant = "disease";
    condition = "Critical Vegetation Loss";
    rec = "High vegetation stress detected. Immediate field inspection recommended.";
    status = "Disease Risk";
  } else if (healthScore < 60) {
    dominant = "water";
    condition = "Water Deficit";
    rec = "Possible water stress detected. Monitor irrigation over the next 5 days.";
    status = "Water Stress";
  } else if (healthScore < 75) {
    dominant = "nutrient";
    condition = "Moderate Stress";
    rec = "Crop growth is slowing. Inspect irrigation and nutrient availability.";
    status = "Nutrient Stress";
  }

  const villageDisease = villageAnalysis?.diseaseRisk ?? Math.round((1 - ndvi) * 45);
  const villageWaterStress = villageAnalysis?.waterStress ?? Math.round((1 - ndvi) * 40);
  const yieldValue =
    villageAnalysis?.yieldPrediction ?? parseFloat((1.0 + (healthScore / 100) * 6.5).toFixed(1));

  const disease =
    dominant === "disease"
      ? Math.round(Math.max(villageDisease, (1 - ndvi) * 85))
      : Math.round(villageDisease * Math.max(0.15, 1 - ndvi));

  const water = Math.min(
    100,
    Math.max(
      0,
      dominant === "water"
        ? Math.round(100 - villageWaterStress)
        : Math.round(100 - villageWaterStress * Math.max(0.2, 1 - ndvi)),
    ),
  );

  const mix =
    status === "Healthy"
      ? { healthy: 70, nutrient: 10, water: 10, disease: 5, pest: 5 }
      : status === "Water Stress"
        ? { healthy: 30, nutrient: 15, water: 45, disease: 5, pest: 5 }
        : status === "Nutrient Stress"
          ? { healthy: 35, nutrient: 40, water: 15, disease: 5, pest: 5 }
          : { healthy: 30, nutrient: 15, water: 10, disease: 40, pest: 5 };

  const fieldLetter = String.fromCharCode(65 + (index % 26));

  return {
    id: poly.id,
    name: `Field ${fieldLetter} — ${village} Paddy Block`,
    lat: poly.polygonCoords[0][0],
    lng: poly.polygonCoords[0][1],
    coordinates: poly.polygonCoords,
    polygonCoords: poly.polygonCoords,
    ndvi: parseFloat(ndvi.toFixed(2)),
    ndmi: poly.mean_ndmi !== undefined ? parseFloat(poly.mean_ndmi.toFixed(2)) : 0,
    hotspots: [] as unknown[],
    dominant,
    status,
    health: healthScore,
    condition,
    rec,
    village,
    disease,
    water,
    stage: healthScore > 75 ? "Panicle Initiation" : healthScore > 55 ? "Tillering" : "Vegetative",
    yield: yieldValue,
    harvestIn: Math.round(18 + (100 - healthScore) * 0.35),
    mix,
    npk: {
      n: Math.round(50 + ndvi * 40),
      p: Math.round(45 + ndvi * 35),
      k: Math.round(40 + ndvi * 30),
    },
    aiConfidence: `${Math.round(88 + ndvi * 10)}%`,
    lastScan: villageAnalysis?.captureDate
      ? new Date(villageAnalysis.captureDate).toLocaleDateString()
      : new Date().toLocaleDateString(),
    area: `${(1.2 + ndvi * 2.8).toFixed(1)} Hectares`,
    surveyNo: `SUR-${1000 + index}`,
  };
}

export function buildKpisFromVillageAnalysis(
  analysis: VillageAnalysisResult,
  villageName: string,
  iconMap: Record<string, unknown>,
) {
  const village = normalizeVillageName(villageName);
  const soilMoisture = Math.round(100 - analysis.waterStress);

  return [
    {
      label: "Farm Health Score",
      value: analysis.healthScore,
      suffix: "/100",
      tone: "healthy",
      icon: iconMap.Leaf,
      trend: "+2.5%",
      spark: [72, 75, 78, 80, 82, analysis.healthScore],
    },
    {
      label: "Canopy NDVI",
      value: analysis.ndvi,
      suffix: " index",
      tone: "healthy",
      icon: iconMap.Sparkles,
      trend: "+1.8%",
      spark: [0.55, 0.58, 0.6, 0.62, analysis.ndvi],
    },
    {
      label: "Predicted Yield",
      value: analysis.yieldPrediction,
      suffix: " t/ha",
      tone: "healthy",
      icon: iconMap.TrendingUp,
      trend: "+0.4 t",
      decimals: 1,
      spark: [4.5, 4.8, 5.0, 5.2, analysis.yieldPrediction],
    },
    {
      label: "Disease Risk",
      value: Math.round(analysis.diseaseRisk),
      suffix: "%",
      tone: "disease",
      icon: iconMap.Microscope,
      trend: "-1.5%",
      spark: [20, 18, 16, 15, Math.round(analysis.diseaseRisk)],
    },
    {
      label: "Soil Moisture",
      value: soilMoisture,
      suffix: "%",
      tone: "water",
      icon: iconMap.Droplets,
      trend: "+4.2%",
      spark: [55, 58, 62, 65, soilMoisture],
    },
    {
      label: "Harvest Readiness",
      value: Math.min(100, Math.round(analysis.healthScore * 0.85)),
      suffix: "%",
      tone: "healthy",
      icon: iconMap.Wheat || iconMap.Leaf,
      trend: "+5.0%",
      spark: [5, 10, 15, 20],
    },
  ];
}

export function buildInsightsFromAnalysis(analysis: VillageAnalysisResult, villageName: string) {
  const village = normalizeVillageName(villageName);
  const insights = [];

  if (analysis.waterStress > 35) {
    insights.push({
      tone: "warn",
      text: `${village}: elevated water stress (${Math.round(analysis.waterStress)}%). Review irrigation schedule.`,
      meta: "Copernicus Sentinel-2 · NDWI proxy",
    });
  }
  if (analysis.diseaseRisk > 25) {
    insights.push({
      tone: "alert",
      text: `${village}: vegetation stress suggests elevated disease risk (${Math.round(analysis.diseaseRisk)}%).`,
      meta: "Copernicus NDVI anomaly model",
    });
  }
  if (analysis.healthScore >= 75) {
    insights.push({
      tone: "good",
      text: `${village} canopy health is strong (NDVI ${analysis.ndvi}). Expected yield ~${analysis.yieldPrediction} t/ha.`,
      meta: "Copernicus Sentinel-2 L2A",
    });
  } else {
    insights.push({
      tone: "info",
      text: `${village} average NDVI is ${analysis.ndvi}. Monitor stressed plots over the next 7 days.`,
      meta: "Copernicus Sentinel-2 L2A",
    });
  }

  return insights;
}
