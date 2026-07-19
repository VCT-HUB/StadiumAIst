/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { StadiumZone, GateInfo, ZoneStatus } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  AlertTriangle, 
  HelpCircle, 
  Clock, 
  BatteryCharging, 
  UtensilsCrossed, 
  Sparkles, 
  Compass, 
  MapPin, 
  Activity 
} from "lucide-react";

interface StadiumMapProps {
  zones: StadiumZone[];
  gates: GateInfo[];
  selectedZone: StadiumZone | null;
  onSelectZone: (zone: StadiumZone) => void;
  onUpdateCrowd?: (zoneId: string, newCrowd: number) => void;
  userRole: string;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  zones,
  gates,
  selectedZone,
  onSelectZone,
  onUpdateCrowd,
  userRole,
}) => {
  const [simulationValue, setSimulationValue] = useState<number>(0);

  // Helper to match zone details based on SVG polygon click with white & green aesthetics
  const getZoneColor = (status: ZoneStatus, isSelected: boolean) => {
    if (isSelected) {
      return "fill-[#15803d]/25 stroke-[#15803d] stroke-[3.5] drop-shadow-[0_0_15px_rgba(21,128,61,0.25)]";
    }
    switch (status) {
      case ZoneStatus.CRITICAL:
        return "fill-red-500/10 stroke-red-600 hover:fill-red-500/25";
      case ZoneStatus.CROWDED:
        return "fill-amber-500/10 stroke-amber-600 hover:fill-amber-500/25";
      case ZoneStatus.NORMAL:
      default:
        return "fill-emerald-500/10 stroke-emerald-600 hover:fill-emerald-500/25";
    }
  };

  const getGateColor = (index: number) => {
    const status = gates[index]?.status;
    if (!status) return "fill-slate-400";
    if (status === "OPEN") return "fill-emerald-600";
    if (status === "SLOW") return "fill-amber-500";
    return "fill-red-600";
  };

  const getGateGlowClass = (index: number) => {
    const status = gates[index]?.status;
    if (status === "OPEN") return "pulse-ring-emerald";
    if (status === "SLOW") return "pulse-ring-amber";
    return "pulse-ring";
  };

  const handleZonePolygonClick = (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      onSelectZone(zone);
      setSimulationValue(zone.currentCrowd);
    }
  };

  return (
    <div id="stadium-map-container" className="bg-white border border-[#22c55e]/20 p-6 rounded-[24px] relative overflow-hidden shadow-[0_8px_30px_rgba(21,128,61,0.03)]">
      
      {/* Decorative soccer grass-pattern grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(21,128,61,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,128,61,0.015)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#22c55e]/15 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#15803d] rounded-full animate-pulse shadow-[0_0_8px_rgba(21,128,61,0.35)]" />
              <h2 className="text-lg font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-display">
                Stadium IoT Crowd Heatmap
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any coordinate sector, suite, or entry gate to route emergency corridors or view queuing bottleneck analytics.
            </p>
          </div>

          {/* Glowing Legend indicators */}
          <div className="flex items-center flex-wrap gap-3 bg-[#f0f7f4] px-4 py-2 rounded-full border border-[#22c55e]/20 text-xs">
            <span className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Sensor Thresholds:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="text-slate-700 text-[11px] font-bold">NORMAL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-700 text-[11px] font-bold">CONGESTED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span className="text-slate-700 text-[11px] font-bold">CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Futuristic SVG Vector Map */}
          <div className="lg:col-span-7 bg-[#f0f7f4]/80 p-6 rounded-2xl border border-[#22c55e]/20 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden group">
            
            {/* Holographic tech accents */}
            <div className="absolute top-4 left-4 text-[9px] font-mono text-[#15803d]/50 uppercase tracking-widest pointer-events-none">
              VECTOR GRID: 600 x 500 // TELEMETRY OMNI
            </div>

            <svg
              viewBox="0 0 600 500"
              className="w-full max-w-[460px] h-auto drop-shadow-[0_4px_15px_rgba(21,128,61,0.06)] cursor-pointer"
            >
              <defs>
                <radialGradient id="field-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#15803d" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Outer Boundary rings with tech dashed designs */}
              <circle cx="300" cy="250" r="230" className="fill-none stroke-[#22c55e]/10 stroke-2 stroke-dasharray-[12,6] animate-spin-slow" />
              <circle cx="300" cy="250" r="215" className="fill-none stroke-[#22c55e]/15 stroke-[1]" />
              <circle cx="300" cy="250" r="195" className="fill-white/80 stroke-[#22c55e]/20 stroke-2" />

              {/* ZONE A (North - Top) */}
              <path
                id="map-zone-A"
                d="M 160,110 A 195,195 0 0,1 440,110 L 390,165 A 120,120 0 0,0 210,165 Z"
                className={`transition-all duration-300 stroke-2 cursor-pointer ${getZoneColor(
                  zones.find(z => z.id === "A")?.status || ZoneStatus.NORMAL,
                  selectedZone?.id === "A"
                )}`}
                onClick={() => handleZonePolygonClick("A")}
              />
              
              {/* ZONE B (East - Right) */}
              <path
                id="map-zone-B"
                d="M 440,110 A 195,195 0 0,1 440,390 L 390,335 A 120,120 0 0,0 390,165 Z"
                className={`transition-all duration-300 stroke-2 cursor-pointer ${getZoneColor(
                  zones.find(z => z.id === "B")?.status || ZoneStatus.NORMAL,
                  selectedZone?.id === "B"
                )}`}
                onClick={() => handleZonePolygonClick("B")}
              />

              {/* ZONE C (South - Bottom) */}
              <path
                id="map-zone-C"
                d="M 440,390 A 195,195 0 0,1 160,390 L 210,335 A 120,120 0 0,0 390,335 Z"
                className={`transition-all duration-300 stroke-2 cursor-pointer ${getZoneColor(
                  zones.find(z => z.id === "C")?.status || ZoneStatus.NORMAL,
                  selectedZone?.id === "C"
                )}`}
                onClick={() => handleZonePolygonClick("C")}
              />

              {/* ZONE D (West - Left) */}
              <path
                id="map-zone-D"
                d="M 160,390 A 195,195 0 0,1 160,110 L 210,165 A 120,120 0 0,0 210,335 Z"
                className={`transition-all duration-300 stroke-2 cursor-pointer ${getZoneColor(
                  zones.find(z => z.id === "D")?.status || ZoneStatus.NORMAL,
                  selectedZone?.id === "D"
                )}`}
                onClick={() => handleZonePolygonClick("D")}
              />

              {/* Inner Soccer Arena */}
              <rect x="220" y="185" width="160" height="130" rx="10" className="fill-[#15803d] stroke-[#22c55e]/40 stroke-2" />
              <rect x="220" y="185" width="160" height="130" rx="10" fill="url(#field-glow)" pointerEvents="none" />
              
              {/* Pitch lines overlay */}
              <rect x="230" y="195" width="140" height="110" rx="2" className="fill-none stroke-white/40 stroke-[1.5]" />
              <circle cx="300" cy="250" r="25" className="fill-none stroke-white/40 stroke-[1.5]" />
              <line x1="300" y1="195" x2="300" y2="305" className="stroke-white/40 stroke-[1.5]" />

              {/* Central FIFA logo HUD overlay */}
              <text x="300" y="247" textAnchor="middle" className="fill-emerald-100 font-sans font-extrabold text-[12px] tracking-widest uppercase">FIFA 2026</text>
              <text x="300" y="262" textAnchor="middle" className="fill-emerald-200/80 font-sans font-semibold text-[8px] tracking-widest uppercase">STADIUM HUB</text>

              {/* Text Labels inside sectors */}
              <g pointerEvents="none" className="font-display font-black">
                <text x="300" y="145" textAnchor="middle" className="fill-slate-800 text-xs font-black tracking-widest">ZONE A</text>
                <text x="410" y="254" textAnchor="middle" className="fill-slate-800 text-xs font-black tracking-widest">ZONE B</text>
                <text x="300" y="365" textAnchor="middle" className="fill-slate-800 text-xs font-black tracking-widest">ZONE C</text>
                <text x="190" y="254" textAnchor="middle" className="fill-slate-800 text-xs font-black tracking-widest">ZONE D</text>
              </g>

              {/* GATE INDICATOR BULBS & PULSING TECH RING */}
              {/* Gate 1 (North) */}
              <circle cx="300" cy="40" r="16" className="fill-transparent stroke-[#22c55e]/15 stroke-[1]" />
              <circle cx="300" cy="40" r="11" className={`${getGateColor(0)} stroke-white stroke-2 ${getGateGlowClass(0)}`} />
              <text x="300" y="44" textAnchor="middle" className="fill-white text-[9px] font-black" pointerEvents="none">G1</text>

              {/* Gate 2 (East) */}
              <circle cx="560" cy="250" r="16" className="fill-transparent stroke-[#22c55e]/15 stroke-[1]" />
              <circle cx="560" cy="250" r="11" className={`${getGateColor(1)} stroke-white stroke-2 ${getGateGlowClass(1)}`} />
              <text x="560" y="254" textAnchor="middle" className="fill-white text-[9px] font-black" pointerEvents="none">G2</text>

              {/* Gate 3 (South) */}
              <circle cx="300" cy="460" r="16" className="fill-transparent stroke-[#22c55e]/15 stroke-[1]" />
              <circle cx="300" cy="460" r="11" className={`${getGateColor(2)} stroke-white stroke-2 ${getGateGlowClass(2)}`} />
              <text x="300" y="464" textAnchor="middle" className="fill-white text-[9px] font-black" pointerEvents="none">G3</text>

              {/* Gate 4 (West) */}
              <circle cx="40" cy="250" r="16" className="fill-transparent stroke-[#22c55e]/15 stroke-[1]" />
              <circle cx="40" cy="250" r="11" className={`${getGateColor(3)} stroke-white stroke-2 ${getGateGlowClass(3)}`} />
              <text x="40" y="254" textAnchor="middle" className="fill-white text-[9px] font-black" pointerEvents="none">G4</text>
            </svg>
          </div>

          {/* Right: Telemetry Information Panel */}
          <div className="lg:col-span-5 h-full">
            <AnimatePresence mode="wait">
              {selectedZone ? (
                <motion.div
                  key={selectedZone.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="bg-white rounded-2xl p-6 border border-[#22c55e]/20 space-y-5 shadow-[0_4px_25px_rgba(21,128,61,0.03)] relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[#15803d] text-[9px] font-bold tracking-widest uppercase bg-[#15803d]/10 px-2.5 py-1 rounded-md border border-[#15803d]/20">
                        <Activity className="w-3 h-3" />
                        ACTIVE TELEMETRY BLOCK
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-800 mt-2.5 font-display flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#15803d]" />
                        {selectedZone.name}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 text-[11px] font-black rounded-full uppercase border ${
                      selectedZone.status === ZoneStatus.CRITICAL
                        ? "bg-red-50 text-red-600 border-red-200 shadow-[0_0_10px_rgba(220,38,38,0.05)]"
                        : selectedZone.status === ZoneStatus.CROWDED
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {selectedZone.status}
                    </span>
                  </div>

                  {/* Core KPI cards */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-[#f0f7f4]/40 p-4 rounded-xl border border-[#22c55e]/15">
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <Users className="w-3.5 h-3.5 text-[#15803d]" />
                        <span className="font-semibold text-[11px]">Sector Fans</span>
                      </div>
                      <p className="text-2xl font-black font-mono text-slate-800 mt-1.5">
                        {selectedZone.currentCrowd.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        of {selectedZone.capacity.toLocaleString()} Max Capacity
                      </span>
                    </div>

                    <div className="bg-[#f0f7f4]/40 p-4 rounded-xl border border-[#22c55e]/15">
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <BatteryCharging className="w-3.5 h-3.5 text-[#15803d]" />
                        <span className="font-semibold text-[11px]">Eco Performance</span>
                      </div>
                      <p className="text-2xl font-black font-mono text-[#15803d] mt-1.5">
                        {selectedZone.sustainabilityScore}%
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Green Index Target
                      </span>
                    </div>
                  </div>

                  {/* Queue Bottleneck Status indicators */}
                  <div className="space-y-3.5">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#15803d]" />
                      Real-Time Queue Diagnostics
                    </h4>

                    {/* Gate Queue */}
                    <div className="space-y-1.5 bg-[#f0f7f4]/20 p-3 rounded-xl border border-[#22c55e]/10">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#15803d]" />
                          Entrance Gate wait-times
                        </span>
                        <span className={`font-mono font-bold ${selectedZone.gateQueueTime > 20 ? "text-red-600" : "text-slate-700"}`}>
                          {selectedZone.gateQueueTime} mins
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            selectedZone.gateQueueTime > 25 ? "bg-red-500" : selectedZone.gateQueueTime > 15 ? "bg-amber-500" : "bg-emerald-550"
                          }`}
                          style={{ width: `${Math.min(100, (selectedZone.gateQueueTime / 40) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Food / Concessions queue */}
                    <div className="space-y-1.5 bg-[#f0f7f4]/20 p-3 rounded-xl border border-[#22c55e]/10">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 flex items-center gap-1.5">
                          <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                          Concessions / Food stalls wait-times
                        </span>
                        <span className={`font-mono font-bold ${selectedZone.concessionQueueTime > 20 ? "text-red-600" : "text-slate-700"}`}>
                          {selectedZone.concessionQueueTime} mins
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            selectedZone.concessionQueueTime > 25 ? "bg-red-500" : selectedZone.concessionQueueTime > 15 ? "bg-amber-500" : "bg-emerald-550"
                          }`}
                          style={{ width: `${Math.min(100, (selectedZone.concessionQueueTime / 40) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Restrooms */}
                    <div className="space-y-1.5 bg-[#f0f7f4]/20 p-3 rounded-xl border border-[#22c55e]/10">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-[#15803d]" />
                          Restroom Services & Facilities wait
                        </span>
                        <span className={`font-mono font-bold ${selectedZone.restroomQueueTime > 15 ? "text-red-600" : "text-slate-700"}`}>
                          {selectedZone.restroomQueueTime} mins
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            selectedZone.restroomQueueTime > 20 ? "bg-red-500" : selectedZone.restroomQueueTime > 10 ? "bg-amber-500" : "bg-emerald-550"
                          }`}
                          style={{ width: `${Math.min(100, (selectedZone.restroomQueueTime / 30) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Simulator Control Slider for Directors/Staff */}
                  {userRole !== "FAN" && onUpdateCrowd && (
                    <div className="mt-4 pt-4 border-t border-[#22c55e]/10 space-y-3 bg-[#f0f7f4]/40 p-4 rounded-xl border border-[#22c55e]/10">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-[#15803d] flex items-center gap-1.5 uppercase tracking-wider">
                          <Activity className="w-3.5 h-3.5 text-[#15803d]" />
                          IoT Density Simulation
                        </span>
                        <span className="text-[10px] text-[#15803d] bg-[#15803d]/10 px-2.5 py-0.5 rounded-full border border-[#15803d]/20 font-semibold font-mono">
                          {Math.round((simulationValue / selectedZone.capacity) * 100)}% cap
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={selectedZone.capacity}
                          value={simulationValue}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSimulationValue(val);
                            onUpdateCrowd(selectedZone.id, val);
                          }}
                          className="w-full accent-[#15803d] cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-slate-800 w-14 text-right">
                          {Math.round(simulationValue).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        Adjust density threshold simulator. Express router synchronizes map statuses & queue math immediately.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl p-8 border border-[#22c55e]/25 flex flex-col items-center justify-center text-center h-full min-h-[340px] shadow-[0_4px_25px_rgba(21,128,61,0.02)]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#15803d] mb-4 border border-[#22c55e]/30 shadow-[0_0_15px_rgba(21,128,61,0.05)]">
                    <Compass className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No Target Zone Selected</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-2.5 leading-relaxed">
                    Select any colored stadium vector sector, VIP suites, or entry gate on the canvas map to load real-time telemetry sensors.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
};
