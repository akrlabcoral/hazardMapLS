import React from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import EarthquakeModule from './modules/EarthquakeModule';
import LandslideModule from './modules/LandslideModule';

import HeatwaveModule from './modules/HeatwaveModule';
import TsunamiModule from './modules/TsunamiModule';

export default function Sidebar() {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const activeModule = useStore((state) => state.activeModule);

  const renderModule = () => {
    if (activeModule === 'earthquake') return <EarthquakeModule />;
    if (activeModule === 'landslide') return <LandslideModule />;
    if (activeModule === 'heatwave') return <HeatwaveModule />;
    if (activeModule === 'tsunami') return <TsunamiModule />;
    return null;
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: isSidebarOpen ? 0 : -280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 left-0 bottom-0 w-[280px] glass-panel z-40 border-y-0 border-l-0 flex flex-col rounded-none rounded-r-lg shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
    >
      <div className="p-4 flex-1 h-full overflow-hidden">
        {renderModule()}
      </div>
    </motion.aside>
  );
}
