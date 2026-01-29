import React from 'react';
import GlassHeader from './GlassHeader';
import GlassSidebar from './GlassSidebar';
import WelcomeScreen from './WelcomeScreen';
import { useStore } from '../store/useStore';

export default function GlassLayout({ children }) {
  const { repositoryPath } = useStore();

  if (!repositoryPath) {
    return <WelcomeScreen />;
  }

  return (
    <div className="relative min-h-screen bg-[#0B0B15] text-white font-sans selection:bg-cbct-accent/30 selection:text-white overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <GlassHeader />
      <GlassSidebar />

      {/* Main Content Area - Adjusted for Header/Sidebar */}
      <main className="pt-16 pl-16 h-screen w-full relative z-10 transition-all duration-300">
        <div className="h-full w-full relative">
          {children}
        </div>
      </main>
      
      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
    </div>
  );
}
