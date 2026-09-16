import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Home, MapPin, History, Wallet, User, Radio, FileText, Bell } from 'lucide-react';

export type PassengerTab = 'home' | 'map' | 'trips' | 'profile';
export type DriverTab = 'home' | 'requests' | 'trips' | 'earnings' | 'profile';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentRole, currentPassengerRide, currentDriverRide, activeDriver } = useApp();

  if (currentRole === 'admin') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2 pb-safe" id="app-bottom-nav">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {currentRole === 'passenger' ? (
          <>
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'home'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[11px]">الرئيسية</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                activeTab === 'map'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-[11px]">الخريطة</span>
              {currentPassengerRide && (
                <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'trips'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[11px]">رحلاتي</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[11px]">حسابي</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'home'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[11px]">الرئيسية</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                activeTab === 'requests'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="text-[11px]">الطلبات</span>
              {activeDriver.isOnline && (
                <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('earnings')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'earnings'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-[11px]">الأرباح</span>
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'trips'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[11px]">الرحلات</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[11px]">حسابي</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
