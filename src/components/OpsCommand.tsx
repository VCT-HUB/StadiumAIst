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
  const [alertSeverity, setAlertSeverity] = useState<"INFO" | "WARNING" | "CRITICAL" | "INFO">("WARNING");

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
      <div className="glass-panel-glow p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-[#0B1228] flex items-center justify-center text-slate-500 border border-white/[0.06] shadow-xl mb-4">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Restricted Operator Level</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-2.5 leading-relaxed">
          Organizers and Safety Chiefs can use this control center to toggle access gates, coordinate evacuation, and prompt GenAI COO briefings.
        </p>
      </div>
    );
  }

  return (
    <div id="ops-command-panel" className="glass-panel-glow p-6 space-y-6 relative overflow-hidden shadow-2xl">
      
      {/* Absolute glowing element */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-[#005CFF]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2 font-display uppercase tracking-wider">
            <Activity className="w-5 h-5 text-[#00D4FF] animate-pulse" />
            Tactical Operations Command HUD
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time infrastructure configuration, emergency triggers, and GenAI-powered decision logs.
          </p>
        </div>

        <button
          onClick={generateOpsSummary}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#005CFF] to-[#6C4DFF] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-lg shadow-[#005CFF]/20 hover:scale-[1.03] active:scale-[0.98]"
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
          <div className="bg-[#050816]/75 p-5 rounded-2xl border border-white/[0.06] space-y-4">
            <h3 className="text-xs font-black text-[#00D4FF] uppercase tracking-widest flex items-center gap-2 font-display">
              <ToggleLeft className="w-4 h-4 text-[#00D4FF]" />
              Access Gate Live Configuration
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {gates.map((g) => {
                const isOpen = g.status === "OPEN";
                const isSlow = g.status === "SLOW";
                return (
                  <div key={g.id} className="bg-[#121932]/45 p-4 rounded-xl border border-white/[0.03] flex items-center justify-between gap-3 hover:border-white/[0.08] transition-all group">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 block">GATE CODE #{g.id}</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{g.name}</h4>
                      <div className="flex gap-3 text-[10px] text-slate-400 mt-1.5 font-bold">
                        <span>Wait: <strong className="text-[#00D4FF]">{g.avgWaitTime}m</strong></span>
                        <span>Flow: <strong className="text-white">{g.flowRate}/m</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGateToggle(g.id, g.status)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg uppercase cursor-pointer border transition-all ${
                        isOpen
                          ? "bg-[#00C853]/10 text-[#00C853] border-[#00C853]/35 hover:bg-[#00C853]/25"
                          : isSlow
                          ? "bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/35 hover:bg-[#FFC107]/25"
                          : "bg-[#FF3B5C]/10 text-[#FF3B5C] border-[#FF3B5C]/35 hover:bg-[#FF3B5C]/25"
                      }`}
                    >
                      {g.status}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 italic font-medium">
              * Cycle gates status between OPEN, SLOW, and CLOSED states. Telemetry wait times adapt automatically.
            </p>
          </div>

          {/* Emergency Alert Panel */}
          <div className="bg-[#050816]/75 p-5 rounded-2xl border border-white/[0.06] space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
              <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 font-display">
                <Siren className="w-4 h-4 text-rose-500 animate-pulse" />
                Safety & Emergency Bulletins
              </h3>
              
              <button
                onClick={() => setShowEmergencyForm(!showEmergencyForm)}
                className="text-[10px] text-rose-300 font-extrabold uppercase bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/25 cursor-pointer hover:bg-rose-500/20 transition-all"
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
                  className="bg-[#050816] p-4 rounded-xl border border-rose-500/20 space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Incident Title</label>
                      <input
                        type="text"
                        required
                        value={alertTitle}
                        onChange={(e) => setAlertTitle(e.target.value)}
                        placeholder="e.g. Staircase D BottleNeck"
                        className="w-full bg-[#121932]/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Location Coordinate</label>
                      <input
                        type="text"
                        required
                        value={alertLoc}
                        onChange={(e) => setAlertLoc(e.target.value)}
                        placeholder="e.g. Sector 104 Gate 1 Corridor"
                        className="w-full bg-[#121932]/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Description & Safety Advisory Instructions</label>
                    <textarea
                      required
                      rows={2}
                      value={alertDesc}
                      onChange={(e) => setAlertDesc(e.target.value)}
                      placeholder="Instruct fans clearly on next steps..."
                      className="w-full bg-[#121932]/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Severity:</span>
                      <div className="flex gap-1.5">
                        {["INFO", "WARNING", "CRITICAL"].map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setAlertSeverity(sev as any)}
                            className={`px-3 py-1 text-[10px] font-black rounded-full cursor-pointer transition-all border ${
                              alertSeverity === sev
                                ? sev === "CRITICAL"
                                  ? "bg-[#FF3B5C] text-white border-[#FF3B5C]/30 shadow-[0_0_8px_rgba(255,59,92,0.3)]"
                                  : sev === "WARNING"
                                  ? "bg-[#FFC107] text-slate-950 border-[#FFC107]/30"
                                  : "bg-[#005CFF] text-white border-[#005CFF]/30"
                                : "bg-[#121932] text-slate-400 border-white/[0.06]"
                            }`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-full cursor-pointer transition-colors shadow-lg shadow-rose-600/20"
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
                          ? "bg-[#121932]/20 border-white/[0.02] opacity-50" 
                          : isCritical
                          ? "bg-[#FF3B5C]/10 border-[#FF3B5C]/25"
                          : isWarning
                          ? "bg-[#FFC107]/10 border-[#FFC107]/25"
                          : "bg-[#005CFF]/10 border-[#005CFF]/25"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-2 h-2 rounded-full ${
                            a.resolved 
                              ? "bg-slate-700" 
                              : isCritical
                              ? "bg-[#FF3B5C] animate-ping"
                              : isWarning
                              ? "bg-[#FFC107]"
                              : "bg-[#005CFF]"
                          }`} />
                          <h4 className="text-xs font-bold text-white">{a.title}</h4>
                          <span className="inline-flex items-center gap-1 text-[9px] bg-[#050816] border border-white/[0.05] px-2 py-0.5 rounded text-slate-400 font-bold font-mono">
                            <MapPin className="w-2.5 h-2.5 text-slate-500" />
                            {a.location}
                          </span>
                        </div>
                        <p className="text-xs text-slate-350 pr-2">{a.description}</p>
                      </div>

                      {!a.resolved && (
                        <button
                          onClick={() => onResolveAlert(a.id)}
                          className="p-1.5 bg-[#050816] border border-white/[0.06] hover:border-[#00C853]/40 hover:bg-[#00C853]/10 text-slate-400 hover:text-[#00C853] rounded-lg cursor-pointer transition-all shrink-0"
                          title="Resolve bulletin"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-5 bg-[#050816]/30 border border-white/[0.05] border-dashed rounded-xl">
                  <span className="text-xs text-slate-500 font-medium">Safe Stadium Operations: Zero warning issues in active memory buffer.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Executive Advisory & Decision Support (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col self-stretch">
          <div className="bg-[#050816]/75 rounded-2xl border border-white/[0.06] p-5 flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#005CFF]/10 to-[#6C4DFF]/10 border border-[#005CFF]/20 flex items-center justify-center text-[#00D4FF]">
                <Cpu className="w-4 h-4 text-[#00D4FF] animate-pulse" />
              </div>
              <h3 className="text-xs font-black text-[#00D4FF] uppercase tracking-widest flex items-center gap-1.5 font-display">
                Gemini Analytics Log
                <Sparkles className="w-3.5 h-3.5 text-[#00D4FF] fill-[#00D4FF]/10" />
              </h3>
            </div>

            {/* Advisory feedback text markdown */}
            <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-slate-300 pr-1 max-h-[350px]">
              {aiSummary ? (
                <div className="space-y-3 font-medium">
                  {aiSummary.split("\n").map((line, idx) => {
                    if (line.startsWith("###")) {
                      return <h4 key={idx} className="text-xs font-extrabold text-white mt-4 mb-1 uppercase tracking-wider font-display">{line.replace("###", "")}</h4>;
                    }
                    if (line.startsWith("##")) {
                      return <h3 key={idx} className="text-xs font-extrabold text-[#00D4FF] mt-5 border-b border-white/[0.06] pb-1.5 font-display">{line.replace("##", "")}</h3>;
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
                          if (pIdx % 2 === 1) return <strong key={pIdx} className="font-extrabold text-white glow-text-ai">{part}</strong>;
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-full py-16">
                  <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center mb-3 text-slate-600">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="font-bold text-slate-300 uppercase tracking-wider text-xs">Advisory Buffers Standby</p>
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
