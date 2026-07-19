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
        className={`border-b text-xs relative z-50 shadow-2xl py-3 px-4 ${
          isCritical
            ? "bg-[#FF3B5C]/15 border-[#FF3B5C]/30 text-rose-100 shadow-[0_4px_25px_rgba(255,59,92,0.15)]"
            : "bg-[#FFC107]/10 border-[#FFC107]/30 text-amber-100"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Alert Content description */}
          <div className="flex items-center gap-3.5">
            <div className={`flex items-center justify-center w-7 h-7 rounded-xl shrink-0 ${
              isCritical
                ? "bg-[#FF3B5C]/25 text-[#FF3B5C] animate-pulse"
                : "bg-[#FFC107]/25 text-[#FFC107] animate-pulse"
            }`}>
              <Siren className="w-4 h-4 animate-bounce" />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-1">
              <span className={`inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-md border ${
                isCritical
                  ? "bg-[#FF3B5C]/10 text-[#FF3B5C] border-[#FF3B5C]/35 shadow-[0_0_8px_rgba(255,59,92,0.2)]"
                  : "bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/35"
              }`}>
                <AlertOctagon className="w-3 h-3" />
                {currentAlert.severity} VENUE BULLETIN
              </span>
              <div className="text-xs">
                <strong className="text-white font-extrabold">{currentAlert.title}</strong>
                <span className="text-slate-400 mx-2 hidden sm:inline">—</span>
                <span className="text-slate-200 block sm:inline mt-0.5 sm:mt-0 font-medium">{currentAlert.description}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] bg-black/40 border border-white/[0.05] px-2.5 py-0.5 rounded-md text-slate-300 font-bold font-mono">
                📍 {currentAlert.location}
              </span>
            </div>
          </div>

          {/* Action Resolve Buttons */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            {activeAlerts.length > 1 && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-black/40 border border-white/[0.05] text-slate-400 px-2.5 py-1 rounded-full">
                +{activeAlerts.length - 1} OTHER INCIDENTS
              </span>
            )}

            {userRole !== "FAN" && (
              <button
                onClick={() => onResolve(currentAlert.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 hover:text-white border border-white/10 text-slate-200 font-bold text-[10px] rounded-full uppercase tracking-wider transition-all cursor-pointer"
              >
                Clear Bulletin
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              </button>
            )}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
