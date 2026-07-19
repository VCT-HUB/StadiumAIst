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
        return "bg-[#FF3B5C]/10 text-[#FF3B5C] border border-[#FF3B5C]/30 shadow-[0_0_8px_rgba(255,59,92,0.15)] font-black";
      case "HIGH":
        return "bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/30 font-bold";
      case "MEDIUM":
        return "bg-[#005CFF]/10 text-[#005CFF] border border-[#005CFF]/30 font-semibold";
      case "LOW":
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-[#00C853]" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-[#FFC107] animate-spin" style={{ animationDuration: '3s' }} />;
      case "PENDING":
      default:
        return <AlertOctagon className="w-4 h-4 text-[#00D4FF]" />;
    }
  };

  // Only Organizers, Security, or Volunteers should see the Task Board
  if (userRole === StaffRole.FAN) {
    return (
      <div className="glass-panel-glow p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-2xl bg-[#0B1228] flex items-center justify-center text-slate-500 border border-white/[0.06] shadow-xl">
          <ClipboardList className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-white mt-4 uppercase tracking-wider font-display">Authorized Staff Corridor Only</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-2.5 leading-relaxed">
          This dispatcher terminal is reserved for FIFA volunteers, stadium safety directors, security forces, and coordinators to resolve live venue logistical tickets.
        </p>
      </div>
    );
  }

  return (
    <div id="staff-tasks-board" className="glass-panel-glow p-6 space-y-4 shadow-2xl relative overflow-hidden">
      
      {/* Decorative top grid accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#6C4DFF]/5 to-transparent pointer-events-none" />

      <div className="flex justify-between items-center border-b border-white/[0.06] pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2 font-display uppercase tracking-wider">
            <ClipboardList className="w-5 h-5 text-[#6C4DFF]" />
            Operations Task Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time logistical operations dispatch queue for World Cup support.
          </p>
        </div>

        {/* Dispatch button only for Organizers & Security */}
        {(userRole === StaffRole.ORGANIZER || userRole === StaffRole.SECURITY) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#005CFF] to-[#6C4DFF] hover:opacity-90 text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-lg shadow-[#005CFF]/20"
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
            className="bg-[#050816] p-5 rounded-2xl border border-white/[0.08] space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#00D4FF] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Dispatch New Ticket
              </h3>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Ticket Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clean medical corridor"
                  className="w-full bg-[#121932]/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-[#00D4FF]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Location Details</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Zone A concession block 3"
                  className="w-full bg-[#121932]/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-[#00D4FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Description & exact instructions</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide direct tasks guidance and instructions..."
                className="w-full bg-[#121932]/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-[#00D4FF] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Assign Service Role</label>
                <select
                  value={roleAssigned}
                  onChange={(e) => setRoleAssigned(e.target.value as StaffRole.VOLUNTEER | StaffRole.SECURITY)}
                  className="w-full bg-[#121932]/80 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-[#00D4FF]"
                >
                  <option value={StaffRole.VOLUNTEER}>Volunteer Support</option>
                  <option value={StaffRole.SECURITY}>Security Force</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Task Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-[#121932]/80 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-[#00D4FF]"
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
                  className="w-1/2 px-3 py-2.5 bg-[#121932] border border-white/[0.06] text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 px-3 py-2.5 bg-gradient-to-r from-[#005CFF] to-[#6C4DFF] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
                className={`bg-[#050816]/70 p-4 rounded-xl border transition-all ${
                  task.status === "COMPLETED"
                    ? "border-[#00C853]/10 opacity-60"
                    : task.priority === "CRITICAL"
                    ? "border-[#FF3B5C]/20 hover:border-[#FF3B5C]/40"
                    : "border-white/[0.05] hover:border-white/[0.12]"
                } premium-card-hover`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500">#{task.id}</span>
                      <h4 className={`text-xs font-bold leading-snug ${task.status === "COMPLETED" ? "line-through text-slate-500" : "text-white"}`}>
                        {task.title}
                      </h4>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${getPriorityStyles(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-350 leading-relaxed pr-2">{task.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-1 font-bold">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
                        Target: {task.assignedRole === StaffRole.VOLUNTEER ? "Volunteer Force" : "Security Force"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#00D4FF] bg-[#00D4FF]/5 px-2 py-0.5 rounded border border-[#00D4FF]/10">
                        <MapPin className="w-3 h-3" />
                        {task.location}
                      </span>
                      <span className="text-slate-500 font-mono font-normal">
                        {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions / Status Controls */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:self-stretch shrink-0 gap-2">
                    <div className="flex items-center gap-1.5 bg-[#050816] px-2.5 py-1 rounded-lg border border-white/[0.04]">
                      {getStatusIcon(task.status)}
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{task.status}</span>
                    </div>

                    {/* Status updater buttons for authorized staff */}
                    {isAssignedToMe && task.status !== "COMPLETED" && (
                      <div className="flex gap-1.5">
                        {task.status === "PENDING" && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, "IN_PROGRESS")}
                            className="px-3 py-1 bg-[#FFC107]/10 hover:bg-[#FFC107]/20 text-[#FFC107] border border-[#FFC107]/25 text-[10px] font-bold rounded-full transition-all cursor-pointer"
                          >
                            Claim
                          </button>
                        )}
                        {task.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, "COMPLETED")}
                            className="px-3 py-1 bg-[#00C853]/10 hover:bg-[#00C853]/25 text-[#00C853] border border-[#00C853]/25 text-[10px] font-bold rounded-full transition-all cursor-pointer animate-pulse"
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
          <div className="text-center py-12 bg-[#050816]/30 rounded-2xl border border-white/[0.06] border-dashed">
            <p className="text-xs text-slate-500 font-medium">All operations are running smoothly. Zero active tasks found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
