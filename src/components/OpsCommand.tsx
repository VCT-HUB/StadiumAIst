/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { StadiumZone, GateInfo, EmergencyAlert, StaffRole } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  Cpu, 
  Sparkles, 
  Loader2, 
  PlayCircle, 
  ToggleLeft, 
  Activity, 
  Info, 
  CheckCircle2, 
  Siren, 
  MapPin, 
  X,
  Plus,
  Compass,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

interface OpsCommandProps {
  zones: StadiumZone[];
  gates: GateInfo[];
  alerts: EmergencyAlert[];
  userRole: StaffRole;
  onTriggerAlert: (title: string, description: string, location: string, severity: "INFO" | "WARNING" | "CRITICAL") => void;
  onResolveAlert: (id: string) => void;
  onUpdateGateStatus: (gateId: string, status: "OPEN" | "CLOSED" | "SLOW", waitTime: number, flowRate: number) => void;
}

export const OpsCommand: React.FC<OpsCommandProps> = ({
  zones,
  gates,
  alerts,
  userRole,
  onTriggerAlert,
  onResolveAlert,
  onUpdateGateStatus,
}) => {
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Emergency Form State
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDesc, setAlertDesc] = useState("");
  const [alertLoc, setAlertLoc] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"INFO" | "WARNING" | "CRITICAL" | "INFO" | any>("WARNING");

  const generateOpsSummary = async () => {
    setIsGenerating(true);
    setAiSummary("");
    try {
      const response = await fetch("/api/gemini/operational-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        setAiSummary(data.summary);
      } else {
        throw new Error(data.error || "Failed to generate AI executive summary.");
      }
    } catch (err: any) {
      setAiSummary(`⚠️ **Intelligence Engine Offline**: ${err.message || "Failed to connect to the operational summary API. Verify server configuration."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertDesc.trim() || !alertLoc.trim()) return;
    onTriggerAlert(alertTitle, alertDesc, alertLoc, alertSeverity as any);
    
    setAlertTitle("");
    setAlertDesc("");
    setAlertLoc("");
    setAlertSeverity("WARNING");
    setShowEmergencyForm(false);
  };

  const handleGateToggle = (gateId: string, currentStatus: string) => {
    // Cycles through: OPEN -> SLOW -> CLOSED -> OPEN
    let nextStatus: "OPEN" | "CLOSED" | "SLOW" = "OPEN";
    let waitTime = 5;
    let flowRate = 90;

    if (currentStatus === "OPEN") {
      nextStatus = "SLOW";
      waitTime = 25;
      flowRate = 35;
    } else if (currentStatus === "SLOW") {
      nextStatus = "CLOSED";
      waitTime = 0;
      flowRate = 0;
    } else {
      nextStatus = "OPEN";
      waitTime = 5;
      flowRate = 95;
    }

    onUpdateGateStatus(gateId, nextStatus, waitTime, flowRate);
  };

  // Only Organizers & Security have access to the Operational Command center
  if (userRole !== StaffRole.ORGANIZER && userRole !== StaffRole.SECURITY) {
    return (
      <div className="bg-white border border-[#22c55e]/20 p-6 rounded-[24px] shadow-[0_8px_30px_rgba(21,128,61,0.03)] text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-[#f0f7f4] flex items-center justify-center text-slate-500 border border-[#22c55e]/20 shadow-sm mb-4">
          <Lock className="w-6 h-6 text-[#15803d]" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">Restricted Operator Level</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2.5 leading-relaxed">
          Organizers and Safety Chiefs can use this control center to toggle access gates, coordinate evacuation, and prompt GenAI COO briefings.
        </p>
      </div>
    );
  }

  return (
    <div id="ops-command-panel" className="bg-white border border-[#22c55e]/20 p-6 rounded-[24px] shadow-[0_8px_30px_rgba(21,128,61,0.03)] space-y-6 relative overflow-hidden">
      
      {/* Absolute glowing element */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-[#15803d]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#22c55e]/15 pb-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 font-display uppercase tracking-wider">
            <Activity className="w-5 h-5 text-[#15803d] animate-pulse" />
            Tactical Operations Command HUD
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time infrastructure configuration, emergency triggers, and GenAI-powered decision logs.
          </p>
        </div>

        <button
          onClick={generateOpsSummary}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#15803d] to-[#22c55e] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-sm hover:scale-[1.03] active:scale-[0.98]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Executive Briefing...
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 text-white" />
              Draft Gemini COO Report
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Gate Control Room & Emergency Trigger (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Gate Access Controls */}
          <div className="bg-white p-5 rounded-2xl border border-[#22c55e]/20 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-[#15803d] uppercase tracking-widest flex items-center gap-2 font-display">
              <ToggleLeft className="w-4 h-4 text-[#15803d]" />
              Access Gate Live Configuration
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {gates.map((g) => {
                const isOpen = g.status === "OPEN";
                const isSlow = g.status === "SLOW";
                return (
                  <div key={g.id} className="bg-[#f0f7f4]/40 p-4 rounded-xl border border-[#22c55e]/15 flex items-center justify-between gap-3 hover:border-[#15803d]/30 transition-all shadow-sm">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block">GATE CODE #{g.id}</span>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5">{g.name}</h4>
                      <div className="flex gap-3 text-[10px] text-slate-500 mt-1.5 font-bold">
                        <span>Wait: <strong className="text-[#15803d]">{g.avgWaitTime}m</strong></span>
                        <span>Flow: <strong className="text-slate-700">{g.flowRate}/m</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGateToggle(g.id, g.status)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg uppercase cursor-pointer border transition-all ${
                        isOpen
                          ? "bg-emerald-50 text-[#15803d] border-[#22c55e]/30 hover:bg-emerald-100/50"
                          : isSlow
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50"
                      }`}
                    >
                      {g.status}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 italic font-medium">
              * Cycle gates status between OPEN, SLOW, and CLOSED states. Telemetry wait times adapt automatically.
            </p>
          </div>

          {/* Emergency Alert Panel */}
          <div className="bg-white p-5 rounded-2xl border border-[#22c55e]/20 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-[#22c55e]/15 pb-3">
              <h3 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2 font-display">
                <Siren className="w-4 h-4 text-red-600 animate-pulse" />
                Safety & Emergency Bulletins
              </h3>
              
              <button
                onClick={() => setShowEmergencyForm(!showEmergencyForm)}
                className="text-[10px] text-red-700 font-extrabold uppercase bg-red-50 px-3 py-1.5 rounded-full border border-red-200 cursor-pointer hover:bg-red-100 transition-all"
              >
                {showEmergencyForm ? "Cancel Incident" : "Report Safety Incident"}
              </button>
            </div>

            <AnimatePresence>
              {showEmergencyForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAlertSubmit} 
                  className="bg-[#fff8f8] p-4 rounded-xl border border-red-200 space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Incident Title</label>
                      <input
                        type="text"
                        required
                        value={alertTitle}
                        onChange={(e) => setAlertTitle(e.target.value)}
                        placeholder="e.g. Staircase D BottleNeck"
                        className="w-full bg-white border border-[#22c55e]/25 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Location Coordinate</label>
                      <input
                        type="text"
                        required
                        value={alertLoc}
                        onChange={(e) => setAlertLoc(e.target.value)}
                        placeholder="e.g. Sector 104 Gate 1 Corridor"
                        className="w-full bg-white border border-[#22c55e]/25 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Description & Safety Advisory Instructions</label>
                    <textarea
                      required
                      rows={4}
                      value={alertDesc}
                      onChange={(e) => setAlertDesc(e.target.value)}
                      placeholder="Instruct fans clearly on next steps..."
                      className="w-full bg-white border border-[#22c55e]/25 rounded-xl px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d] resize-y min-h-[100px] leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#22c55e]/15">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Severity:</span>
                      <div className="flex gap-1.5">
                        {["INFO", "WARNING", "CRITICAL"].map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setAlertSeverity(sev as any)}
                            className={`px-3 py-1 text-[10px] font-black rounded-full cursor-pointer transition-all border ${
                              alertSeverity === sev
                                ? sev === "CRITICAL"
                                  ? "bg-red-600 text-white border-red-500"
                                  : sev === "WARNING"
                                  ? "bg-amber-500 text-white border-amber-400"
                                  : "bg-[#15803d] text-white border-[#22c55e]"
                                : "bg-[#f0f7f4] text-slate-500 border-[#22c55e]/25"
                            }`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-full cursor-pointer transition-colors shadow-sm"
                    >
                      Broadcast Bulletin
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Incident logs stream */}
            <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
              {alerts.length > 0 ? (
                alerts.map((a) => {
                  const isCritical = a.severity === "CRITICAL";
                  const isWarning = a.severity === "WARNING";
                  return (
                    <div
                      key={a.id}
                      className={`p-3.5 rounded-xl border flex justify-between items-start gap-4 transition-all ${
                        a.resolved 
                          ? "bg-[#f0f7f4]/40 border-[#22c55e]/10 opacity-60" 
                          : isCritical
                          ? "bg-red-50 border-red-200 text-red-900"
                          : isWarning
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-emerald-50 border-emerald-200 text-emerald-900"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-2 h-2 rounded-full ${
                            a.resolved 
                              ? "bg-slate-300" 
                              : isCritical
                              ? "bg-red-600 animate-pulse"
                              : isWarning
                              ? "bg-amber-500"
                              : "bg-[#15803d]"
                          }`} />
                          <h4 className="text-xs font-bold text-slate-800">{a.title}</h4>
                          <span className="inline-flex items-center gap-1 text-[9px] bg-[#f0f7f4] border border-[#22c55e]/20 px-2 py-0.5 rounded text-slate-700 font-bold font-mono">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            {a.location}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 pr-2">{a.description}</p>
                      </div>

                      {!a.resolved && (
                        <button
                          onClick={() => onResolveAlert(a.id)}
                          className="p-1.5 bg-white border border-[#22c55e]/20 hover:border-[#15803d]/40 hover:bg-[#15803d]/10 text-slate-500 hover:text-[#15803d] rounded-lg cursor-pointer transition-all shrink-0"
                          title="Resolve bulletin"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-5 bg-[#f0f7f4]/30 border border-[#22c55e]/20 border-dashed rounded-xl">
                  <span className="text-xs text-slate-500 font-semibold">Safe Stadium Operations: Zero warning issues in active memory buffer.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Executive Advisory & Decision Support (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col self-stretch">
          <div className="bg-white rounded-2xl border border-[#22c55e]/20 p-5 flex-1 flex flex-col min-h-[300px] shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#22c55e]/15 pb-3 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#f0f7f4] border border-[#22c55e]/25 flex items-center justify-center text-[#15803d]">
                <Cpu className="w-4 h-4 text-[#15803d] animate-pulse" />
              </div>
              <h3 className="text-xs font-black text-[#15803d] uppercase tracking-widest flex items-center gap-1.5 font-display">
                Gemini Analytics Log
                <Sparkles className="w-3.5 h-3.5 text-[#15803d] fill-[#15803d]/10" />
              </h3>
            </div>

            {/* Advisory feedback text markdown */}
            <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-slate-600 pr-1 max-h-[350px]">
              {aiSummary ? (
                <div className="space-y-3 font-medium">
                  {aiSummary.split("\n").map((line, idx) => {
                    if (line.startsWith("###")) {
                      return <h4 key={idx} className="text-xs font-extrabold text-slate-800 mt-4 mb-1 uppercase tracking-wider font-display">{line.replace("###", "")}</h4>;
                    }
                    if (line.startsWith("##")) {
                      return <h3 key={idx} className="text-xs font-extrabold text-[#15803d] mt-5 border-b border-[#22c55e]/15 pb-1.5 font-display">{line.replace("##", "")}</h3>;
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
                <div className="flex flex-col items-center justify-center text-center h-full py-16">
                  <div className="w-12 h-12 rounded-full bg-[#f0f7f4] flex items-center justify-center mb-3 text-[#15803d]">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-xs">Advisory Buffers Standby</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                    Query Google Gemini model briefing. Scans live gate flow thresholds, active dispatch lists, and environmental scores to output full operational briefings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
