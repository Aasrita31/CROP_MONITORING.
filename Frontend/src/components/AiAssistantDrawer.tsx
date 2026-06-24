import React, { useState, useEffect } from "react";
import { Bot, X, Search, Send } from "lucide-react";

import { useApp } from "@/context/AppContext";

export function AiAssistantDrawer({ onClose, farm, crop }: { onClose: () => void; farm: string; crop: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const { activeFarm, setHighlightedFields } = useApp();

  const PRESET_QUERIES = [
    "Which field needs attention today?",
    "Show disease hotspots",
    "Which area requires irrigation?",
    "Which field has the highest yield prediction?"
  ];

  useEffect(() => {
    let stateId = "pb";
    if (farm === "Maharashtra Grape Orchards") stateId = "mh";
    else if (farm === "Vinh Long Estate") stateId = "vl";
    fetch(`http://127.0.0.1:8080/api/ai/chat/${stateId}`)
      .then(r => r.json())
      .then(data => setMessages(data))
      .catch(console.error);
  }, [farm]);

  const handleSend = (textInput?: string) => {
    const q = textInput || input;
    if (!q.trim()) return;
    const newMsg = { who: "me", text: q };
    setMessages(prev => [...prev, newMsg]);
    if (!textInput) setInput("");

    // Simulate map highlighting based on query
    if (activeFarm && activeFarm.fields) {
      if (q.includes("needs attention")) {
        const affected = activeFarm.fields.filter((f: any) => f.health < 75).map((f: any) => f.id);
        setHighlightedFields(affected);
      } else if (q.includes("disease hotspots")) {
        const affected = activeFarm.fields.filter((f: any) => f.dominant === "disease" || f.disease > 20).map((f: any) => f.id);
        setHighlightedFields(affected);
      } else if (q.includes("requires irrigation")) {
        const affected = activeFarm.fields.filter((f: any) => f.dominant === "water" || f.water < 60).map((f: any) => f.id);
        setHighlightedFields(affected);
      } else if (q.includes("highest yield")) {
        const sorted = [...activeFarm.fields].sort((a: any, b: any) => parseFloat(b.yield) - parseFloat(a.yield));
        if (sorted.length > 0) setHighlightedFields([sorted[0].id]);
      } else {
        setHighlightedFields([]);
      }
    }

    let stateId = "pb";
    if (farm === "Maharashtra Grape Orchards") stateId = "mh";
    else if (farm === "Vinh Long Estate") stateId = "vl";

    fetch(`http://127.0.0.1:8080/api/ai/chat/${stateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: q })
    })
      .then(r => r.json())
      .then(data => {
        setMessages(prev => [...prev, data.reply]);
      })
      .catch(console.error);
  };

  // Clear highlights on close
  useEffect(() => {
    return () => setHighlightedFields([]);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end pointer-events-none">
      <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto shadow-2xl">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes brilliantGold {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes intenseGlow {
            0%, 100% { box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.3), 0 4px 20px rgba(255, 215, 0, 0.2); }
            50% { box-shadow: inset 0 0 40px rgba(255, 215, 0, 0.7), 0 4px 30px rgba(255, 215, 0, 0.5); }
          }
          .gold-ai-header {
            background: linear-gradient(270deg, #fcd34d, #fbbf24, #f59e0b, #fbbf24, #fcd34d);
            background-size: 300% 300%;
            animation: brilliantGold 4s ease infinite, intenseGlow 2.5s ease-in-out infinite;
            border-bottom: 2px solid #b45309 !important;
            color: #451a03; 
          }
          .gold-ai-header .subtitle {
            color: #78350f;
          }
          .gold-ai-header .icon-bg {
            background: #451a03 !important; 
            color: #fbbf24 !important; 
            box-shadow: 0 0 10px rgba(69, 26, 3, 0.5);
          }
          .gold-ai-header .close-btn {
            color: #78350f;
          }
          .gold-ai-header .close-btn:hover {
            background: rgba(69, 26, 3, 0.15);
            color: #451a03;
          }
        `}} />
        <div className="gold-ai-header p-4 border-b border-border flex items-center gap-3 relative z-10">
          <div className="icon-bg h-9 w-9 rounded-lg grid place-items-center">
            <Bot className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">AgriTwin AI Assistant</div>
            <div className="subtitle text-[10px] font-bold uppercase tracking-widest mt-0.5">Precision Farming Diagnostic Model</div>
          </div>
          <button onClick={onClose} className="close-btn ml-auto p-1.5 rounded transition"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.who === "me" ? "justify-end" : ""}`}>
              <div className={`max-w-[85%] text-[13px] leading-relaxed rounded-2xl px-3 py-2 ${m.who === "me" ? "bg-primary text-primary-foreground font-semibold" : "bg-accent text-foreground"}`}>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border bg-card/50">
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_QUERIES.map(q => (
              <button 
                key={q} 
                onClick={() => handleSend(q)}
                className="text-[10px] bg-accent hover:bg-primary/20 hover:text-primary transition px-2 py-1.5 rounded-md border border-border text-muted-foreground whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 h-11 rounded-xl border border-border pl-3 pr-1 focus-within:border-primary bg-card">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input 
              placeholder={`Ask about ${crop} condition...`} 
              className="flex-1 bg-transparent text-sm outline-none" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={() => handleSend()} className="h-8 w-8 rounded-lg grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
