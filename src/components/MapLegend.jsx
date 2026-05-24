import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

// Map Legend — positioned top-right, shows layer symbology + intensity color scale
// Uses glassmorphism panel with premium dark GIS styling
export default function MapLegend() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="absolute top-24 right-6 z-20 flex flex-col items-end gap-2 pointer-events-auto">
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-full text-slate-400 hover:text-cyan-400 transition-colors shadow-lg flex items-center justify-center"
        title={isVisible ? "Hide Legend" : "Show Legend"}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] text-xs w-64"
          >
            {/* Header with neon accent */}
            <h3 className="font-bold text-slate-200 uppercase tracking-[0.15em] mb-3 pb-2 border-b border-slate-700/50 text-[11px]"
                style={{ textShadow: '0 0 10px rgba(6,182,212,0.3)' }}>
              MAP LEGEND
            </h3>
      <div className="space-y-2.5">
        {/* Layer symbology items with glowing dot indicators */}
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300/50 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
          <span className="text-slate-400">Safe nodes / evacuation points</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-1 bg-emerald-500 rounded shadow-[0_0_4px_rgba(16,185,129,0.4)]"></div>
          <span className="text-slate-400">Evacuation or rescue routes</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          <span className="text-slate-400">Earthquake origin point</span>
        </div>

        {/* Intensity scale items — matches heatmap color ramp */}
        <div className="mt-2 pt-2 border-t border-slate-700/40">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Intensity Scale</div>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500/90 shadow-[0_0_6px_rgba(239,68,68,0.4)]"></div>
            <span className="text-slate-400">High Intensity (Near Epicenter)</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-orange-400/90 shadow-[0_0_6px_rgba(251,146,60,0.4)]"></div>
            <span className="text-slate-400">Moderate Intensity</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.4)]"></div>
            <span className="text-slate-400">Low Intensity</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-400/90 shadow-[0_0_6px_rgba(96,165,250,0.4)]"></div>
            <span className="text-slate-400">Very Low Intensity (Farther Away)</span>
          </div>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
