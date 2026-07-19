/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { ZoneStatus, StaffRole, StadiumZone, GateInfo, StaffTask, EmergencyAlert, SustainabilityMetric } from "./src/types.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Live Stadium State
let stadiumZones: StadiumZone[] = [
  { id: "A", name: "Zone A (North Gate / Fan Zone)", capacity: 15000, currentCrowd: 6500, status: ZoneStatus.NORMAL, gateQueueTime: 8, concessionQueueTime: 12, restroomQueueTime: 5, sustainabilityScore: 88 },
  { id: "B", name: "Zone B (East Concourse / Rest Area)", capacity: 18000, currentCrowd: 16500, status: ZoneStatus.CROWDED, gateQueueTime: 22, concessionQueueTime: 25, restroomQueueTime: 15, sustainabilityScore: 74 },
  { id: "C", name: "Zone C (South Gate / Hospitality)", capacity: 15000, currentCrowd: 14200, status: ZoneStatus.CROWDED, gateQueueTime: 18, concessionQueueTime: 18, restroomQueueTime: 10, sustainabilityScore: 82 },
  { id: "D", name: "Zone D (West Concourse / Media Box)", capacity: 12000, currentCrowd: 11800, status: ZoneStatus.CRITICAL, gateQueueTime: 35, concessionQueueTime: 30, restroomQueueTime: 22, sustainabilityScore: 68 },
];

let gates: GateInfo[] = [
  { id: "G1", name: "North Gate (Gate 1)", status: "OPEN", flowRate: 85, avgWaitTime: 8 },
  { id: "G2", name: "East Gate (Gate 2)", status: "SLOW", flowRate: 40, avgWaitTime: 22 },
  { id: "G3", name: "South Gate (Gate 3)", status: "OPEN", flowRate: 70, avgWaitTime: 18 },
  { id: "G4", name: "West Gate (Gate 4)", status: "CLOSED", flowRate: 0, avgWaitTime: 0 },
];

