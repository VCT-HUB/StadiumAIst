/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { StaffTask, StaffRole } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClipboardList, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  AlertOctagon, 
  UserCheck, 
  ShieldAlert, 
  Sparkles,
  MapPin,
  ChevronDown,
  X,
  Plus
} from "lucide-react";

interface TaskBoardProps {
  tasks: StaffTask[];
  onCreateTask: (title: string, description: string, location: string, assignedRole: StaffRole.VOLUNTEER | StaffRole.SECURITY, priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
  onUpdateTaskStatus: (taskId: string, newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED") => void;
  userRole: StaffRole;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onCreateTask,
  onUpdateTaskStatus,
  userRole,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [roleAssigned, setRoleAssigned] = useState<StaffRole.VOLUNTEER | StaffRole.SECURITY>(StaffRole.VOLUNTEER);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) return;
    
    onCreateTask(title, description, location, roleAssigned, priority);
    
    // Reset Form
    setTitle("");
    setDescription("");
    setLocation("");
    setPriority("MEDIUM");
    setRoleAssigned(StaffRole.VOLUNTEER);
    setShowForm(false);
  };

  const getPriorityStyles = (p: string) => {
    switch (p) {
      case "CRITICAL":
        return "bg-red-50 text-red-700 border border-red-200 shadow-sm font-black";
      case "HIGH":
        return "bg-amber-50 text-amber-700 border border-amber-200 font-bold";
      case "MEDIUM":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold";
      case "LOW":
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />;
      case "PENDING":
      default:
        return <AlertOctagon className="w-4 h-4 text-[#15803d]" />;
    }
  };

  // Only Organizers, Security, or Volunteers should see the Task Board
  if (userRole === StaffRole.FAN) {
    return (
      <div className="bg-white border border-[#22c55e]/20 p-6 flex flex-col items-center justify-center text-center min-h-[400px] rounded-[24px]">
        <div className="w-14 h-14 rounded-2xl bg-[#f0f7f4] flex items-center justify-center text-slate-500 border border-[#22c55e]/20 shadow-sm">
          <ClipboardList className="w-6 h-6 text-[#15803d]" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mt-4 uppercase tracking-wider font-display">Authorized Staff Corridor Only</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2.5 leading-relaxed">
          This dispatcher terminal is reserved for FIFA volunteers, stadium safety directors, security forces, and coordinators to resolve live venue logistical tickets.
        </p>
      </div>
    );
  }

  return (
    <div id="staff-tasks-board" className="bg-white border border-[#22c55e]/20 p-6 rounded-[24px] shadow-[0_8px_30px_rgba(21,128,61,0.03)] space-y-4 relative overflow-hidden">
      
      {/* Decorative top grid accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#15803d]/5 to-transparent pointer-events-none" />

      <div className="flex justify-between items-center border-b border-[#22c55e]/15 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 font-display uppercase tracking-wider">
            <ClipboardList className="w-5 h-5 text-[#15803d]" />
            Operations Task Board
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time logistical operations dispatch queue for World Cup support.
          </p>
        </div>

        {/* Dispatch button only for Organizers & Security */}
        {(userRole === StaffRole.ORGANIZER || userRole === StaffRole.SECURITY) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#15803d] to-[#22c55e] hover:opacity-90 text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Dispatch Ticket
          </button>
        )}
      </div>

      {/* Ticket Dispatch Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#f0f7f4]/60 p-5 rounded-2xl border border-[#22c55e]/25 shadow-sm space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#15803d] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Dispatch New Ticket
              </h3>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Ticket Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clean medical corridor"
                  className="w-full bg-white border border-[#22c55e]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Location Details</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Zone A concession block 3"
                  className="w-full bg-white border border-[#22c55e]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Description & exact instructions</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide direct tasks guidance and instructions..."
                className="w-full bg-white border border-[#22c55e]/25 rounded-xl px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#15803d] resize-y min-h-[100px] leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Assign Service Role</label>
                <select
                  value={roleAssigned}
                  onChange={(e) => setRoleAssigned(e.target.value as StaffRole.VOLUNTEER | StaffRole.SECURITY)}
                  className="w-full bg-white border border-[#22c55e]/25 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#15803d]"
                >
                  <option value={StaffRole.VOLUNTEER}>Volunteer Support</option>
                  <option value={StaffRole.SECURITY}>Security Force</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Task Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-white border border-[#22c55e]/25 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#15803d]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical Emergency</option>
                </select>
              </div>

              <div className="flex items-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-1/2 px-3 py-2.5 bg-white border border-[#22c55e]/20 text-slate-500 hover:text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 px-3 py-2.5 bg-gradient-to-r from-[#15803d] to-[#22c55e] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task Queue Cards */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            // Is this task relevant for the logged-in staff role?
            const isAssignedToMe = userRole === StaffRole.ORGANIZER || userRole === task.assignedRole;

            return (
              <div
                key={task.id}
                className={`bg-[#f0f7f4]/40 p-4 rounded-xl border transition-all ${
                  task.status === "COMPLETED"
                    ? "border-[#22c55e]/10 opacity-60"
                    : task.priority === "CRITICAL"
                    ? "border-red-200 hover:border-red-400"
                    : "border-[#22c55e]/15 hover:border-[#15803d]/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">#{task.id}</span>
                      <h4 className={`text-xs font-bold leading-snug ${task.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.title}
                      </h4>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${getPriorityStyles(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pr-2">{task.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-1 font-bold">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-[#15803d]" />
                        Target: {task.assignedRole === StaffRole.VOLUNTEER ? "Volunteer Force" : "Security Force"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#15803d] bg-emerald-50 px-2 py-0.5 rounded border border-[#22c55e]/35">
                        <MapPin className="w-3 h-3" />
                        {task.location}
                      </span>
                      <span className="text-slate-400 font-mono font-normal">
                        {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions / Status Controls */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:self-stretch shrink-0 gap-2">
                    <div className="flex items-center gap-1.5 bg-[#f0f7f4] px-2.5 py-1 rounded-lg border border-[#22c55e]/20">
                      {getStatusIcon(task.status)}
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{task.status}</span>
                    </div>

                    {/* Status updater buttons for authorized staff */}
                    {isAssignedToMe && task.status !== "COMPLETED" && (
                      <div className="flex gap-1.5">
                        {task.status === "PENDING" && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, "IN_PROGRESS")}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100/50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full transition-all cursor-pointer shadow-sm"
                          >
                            Claim
                          </button>
                        )}
                        {task.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, "COMPLETED")}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100/50 text-emerald-800 border border-[#22c55e]/25 text-[10px] font-bold rounded-full transition-all cursor-pointer animate-pulse shadow-sm"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-[#f0f7f4]/30 rounded-2xl border border-[#22c55e]/20 border-dashed">
            <p className="text-xs text-slate-500 font-semibold">All operations are running smoothly. Zero active tasks found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
