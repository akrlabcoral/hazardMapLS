import React from 'react';
import { Shield, Bell, UserCircle, Menu, Moon, Sun, Globe, Mountain, ThermometerSun } from 'lucide-react';
import useStore from '../store/useStore';

const STATUS_CONFIG = {
  connected:    { dot: 'bg-[#22c55e]', pulse: true  },
  connecting:   { dot: 'bg-[#f97316]', pulse: true  },
  disconnected: { dot: 'bg-[#64748b]', pulse: false },
  error:        { dot: 'bg-[#dc2626]', pulse: false },
};

function WsStatusBadge() {
  const wsStatus = useStore((s) => s.wsStatus);
  const { dot, pulse } = STATUS_CONFIG[wsStatus] ?? STATUS_CONFIG.disconnected;

  return (
    <div 
      className={`w-2.5 h-2.5 rounded-full ${dot} ${pulse ? 'animate-pulse' : ''}`} 
      title={`Status: ${wsStatus}`}
    />
  );
}

export default function Navbar() {
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const mapStyle = useStore((state) => state.mapStyle);
  const toggleMapStyle = useStore((state) => state.toggleMapStyle);
  const activeModule = useStore((state) => state.activeModule);
  const setActiveModule = useStore((state) => state.setActiveModule);

  return (
    <nav className="h-16 glass-panel flex items-center justify-between px-6 z-50 relative border-b-0 rounded-none shadow-sm">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-4 w-1/3">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer text-[#64748b] hover:text-[#f1f5f9]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#00d4ff]" />
          <h1 className="text-lg font-bold tracking-wide text-[#f1f5f9]">HazardMap</h1>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] ml-1">
            v1.0.0
          </span>
        </div>
      </div>

      {/* Center: Module Switcher */}
      <div className="flex items-center justify-center gap-2 w-1/3">
        <button
          onClick={() => setActiveModule('earthquake')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
            activeModule === 'earthquake' 
              ? 'text-[#00d4ff] bg-[#00d4ff]/10' 
              : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/[0.05]'
          }`}
        >
          <Globe className="w-4 h-4" />
          Earthquake
          {activeModule === 'earthquake' && (
            <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#00d4ff] rounded-t-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveModule('landslide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
            activeModule === 'landslide' 
              ? 'text-[#00d4ff] bg-[#00d4ff]/10' 
              : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/[0.05]'
          }`}
        >
          <Mountain className="w-4 h-4" />
          Landslide
          {activeModule === 'landslide' && (
            <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#00d4ff] rounded-t-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveModule('heatwave')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
            activeModule === 'heatwave' 
              ? 'text-[#00d4ff] bg-[#00d4ff]/10' 
              : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/[0.05]'
          }`}
        >
          <ThermometerSun className="w-4 h-4" />
          Heatwave
          {activeModule === 'heatwave' && (
            <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#00d4ff] rounded-t-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center justify-end gap-5 w-1/3">
        <WsStatusBadge />
        <div className="w-[1px] h-4 bg-white/[0.1]"></div>
        <button 
          onClick={toggleMapStyle}
          className="text-[#64748b] hover:text-[#f1f5f9] transition-colors"
          title={mapStyle === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {mapStyle === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="relative text-[#64748b] hover:text-[#f1f5f9] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#dc2626] rounded-full"></span>
        </button>
        <button className="text-[#64748b] hover:text-[#f1f5f9] transition-colors">
          <UserCircle className="w-5 h-5" />
        </button>
      </div>
      
      {/* Subtle bottom border replacing the heavy gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/[0.06]" />
    </nav>
  );
}