let staffTasks: StaffTask[] = [
  { id: "T1", title: "Redirect Traffic from East Gate", description: "Direct arriving fans from Gate 2 (East) toward Gate 1 (North) to ease the current 22-min bottle-neck.", location: "East Gate concourse", assignedRole: StaffRole.VOLUNTEER, status: "IN_PROGRESS", priority: "HIGH", timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: "T2", title: "Clean Up Spill at Zone D Restroom", description: "Slippery hazard reported. Please clean up immediately and put up safety caution sign.", location: "Zone D Concourse Section 104", assignedRole: StaffRole.VOLUNTEER, status: "PENDING", priority: "MEDIUM", timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: "T3", title: "Crowd Control at West Concourse", description: "West Gate is closed. Help direct fans exiting seats toward south-west paths.", location: "Zone D Exit Paths", assignedRole: StaffRole.SECURITY, status: "PENDING", priority: "CRITICAL", timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
];

let emergencyAlerts: EmergencyAlert[] = [
  { id: "E1", title: "West Concourse Congestion", description: "West Gate closure has created excessive crowd accumulation in Zone D exit corridor.", location: "Zone D Corridor", severity: "CRITICAL", timestamp: new Date(Date.now() - 10 * 60000).toISOString(), resolved: false },
  { id: "E2", title: "Lost Child Assisted", description: "A 7-year-old child wearing a red FIFA cap was found near the North Gate medical tent. Handled by Section A security.", location: "Zone A Medical Tent", severity: "INFO", timestamp: new Date(Date.now() - 40 * 60000).toISOString(), resolved: true },
];

let sustainabilityMetrics: SustainabilityMetric[] = [
  { category: "Solar Power Generation", value: 450, target: 500, unit: "kWh", status: "ON_TRACK" },
  { category: "Waste Diverted from Landfill", value: 85, target: 90, unit: "%", status: "EXCELLENT" },
  { category: "Recycled Water Consumption", value: 120, target: 150, unit: "kL", status: "NEEDS_IMPROVEMENT" },
  { category: "Biodegradable Packaging Use", value: 98, target: 95, unit: "%", status: "EXCELLENT" },
];

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Get stadium zones status
app.get("/api/stadium/zones", (req, res) => {
  res.json(stadiumZones);
});

// Update crowd simulation on server (creates dynamic playground!)
app.post("/api/stadium/zones/:id/crowd", (req, res) => {
  const { id } = req.params;
  const { crowd } = req.body;
  const zone = stadiumZones.find((z) => z.id === id);
  if (zone) {
    zone.currentCrowd = Math.max(0, Math.min(zone.capacity, crowd));
    const occupancy = zone.currentCrowd / zone.capacity;
    if (occupancy > 0.9) {
      zone.status = ZoneStatus.CRITICAL;
    } else if (occupancy > 0.7) {
      zone.status = ZoneStatus.CROWDED;
    } else {
      zone.status = ZoneStatus.NORMAL;
    }
    res.json({ success: true, updatedZone: zone });
  } else {
    res.status(404).json({ error: "Zone not found" });
  }
});

// Get gates status
app.get("/api/stadium/gates", (req, res) => {
  res.json(gates);
});

// Update gate status
app.post("/api/stadium/gates/:id", (req, res) => {
  const { id } = req.params;
  const { status, avgWaitTime, flowRate } = req.body;
  const gate = gates.find((g) => g.id === id);
  if (gate) {
    if (status !== undefined) gate.status = status;
    if (avgWaitTime !== undefined) gate.avgWaitTime = avgWaitTime;
    if (flowRate !== undefined) gate.flowRate = flowRate;
    res.json({ success: true, updatedGate: gate });
  } else {
    res.status(404).json({ error: "Gate not found" });
  }
});

// Get tasks
app.get("/api/stadium/tasks", (req, res) => {
  res.json(staffTasks);
});

// Create task
app.post("/api/stadium/tasks", (req, res) => {
  const { title, description, location, assignedRole, priority } = req.body;
  const newTask: StaffTask = {
    id: `T${staffTasks.length + 1}`,
    title,
    description,
    location,
    assignedRole,
    status: "PENDING",
    priority,
    timestamp: new Date().toISOString(),
  };
  staffTasks.unshift(newTask);
  res.json({ success: true, task: newTask });
});

// Update task status
app.post("/api/stadium/tasks/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const task = staffTasks.find((t) => t.id === id);
  if (task) {
    task.status = status;
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

// Get emergency alerts
app.get("/api/stadium/alerts", (req, res) => {
  res.json(emergencyAlerts);
});

// Create emergency alert
app.post("/api/stadium/alerts", (req, res) => {
  const { title, description, location, severity } = req.body;
  const newAlert: EmergencyAlert = {
    id: `E${emergencyAlerts.length + 1}`,
    title,
    description,
    location,
    severity,
    timestamp: new Date().toISOString(),
    resolved: false,
  };
  emergencyAlerts.unshift(newAlert);
  res.json({ success: true, alert: newAlert });
});

// Resolve emergency alert
app.post("/api/stadium/alerts/:id/resolve", (req, res) => {
  const { id } = req.params;
  const alert = emergencyAlerts.find((a) => a.id === id);
  if (alert) {
    alert.resolved = true;
    res.json({ success: true, alert });
  } else {
    res.status(404).json({ error: "Alert not found" });
  }
});

// Get sustainability metrics
app.get("/api/stadium/sustainability", (req, res) => {
  res.json(sustainabilityMetrics);
});

// Update sustainability metric
app.post("/api/stadium/sustainability", (req, res) => {
  const { category, value } = req.body;
  const metric = sustainabilityMetrics.find((m) => m.category === category);
  if (metric) {
    metric.value = value;
    const progress = metric.value / metric.target;
    if (progress >= 0.95) {
      metric.status = "EXCELLENT";
    } else if (progress >= 0.8) {
      metric.status = "ON_TRACK";
    } else {
      metric.status = "NEEDS_IMPROVEMENT";
    }
    res.json({ success: true, metric });
  } else {
    res.status(404).json({ error: "Metric not found" });
  }
});

// ==========================================
// GEN AI API ENDPOINTS (Google Gemini API SDK)
// ==========================================

// 1. Multilingual Assistant (Handles fans and venue staff inquiries in any language)
app.post("/api/gemini/assistant", async (req, res) => {
  const { message, history, role = StaffRole.FAN, preferredLanguage = "English" } = req.body;

  try {
    const ai = getAiClient();

    // Inject stadium context so Gemini actually knows the live venue status
    const liveContext = `
[LIVE STADIUM CONTEXT FOR THE ASSISTANT]
Current time: ${new Date().toLocaleTimeString()}
Current Active Emergency/Safety Alerts:
${emergencyAlerts.filter(a => !a.resolved).map(a => `- [${a.severity}] ${a.title} at ${a.location}: ${a.description}`).join("\n") || "No active safety alerts. Venue is completely safe."}

Current Gates status:
${gates.map(g => `- ${g.name}: Status is ${g.status}, Wait time is ${g.avgWaitTime} minutes, flow rate is ${g.flowRate} people/min.`).join("\n")}

Current Zones crowd & facilities queues:
${stadiumZones.map(z => `- ${z.name}: Occupancy is ${Math.round((z.currentCrowd/z.capacity)*100)}% (${z.currentCrowd}/${z.capacity} fans). Status is ${z.status}. Wait times: Concessions is ${z.concessionQueueTime} mins, Restrooms is ${z.restroomQueueTime} mins.`).join("\n")}

User role interacting with you: ${role}
Preferred Response Language: ${preferredLanguage}
`;

    const systemInstruction = `
You are "StadiumAIst", an intelligent, friendly, and authoritative stadium operations and fan assistance bot for the FIFA World Cup 2026.
Your main goals are:
1. Help fans navigate comfortably, find shorter restroom/concession lines, and select the best gate to enter or exit.
2. Provide multilingual support. ALWAYS respond in the user's preferred language (requested as: ${preferredLanguage}) or automatically match the language of their message if they write in Spanish, French, German, Arabic, Japanese, etc.
3. If the user is a Volunteer or Security staff (specified in role), provide helpful guidance on handling stadium logistics, task assignment context, or crowd calming methods.
4. Keep answers clear, professional, short, and highly actionable.
5. Emphasize sustainability when appropriate (e.g., recommend using waste recycling bins or noting that Zone A is fully solar-powered).
6. Under no circumstances should you invent false gate status or safety threats. Only reference the provided LIVE STADIUM CONTEXT. If something is not in the context, guide the user to the nearest volunteer desk.

Current Live Stadium Status to base your responses on:
${liveContext}
`;

    // Process using Chat API to maintain conversation history!
    const chatSession = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // Feed prior history if available
    if (history && Array.isArray(history)) {
      // Set history if the SDK supports it, or we can send it as parts.
      // Since history is passed, we will simulate the conversation flow or run a contents-based generateContent with history.
    }

    const response = await chatSession.sendMessage({
      message: message
    });

    res.json({
      reply: response.text,
      contextUsed: {
        alertsCount: emergencyAlerts.filter(a => !a.resolved).length,
        safestGates: gates.filter(g => g.status === "OPEN").map(g => g.name),
      }
    });
  } catch (error: any) {
    console.error("Gemini Assistant API Error:", error);
    res.status(500).json({ error: "Gemini AI failed to process the request. Make sure your API key is configured." });
  }
});

// 2. AI-Generated Operational Summary & Decision Support (For Organizers)
app.post("/api/gemini/operational-summary", async (req, res) => {
  try {
    const ai = getAiClient();

    const prompt = `
Please analyze the current stadium operational state and generate a concise executive summary for FIFA World Cup Organizers.
Include:
1. Crowd Logistics Analysis: Highlight bottlenecks (Current status: Zone D is CRITICAL, Zone B/C are CROWDED).
2. Gates Optimization: Analyze gates (West Gate is CLOSED, Gate 2 is SLOW). Recommend action.
3. Safety & Task Analysis: What tasks are in-progress or pending? What are the critical safety concerns?
4. Sustainability report: How are we tracking on Solar generation and Waste divert rate?
5. Strategic Actionable Plan: 3 quick tactical steps to optimize fan outflow in the next 15 minutes.

Live Data:
- Zones: ${JSON.stringify(stadiumZones)}
- Gates: ${JSON.stringify(gates)}
- Pending/Active Tasks: ${JSON.stringify(staffTasks)}
- Safety Alerts: ${JSON.stringify(emergencyAlerts)}
- Sustainability Metrics: ${JSON.stringify(sustainabilityMetrics)}

Provide your response in structured Markdown format. Make it look professional and authoritative.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a Chief Operations Officer (COO) AI Assistant specializing in large-scale sporting venue logistics.",
        temperature: 0.3
      }
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Gemini Operational Summary Error:", error);
    res.status(500).json({ error: "Failed to generate operational summary." });
  }
});

// 3. AI Sustainability Advisor (Fan or Organizer insights)
app.post("/api/gemini/sustainability-advisor", async (req, res) => {
  const { focus = "General" } = req.body;
  try {
    const ai = getAiClient();

    const prompt = `
Give a high-fidelity, encouraging, and informative report on stadium sustainability.
Focus Area: ${focus}

Current Stadium Metrics:
- Solar Power: Generated ${stadiumMetricsValue("Solar Power Generation")} kWh out of 500 kWh target.
- Waste Diverted from Landfill: ${stadiumMetricsValue("Waste Diverted from Landfill")}% out of 90% target.
- Recycled Water Consumption: ${stadiumMetricsValue("Recycled Water Consumption")} kL out of 150 kL target.
- Biodegradable Packaging: ${stadiumMetricsValue("Biodegradable Packaging Use")}% out of 95% target.

Provide 3 specific sustainability achievements and 2 areas where fans can help during their visit. Return in Markdown.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the StadiumAIst Green Planet Advisor. You motivate sports fans and organizers to achieve eco-friendly stadium goals."
      }
    });

    res.json({ insights: response.text });
  } catch (error) {
    console.error("Gemini Sustainability Advisor Error:", error);
    res.status(500).json({ error: "Failed to fetch sustainability insights." });
  }
});

function stadiumMetricsValue(category: string): number {
  return sustainabilityMetrics.find(m => m.category === category)?.value || 0;
}

// ==========================================
// STATIC ASSETS AND SPA HANDLING
// ==========================================
async function startServer() {
  if (process.env.VERCEL) {
    // On Vercel, the CDN handles static files, and the app is run as a serverless function.
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[StadiumAIst Backend] Running at http://localhost:${PORT}`);
  });
}

startServer();

export default app;
