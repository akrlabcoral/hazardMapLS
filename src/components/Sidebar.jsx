import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Settings, Database, Sliders, Cpu, Layers, Radio, Play } from 'lucide-react';
import useStore from '../store/useStore';

const navItems = [
  { id: 'disasters',  icon: ShieldAlert,    label: 'Disaster Controls' },
  { id: 'layers',     icon: Layers,       label: 'Map Layers'        },
  { id: 'simulation', icon: Radio,        label: 'Live Feed'},
  { id: 'ml-simulation', icon: Play,         label: 'Earthquake Simulation'},
  { id: 'alerts',     icon: AlertTriangle,  label: 'Alerts'            },
];

// Footer line that reflects live WS connection state
function ConnectionFooter() {
  const wsStatus    = useStore((s) => s.wsStatus);
  const realtimeMode = useStore((s) => s.realtimeMode);

  const lines = {
    connected:    { icon: '🟢', text: realtimeMode ? 'Real-time · Server active' : 'Server connected' },
    connecting:   { icon: '🟡', text: 'Connecting to server…' },
    disconnected: { icon: '🔴', text: 'Offline mode' },
    error:        { icon: '🔴', text: 'Server unreachable' },
  };

  const { icon, text } = lines[wsStatus] ?? lines.disconnected;

  return (
    <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 relative">
      {/* Top gradient divider for premium sidebar footer separation */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <div className="text-xs text-slate-500 text-center">
        HazardMap Command Link<br />
        <span className="mt-1 inline-block">{icon} {text}</span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const activeSection = useStore((state) => state.activeSection);
  const setActiveSection = useStore((state) => state.setActiveSection);

  const sidebarWidth = useStore((state) => state.sidebarWidth);
  const setSidebarWidth = useStore((state) => state.setSidebarWidth);
  const isDraggingSidebar = useStore((state) => state.isDraggingSidebar);
  const setIsDraggingSidebar = useStore((state) => state.setIsDraggingSidebar);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(240, Math.min(480, startWidth + deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: isSidebarOpen ? 0 : -(sidebarWidth + 20) }}
      transition={isDraggingSidebar ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 left-0 bottom-0 glass-panel z-40 border-t-0 border-l-0 flex flex-col"
      style={{ width: sidebarWidth }}
    >
      <div className="p-4 flex-1 overflow-y-auto space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative ${
                isActive 
                  ? 'bg-cyan-900/40 neon-border text-cyan-400' 
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active state left accent bar — command-center navigation indicator */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'neon-text' : ''}`} />
              <span className="font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Dynamic connection status footer */}
      <ConnectionFooter />

      {/* Draggable resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-cyan-500/30 active:bg-cyan-500/50 transition-colors z-50 group flex items-center justify-center"
      >
        <div className={`w-[1px] h-12 transition-colors rounded ${isDraggingSidebar ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-slate-700 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.6)]'}`} />
      </div>
    </motion.aside>
  );
}


