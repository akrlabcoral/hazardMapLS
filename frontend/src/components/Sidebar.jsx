import React from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import EarthquakeModule from './modules/EarthquakeModule';
import LandslideModule from './modules/LandslideModule';

export default function Sidebar() {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const activeModule = useStore((state) => state.activeModule);

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: isSidebarOpen ? 0 : -280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 left-0 bottom-0 w-[280px] glass-panel z-40 border-y-0 border-l-0 flex flex-col rounded-none rounded-r-lg shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
    >
      <div className="p-4 flex-1 h-full overflow-hidden">
        {activeModule === 'earthquake' ? <EarthquakeModule /> : <LandslideModule />}
      </div>
    </motion.aside>
  );
}
