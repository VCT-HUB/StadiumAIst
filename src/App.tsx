/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { ZoneStatus, StaffRole, StadiumZone, GateInfo, StaffTask, EmergencyAlert, SustainabilityMetric } from "./types.js";
import { StadiumMap } from "./components/StadiumMap.tsx";
import { ChatAssistant } from "./components/ChatAssistant.tsx";
import { TaskBoard } from "./components/TaskBoard.tsx";
import { OpsCommand } from "./components/OpsCommand.tsx";
import { SustainabilityMetrics } from "./components/SustainabilityMetrics.tsx";
import { AlertBanner } from "./components/AlertBanner.tsx";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Sparkles, 
  Users, 
  Layers, 
  LayoutDashboard, 
  Globe, 
  Landmark, 
  Settings, 
  Clock, 
  Activity, 
  Leaf, 
  AlertTriangle, 
  Car, 
  ChevronRight, 
  Cpu, 
  Eye, 
  Calendar,
  Compass
} from "lucide-react";

export default function App() {
  // Application roles and profile selections
  const [currentRole, setCurrentRole] = useState<StaffRole>(StaffRole.FAN);
  
  // Server-synced state
  const [zones, setZones] = useState<StadiumZone[]>([]);
  const [gates, setGates] = useState<GateInfo[]>([]);
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [metrics, setMetrics] = useState<SustainabilityMetric[]>([]);
  
  const [selectedZone, setSelectedZone] = useState<StadiumZone | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Live calculated metrics for the high-end dashboard HUD
  const totalCrowd = zones.reduce((acc, z) => acc + (z.currentCrowd || 0), 0);
  const avgWaitTime = gates.length 
    ? Math.round(gates.reduce((acc, g) => acc + (g.avgWaitTime || 0), 0) / gates.length) 
    : 0;
  
  const safetyStatus = alerts.some(a => !a.resolved && a.severity === "CRITICAL") 
    ? { score: "84%", label: "HIGH WARNING", color: "text-rose-400" } 
    : { score: "99.8%", label: "SECURE STATE", color: "text-emerald-400" };

  const currentEcoScore = 88; // Dynamic base rating

  // Initial and periodic state fetch (live telemetry)
  const fetchStadiumState = async () => {
    setIsSyncing(true);
    try {
      const [zonesRes, gatesRes, tasksRes, alertsRes, metricsRes] = await Promise.all([
        fetch("/api/stadium/zones"),
        fetch("/api/stadium/gates"),
        fetch("/api/stadium/tasks"),
        fetch("/api/stadium/alerts"),
        fetch("/api/stadium/sustainability"),
      ]);

      const [zonesData, gatesData, tasksData, alertsData, metricsData] = await Promise.all([
        zonesRes.json(),
        gatesRes.json(),
        tasksRes.json(),
        alertsRes.json(),
        metricsRes.json(),
      ]);

      setZones(zonesData);
      setGates(gatesData);
      setTasks(tasksData);
      setAlerts(alertsData);
      setMetrics(metricsData);

      // Maintain current selected zone telemetry if already chosen
      if (selectedZone) {
        const matchingZone = zonesData.find((z: StadiumZone) => z.id === selectedZone.id);
        if (matchingZone) {
          setSelectedZone(matchingZone);
        }
      } else if (zonesData.length > 0) {
        // Default select first zone for fan guidance
        setSelectedZone(zonesData[0]);
      }
    } catch (err) {
      console.error("Failed to sync live telemetry with Express server", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchStadiumState();
    // Polling interval to simulate real-time stadium sensors (every 8 seconds)
    const interval = setInterval(fetchStadiumState, 8000);
    return () => clearInterval(interval);
  }, []);

  // Sync server handlers (POST requests that keep state completely consistent)
  
  const handleUpdateCrowd = async (zoneId: string, newCrowd: number) => {
    try {
      const res = await fetch(`/api/stadium/zones/${zoneId}/crowd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crowd: newCrowd }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state instantly for lightning performance
        setZones((prev) => prev.map((z) => (z.id === zoneId ? data.updatedZone : z)));
        if (selectedZone && selectedZone.id === zoneId) {
          setSelectedZone(data.updatedZone);
        }
      }
    } catch (err) {
      console.error("Error simulating crowd update", err);
    }
  };

  const handleCreateTask = async (
    title: string,
    description: string,
    location: string,
    assignedRole: StaffRole.VOLUNTEER | StaffRole.SECURITY,
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  ) => {
    try {
      const res = await fetch("/api/stadium/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, location, assignedRole, priority }),
      });
      if (res.ok) {
        fetchStadiumState();
      }
    } catch (err) {
      console.error("Error creating dispatch ticket", err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED") => {
    try {
      const res = await fetch(`/api/stadium/tasks/${taskId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchStadiumState();
      }
    } catch (err) {
      console.error("Error claiming/resolving task", err);
    }
  };

  const handleTriggerAlert = async (title: string, description: string, location: string, severity: "INFO" | "WARNING" | "CRITICAL") => {
    try {
      const res = await fetch("/api/stadium/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, location, severity }),
      });
      if (res.ok) {
        fetchStadiumState();
      }
    } catch (err) {
      console.error("Error broadcasting alert", err);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/stadium/alerts/${alertId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        fetchStadiumState();
      }
    } catch (err) {
      console.error("Error resolving alert", err);
    }
  };

  const handleUpdateGateStatus = async (gateId: string, status: "OPEN" | "CLOSED" | "SLOW", waitTime: number, flowRate: number) => {
    try {
      const res = await fetch(`/api/stadium/gates/${gateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, avgWaitTime: waitTime, flowRate }),
      });
      if (res.ok) {
        fetchStadiumState();
      }
    } catch (err) {
      console.error("Error updating gate configuration", err);
    }
  };

  const handleUpdateMetric = async (category: string, newValue: number) => {
    try {
      const res = await fetch("/api/stadium/sustainability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, value: newValue }),
      });
      if (res.ok) {
        fetchStadiumState();
      }
    } catch (err) {
      console.error("Error logging green action", err);
    }
  };

  // Roles colors / visuals for modern UI
  const getRoleTheme = (role: StaffRole) => {
    switch (role) {
      case StaffRole.ORGANIZER:
        return {
          glow: "shadow-violet-500/20",
          border: "border-violet-500/30",
          bg: "bg-violet-600/10",
          text: "text-violet-400",
          accent: "bg-violet-500",
        };
      case StaffRole.SECURITY:
        return {
          glow: "shadow-rose-500/20",
          border: "border-rose-500/30",
          bg: "bg-rose-600/10",
          text: "text-rose-400",
          accent: "bg-rose-500",
        };
      case StaffRole.VOLUNTEER:
        return {
          glow: "shadow-amber-500/20",
          border: "border-amber-500/30",
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          accent: "bg-amber-500",
        };
      case StaffRole.FAN:
      default:
        return {
          glow: "shadow-emerald-500/20",
          border: "border-emerald-500/30",
          bg: "bg-emerald-600/10",
          text: "text-emerald-400",
          accent: "bg-emerald-500",
        };
    }
  };

  const activeTheme = getRoleTheme(currentRole);

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col font-sans selection:bg-[#00D4FF]/30 selection:text-white antialiased relative overflow-hidden">
      
      {/* FUTURISTIC RADIAL BACKGROUND GLOWS & PITCH LINES */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#005CFF]/15 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#6C4DFF]/15 to-transparent blur-[120px]" />
        <div className="absolute top-[30%] right-[15%] w-[400px] h-[400px] rounded-full bg-[#00D4FF]/5 blur-[100px]" />
        <div className="absolute inset-0 opacity-25 pitch-lines-overlay" />
      </div>

      {/* Live Warning Alerts Marquee Banner */}
      <AlertBanner
        alerts={alerts}
        onResolve={handleResolveAlert}
        userRole={currentRole}
      />

      {/* MINIMALIST HERO SECTION */}
      <div className="relative z-10 w-full overflow-hidden border-b border-white/[0.05] bg-[#050816] pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-6 relative">
          
          <div className="max-w-3xl space-y-6">
            {/* Top Branding Block */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl md:text-4xl">⚽</span>
                <h1 className="text-3xl md:text-4.5xl font-black tracking-tight text-white leading-none">
                  Stadium<span className="bg-gradient-to-r from-[#00D4FF] to-[#6C4DFF] bg-clip-text text-transparent glow-text-ai">AIst</span>
                </h1>
              </div>
              <p className="text-sm md:text-base text-slate-400 font-medium tracking-wide">
                Your AI Stadium Companion
              </p>
            </div>

            {/* Separator 1 */}
            <div className="text-white/20 select-none overflow-hidden text-ellipsis whitespace-nowrap text-lg leading-none tracking-widest font-mono">
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            </div>

            {/* Sub-Branding and Subtitles */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl md:text-2xl">🏟</span>
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                  FIFA World Cup 2026
                </h2>
              </div>
              <div className="text-xs md:text-sm text-slate-400 font-medium flex flex-wrap items-center gap-x-2.5 gap-y-1.5 leading-relaxed">
                <span>Live Crowd Intelligence</span>
                <span className="text-slate-600 font-bold">•</span>
                <span>AI Navigation</span>
                <span className="text-slate-600 font-bold">•</span>
                <span>Emergency Response</span>
              </div>
            </div>

            {/* Separator 2 */}
            <div className="text-white/20 select-none overflow-hidden text-ellipsis whitespace-nowrap text-lg leading-none tracking-widest font-mono">
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            </div>
          </div>

        </div>
      </div>

      {/* BROADCAST STYLE TABS NAVIGATION */}
      <div className="sticky top-0 z-30 bg-[#050816]/90 backdrop-blur-md border-b border-white/[0.05] py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">
              {isSyncing ? "TELEMETRY SYNC IN PROGRESS..." : "FEED LIVE // SECURED STADIUM LINK"}
            </span>
          </div>

          {/* Pill Selector */}
          <div className="flex items-center gap-1.5 bg-[#0B1228] border border-white/[0.06] p-1.5 rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
            {[
              { role: StaffRole.FAN, label: "Fan Portal", icon: Users },
              { role: StaffRole.VOLUNTEER, label: "Volunteer Staff", icon: Compass },
              { role: StaffRole.SECURITY, label: "Security Forces", icon: Shield },
              { role: StaffRole.ORGANIZER, label: "FIFA Director", icon: Landmark },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = currentRole === tab.role;
              return (
                <button
                  key={tab.role}
                  onClick={() => setCurrentRole(tab.role)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? "text-white bg-gradient-to-r from-[#005CFF] to-[#6C4DFF] shadow-[0_4px_15px_rgba(0,92,255,0.4)] border border-white/10"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* STADIUM COMMAND CENTER: BROADCAST KPI METRICS PANEL */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Card 1: Live Crowd */}
          <div className="bg-gradient-to-b from-[#121932] to-[#0B1228] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#005CFF]/5 rounded-full blur-xl group-hover:bg-[#005CFF]/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LIVE VENUE CROWD</span>
              <Users className="w-4 h-4 text-[#005CFF]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white font-mono">{totalCrowd.toLocaleString()}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Sensors Syncing</p>
            </div>
          </div>

          {/* Card 2: Average Wait Queue */}
          <div className="bg-gradient-to-b from-[#121932] to-[#0B1228] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#6C4DFF]/5 rounded-full blur-xl group-hover:bg-[#6C4DFF]/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GATE QUEUE TIME</span>
              <Clock className="w-4 h-4 text-[#6C4DFF]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white font-mono">{avgWaitTime} <span className="text-xs text-slate-450 font-normal">MINS</span></span>
              <p className="text-[10px] text-slate-400 mt-0.5">Flow Rate Optimize</p>
            </div>
          </div>

          {/* Card 3: Safety Score */}
          <div className="bg-gradient-to-b from-[#121932] to-[#0B1228] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SAFETY Corridor INDEX</span>
              <Shield className="w-4 h-4 text-[#FF3B5C]" />
            </div>
            <div className="mt-4">
              <span className={`text-2xl font-black font-mono ${safetyStatus.color}`}>{safetyStatus.score}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{safetyStatus.label}</p>
            </div>
          </div>

          {/* Card 4: Sustainability Score */}
          <div className="bg-gradient-to-b from-[#121932] to-[#0B1228] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STADIUM ECO INDEX</span>
              <Leaf className="w-4 h-4 text-[#00C853]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white font-mono">{currentEcoScore}<span className="text-xs text-slate-450 font-normal">/100</span></span>
              <p className="text-[10px] text-slate-400 mt-0.5">Silver Star Rated</p>
            </div>
          </div>

          {/* Card 5: Transport Status */}
          <div className="bg-gradient-to-b from-[#121932] to-[#0B1228] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#00D4FF]/5 rounded-full blur-xl group-hover:bg-[#00D4FF]/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">METRO & TRANSPORT</span>
              <Car className="w-4 h-4 text-[#00D4FF]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-[#00D4FF] font-mono">NORMAL</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Light Rail Synchronized</p>
            </div>
          </div>

          {/* Card 6: Active Operations */}
          <div className="bg-gradient-to-b from-[#121932] to-[#0B1228] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PENDING TASKS</span>
              <Activity className="w-4 h-4 text-[#FFC107]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white font-mono">{tasks.filter(t => t.status !== "COMPLETED").length}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Tickets Active</p>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN VIEWPORT LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-6 relative z-10">
        
        {/* CURRENT ROLE EXPLAINER BOARD */}
        <div className={`p-5 rounded-[24px] border glass-panel relative overflow-hidden ${activeTheme.border} shadow-[0_8px_30px_rgba(0,0,0,0.4)]`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.02] to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${activeTheme.bg} ${activeTheme.text} border border-white/[0.05] shrink-0`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTheme.accent}`} />
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-200">
                    Mode Active: {currentRole}
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                  {currentRole === StaffRole.FAN && "Welcome to the Stadium Visitor Portal. Zoom into the live heat sensors to check wait times. Engage our Multilingual AI guide for food kiosks, gate lines, and log your green practices!"}
                  {currentRole === StaffRole.VOLUNTEER && "Logged in as Support Staff. Review active dispatcher tickets on the operations board to claim tasks, assist visitors, or coordinate logistics around the stadium."}
                  {currentRole === StaffRole.SECURITY && "Logged in as Security Officer. Monitor sensitive crowds on the heatmap, manage perimeter access, and dispatch or address warning notifications."}
                  {currentRole === StaffRole.ORGANIZER && "Logged in as FIFA Stadium Operations Director. Full privileges active. Access real-time gate throughput controls, broadcast emergencies, and consult Gemini for full reporting."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 bg-white/[0.03] border border-white/[0.06] py-1.5 px-3.5 rounded-full text-[10px] font-bold text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              TELEMETRY CONNECTED
            </div>

          </div>
        </div>

        {/* SECTION 1: MAP VISUALIZATION CENTERPIECE */}
        <StadiumMap
          zones={zones}
          gates={gates}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          onUpdateCrowd={handleUpdateCrowd}
          userRole={currentRole}
        />

        {/* SECTION 2: THE ADAPTIVE CONTROL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ChatAssistant */}
          <ChatAssistant
            currentRole={currentRole}
            selectedZoneName={selectedZone ? selectedZone.name : null}
          />

          {/* Dynamic Side Card based on Role */}
          {currentRole === StaffRole.FAN ? (
            <SustainabilityMetrics
              metrics={metrics}
              userRole={currentRole}
              onUpdateMetric={handleUpdateMetric}
            />
          ) : (
            <TaskBoard
              tasks={tasks}
              onCreateTask={handleCreateTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              userRole={currentRole}
            />
          )}

        </div>

        {/* SECTION 3: TACTICAL CONTROL HUD (Visible only for Organizer and Security) */}
        {(currentRole === StaffRole.ORGANIZER || currentRole === StaffRole.SECURITY) && (
          <OpsCommand
            zones={zones}
            gates={gates}
            alerts={alerts}
            userRole={currentRole}
            onTriggerAlert={handleTriggerAlert}
            onResolveAlert={handleResolveAlert}
            onUpdateGateStatus={handleUpdateGateStatus}
          />
        )}

        {/* SECTION 4: ECO METRICS FOR STAFF AS WELL */}
        {currentRole !== StaffRole.FAN && (
          <SustainabilityMetrics
            metrics={metrics}
            userRole={currentRole}
            onUpdateMetric={handleUpdateMetric}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] bg-[#0B1228]/60 backdrop-blur-md mt-16 py-8 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-slate-400">© 2026 FIFA World Cup Stadium Operations Co-Pilot. Secure Telemetry Port.</p>
          <div className="flex gap-4 text-[10px] uppercase tracking-wider font-bold">
            <span className="text-[#00D4FF]">Powered by Google Gemini 3.5</span>
            <span className="text-white/10">|</span>
            <span className="text-slate-400">Venue Operations Mesh v1.4</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
