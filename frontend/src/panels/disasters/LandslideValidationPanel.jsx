import React from 'react';
import useStore from '../../store/useStore';
import { Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

export function LandslideValidationPanel() {
  const { historicalValidationVisible, simulationResults } = useStore(
    useShallow((s) => ({
      historicalValidationVisible: s.historicalValidationVisible,
      simulationResults: s.simulationResults,
    }))
  );

  if (!historicalValidationVisible || !simulationResults?.validation_stats) return null;

  const stats = simulationResults.validation_stats;

  if (stats.error) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-red-500/50 mt-4">
        <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
          <AlertTriangle size={16} /> Validation Error
        </h3>
        <p className="text-sm text-slate-400">{stats.error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 mt-4 space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
        <Target size={18} className="text-emerald-400" />
        <h3 className="font-semibold text-slate-200">Historical Validation</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-900/50 p-2 rounded">
          <p className="text-slate-400 text-xs">Total NASA Points</p>
          <p className="text-xl font-mono text-slate-200">{stats.total_historical_events}</p>
        </div>
        
        <div className="bg-slate-900/50 p-2 rounded">
          <p className="text-slate-400 text-xs">Overlap Accuracy</p>
          <p className="text-xl font-mono text-emerald-400 flex items-center gap-1">
            {stats.accuracy_percentage}%
          </p>
        </div>
      </div>

      <div className="text-xs text-slate-400 flex flex-col gap-1 mt-2 bg-slate-900 p-2 rounded border border-slate-700/50">
        <div className="flex justify-between">
          <span>In Very High Risk (0.8+)</span>
          <span className="font-mono text-red-400">{stats.events_in_very_high_risk}</span>
        </div>
        <div className="flex justify-between">
          <span>In High Risk (0.6-0.8)</span>
          <span className="font-mono text-orange-400">{stats.events_in_high_risk}</span>
        </div>
      </div>
    </div>
  );
}
