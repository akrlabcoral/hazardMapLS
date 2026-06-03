import React, { useRef } from 'react';
import { Eye, EyeOff, Trash2, UploadCloud } from 'lucide-react';
import useStore from '../store/useStore';
import { rasterService } from '../services/rasterService';

export default function RasterLayersPanel() {
  const fileInputRef = useRef(null);
  const rasterLayers = useStore((state) => state.rasterLayers);
  const addRasterLayer = useStore((state) => state.addRasterLayer);
  const removeRasterLayer = useStore((state) => state.removeRasterLayer);
  const updateRasterLayerOpacity = useStore((state) => state.updateRasterLayerOpacity);
  const updateRasterLayerVisibility = useStore((state) => state.updateRasterLayerVisibility);
  const updateRasterLayerLoaded = useStore((state) => state.updateRasterLayerLoaded);

  const addUploadTask = useStore((state) => state.addUploadTask);
  const updateUploadTask = useStore((state) => state.updateUploadTask);
  const removeUploadTask = useStore((state) => state.removeUploadTask);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Reset input so the same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';

    files.forEach(async (file) => {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const layerId = `raster-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const abortController = new AbortController();

      addUploadTask({
        id: taskId,
        fileName: file.name,
        loadedBytes: 0,
        totalBytes: file.size,
        status: 'reading', // reading, processing, completed, failed
        error: null,
        abortController
      });

      try {
        await rasterService.addGeoTiffLayer(file, layerId, {
          abortSignal: abortController.signal,
          onProgress: (loaded, total) => {
            updateUploadTask(taskId, { loadedBytes: loaded, totalBytes: total });
          },
          onStateChange: (status) => {
            updateUploadTask(taskId, { status });
          }
        });

        // Add to main raster list once successfully processed
        addRasterLayer({
          id: layerId,
          name: file.name,
          opacity: 0.8,
          visible: true
        });

        updateUploadTask(taskId, { status: 'completed' });

        // Auto-remove completed task after 3 seconds
        setTimeout(() => removeUploadTask(taskId), 3000);
      } catch (error) {
        if (error.message.includes('cancelled')) {
          removeUploadTask(taskId);
        } else {
          updateUploadTask(taskId, { status: 'failed', error: error.message });
        }
      }
    });
  };

  const handleRemove = (id) => {
    rasterService.removeGeoTiffLayer(id);
    removeRasterLayer(id);
  };

  const handleToggleVisibility = async (layer) => {
    const newVisibility = !layer.visible;
    
    if (layer.isBuiltIn && newVisibility && !layer.isLoaded) {
      try {
        await rasterService.addGeoTiffFromUrl(layer.url, layer.id, {
          opacity: layer.opacity,
          visible: true
        });
        updateRasterLayerLoaded(layer.id, true);
      } catch (error) {
        alert(`Failed to load built-in layer: ${error.message}`);
        return;
      }
    } else {
      rasterService.updateVisibility(layer.id, newVisibility);
    }

    updateRasterLayerVisibility(layer.id, newVisibility);
  };

  const handleOpacityChange = (id, opacity) => {
    rasterService.updateOpacity(id, opacity);
    updateRasterLayerOpacity(id, opacity);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">GeoTIFF Overlays</h4>
        
        <input 
          type="file" 
          accept=".tif,.tiff" 
          multiple
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-[#f1f5f9] text-[11px] font-semibold uppercase tracking-wider rounded border border-white/[0.1] transition-all"
        >
          <UploadCloud size={14} />
          Add GeoTIFF
        </button>
      </div>

      {rasterLayers.length === 0 ? (
        <div className="p-4 border border-dashed border-white/[0.1] bg-white/[0.02] rounded-lg text-center text-[#64748b] text-[11px] italic">
          No raster layers loaded. Upload a .tif file to begin.
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {rasterLayers.map(layer => (
            <div key={layer.id} className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-[#f1f5f9] text-[13px] truncate max-w-[180px]" title={layer.name}>
                  {layer.name}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleToggleVisibility(layer)}
                    className={`p-1.5 rounded transition-colors ${layer.visible ? 'text-[#00d4ff] bg-[#00d4ff]/10' : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/[0.05]'}`}
                    title="Toggle Visibility"
                  >
                    {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  {!layer.isBuiltIn && (
                    <button 
                      onClick={() => handleRemove(layer.id)}
                      className="p-1.5 rounded text-[#64748b] hover:text-[#dc2626] hover:bg-[#dc2626]/10 transition-colors"
                      title="Remove Layer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {layer.visible && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider w-12">Opacity</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" 
                    value={layer.opacity}
                    onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                    className="flex-1 accent-[#00d4ff] h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[11px] text-[#00d4ff] w-8 text-right font-mono">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
