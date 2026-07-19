/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, StaffRole } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  MessageSquare, 
  Bot, 
  User, 
  Globe, 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  Mic, 
  MicOff, 
  Volume2, 
  HelpCircle,
  Activity
} from "lucide-react";

interface ChatAssistantProps {
  currentRole: StaffRole;
  selectedZoneName: string | null;
}

const PRESET_LANGUAGES = [
  { code: "English", label: "English", flag: "🇺🇸" },
  { code: "Spanish", label: "Español", flag: "🇪🇸" },
  { code: "French", label: "Français", flag: "🇫🇷" },
  { code: "Portuguese", label: "Português", flag: "🇧🇷" },
  { code: "Japanese", label: "日本語", flag: "🇯🇵" },
  { code: "German", label: "Deutsch", flag: "🇩🇪" },
  { code: "Arabic", label: "العربية", flag: "🇲🇦" },
];

const FAN_SUGGESTIONS = [
  "Where is the shortest restroom queue?",
  "Which gate has the shortest wait time?",
  "Is the stadium powered by renewable energy?",
  "Where can I find food in Zone B?",
];

const STAFF_SUGGESTIONS = [
  "How should I redirect fans from East Gate?",
  "Draft an announcement for Zone D crowd warning",
  "Summarize active emergency tasks and priorities",
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ currentRole, selectedZoneName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! I am **StadiumAIst**, your real-time venue copilot for the **FIFA World Cup 2026**. I have live operational feeds on concessions, gate lines, safety alerts, and green statistics. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [preferredLang, setPreferredLang] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningTimer, setListeningTimer] = useState<NodeJS.Timeout | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll container only, preventing full page scroll jumping on refresh or update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          role: currentRole,
          preferredLanguage: preferredLang,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: "model",
            text: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        throw new Error(data.error || "Failed to call assistant API.");
      }
    } catch (err: any) {
      console.warn("Express backend API offline. Activating Stadium Local Companion mode fallback.", err);
      
      const query = text.toLowerCase();
      let fallbackText = "";

      if (query.includes("concession") || query.includes("food") || query.includes("eat") || query.includes("drink") || query.includes("beer") || query.includes("kiosk") || query.includes("hungry") || query.includes("restaurant")) {
        fallbackText = "🍔 **Stadium Food & Concessions Guide**:\n\n- **Zone A (North)**: Quick-bites, popcorn, soda, and hot dogs. (Wait line: ~12 min)\n- **Zone B (East)**: World Cup Official Souvenirs & Snack Station. (Wait line: ~25 min)\n- **Zone C (South)**: Premium VIP Hospitality Lounges & international buffet kiosks. (Wait line: ~18 min)\n- **Zone D (West)**: Mega Food Court with local food trucks and soft drinks. (Wait line: ~30 min)";
      } else if (query.includes("queue") || query.includes("wait") || query.includes("delay") || query.includes("line") || query.includes("time") || query.includes("slow")) {
        fallbackText = "⏱️ **Current Live Wait Times (Local Sensors)**:\n\n- **Zone A (North)**: Gates: 8m | Food: 12m | Restrooms: 5m\n- **Zone B (East)**: Gates: 22m | Food: 25m | Restrooms: 15m\n- **Zone C (South)**: Gates: 18m | Food: 18m | Restrooms: 10m\n- **Zone D (West)**: Gates: 35m | Food: 30m | Restrooms: 22m\n\n*Pro-tip:* Head over to Zone A (North Gate) or Zone C (South Gate) to bypass crowd bottlenecks!";
      } else if (query.includes("gate") || query.includes("open") || query.includes("close") || query.includes("g1") || query.includes("g2") || query.includes("g3") || query.includes("g4") || query.includes("entrance") || query.includes("exit")) {
        fallbackText = "🚧 **Stadium Gates & Access Control Status**:\n\n- **Gate 1 (North)**: 🟢 **OPEN** (Flow rate: 85 fans/min, Average wait: 8 min)\n- **Gate 2 (East)**: 🟡 **SLOW** (Flow rate: 40 fans/min, Average wait: 22 min due to scanner upgrade)\n- **Gate 3 (South)**: 🟢 **OPEN** (Flow rate: 70 fans/min, Average wait: 18 min)\n- **Gate 4 (West)**: 🔴 **CLOSED** (Flow rate: 0 fans/min, Wait: 0 min - Traffic diverted to South-West pathways)";
      } else if (query.includes("eco") || query.includes("green") || query.includes("recycle") || query.includes("solar") || query.includes("sustainable") || query.includes("water") || query.includes("waste") || query.includes("carbon")) {
        fallbackText = "🌱 **FIFA Green Stadium Sustainability Telemetry**:\n\n- **Solar Energy**: 450 kWh generated today (Target: 500 kWh - **On Track**)\n- **Waste Diverted**: 85% of plastic/cups diverted from landfill (Target: 90% - **Excellent**)\n- **Recycled Water**: 120 kL consumed for cooling/gardens (Target: 150 kL - **Needs Improvement**)\n- **Eco-Products**: 98% biodegradable food containers in-use across kiosks!";
      } else if (query.includes("emergency") || query.includes("alert") || query.includes("security") || query.includes("hazard") || query.includes("congest") || query.includes("accident") || query.includes("fire")) {
        fallbackText = "🚨 **Active Safety & Tactical Alerts**:\n\n- **Zone D Exit Corridor Congestion (CRITICAL)**: Gate 4 closure has created extreme foot-traffic bottleneck. Volunteer squads are dispatched to assist.\n- **Lost Child (RESOLVED)**: A 7-year-old child wearing a red FIFA cap has been reunited with family near North Gate.\n\n*Staff members are requested to consult the Operations Command HUD to claim tasks.*";
      } else if (query.includes("crowd") || query.includes("heatmap") || query.includes("sensor") || query.includes("capacity") || query.includes("people") || query.includes("density")) {
        fallbackText = "📊 **Stadium Crowd Occupancy & Live Capacity**:\n\n- **Zone A**: 43% full (6,500 / 15,000 capacity - **Normal**)\n- **Zone B**: 91% full (16,500 / 18,000 capacity - **Crowded**)\n- **Zone C**: 94% full (14,200 / 15,000 capacity - **Crowded**)\n- **Zone D**: 98% full (11,800 / 12,000 capacity - **Critical Congestion**)\n\n*Sensors indicate high density at the West Concourse. Please guide incoming fans away from Zone D.*";
      } else if (query.includes("who are you") || query.includes("stadiumaist") || query.includes("assistant") || query.includes("copilot") || query.includes("help") || query.includes("introduce")) {
        fallbackText = "Hello! I am **StadiumAIst**, your real-time FIFA Stadium operations assistant. I can help visitors find food kiosks, check gate times, track green metrics, and assist managers with staff coordination.";
      } else if (query.includes("announcement") || query.includes("draft") || query.includes("warning") || query.includes("broadcast") || query.includes("zone d")) {
        fallbackText = "📢 **Draft Broadcast for Zone D Crowd Warning**:\n\n*\"Attention fans in Zone D (West Concourse): Severe exit corridor congestion is reported. For your safety and faster exit, please proceed toward the South-West walkways and follow security instructions. Avoid waiting in concourse lobbies. Thank you for your cooperation.\"*";
      } else {
        fallbackText = "👋 Welcome! I am **StadiumAIst**, your real-time stadium companion.\n\nI can assist you with live gate times, concessions, green initiatives, and operations updates.\n\n*Try asking me about*:\n- **'Gate wait times'**\n- **'How is the crowd?'** or **'Zone D status'**\n- **'Food kiosks'** or **'Where to eat'**\n- **'Green eco metrics'** or **'Solar power'**\n- **'Draft announcement for crowd warning'**";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "model",
          text: fallbackText,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceButtonClick = () => {
    if (isListening) {
      if (listeningTimer) clearTimeout(listeningTimer);
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate speech-to-text recognition timeout
      const timer = setTimeout(() => {
        setIsListening(false);
        // Dispatch simulated recognized text
        const simulatedVoiceQueries = [
          "Where is the nearest food concession?",
          "Are there any delays at Gate 3?",
          "What is the current safety corridor score?",
        ];
        const randomQuery = simulatedVoiceQueries[Math.floor(Math.random() * simulatedVoiceQueries.length)];
        handleSendMessage(randomQuery);
      }, 3500);
      setListeningTimer(timer);
    }
  };

  const suggestions = currentRole === StaffRole.FAN ? FAN_SUGGESTIONS : STAFF_SUGGESTIONS;

  return (
    <div id="ai-assistant-card" className="bg-white border border-[#22c55e]/20 flex flex-col h-[540px] overflow-hidden relative rounded-[24px] shadow-[0_8px_30px_rgba(21,128,61,0.03)]">
      {/* Top green indicator glow line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#15803d] to-[#22c55e]" />
      
      {/* Card Header */}
      <div className="px-5 py-4 bg-[#f0f7f4] border-b border-[#22c55e]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* Floating Neon AI Icon container */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#15803d] to-[#22c55e] flex items-center justify-center border border-white/20 shadow-[0_4px_12px_rgba(21,128,61,0.2)] relative group overflow-hidden">
            <Bot className="w-5 h-5 text-white relative z-10 animate-pulse" />
            <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 font-display uppercase tracking-wider">
              Gemini Stadium Copilot
              <Sparkles className="w-3.5 h-3.5 text-[#15803d] fill-[#15803d]/20" />
            </h3>
            <span className="text-[10px] text-[#15803d] flex items-center gap-1 mt-0.5 font-semibold">
              <span className="w-1.5 h-1.5 bg-[#15803d] rounded-full animate-ping" />
              ON-LINE // V4 CORRIDORS ACTIVE
            </span>
          </div>
        </div>

        {/* Language dropdown */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#22c55e]/20">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={preferredLang}
            onChange={(e) => setPreferredLang(e.target.value)}
            className="bg-transparent border-none text-slate-700 text-xs focus:outline-none cursor-pointer pr-1"
          >
            {PRESET_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-[#f0f7f4] text-slate-800">
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/70 pitch-lines-overlay">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isBot = msg.role === "model";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex gap-3.5 max-w-[85%] ${isBot ? "" : "ml-auto flex-row-reverse"}`}
              >
                {/* Profile Bubble */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isBot 
                    ? "bg-[#f0f7f4] border-[#22c55e]/25 text-[#15803d] shadow-sm" 
                    : "bg-gradient-to-tr from-[#15803d] to-[#22c55e] border-white/15 text-white shadow-sm"
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message bubble */}
                <div className="space-y-1">
                  <div className={`rounded-2xl p-3.5 text-xs leading-relaxed border ${
                    isBot 
                      ? "bg-white border-[#22c55e]/20 text-slate-700 shadow-sm" 
                      : "bg-[#15803d] border-[#15803d] text-white font-medium shadow-sm"
                  }`}>
                    {/* Simplistic Markdown Support (bolding and spacing) */}
                    {msg.text.split("\n").map((line, idx) => {
                      const parts = line.split("**");
                      return (
                        <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                          {parts.map((part, pIdx) => {
                            if (pIdx % 2 === 1) {
                              return <strong key={pIdx} className={`font-extrabold ${isBot ? "text-[#15803d]" : "text-emerald-200"}`}>{part}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                  <span className={`text-[9px] text-slate-400 font-bold font-mono block px-1 ${isBot ? "" : "text-right"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Thinking / Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-xl bg-[#f0f7f4] border border-[#22c55e]/25 text-[#15803d] flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-[#22c55e]/15 rounded-2xl p-3.5 text-xs text-slate-500 italic flex items-center gap-2.5 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-[#15803d] animate-pulse" />
              <span>Scanning tactical sensor feeds...</span>
            </div>
          </div>
        )}

        {/* Voice Listening Waveform Panel */}
        {isListening && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0 animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
            <div className="bg-red-50/50 border border-red-500/10 rounded-2xl p-3.5 text-xs text-red-800 flex flex-col gap-2 w-full shadow-sm">
              <span className="font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                Listening to voice prompts...
              </span>
              {/* Pulsing soundwave animation spikes */}
              <div className="flex items-center gap-1 h-4 px-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                  <span 
                    key={item} 
                    className="w-[3px] bg-red-500 rounded-full animate-bounce" 
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      animationDuration: `${0.4 + Math.random() * 0.4}s` 
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Suggestion Pills */}
      <div className="px-5 py-3 bg-white border-t border-[#22c55e]/15 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2 relative z-10">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sug)}
            disabled={isLoading || isListening}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f0f7f4] border border-[#22c55e]/20 hover:border-[#15803d]/40 text-slate-600 hover:text-slate-800 text-[11px] font-semibold rounded-full transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.03] active:scale-[0.98]"
          >
            {sug}
            <ArrowRight className="w-3 h-3 text-[#15803d]" />
          </button>
        ))}
      </div>

      {/* Chat Input & Voice/Mic Controls */}
      <div className="p-4 bg-[#f0f7f4]/60 border-t border-[#22c55e]/15 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex gap-2.5"
        >
          {/* Simulated Voice Command Trigger */}
          <button
            type="button"
            onClick={handleVoiceButtonClick}
            className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 border ${
              isListening
                ? "bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                : "bg-white hover:bg-slate-50 text-[#15803d] border-[#22c55e]/20 hover:border-[#15803d]/30"
            }`}
            title="Start voice command"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || isListening}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (inputText.trim()) {
                  handleSendMessage(inputText);
                }
              }
            }}
            placeholder={
              selectedZoneName 
                ? `Ask AI about ${selectedZoneName} queue state...` 
                : "Ask about restroom queues, gate flows, or green actions..."
            }
            rows={2}
            className="flex-1 bg-white border border-[#22c55e]/25 rounded-xl px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] disabled:opacity-50 resize-y min-h-[52px] max-h-[120px] overflow-y-auto leading-relaxed"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isListening}
            className="p-3 bg-gradient-to-r from-[#15803d] to-[#22c55e] hover:opacity-95 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.04] active:scale-[0.96]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
