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

const INITIAL_ZONES: StadiumZone[] = [
  { id: "A", name: "Zone A (North Gate / Fan Zone)", capacity: 15000, currentCrowd: 6500, status: ZoneStatus.NORMAL, gateQueueTime: 8, concessionQueueTime: 12, restroomQueueTime: 5, sustainabilityScore: 88 },
  { id: "B", name: "Zone B (East Concourse / Rest Area)", capacity: 18000, currentCrowd: 16500, status: ZoneStatus.CROWDED, gateQueueTime: 22, concessionQueueTime: 25, restroomQueueTime: 15, sustainabilityScore: 74 },
  { id: "C", name: "Zone C (South Gate / Hospitality)", capacity: 15000, currentCrowd: 14200, status: ZoneStatus.CROWDED, gateQueueTime: 18, concessionQueueTime: 18, restroomQueueTime: 10, sustainabilityScore: 82 },
  { id: "D", name: "Zone D (West Concourse / Media Box)", capacity: 12000, currentCrowd: 11800, status: ZoneStatus.CRITICAL, gateQueueTime: 35, concessionQueueTime: 30, restroomQueueTime: 22, sustainabilityScore: 68 },
];

const INITIAL_GATES: GateInfo[] = [
  { id: "G1", name: "North Gate (Gate 1)", status: "OPEN", flowRate: 85, avgWaitTime: 8 },
  { id: "G2", name: "East Gate (Gate 2)", status: "SLOW", flowRate: 40, avgWaitTime: 22 },
  { id: "G3", name: "South Gate (Gate 3)", status: "OPEN", flowRate: 70, avgWaitTime: 18 },
  { id: "G4", name: "West Gate (Gate 4)", status: "CLOSED", flowRate: 0, avgWaitTime: 0 },
];

