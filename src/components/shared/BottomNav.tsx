import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Home, MapPin, History, Wallet, User, Radio, FileText, Bell } from 'lucide-react';

export type PassengerTab = 'home' | 'map' | 'trips' | 'profile';
export type DriverTab = 'home' | 'requests' | 'earnings' | 'trips' | 'profile';

interface BottomNavProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onTabChange }) => {
  const { currentRole, currentPassengerRide, activeDriver } = useApp();

  if (currentRole === 'admin') return null;

  const handleTabClick = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    if (setActiveTab) setActiveTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 pb-safe shadow-2xl" id="app-bottom-nav">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {currentRole === 'passenger' ? (
          <>
            <button
              id="nav-tab-passenger-ride"
              onClick={() => handleTabClick('home')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-2xl transition-all cursor-pointer select-none min-h-[44px] ${
                activeTab === 'home' || activeTab === 'map'
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs font-bold">الرحلة</span>
            </button>

            <button
              id="nav-tab-passenger-trips"
              onClick={() => handleTabClick('trips')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-2xl transition-all cursor-pointer select-none min-h-[44px] ${
                activeTab === 'trips'
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-xs font-bold">رحلاتي</span>
            </button>

            <button
              id="nav-tab-passenger-profile"
              onClick={() => handleTabClick('profile')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-2xl transition-all cursor-pointer select-none min-h-[44px] ${
                activeTab === 'profile'
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-xs font-bold">حسابي</span>
            </button>
          </>
        ) : (
          <>
            <button
              id="nav-tab-driver-home"
              onClick={() => handleTabClick('home')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1.5 rounded-2xl transition-all cursor-pointer select-none min-h-[44px] ${
                activeTab === 'home'
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px] font-bold">الرئيسية</span>
            </button>

            <button
              id="nav-tab-driver-requests"
              onClick={() => handleTabClick('requests')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1.5 rounded-2xl transition-all cursor-pointer select-none relative min-h-[44px] ${
                activeTab === 'requests'
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span className="text-[10px] font-bold">الطلبات</span>
              {activeDriver.isOnline && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              id="nav-tab-driver-earnings"
              onClick={() => handleTabClick('earnings')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1.5 rounded-2xl transition-all cursor-pointer select-none min-h-[44px] ${
                activeTab === 'earnings'
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-[10px] font-bold">الأرباح</span>
            </button>

            <button
              id="nav-tab-driver-trips"
              onClick={() => handleTabClick('trips')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1.5 rounded-2xl transition-all cursor-pointer select-none min-h-[44px] ${
                activeTab === 'trips'
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="text-[10px] font-bold">الرحلات</span>
            </button>

            <button
              id="nav-tab-driver-profile"
              onClick={() => handleTabClick('profile')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1.5 rounded-2xl transition-all cursor-pointer select-none min-h-[44px] ${
                activeTab === 'profile'
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[10px] font-bold">حسابي</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
