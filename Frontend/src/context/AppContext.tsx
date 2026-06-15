import React, { createContext, useContext, useState, useEffect } from "react";
import satelliteImg from "@/assets/satellite-farm.jpg";
import punjabFarmImg from "@/assets/punjab-wheat-farm.png";
import maharashtraFarmImg from "@/assets/maharashtra-grape-farm.png";
import wheatEarImg from "@/assets/wheat-ear.png";
import grapeClusterImg from "@/assets/grape-cluster.png";
import fruitHealthy from "@/assets/dragonfruit-healthy.png";
import fruitNutrient from "@/assets/dragonfruit-nutrient.png";
import fruitWater from "@/assets/dragonfruit-water.png";
import fruitDisease from "@/assets/dragonfruit-disease.png";

import {
  Activity, Bell, Bot, Bug, Calendar, ChevronDown, ChevronLeft,
  ChevronRight, CloudRain, CloudSun, Compass, Droplets, FileBarChart, FlaskConical,
  Grid3x3, Hexagon, Leaf, MapPin, Menu, Microscope,
  Plane, Play, Search, Send, SettingsIcon, Sparkles, Sprout, Sun, Target,
  Thermometer, TrendingUp, Wind, Wheat, X, Calendar as CalIcon, Globe
} from "lucide-react";

export const IMG_MAP: Record<string, string> = {
  satelliteImg, punjabFarmImg, maharashtraFarmImg, wheatEarImg, grapeClusterImg,
  fruitHealthy, fruitNutrient, fruitWater, fruitDisease
};

export const ICON_MAP: Record<string, any> = {
  Activity, Bell, Bot, Bug, Calendar, ChevronDown, ChevronLeft,
  ChevronRight, CloudRain, CloudSun, Compass, Droplets, FileBarChart, FlaskConical,
  Grid3x3, Hexagon, Leaf, MapPin, Menu, Microscope,
  Plane, Play, Search, Send, SettingsIcon, Sparkles, Sprout, Sun, Target,
  Thermometer, TrendingUp, Wind, Wheat, X, CalIcon, Globe
};

interface AppContextType {
  farm: string;
  setFarm: (farm: string) => void;
  crop: string;
  setCrop: (crop: string) => void;
  activeFarm: any;
  weatherData: any;
  nationalNdvi: any;
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  addFieldOpen: boolean;
  setAddFieldOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [farm, setFarm] = useState("Punjab Wheat Belt");
  const [crop, setCrop] = useState("Wheat");
  const [aiOpen, setAiOpen] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);

  const [activeFarmData, setActiveFarmData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [nationalNdvi, setNationalNdvi] = useState<any>(null);

  // Sync crops
  useEffect(() => {
    if (farm === "Punjab Wheat Belt") {
      setCrop("Wheat");
    } else if (farm === "Maharashtra Grape Orchards") {
      setCrop("Grapes");
    } else if (farm === "Vinh Long Estate" || farm === "Mekong Delta Farm") {
      setCrop("Dragon Fruit");
    }
  }, [farm]);

  // National NDVI fetch
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/national/ndvi")
      .then(r => r.json())
      .then(data => setNationalNdvi(data))
      .catch(e => console.error(e));
  }, []);

  // Farm and Weather data fetch
  useEffect(() => {
    let stateId = "pb";
    if (farm === "Maharashtra Grape Orchards" || farm === "Backend-mh") stateId = "mh";
    else if (farm === "Vinh Long Estate" || farm === "Backend-vl") stateId = "vl";
    else if (farm.startsWith("Backend-")) stateId = farm.split("-")[1];

    fetch(`http://127.0.0.1:8000/api/farm/${stateId}`)
      .then(r => r.json())
      .then(data => {
        data.backdrop = IMG_MAP[data.backdrop] || satelliteImg;
        data.kpis = data.kpis?.map((k: any) => ({ ...k, icon: ICON_MAP[k.icon] || Leaf })) || [];
        data.insights = data.insights?.map((i: any) => ({ ...i, icon: ICON_MAP[i.icon] || Leaf })) || [];
        data.qualityFruit = data.qualityFruit?.map((f: any) => ({ ...f, img: IMG_MAP[f.img] || wheatEarImg })) || [];
        setActiveFarmData(data);
        setCrop(data.crop);
      })
      .catch(e => console.error(e));

    fetch(`http://127.0.0.1:8000/api/weather/${stateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.forecast) {
            data.forecast = data.forecast.map((w: any) => ({ ...w, icon: ICON_MAP[w.icon] || Sun }));
        }
        setWeatherData(data);
      })
      .catch(e => console.error(e));
  }, [farm]);

  return (
    <AppContext.Provider
      value={{
        farm,
        setFarm,
        crop,
        setCrop,
        activeFarm: activeFarmData,
        weatherData,
        nationalNdvi,
        aiOpen,
        setAiOpen,
        addFieldOpen,
        setAddFieldOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
