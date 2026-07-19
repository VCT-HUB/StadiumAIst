/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { EmergencyAlert } from "../types.js";
import { Siren, ShieldAlert, ArrowRight, XCircle, AlertOctagon, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AlertBannerProps {
  alerts: EmergencyAlert[];
  onResolve: (id: string) => void;
  userRole: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onResolve, userRole }) => {
  const activeAlerts = alerts.filter((a) => !a.resolved);

  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];
  const isCritical = currentAlert.severity === "CRITICAL";

  return (
    <AnimatePresence>
      <motion.div
        id="safety-alert-ticker"
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -25 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`border-b text-xs relative z-50 shadow-md py-3 px-4 ${
          isCritical
            ? "bg-red-50 border-red-200 text-red-900 shadow-[0_4px_25px_rgba(220,38,38,0.05)]"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Alert Content description */}
          <div className="flex items-center gap-3.5">
            <div className={`flex items-center justify-center w-7 h-7 rounded-xl shrink-0 ${
              isCritical
                ? "bg-red-200 text-red-600 animate-pulse"
                : "bg-amber-200 text-amber-600 animate-pulse"
            }`}>
              <Siren className="w-4 h-4 animate-bounce" />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-1">
              <span className={`inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-md border ${
                isCritical
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                <AlertOctagon className="w-3 h-3" />
                {currentAlert.severity} VENUE BULLETIN
              </span>
              <div className="text-xs">
                <strong className="text-slate-800 font-extrabold">{currentAlert.title}</strong>
                <span className="text-slate-400 mx-2 hidden sm:inline">—</span>
                <span className="text-slate-600 block sm:inline mt-0.5 sm:mt-0 font-medium">{currentAlert.description}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] bg-[#f0f7f4] border border-[#22c55e]/20 px-2.5 py-0.5 rounded-md text-slate-700 font-bold font-mono">
                📍 {currentAlert.location}
              </span>
            </div>
          </div>

          {/* Action Resolve Buttons */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            {activeAlerts.length > 1 && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-[#f0f7f4] border border-[#22c55e]/20 text-slate-500 px-2.5 py-1 rounded-full">
                +{activeAlerts.length - 1} OTHER INCIDENTS
              </span>
            )}

            {userRole !== "FAN" && (
              <button
                onClick={() => onResolve(currentAlert.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f7f4] hover:bg-[#15803d]/10 border border-[#22c55e]/20 text-[#15803d] font-bold text-[10px] rounded-full uppercase tracking-wider transition-all cursor-pointer"
              >
                Clear Bulletin
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              </button>
            )}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
