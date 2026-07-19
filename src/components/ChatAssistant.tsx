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
      text: "Hello! I am **StadiumAIst**, your real-time stadium assistant for the **FIFA World Cup 2026**. I have live operational feeds on concessions, gate lines, safety alerts, and green statistics. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [preferredLang, setPreferredLang] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningTimer, setListeningTimer] = useState<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "model",
          text: `⚠️ **API Service Offline**: ${err.message || "Could not reach StadiumAIst server. Check your Gemini API setup."}`,
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
    <div id="ai-assistant-card" className="glass-panel-glow flex flex-col h-[540px] overflow-hidden relative">
      {/* Top neon indicator glow line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#005CFF] via-[#00D4FF] to-[#6C4DFF]" />
      
      {/* Card Header */}
      <div className="px-5 py-4 bg-[#0B1228]/80 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* Floating Neon AI Icon container */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#005CFF] to-[#6C4DFF] flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(0,212,255,0.35)] relative group overflow-hidden">
            <Bot className="w-5 h-5 text-white relative z-10 animate-pulse" />
            <div className="absolute inset-0 bg-[#00D4FF]/25 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
              Gemini Stadium Copilot
              <Sparkles className="w-3.5 h-3.5 text-[#00D4FF] fill-[#00D4FF]/20" />
            </h3>
            <span className="text-[10px] text-[#00C853] flex items-center gap-1 mt-0.5 font-semibold">
              <span className="w-1.5 h-1.5 bg-[#00C853] rounded-full animate-ping" />
              ON-LINE // V4 CORIDORS ACTIVE
            </span>
          </div>
        </div>

        {/* Language dropdown */}
        <div className="flex items-center gap-2 bg-[#050816]/60 px-3 py-1.5 rounded-full border border-white/[0.06]">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={preferredLang}
            onChange={(e) => setPreferredLang(e.target.value)}
            className="bg-transparent border-none text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
          >
            {PRESET_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-[#0B1228] text-slate-200">
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#050816]/45 pitch-lines-overlay">
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
                    ? "bg-[#121932] border-white/[0.08] text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.15)]" 
                    : "bg-gradient-to-tr from-[#005CFF] to-[#6C4DFF] border-white/15 text-white"
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message bubble */}
                <div className="space-y-1">
                  <div className={`rounded-2xl p-3.5 text-xs leading-relaxed border ${
                    isBot 
                      ? "bg-[#121932]/90 border-white/[0.06] text-slate-200" 
                      : "bg-[#6C4DFF]/90 border-white/[0.08] text-white font-medium shadow-lg shadow-[#6C4DFF]/15"
                  }`}>
                    {/* Simplistic Markdown Support (bolding and spacing) */}
                    {msg.text.split("\n").map((line, idx) => {
                      const parts = line.split("**");
                      return (
                        <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                          {parts.map((part, pIdx) => {
                            if (pIdx % 2 === 1) {
                              return <strong key={pIdx} className="font-extrabold text-[#00D4FF] glow-text-ai">{part}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                  <span className={`text-[9px] text-slate-500 font-bold font-mono block px-1 ${isBot ? "" : "text-right"}`}>
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
            <div className="w-8 h-8 rounded-xl bg-[#121932] border border-white/[0.08] text-[#00D4FF] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,212,255,0.15)]">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#121932]/75 border border-white/[0.06] rounded-2xl p-3.5 text-xs text-slate-400 italic flex items-center gap-2.5">
              <Activity className="w-3.5 h-3.5 text-[#00D4FF] animate-pulse" />
              <span>StadiumAIst is scanning crowd telemetry sensors...</span>
            </div>
          </div>
        )}

        {/* Voice Listening Waveform Panel */}
        {isListening && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-500/20 text-[#FF3B5C] flex items-center justify-center shrink-0 animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
            <div className="bg-rose-950/40 border border-rose-500/20 rounded-2xl p-3.5 text-xs text-rose-200 flex flex-col gap-2 w-full">
              <span className="font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#FF3B5C] rounded-full animate-ping" />
                Listening to voice prompts...
              </span>
              {/* Pulsing soundwave animation spikes */}
              <div className="flex items-center gap-1 h-4 px-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                  <span 
                    key={item} 
                    className="w-[3px] bg-[#FF3B5C] rounded-full animate-bounce" 
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

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Pills */}
      <div className="px-5 py-3 bg-[#050816]/80 border-t border-white/[0.05] overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2 relative z-10">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sug)}
            disabled={isLoading || isListening}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#121932] border border-white/[0.08] hover:border-[#00D4FF]/40 text-slate-300 hover:text-white text-[11px] font-semibold rounded-full transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.03] active:scale-[0.98]"
          >
            {sug}
            <ArrowRight className="w-3 h-3 text-[#00D4FF]" />
          </button>
        ))}
      </div>

      {/* Chat Input & Voice/Mic Controls */}
      <div className="p-4 bg-[#0B1228]/95 border-t border-white/[0.06] relative z-10">
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
                ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(255,59,92,0.4)]"
                : "bg-[#121932] hover:bg-[#121932]/85 text-[#00D4FF] border-white/[0.06] hover:border-[#00D4FF]/30"
            }`}
            title="Start voice command"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || isListening}
            placeholder={
              selectedZoneName 
                ? `Ask AI about ${selectedZoneName} queue state...` 
                : "Ask about restroom queues, gate flows, or green actions..."
            }
            className="flex-1 bg-[#050816] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isListening}
            className="p-3 bg-gradient-to-r from-[#005CFF] to-[#6C4DFF] hover:opacity-90 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-[#005CFF]/20 disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.04] active:scale-[0.96]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
