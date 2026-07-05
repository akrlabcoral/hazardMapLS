import React, { useState, useRef, useEffect } from 'react';
import useStore from '../../store/useStore';
import { ThermometerSun, Droplets, Play, Loader2, Calendar, XCircle, Trash2, Building, Activity, Users } from 'lucide-react';

export default function HeatwaveModule() {
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [uhiEnabled, setUhiEnabled] = useState(true);
  const [forecastDays, setForecastDays] = useState(5);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showAllStates, setShowAllStates] = useState(false);
  
  // Custom Fallback (if they turn off Live Mode)
  const [customTemp, setCustomTemp] = useState(40.0);
  const [customHum, setCustomHum] = useState(50.0);
  
  const isSimulationRunning = useStore((state) => state.isSimulationRunning);
  const setIsSimulationRunning = useStore((state) => state.setIsSimulationRunning);
  const simulationResults = useStore((state) => state.simulationResults);
  const setSimulationResults = useStore((state) => state.setSimulationResults);
  const setMlSimulationData = useStore((state) => state.setMlSimulationData);
  const setMlHeatmapVisible = useStore((state) => state.setMlHeatmapVisible);
  const setMlContoursVisible = useStore((state) => state.setMlContoursVisible);
  
  const heatwaveActiveLayer = useStore((state) => state.heatwaveActiveLayer);
  const setHeatwaveActiveLayer = useStore((state) => state.setHeatwaveActiveLayer);
  
  const targetDateOffset = useStore((state) => state.targetDateOffset);
  const setTargetDateOffset = useStore((state) => state.setTargetDateOffset);
  
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // When selectedDay changes, update the map data
  useEffect(() => {
    if (simulationResults?.forecast) {
      const dayData = simulationResults.forecast[selectedDay - 1];
      if (dayData) {
        setMlSimulationData(dayData.grid_geojson);
      }
    }
  }, [selectedDay, simulationResults, setMlSimulationData]);

  const runSimulation = async () => {
    setIsSimulationRunning(true);
    setError(null);
    setSelectedDay(1);
    abortControllerRef.current = new AbortController();
    try {
      const response = await fetch('/scientific-api/heatwave/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_live: isLiveMode,
          uhi_enabled: uhiEnabled,
          duration_days: forecastDays,
          apparent_temperature: customTemp,
          target_date_offset: targetDateOffset
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const text = await response.text();
        let errMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const json = JSON.parse(text);
          errMsg = json.detail || JSON.stringify(json);
        } catch {
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data.forecast && data.forecast.length > 0) {
        const day = data.forecast[0];
        // Set simulationResults in same format as landslide so contour rendering works
        setSimulationResults({
          ...data,
          grid_geojson: day.grid_geojson,
          contour_geojson: day.contour_geojson,
        });
        setMlSimulationData(day.grid_geojson);
      } else {
        setSimulationResults(data);
      }
      setMlHeatmapVisible(true);
      setMlContoursVisible(true);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError("Simulation stopped by user.");
      } else {
        console.error("[Heatwave] Simulation error:", err);
        setError(err.message || "Failed to run simulation");
      }
    } finally {
      setIsSimulationRunning(false);
      abortControllerRef.current = null;
    }
  };
  
  const clearSimulationState = useStore((state) => state.clearSimulationState);

  const handleStopOrClear = () => {
    if (isSimulationRunning && abortControllerRef.current) {
      abortControllerRef.current.abort();
    } else if (simulationResults) {
      clearSimulationState();
    }
  };

  const currentResult = simulationResults?.forecast?.[selectedDay - 1];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold tracking-wide text-[#f1f5f9] uppercase">Heatwave Model</h2>
        <div className="flex items-center gap-2">
           <label className="text-[11px] text-[#94a3b8]">Live API Data</label>
           <label className="cursor-pointer relative inline-flex items-center">
             <input type="checkbox" checked={isLiveMode} onChange={(e) => setIsLiveMode(e.target.checked)} className="sr-only peer" />
             <div className="w-7 h-4 bg-white/[0.1] rounded-full peer peer-checked:bg-[#00d4ff]/20 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#00d4ff] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3"></div>
           </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        
        {/* Parameters Box */}
        <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06] space-y-4">
          
          <div className="flex items-center justify-between">
             <span className="text-[11px] font-semibold text-[#f1f5f9] flex items-center gap-1">
               <Building className="w-3 h-3 text-[#f97316]" /> 
               Urban Heat Island (UHI)
             </span>
             <label className="cursor-pointer relative inline-flex items-center">
               <input type="checkbox" checked={uhiEnabled} onChange={(e) => setUhiEnabled(e.target.checked)} className="sr-only peer" />
               <div className="w-7 h-4 bg-white/[0.1] rounded-full peer peer-checked:bg-[#f97316]/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#f97316] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3"></div>
             </label>
          </div>



          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#f1f5f9] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#00d4ff]" /> 
                Target Date
              </span>
              <span className="text-[12px] text-[#00d4ff] font-mono">
                {targetDateOffset === 0 ? "Today" : targetDateOffset < 0 ? `${Math.abs(targetDateOffset)} Days Ago` : `In ${targetDateOffset} Days`}
              </span>
            </div>
            <input 
              type="range" 
              min="-3" max="3" step="1" 
              value={targetDateOffset} 
              onChange={(e) => setTargetDateOffset(parseInt(e.target.value))}
              className="w-full accent-[#00d4ff] h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-1 text-[9px] text-[#64748b]">
              <span>-3 Days</span>
              <span>Today</span>
              <span>+3 Days</span>
            </div>
          </div>
          
          {!isLiveMode && (
            <div className="space-y-4 pt-3 border-t border-white/[0.06]">
              <div>
                <div className="flex justify-between text-[11px] text-[#94a3b8] mb-1">
                  <span className="flex items-center gap-1"><ThermometerSun className="w-3 h-3"/> Apparent Temp / UTCI</span> 
                  <span>{customTemp}°C</span>
                </div>
                <input type="range" min="30" max="55" step="0.5" value={customTemp} onChange={(e)=>setCustomTemp(parseFloat(e.target.value))} className="w-full accent-[#f97316] h-1.5" />
              </div>
            </div>
          )}

        </div>

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[11px]">
            {error}
          </div>
        )}


        {/* Statistics Dashboard */}
        {currentResult?.state_summary && Object.keys(currentResult.state_summary).length > 0 && (
          <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06] space-y-3">
            <h3 className="text-[11px] font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2">Impact Statistics</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] p-2 rounded border border-white/[0.05]">
                <div className="text-[10px] text-[#64748b] mb-1">Affected States</div>
                <div className="text-sm font-mono text-[#00d4ff]">{Object.keys(currentResult.state_summary).length}</div>
              </div>
              <div className="bg-white/[0.03] p-2 rounded border border-white/[0.05]">
                <div className="text-[10px] text-[#64748b] mb-1">Max Recorded WBGT</div>
                <div className="text-sm font-mono text-[#ef4444]">
                  {Object.values(currentResult.state_summary).reduce((max, s) => Math.max(max, s.max_wbgt || 0), -99).toFixed(1)}°C
                </div>
              </div>
            </div>
            
            <div className="bg-white/[0.03] p-2 rounded border border-white/[0.05] flex justify-between items-center">
              <div className="text-[10px] text-[#64748b] flex items-center gap-1">
                <Users className="w-3 h-3"/> Population at Risk
              </div>
              <div className="text-sm font-mono text-[#f97316]">
                {Object.values(currentResult.state_summary).reduce((sum, s) => sum + (s.pop_at_risk || 0), 0).toLocaleString()}
              </div>
            </div>

            {/* IMD Spatial Coverage Breakdown */}
            <div className="mt-2 text-[10px] text-[#94a3b8] bg-white/[0.01] p-2 rounded border border-white/[0.02]">
              <div className="font-semibold mb-1.5 uppercase tracking-wider text-[#64748b] flex justify-between">
                <span>State Coverage</span>
                <span>Category</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(currentResult.state_summary)
                  .filter(([_, s]) => s.spatial_coverage && s.spatial_coverage !== "None")
                  .sort((a, b) => b[1].percent_affected - a[1].percent_affected)
                  .slice(0, showAllStates ? undefined : 4)
                  .map(([k, s]) => (
                    <div key={k} className="flex justify-between items-center">
                      <span className="truncate max-w-[100px]" title={k}>{k}</span>
                      <span className={`font-mono text-right ${s.spatial_coverage === 'Widespread' ? 'text-[#dc2626]' : s.spatial_coverage === 'Fairly Widespread' ? 'text-[#ef4444]' : 'text-[#f97316]'}`}>
                        {s.spatial_coverage} ({s.percent_affected}%)
                      </span>
                    </div>
                ))}
                {Object.values(currentResult.state_summary).filter(s => s.spatial_coverage && s.spatial_coverage !== "None").length > 4 && (
                  <button 
                    onClick={() => setShowAllStates(!showAllStates)}
                    className="w-full text-center text-[#64748b] hover:text-[#f1f5f9] pt-1.5 border-t border-white/[0.03] mt-1.5 transition-colors cursor-pointer"
                  >
                    {showAllStates ? "Show less" : `+ ${Object.values(currentResult.state_summary).filter(s => s.spatial_coverage && s.spatial_coverage !== "None").length - 4} more states affected`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {simulationResults?.forecast && (
          <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06] space-y-3">
            <h3 className="text-[11px] font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2">Map Layers</h3>
            <div className="space-y-2 text-[11px] text-[#94a3b8]">
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#f1f5f9]">
                <input type="radio" name="hw_layer" checked={heatwaveActiveLayer === 'status'} onChange={() => setHeatwaveActiveLayer('status')} className="accent-[#00d4ff]" />
                Heat Wave Status
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#f1f5f9]">
                <input type="radio" name="hw_layer" checked={heatwaveActiveLayer === 'temperature'} onChange={() => setHeatwaveActiveLayer('temperature')} className="accent-[#00d4ff]" />
                Max Temperature
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#f1f5f9]">
                <input type="radio" name="hw_layer" checked={heatwaveActiveLayer === 'anomaly'} onChange={() => setHeatwaveActiveLayer('anomaly')} className="accent-[#00d4ff]" />
                Max Temp Departure
              </label>
            </div>
          </div>
        )}

        {/* Dynamic IMD Legend */}
        {simulationResults?.forecast && heatwaveActiveLayer === 'temperature' && (
          <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06] space-y-2">
            <h3 className="text-[11px] font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2 text-center">Max Temp (°C)</h3>
            <div className="flex flex-col gap-[1px] text-[10px] font-mono w-full">
              {[
                { color: '#4a044e', label: '> 47' },
                { color: '#701a75', label: '46 - 47' },
                { color: '#86198f', label: '45 - 46' },
                { color: '#991b1b', label: '44 - 45' },
                { color: '#dc2626', label: '43 - 44' },
                { color: '#ea580c', label: '42 - 43' },
                { color: '#f97316', label: '41 - 42' },
                { color: '#fb923c', label: '40 - 41' },
                { color: '#fdba74', label: '38 - 40' },
                { color: '#facc15', label: '36 - 38' },
                { color: '#a3e635', label: '34 - 36' },
                { color: '#4ade80', label: '32 - 34' },
                { color: '#22c55e', label: '<= 32' },
              ].map(item => (
                <div key={item.label} className="flex">
                  <div className="w-6 h-4 opacity-90" style={{ backgroundColor: item.color }}></div>
                  <div className="flex-1 bg-white/[0.02] pl-2 leading-4 text-center">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {simulationResults?.forecast && heatwaveActiveLayer === 'anomaly' && (
          <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06] space-y-2">
            <h3 className="text-[11px] font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2 text-center">Departure (°C)</h3>
            <div className="flex flex-col gap-[1px] text-[10px] font-mono w-full">
              {[
                { color: '#991b1b', label: '> 6' },
                { color: '#dc2626', label: '4 to 6' },
                { color: '#ea580c', label: '2 to 4' },
                { color: '#facc15', label: '0 to 2' },
                { color: '#4ade80', label: '<= 0' },
              ].map(item => (
                <div key={item.label} className="flex">
                  <div className="w-6 h-4 opacity-90" style={{ backgroundColor: item.color }}></div>
                  <div className="flex-1 bg-white/[0.02] pl-2 leading-4 text-center">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {simulationResults?.forecast && heatwaveActiveLayer === 'status' && (
          <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06] space-y-2">
            <h3 className="text-[11px] font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2 text-center">Heat Wave Status</h3>
            <div className="flex flex-col gap-[1px] text-[10px] font-mono w-full">
              {[
                { color: '#ef4444', label: 'Extreme Heatwave' },
                { color: '#f97316', label: 'Severe Heatwave' },
                { color: '#eab308', label: 'Heatwave' },
                { color: '#10b981', label: 'Warm' },
              ].map(item => (
                <div key={item.label} className="flex">
                  <div className="w-6 h-4 opacity-90" style={{ backgroundColor: item.color }}></div>
                  <div className="flex-1 bg-white/[0.02] pl-2 leading-4 text-center">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-white/[0.06] flex gap-2">
        {(isSimulationRunning || simulationResults) && (
          <button
            onClick={handleStopOrClear}
            className="flex-1 max-w-[100px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors"
          >
            {isSimulationRunning ? <><XCircle className="w-3.5 h-3.5" /> Stop</> : <><Trash2 className="w-3.5 h-3.5" /> Clear</>}
          </button>
        )}
        <button
          onClick={runSimulation}
          disabled={isSimulationRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            isSimulationRunning 
              ? 'bg-white/[0.05] text-[#64748b] cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#f97316] to-[#dc2626] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] text-white'
          }`}
        >
          {isSimulationRunning ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Interpolating Data...</>
          ) : (
            <><Play className="w-4 h-4 fill-current" /> {isLiveMode ? "Interpolate Live Forecast" : "Run Custom Simulation"}</>
          )}
        </button>
      </div>
    </div>
  );
}
