/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ZoneStatus {
  NORMAL = "NORMAL",
  CROWDED = "CROWDED",
  CRITICAL = "CRITICAL",
}

export enum StaffRole {
  FAN = "FAN",
  VOLUNTEER = "VOLUNTEER",
  SECURITY = "SECURITY",
  ORGANIZER = "ORGANIZER",
}

export interface StadiumZone {
  id: string;
  name: string;
  capacity: number;
  currentCrowd: number;
  status: ZoneStatus;
  gateQueueTime: number; // in minutes
  concessionQueueTime: number; // in minutes
  restroomQueueTime: number; // in minutes
  sustainabilityScore: number; // 0 to 100
}

export interface GateInfo {
  id: string;
  name: string;
  status: "OPEN" | "CLOSED" | "SLOW";
  flowRate: number; // people per minute
  avgWaitTime: number; // in minutes
}

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  location: string;
  assignedRole: StaffRole.VOLUNTEER | StaffRole.SECURITY;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: string;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  timestamp: string;
  resolved: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface SustainabilityMetric {
  category: string;
  value: number;
  target: number;
  unit: string;
  status: "EXCELLENT" | "ON_TRACK" | "NEEDS_IMPROVEMENT";
}
