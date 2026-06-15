import React, { useState, useEffect } from "react";
import { Bot, X, Search, Send } from "lucide-react";

export function AiAssistantDrawer({ onClose, farm, crop }: { onClose: () => void; farm: string; crop: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    let stateId = "pb";
    if (farm === "Maharashtra Grape Orchards") stateId = "mh";
    else if (farm === "Vinh Long Estate") stateId = "vl";
    fetch(`http://127.0.0.1:8000/api/ai/chat/${stateId}`)
      .then(r => r.json())
      .then(data => setMessages(data))
      .catch(console.error);
  }, [farm]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { who: "me", text: input };
    setMessages([...messages, newMsg]);
    setInput("");

    let stateId = "pb";
    if (farm === "Maharashtra Grape Orchards") stateId = "mh";
    else if (farm === "Vinh Long Estate") stateId = "vl";

    fetch(`http://127.0.0.1:8000/api/ai/chat/${stateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input })
    })
      .then(r => r.json())
      .then(data => {
        setMessages(prev => [...prev, data.reply]);
      })
      .catch(console.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">AgriTwin AI Assistant</div>
            <div className="text-[11px] text-muted-foreground">Precision Farming Diagnostic Model</div>
          </div>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.who === "me" ? "justify-end" : ""}`}>
              <div className={`max-w-[85%] text-[13px] leading-relaxed rounded-2xl px-3 py-2 ${m.who === "me" ? "bg-primary text-primary-foreground font-semibold" : "bg-accent text-foreground"}`}>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 h-11 rounded-xl border border-border pl-3 pr-1 focus-within:border-primary">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input 
              placeholder={`Ask about ${crop} condition...`} 
              className="flex-1 bg-transparent text-sm outline-none" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="h-8 w-8 rounded-lg grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
