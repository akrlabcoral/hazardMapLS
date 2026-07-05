import React, { useState, useEffect } from 'react';
import LiveEventsPanel from './LiveEventsPanel';
import { AlertTriangle, MapPin, Calendar, Flame, Mountain } from 'lucide-react';

export function AlertsPanel() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = () => {
      fetch('/scientific-api/alerts/predictions')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setPredictions(data.predictions);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch predictions", err);
          setLoading(false);
        });
    };

    // Fetch immediately on mount
    fetchPredictions();

    // Fetch every hour (3600000 ms)
    const intervalId = setInterval(fetchPredictions, 3600000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col h-full w-full space-y-4">
      {/* Predictive Early Warnings */}
      <div className="glass-panel p-4 flex-none max-h-[300px] overflow-y-auto">
        <h3 className="text-[#f1f5f9] font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-500" />
          AI Early Warnings (Next 3 Days)
        </h3>
        
        {loading ? (
          <div className="text-[#64748b] text-sm italic">Loading predictions...</div>
        ) : predictions.length === 0 ? (
          <div className="text-[#22c55e] text-sm">No extreme hazards predicted for key regions in the next 3 days.</div>
        ) : (
          <div className="space-y-3">
            {predictions.map(pred => (
              <div key={pred.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {pred.hazard_type === 'heatwave' ? (
                      <Flame size={14} className={pred.severity.includes('Extreme') ? 'text-red-500' : 'text-orange-500'} />
                    ) : (
                      <Mountain size={14} className={pred.severity.includes('Extreme') ? 'text-red-500' : 'text-orange-500'} />
                    )}
                    <span className={`font-bold text-sm ${pred.severity.includes('Extreme') ? 'text-red-400' : 'text-orange-400'}`}>
                      {pred.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
                    <Calendar size={12} />
                    {pred.target_date}
                  </div>
                </div>
                
                <p className="text-sm text-[#f1f5f9] mb-2 leading-relaxed">
                  {pred.message}
                </p>
                
                <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
                  <MapPin size={12} />
                  {pred.place_name} ({pred.latitude.toFixed(2)}, {pred.longitude.toFixed(2)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Earthquake Events */}
      <div className="flex-1 min-h-[400px]">
        <h3 className="text-[#f1f5f9] font-bold uppercase tracking-wider text-xs mb-2">
          Live Seismic Feed
        </h3>
        <LiveEventsPanel />
      </div>
    </div>
  );
}

