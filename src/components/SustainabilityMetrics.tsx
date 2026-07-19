/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SustainabilityMetric, StaffRole } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { 
  Leaf, 
  Sun, 
  Droplets, 
  Trash2, 
  Award, 
  Sparkles, 
  Loader2, 
  Footprints, 
  Heart, 
  Plus,
  BatteryCharging,
  Zap,
  Globe
} from "lucide-react";

interface SustainabilityMetricsProps {
  metrics: SustainabilityMetric[];
  userRole: StaffRole;
  onUpdateMetric: (category: string, newValue: number) => void;
}

export const SustainabilityMetrics: React.FC<SustainabilityMetricsProps> = ({
  metrics,
  userRole,
  onUpdateMetric,
}) => {
  const [aiInsights, setAiInsights] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"General" | "Water" | "Energy" | "Waste">("General");
  
  // Confetti/success state after fan logs action
  const [loggedAction, setLoggedAction] = useState<string | null>(null);

  const fetchEcoInsights = async (focusArea: string) => {
    setIsGenerating(true);
    setAiInsights("");
    try {
      const response = await fetch("/api/gemini/sustainability-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: focusArea }),
      });
      const data = await response.json();
      if (response.ok) {
        setAiInsights(data.insights);
      } else {
        throw new Error(data.error || "Failed to fetch green insights.");
      }
    } catch (err: any) {
      setAiInsights(`⚠️ **Eco Advisor Offline**: ${err.message || "Failed to contact Gemini Eco-Advisor. Check configuration."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const logFanAction = (metricCategory: string, increment: number, actionName: string) => {
    const metric = metrics.find((m) => m.category === metricCategory);
    if (metric) {
      const newVal = metric.value + increment;
      onUpdateMetric(metricCategory, newVal);
      
      setLoggedAction(actionName);
      setTimeout(() => setLoggedAction(null), 3000);
    }
  };

  const getMetricIcon = (category: string) => {
    if (category.toLowerCase().includes("solar") || category.toLowerCase().includes("power")) {
      return <Sun className="w-5 h-5 text-amber-400" />;
    }
    if (category.toLowerCase().includes("water")) {
      return <Droplets className="w-5 h-5 text-[#00D4FF]" />;
    }
    if (category.toLowerCase().includes("waste")) {
      return <Trash2 className="w-5 h-5 text-indigo-400" />;
    }
    return <Leaf className="w-5 h-5 text-[#00C853]" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EXCELLENT":
        return "text-[#00C853] bg-[#00C853]/10 border-[#00C853]/25 shadow-[0_0_8px_rgba(0,200,83,0.15)]";
      case "ON_TRACK":
        return "text-[#005CFF] bg-[#005CFF]/10 border-[#005CFF]/25";
      case "NEEDS_IMPROVEMENT":
      default:
        return "text-[#FFC107] bg-[#FFC107]/10 border-[#FFC107]/25";
    }
  };

  return (
    <div id="stadium-sustainability-center" className="glass-panel-glow p-6 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Decorative radial eco blur */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C853]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5 font-display uppercase tracking-wider">
            <Leaf className="w-5 h-5 text-[#00C853] animate-pulse" />
            FIFA Green Planet Advisor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time carbon offsets, eco-friendly energy production, and interactive fan recycling targets.
          </p>
        </div>

        {/* Broadcast style tabs */}
        <div className="flex items-center gap-1.5 bg-[#050816] border border-white/[0.08] p-1 rounded-full shrink-0">
          {["General", "Energy", "Water", "Waste"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                fetchEcoInsights(tab);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#00C853] to-emerald-600 text-white shadow-[0_0_10px_rgba(0,200,83,0.3)] border border-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Gamified Success Pop-up notification */}
      <AnimatePresence>
        {loggedAction && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="absolute top-16 left-1/2 z-50 bg-[#0B1228] border border-[#00C853] text-emerald-100 text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-[#00C853]/10 flex items-center justify-center text-[#00C853]">
              <Award className="w-4 h-4" />
            </div>
            <span>Fan Achievement: <strong>{loggedAction}</strong> registered! Score boosted.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sustainability Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const progress = Math.min(100, Math.round((m.value / m.target) * 100));
          return (
            <div key={m.category} className="bg-[#050816]/60 p-4 rounded-xl border border-white/[0.05] space-y-4 hover:border-white/[0.12] transition-colors premium-card-hover group">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-[#121932] border border-white/[0.04] rounded-xl text-[#00C853]">
                  {getMetricIcon(m.category)}
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border uppercase tracking-wider ${getStatusColor(m.status)}`}>
                  {m.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 leading-snug">{m.category}</h4>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-xl font-mono font-black text-white">{m.value.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    / {m.target.toLocaleString()} {m.unit}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 font-mono">
                  <span>TARGET VALUE PROGRESS</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-[#050816] h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 95 ? "bg-[#00C853]" : progress >= 80 ? "bg-[#005CFF]" : "bg-[#FFC107]"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* Left: Fan Interactive Eco Actions Panel (5 Columns) */}
        <div className="lg:col-span-5 bg-[#050816]/80 border border-white/[0.05] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-black text-[#00C853] uppercase tracking-widest flex items-center gap-2 font-display">
            <Footprints className="w-4 h-4 text-[#00C853] animate-pulse" />
            Interactive Fan Sandbox
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Visiting the venue today? Track your eco-friendly actions to dynamically offsets the stadium carbon footprint score on the live scoreboard.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => logFanAction("Solar Power Generation", 15, "Renewable Energy Saver")}
              className="w-full bg-[#121932]/40 hover:bg-[#121932]/95 border border-white/[0.05] hover:border-[#00C853]/25 p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div>
                <h4 className="text-xs font-bold text-white">Used Solar Charging Canopy</h4>
                <p className="text-[10px] text-slate-400 mt-1">Plugged devices into smart kiosks at zone canopy B (+15 kWh)</p>
              </div>
              <span className="p-2 bg-[#00C853]/10 hover:bg-[#00C853]/20 text-[#00C853] rounded-lg border border-[#00C853]/20 transition-all">
                <Plus className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={() => logFanAction("Waste Diverted from Landfill", 1, "Zero Waste Champion")}
              className="w-full bg-[#121932]/40 hover:bg-[#121932]/95 border border-white/[0.05] hover:border-[#00C853]/25 p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div>
                <h4 className="text-xs font-bold text-white">Biodegradable Trash Composting</h4>
                <p className="text-[10px] text-slate-400 mt-1">Diverted biodegradable cups to composting bins (+1% Waste Diverted)</p>
              </div>
              <span className="p-2 bg-[#00C853]/10 hover:bg-[#00C853]/20 text-[#00C853] rounded-lg border border-[#00C853]/20 transition-all">
                <Plus className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={() => logFanAction("Recycled Water Consumption", 5, "Water Ambassador")}
              className="w-full bg-[#121932]/40 hover:bg-[#121932]/95 border border-white/[0.05] hover:border-[#00C853]/25 p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div>
                <h4 className="text-xs font-bold text-white">Smart Sensor Water Taps</h4>
                <p className="text-[10px] text-slate-400 mt-1">Used sensor smart low-flow greywater faucets (+5 kL savings)</p>
              </div>
              <span className="p-2 bg-[#00C853]/10 hover:bg-[#00C853]/20 text-[#00C853] rounded-lg border border-[#00C853]/20 transition-all">
                <Plus className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>

        {/* Right: AI Sustainability Advisory Logs (7 Columns) */}
        <div className="lg:col-span-7 bg-[#050816]/40 border border-white/[0.05] p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
              <h3 className="text-xs font-black text-[#00D4FF] uppercase tracking-widest flex items-center gap-2 font-display">
                <Sparkles className="w-4 h-4 text-[#00D4FF] animate-pulse" />
                AI Sustainability Advisory
              </h3>

              <button
                onClick={() => fetchEcoInsights(activeTab)}
                disabled={isGenerating}
                className="text-[10px] bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/25 px-3 py-1.5 rounded-full cursor-pointer transition-all font-bold flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Consult Advisor
                  </>
                )}
              </button>
            </div>

            {/* Markdown Display */}
            <div className="text-xs text-slate-300 leading-relaxed space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {aiInsights ? (
                <div className="space-y-3">
                  {aiInsights.split("\n").map((line, idx) => {
                    if (line.startsWith("###")) {
                      return <h4 key={idx} className="text-xs font-black text-white mt-4 mb-1 uppercase tracking-wider font-display">{line.replace("###", "")}</h4>;
                    }
                    if (line.startsWith("##")) {
                      return <h3 key={idx} className="text-xs font-black text-[#00D4FF] mt-5 border-b border-white/[0.06] pb-1.5 font-display">{line.replace("##", "")}</h3>;
                    }
                    if (line.startsWith("-") || line.startsWith("*")) {
                      return (
                        <div key={idx} className="flex gap-2 pl-2">
                          <span className="text-[#00C853]">•</span>
                          <p className="text-slate-300">{line.substring(1).trim()}</p>
                        </div>
                      );
                    }
                    const parts = line.split("**");
                    return (
                      <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                        {parts.map((part, pIdx) => {
                          if (pIdx % 2 === 1) return <strong key={pIdx} className="font-extrabold text-white">{part}</strong>;
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <Leaf className="w-8 h-8 text-slate-700 animate-pulse mb-3" />
                  <p className="font-bold text-slate-300 uppercase tracking-wide text-xs">Advisor Inactive</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                    Select a focus area tab (General, Energy, Water, Waste) and click **"Consult Advisor"** to query Gemini AI model for real-time venue carbon offsets.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Eco Scorecard banner */}
          <div className="border-t border-white/[0.05] pt-4 mt-4 text-[10px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono font-bold">
            <span className="flex items-center gap-1.5 bg-[#00C853]/5 border border-[#00C853]/15 py-1 px-3.5 rounded-full text-[#00C853]">
              <Award className="w-4 h-4 text-[#FFD54F]" />
              FIFA 2026 Stadium Eco Score: <strong>88/100 (Silver Star Award)</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Carbon Offset Neutral Target
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
