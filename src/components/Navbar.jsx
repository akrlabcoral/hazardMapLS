import React from 'react';
import { Shield, Bell, UserCircle, Activity } from 'lucide-react';
import useStore from '../store/useStore';

// ── WS Status Badge ────────────────────────────────────────────────────────────
// Reads wsStatus from the Zustand store and renders a coloured indicator.
// Updates independently — does NOT cause the map or control panels to re-render.
const STATUS_CONFIG = {
  connected:    { dot: 'bg-emerald-500', label: 'Live',         pulse: true  },
  connecting:   { dot: 'bg-amber-400',   label: 'Connecting…',  pulse: true  },
  disconnected: { dot: 'bg-slate-500',   label: 'Offline',      pulse: false },
  error:        { dot: 'bg-red-500',     label: 'No Connection', pulse: false },
};

function WsStatusBadge() {
  const wsStatus = useStore((s) => s.wsStatus);
  const { dot, label, pulse } = STATUS_CONFIG[wsStatus] ?? STATUS_CONFIG.disconnected;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${dot} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

export default function Navbar() {
  const toggleSidebar = useStore((state) => state.toggleSidebar);

  return (
    <nav className="h-16 glass-panel flex items-center justify-between px-6 z-50 relative border-b-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Activity className="w-6 h-6 neon-text" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-wider neon-text" style={{ textShadow: '0 0 20px rgba(6,182,212,0.4)' }}>HazardMap</h1>
          <span className="text-xs bg-cyan-900/50 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-shadow">
            v1.0.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Live WS connection status — updates reactively from Zustand */}
        <WsStatusBadge />
        <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <UserCircle className="w-5 h-5 text-slate-300" />
        </button>
      </div>
      {/* Cinematic bottom gradient divider — transparent→cyan→transparent for premium header separation */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </nav>
  );
}
