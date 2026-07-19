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
      return <Sun className="w-5 h-5 text-amber-500" />;
    }
    if (category.toLowerCase().includes("water")) {
      return <Droplets className="w-5 h-5 text-emerald-600" />;
    }
    if (category.toLowerCase().includes("waste")) {
      return <Trash2 className="w-5 h-5 text-indigo-500" />;
    }
    return <Leaf className="w-5 h-5 text-emerald-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EXCELLENT":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "ON_TRACK":
        return "text-[#15803d] bg-emerald-50 border-[#22c55e]/20";
      case "NEEDS_IMPROVEMENT":
      default:
        return "text-amber-700 bg-amber-50 border-amber-200";
    }
  };

  return (
    <div id="stadium-sustainability-center" className="bg-white border border-[#22c55e]/20 p-6 rounded-[24px] shadow-[0_8px_30px_rgba(21,128,61,0.03)] space-y-6 relative overflow-hidden">
      
      {/* Decorative radial eco blur */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#15803d]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22c55e]/15 pb-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5 font-display uppercase tracking-wider">
            <Leaf className="w-5 h-5 text-[#15803d] animate-pulse" />
            FIFA Green Planet Advisor
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time carbon offsets, eco-friendly energy production, and interactive fan recycling targets.
          </p>
        </div>

        {/* Broadcast style tabs */}
        <div className="flex items-center gap-1.5 bg-[#f0f7f4] border border-[#22c55e]/20 p-1 rounded-full shrink-0">
          {["General", "Energy", "Water", "Waste"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                fetchEcoInsights(tab);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#15803d] to-[#22c55e] text-white shadow-sm border border-white/10"
                  : "text-slate-600 hover:text-[#15803d]"
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
            className="absolute top-16 left-1/2 z-50 bg-white border border-[#22c55e] text-slate-800 text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-[#15803d]">
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
            <div key={m.category} className="bg-[#f0f7f4]/45 p-4 rounded-xl border border-[#22c55e]/15 space-y-4 hover:border-[#15803d]/30 transition-colors shadow-sm group">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-white border border-[#22c55e]/15 rounded-xl text-[#15803d]">
                  {getMetricIcon(m.category)}
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border uppercase tracking-wider ${getStatusColor(m.status)}`}>
                  {m.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 leading-snug">{m.category}</h4>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-xl font-mono font-black text-slate-800">{m.value.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-medium">
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
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 95 ? "bg-[#15803d]" : progress >= 80 ? "bg-[#22c55e]" : "bg-amber-500"
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
        <div className="lg:col-span-5 bg-white border border-[#22c55e]/20 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-[#15803d] uppercase tracking-widest flex items-center gap-2 font-display">
            <Footprints className="w-4 h-4 text-[#15803d] animate-pulse" />
            Interactive Fan Sandbox
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Visiting the venue today? Track your eco-friendly actions to dynamically offset the stadium carbon footprint score on the live scoreboard.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => logFanAction("Solar Power Generation", 15, "Renewable Energy Saver")}
              className="w-full bg-[#f0f7f4]/40 hover:bg-[#f0f7f4]/80 border border-[#22c55e]/20 hover:border-[#15803d]/30 p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800">Used Solar Charging Canopy</h4>
                <p className="text-[10px] text-slate-500 mt-1">Plugged devices into smart kiosks at zone canopy B (+15 kWh)</p>
              </div>
              <span className="p-2 bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] rounded-lg border border-[#15803d]/20 transition-all">
                <Plus className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={() => logFanAction("Waste Diverted from Landfill", 1, "Zero Waste Champion")}
              className="w-full bg-[#f0f7f4]/40 hover:bg-[#f0f7f4]/80 border border-[#22c55e]/20 hover:border-[#15803d]/30 p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800">Biodegradable Trash Composting</h4>
                <p className="text-[10px] text-slate-500 mt-1">Diverted biodegradable cups to composting bins (+1% Waste Diverted)</p>
              </div>
              <span className="p-2 bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] rounded-lg border border-[#15803d]/20 transition-all">
                <Plus className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={() => logFanAction("Recycled Water Consumption", 5, "Water Ambassador")}
              className="w-full bg-[#f0f7f4]/40 hover:bg-[#f0f7f4]/80 border border-[#22c55e]/20 hover:border-[#15803d]/30 p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800">Smart Sensor Water Taps</h4>
                <p className="text-[10px] text-slate-500 mt-1">Used sensor smart low-flow greywater faucets (+5 kL savings)</p>
              </div>
              <span className="p-2 bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] rounded-lg border border-[#15803d]/20 transition-all">
                <Plus className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>

        {/* Right: AI Sustainability Advisory Logs (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-[#22c55e]/20 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#22c55e]/15 pb-3.5">
              <h3 className="text-xs font-black text-[#15803d] uppercase tracking-widest flex items-center gap-2 font-display">
                <Sparkles className="w-4 h-4 text-[#15803d] animate-pulse" />
                AI Sustainability Advisory
              </h3>

              <button
                onClick={() => fetchEcoInsights(activeTab)}
                disabled={isGenerating}
                className="text-[10px] bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] border border-[#15803d]/25 px-3 py-1.5 rounded-full cursor-pointer transition-all font-bold flex items-center gap-1.5"
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

            {/* Advisory Content Display */}
            <div className="text-xs text-slate-600 leading-relaxed space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {aiInsights ? (
                <div className="space-y-3">
                  {aiInsights.split("\n").map((line, idx) => {
                    if (line.startsWith("###")) {
                      return <h4 key={idx} className="text-xs font-black text-slate-800 mt-4 mb-1 uppercase tracking-wider font-display">{line.replace("###", "")}</h4>;
                    }
                    if (line.startsWith("##")) {
                      return <h3 key={idx} className="text-xs font-black text-[#15803d] mt-5 border-b border-[#22c55e]/15 pb-1.5 font-display">{line.replace("##", "")}</h3>;
                    }
                    if (line.startsWith("-") || line.startsWith("*")) {
                      return (
                        <div key={idx} className="flex gap-2 pl-2">
                          <span className="text-emerald-600">•</span>
                          <p className="text-slate-600">{line.substring(1).trim()}</p>
                        </div>
                      );
                    }
                    const parts = line.split("**");
                    return (
                      <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                        {parts.map((part, pIdx) => {
                          if (pIdx % 2 === 1) return <strong key={pIdx} className="font-extrabold text-[#15803d]">{part}</strong>;
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <Leaf className="w-8 h-8 text-slate-300 animate-pulse mb-3" />
                  <p className="font-bold text-slate-700 uppercase tracking-wide text-xs">Advisor Inactive</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                    Select a focus area tab (General, Energy, Water, Waste) and click **"Consult Advisor"** to query Gemini AI model for real-time venue carbon offsets.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Eco Scorecard banner */}
          <div className="border-t border-[#22c55e]/15 pt-4 mt-4 text-[10px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono font-bold">
            <span className="flex items-center gap-1.5 bg-[#f0f7f4] border border-[#22c55e]/25 py-1 px-3.5 rounded-full text-[#15803d]">
              <Award className="w-4 h-4 text-amber-500" />
              FIFA 2026 Stadium Eco Score: <strong>88/100 (Silver Star Award)</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Carbon Offset Neutral Target
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