const INITIAL_TASKS: StaffTask[] = [
  { id: "T1", title: "Redirect Traffic from East Gate", description: "Direct arriving fans from Gate 2 (East) toward Gate 1 (North) to ease the current 22-min bottle-neck.", location: "East Gate concourse", assignedRole: StaffRole.VOLUNTEER, status: "IN_PROGRESS", priority: "HIGH", timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: "T2", title: "Clean Up Spill at Zone D Restroom", description: "Slippery hazard reported. Please clean up immediately and put up safety caution sign.", location: "Zone D Concourse Section 104", assignedRole: StaffRole.VOLUNTEER, status: "PENDING", priority: "MEDIUM", timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: "T3", title: "Crowd Control at West Concourse", description: "West Gate is closed. Help direct fans exiting seats toward south-west paths.", location: "Zone D Exit Paths", assignedRole: StaffRole.SECURITY, status: "PENDING", priority: "CRITICAL", timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
];

const INITIAL_ALERTS: EmergencyAlert[] = [
  { id: "E1", title: "West Concourse Congestion", description: "West Gate closure has created excessive crowd accumulation in Zone D exit corridor.", location: "Zone D Corridor", severity: "CRITICAL", timestamp: new Date(Date.now() - 10 * 60000).toISOString(), resolved: false },
  { id: "E2", title: "Lost Child Assisted", description: "A 7-year-old child wearing a red FIFA cap was found near the North Gate medical tent. Handled by Section A security.", location: "Zone A Medical Tent", severity: "INFO", timestamp: new Date(Date.now() - 40 * 60000).toISOString(), resolved: true },
];

const INITIAL_METRICS: SustainabilityMetric[] = [
  { category: "Solar Power Generation", value: 450, target: 500, unit: "kWh", status: "ON_TRACK" },
  { category: "Waste Diverted from Landfill", value: 85, target: 90, unit: "%", status: "EXCELLENT" },
  { category: "Recycled Water Consumption", value: 120, target: 150, unit: "kL", status: "NEEDS_IMPROVEMENT" },
  { category: "Biodegradable Packaging Use", value: 98, target: 95, unit: "%", status: "EXCELLENT" },
];

export default function App() {
  // Application roles and profile selections
  const [currentRole, setCurrentRole] = useState<StaffRole>(StaffRole.ORGANIZER);
  
  // Server-synced state - initialized with gorgeous rich sensor data for robust static deploys (Netlify/Vercel)
  const [zones, setZones] = useState<StadiumZone[]>(INITIAL_ZONES);
  const [gates, setGates] = useState<GateInfo[]>(INITIAL_GATES);
  const [tasks, setTasks] = useState<StaffTask[]>(INITIAL_TASKS);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);
  const [metrics, setMetrics] = useState<SustainabilityMetric[]>(INITIAL_METRICS);
  
  const [selectedZone, setSelectedZone] = useState<StadiumZone | null>(INITIAL_ZONES[0]);
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
      console.warn("Failed to sync live telemetry with Express server. Running in Stadium Local Companion mode.", err);
      // In static deployment, keep using local in-memory simulated updates
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

  // Sync server handlers (POST requests that keep state completely consistent with local companion fallbacks)
  
  const handleUpdateCrowd = async (zoneId: string, newCrowd: number) => {
    // Optimistic / Local fallback update first, ensuring instantly responsive and operational static builds
    setZones((prev) => prev.map((z) => {
      if (z.id === zoneId) {
        const capacity = z.capacity;
        const currentCrowd = Math.max(0, Math.min(capacity, newCrowd));
        const occupancy = currentCrowd / capacity;
        let status = ZoneStatus.NORMAL;
        if (occupancy > 0.9) status = ZoneStatus.CRITICAL;
        else if (occupancy > 0.7) status = ZoneStatus.CROWDED;
        const updated = { ...z, currentCrowd, status };
        if (selectedZone && selectedZone.id === zoneId) {
          setSelectedZone(updated);
        }
        return updated;
      }
      return z;
    }));

    try {
      const res = await fetch(`/api/stadium/zones/${zoneId}/crowd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crowd: newCrowd }),
      });
      if (res.ok) {
        const data = await res.json();
        setZones((prev) => prev.map((z) => (z.id === zoneId ? data.updatedZone : z)));
        if (selectedZone && selectedZone.id === zoneId) {
          setSelectedZone(data.updatedZone);
        }
      }
    } catch (err) {
      console.warn("Express server offline. Local crowd simulation applied.", err);
    }
  };

  const handleCreateTask = async (
    title: string,
    description: string,
    location: string,
    assignedRole: StaffRole.VOLUNTEER | StaffRole.SECURITY,
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  ) => {
    const fallbackId = `T-${Date.now()}`;
    const newTask: StaffTask = {
      id: fallbackId,
      title,
      description,
      location,
      assignedRole,
      status: "PENDING",
      priority,
      timestamp: new Date().toISOString(),
    };

    // Prepend to local state instantly
    setTasks((prev) => [newTask, ...prev]);

    try {
      const res = await fetch("/api/stadium/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, location, assignedRole, priority }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((t) => t.id === fallbackId ? data.task : t));
      }
    } catch (err) {
      console.warn("Express server offline. Dispatch ticket registered in-memory.", err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED") => {
    // Update local state instantly
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      const res = await fetch(`/api/stadium/tasks/${taskId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      }
    } catch (err) {
      console.warn("Express server offline. Task status claimed/resolved in local session.", err);
    }
  };

  const handleTriggerAlert = async (title: string, description: string, location: string, severity: "INFO" | "WARNING" | "CRITICAL") => {
    const fallbackId = `E-${Date.now()}`;
    const newAlert: EmergencyAlert = {
      id: fallbackId,
      title,
      description,
      location,
      severity,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    setAlerts((prev) => [newAlert, ...prev]);

    try {
      const res = await fetch("/api/stadium/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, location, severity }),
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => a.id === fallbackId ? data.alert : a));
      }
    } catch (err) {
      console.warn("Express server offline. Tactical alert logged locally.", err);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));

    try {
      const res = await fetch(`/api/stadium/alerts/${alertId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.alert : a)));
      }
    } catch (err) {
      console.warn("Express server offline. Tactical alert resolved locally.", err);
    }
  };

  const handleUpdateGateStatus = async (gateId: string, status: "OPEN" | "CLOSED" | "SLOW", waitTime: number, flowRate: number) => {
    setGates((prev) => prev.map((g) => (g.id === gateId ? { ...g, status, avgWaitTime: waitTime, flowRate } : g)));

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
      console.warn("Express server offline. Access Gate configuration updated locally.", err);
    }
  };

  const handleUpdateMetric = async (category: string, newValue: number) => {
    setMetrics((prev) => prev.map((m) => {
      if (m.category === category) {
        const progress = newValue / m.target;
        let status: "EXCELLENT" | "ON_TRACK" | "NEEDS_IMPROVEMENT" = "NEEDS_IMPROVEMENT";
        if (progress >= 0.95) status = "EXCELLENT";
        else if (progress >= 0.8) status = "ON_TRACK";
        return { ...m, value: newValue, status };
      }
      return m;
    }));

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
      console.warn("Express server offline. Sustainability telemetry updated locally.", err);
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
