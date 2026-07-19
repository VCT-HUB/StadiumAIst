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
  const [currentRole, setCurrentRole] = useState<StaffRole>(StaffRole.ORGANIZER);
  
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
    ? { score: "84%", label: "HIGH WARNING", color: "text-red-600" } 
    : { score: "99.8%", label: "SECURE STATE", color: "text-emerald-700" };

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

  // Roles colors / visuals optimized for White & Grass Green Light Theme
  const getRoleTheme = (role: StaffRole) => {
    switch (role) {
      case StaffRole.ORGANIZER:
        return {
          glow: "shadow-emerald-500/10",
          border: "border-[#15803d]/45",
          bg: "bg-[#15803d]/10",
          text: "text-[#15803d]",
          accent: "bg-[#15803d]",
        };
      case StaffRole.SECURITY:
        return {
          glow: "shadow-red-500/10",
          border: "border-red-500/30",
          bg: "bg-red-50",
          text: "text-red-700",
          accent: "bg-red-600",
        };
      case StaffRole.VOLUNTEER:
        return {
          glow: "shadow-amber-500/10",
          border: "border-amber-500/30",
          bg: "bg-amber-50",
          text: "text-amber-800",
          accent: "bg-amber-600",
        };
      case StaffRole.FAN:
      default:
        return {
          glow: "shadow-emerald-500/10",
          border: "border-[#22c55e]/30",
          bg: "bg-emerald-50",
          text: "text-emerald-800",
          accent: "bg-emerald-600",
        };
    }
  };

  const activeTheme = getRoleTheme(currentRole);

  return (
    <div className="min-h-screen bg-[#f0f7f4] text-slate-800 flex flex-col font-sans selection:bg-[#22c55e]/30 selection:text-slate-900 antialiased relative overflow-hidden">
      
      {/* FUTURISTIC RADIAL BACKGROUND GLOWS & SOCCER PITCH LINES */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#22c55e]/15 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#15803d]/15 to-transparent blur-[120px]" />
        <div className="absolute top-[30%] right-[15%] w-[400px] h-[400px] rounded-full bg-[#22c55e]/5 blur-[100px]" />
        <div className="absolute inset-0 opacity-40 pitch-lines-overlay" />
      </div>

      {/* Live Warning Alerts Marquee Banner */}
      <AlertBanner
        alerts={alerts}
        onResolve={handleResolveAlert}
        userRole={currentRole}
      />

      {/* BROADCAST STYLE TACTICAL NAVIGATION */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#22c55e]/20 py-3.5 shadow-[0_4px_20px_rgba(21,128,61,0.04)]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            {/* Cute Football Logo with Rosy Cheeks */}
            <div className="relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md overflow-visible border-2 border-emerald-500 animate-pulse" style={{ animationDuration: '3s' }}>
              <svg className="w-8 h-8 text-slate-800" viewBox="0 0 100 100" fill="currentColor">
                {/* Outer football circle */}
                <circle cx="50" cy="50" r="45" fill="white" stroke="#1e293b" strokeWidth="4" />
                
                {/* Traditional Pentagons and lines */}
                <polygon points="50,32 35,43 41,61 59,61 65,43" fill="#1e293b" />
                <polygon points="50,32 50,5 31,11 35,43" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="50,5 69,11 65,43" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="65,43 92,34 81,14 69,11" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="35,43 8,34 19,14 31,11" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="8,34 14,64 41,61" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="92,34 86,64 59,61" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="41,61 31,88 50,95 59,61" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="14,64 31,88" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="86,64 69,88" fill="none" stroke="#1e293b" strokeWidth="4" />
                <polygon points="50,95 69,88" fill="none" stroke="#1e293b" strokeWidth="4" />

                {/* Cute rosy cheeks & smiley mouth */}
                <ellipse cx="36" cy="48" rx="4" ry="4" fill="#f43f5e" />
                <ellipse cx="64" cy="48" rx="4" ry="4" fill="#f43f5e" />
                <path d="M 44,52 Q 50,57 56,52" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
              </svg>
              {/* Sparkle icon */}
              <span className="absolute -top-1 -right-1 text-xs">✨</span>
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-wider flex items-center gap-1 font-display uppercase leading-none">
                StadiumAIst
              </h1>
              <p className="text-[10px] text-[#15803d]/90 font-mono font-bold uppercase tracking-wider leading-none mt-1.5">
                ⚡ LIVE FIFA 2026 VENUE CO-PILOT
              </p>
            </div>
          </div>

          {/* Minimal Live Dot */}
          <div className="flex items-center gap-2 bg-[#f0f7f4] border border-[#22c55e]/20 px-3 py-1.5 rounded-full text-[10px] font-bold text-[#15803d] font-mono shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-ping" />
            LIVE
          </div>

        </div>
      </div>

      {/* STADIUM COMMAND CENTER: BROADCAST KPI METRICS PANEL */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Card 1: Live Crowd */}
          <div className="bg-white border border-[#22c55e]/20 p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_15px_rgba(21,128,61,0.04)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#15803d]/5 rounded-full blur-xl group-hover:bg-[#15803d]/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">LIVE VENUE CROWD</span>
              <Users className="w-4 h-4 text-[#15803d]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-slate-800 font-mono">{totalCrowd.toLocaleString()}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Sensors Syncing</p>
            </div>
          </div>

          {/* Card 2: Average Wait Queue */}
          <div className="bg-white border border-[#22c55e]/20 p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_15px_rgba(21,128,61,0.04)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#16a34a]/5 rounded-full blur-xl group-hover:bg-[#16a34a]/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">GATE QUEUE TIME</span>
              <Clock className="w-4 h-4 text-[#16a34a]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-slate-800 font-mono">{avgWaitTime} <span className="text-xs text-slate-500 font-normal">MINS</span></span>
              <p className="text-[10px] text-slate-500 mt-0.5">Flow Rate Optimize</p>
            </div>
          </div>

          {/* Card 3: Safety Score */}
          <div className="bg-white border border-[#22c55e]/20 p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_15px_rgba(21,128,61,0.04)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">SAFETY Corridor INDEX</span>
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <div className="mt-4">
              <span className={`text-2xl font-black font-mono ${safetyStatus.color}`}>{safetyStatus.score}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">{safetyStatus.label}</p>
            </div>
          </div>

          {/* Card 4: Sustainability Score */}
          <div className="bg-white border border-[#22c55e]/20 p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_15px_rgba(21,128,61,0.04)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#15803d]/5 rounded-full blur-xl group-hover:bg-[#15803d]/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">STADIUM ECO INDEX</span>
              <Leaf className="w-4 h-4 text-[#15803d]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-slate-800 font-mono">{currentEcoScore}<span className="text-xs text-slate-500 font-normal">/100</span></span>
              <p className="text-[10px] text-slate-500 mt-0.5">Silver Star Rated</p>
            </div>
          </div>

          {/* Card 5: Transport Status */}
          <div className="bg-white border border-[#22c55e]/20 p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_15px_rgba(21,128,61,0.04)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#0d9488]/5 rounded-full blur-xl group-hover:bg-[#0d9488]/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">METRO & TRANSPORT</span>
              <Car className="w-4 h-4 text-[#0d9488]" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-[#0d9488] font-mono">NORMAL</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Light Rail Synchronized</p>
            </div>
          </div>

          {/* Card 6: Active Operations */}
          <div className="bg-white border border-[#22c55e]/20 p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_15px_rgba(21,128,61,0.04)] premium-card-hover relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">PENDING TASKS</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-slate-800 font-mono">{tasks.filter(t => t.status !== "COMPLETED").length}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Tickets Active</p>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN VIEWPORT LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-6 relative z-10">

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

          {/* TaskBoard */}
          <TaskBoard
            tasks={tasks}
            onCreateTask={handleCreateTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            userRole={currentRole}
          />

        </div>

        {/* SECTION 3: TACTICAL CONTROL HUD */}
        <OpsCommand
          zones={zones}
          gates={gates}
          alerts={alerts}
          userRole={currentRole}
          onTriggerAlert={handleTriggerAlert}
          onResolveAlert={handleResolveAlert}
          onUpdateGateStatus={handleUpdateGateStatus}
        />

        {/* SECTION 4: ECO METRICS */}
        <SustainabilityMetrics
          metrics={metrics}
          userRole={currentRole}
          onUpdateMetric={handleUpdateMetric}
        />

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#22c55e]/20 bg-white/85 backdrop-blur-md mt-16 py-8 text-center text-xs text-slate-500 relative z-10 shadow-[0_-4px_20px_rgba(21,128,61,0.02)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-slate-600">© 2026 FIFA World Cup Stadium Operations Co-Pilot. Secure Telemetry Port.</p>
          <div className="flex gap-4 text-[10px] uppercase tracking-wider font-bold">
            <span className="text-[#15803d]">Powered by Google Gemini 3.5</span>
            <span className="text-[#22c55e]/30">|</span>
            <span className="text-slate-500">Venue Operations Mesh v1.4</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
