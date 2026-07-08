import React, { useState, useEffect } from "react";
import { Mic, Play, Pause, Volume2 } from "lucide-react";
import { useDashboardContext } from "@/context/DashboardContext";

function generateTeluguAdvisory(villageName: string, ndvi: number, ndmi: number, evi: number, savi: number): string {
  let advisory = `రైతుగారూ, `;

  // NDVI
  if (ndvi >= 0.6) {
    advisory += "మీ పంట ప్రస్తుతం మంచి ఆరోగ్య స్థితిలో ఉంది. ";
  } else if (ndvi >= 0.4) {
    advisory += "మీ పంట స్థితి సాధారణంగా ఉంది. ";
  } else {
    advisory += "మీ పంట ఆరోగ్య పరిస్థితి బలహీనంగా ఉంది. ";
  }

  // NDMI
  if (ndmi < -0.2) {
    advisory += "మీ పొలంలో నీటి కొరత కనిపిస్తోంది. వెంటనే నీరు అందించండి. ";
  } else if (ndmi < 0.0) {
    advisory += "మీ పొలంలో తేమ కొంత తగ్గింది. వచ్చే రెండు రోజులలో నీరు అందించడం మంచిది. ";
  }

  // EVI
  if (evi >= 0.4) {
    advisory += "పంట పెరుగుదల బాగా కొనసాగుతోంది. ";
  } else if (evi >= 0.28) {
    advisory += "పంట పెరుగుదల సాధారణంగా కొనసాగుతోంది. ";
  } else {
    advisory += "పంట పెరుగుదల మందగించింది. ";
  }

  // SAVI
  if (savi < 0.3) {
    advisory += "కొన్ని ప్రాంతాల్లో పంట సాంద్రత తక్కువగా ఉంది. ";
  }

  advisory += "ధన్యవాదాలు.";

  return advisory;
}

export function FarmerVoiceAssistant() {
  const { villageAnalysis, searchQuery } = useDashboardContext();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Stop any playing audio if context changes
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }

    if (villageAnalysis && searchQuery) {
      const text = generateTeluguAdvisory(
        searchQuery,
        villageAnalysis.ndvi ?? 0,
        villageAnalysis.ndmi ?? 0,
        villageAnalysis.evi ?? 0,
        villageAnalysis.savi ?? 0
      );
      
      const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=te`;
      const newAudio = new Audio(audioUrl);
      newAudio.playbackRate = 1.25;
      
      newAudio.onended = () => setIsPlaying(false);
      newAudio.onerror = () => {
        console.error("Audio failed to load");
        setIsPlaying(false);
      };
      
      setAudio(newAudio);
      setIsReady(true);
      setIsPlaying(false);
    } else {
      setIsReady(false);
      setAudio(null);
    }
  }, [villageAnalysis, searchQuery]);

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((e) => {
        console.error("Playback failed:", e);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  if (!isReady) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <button
        onClick={togglePlay}
        className="group relative flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-emerald-400/50"
      >
        {/* Pulse animation when available but not playing */}
        {!isPlaying && (
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-20" />
        )}
        
        <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-1" />
          )}
        </div>
        
        <div className="flex flex-col items-start mr-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
            {isPlaying ? "Pause Advisory" : "Play Advisory"}
          </span>
          <span className="text-sm font-black tracking-tight flex items-center gap-1">
            <Volume2 className="h-3.5 w-3.5" />
            Farmer Voice Assistant
          </span>
        </div>
      </button>
    </div>
  );
}
