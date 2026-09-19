import React, { useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { AdminDrivers } from './AdminDrivers';
import { AdminRides } from './AdminRides';
import { AdminPricing } from './AdminPricing';
import { AdminServiceAreas } from './AdminServiceAreas';
import { AdminComplaints } from './AdminComplaints';
import { AdminLiveMap } from './AdminLiveMap';
import { AdminUsers } from './AdminUsers';
import {
  LayoutDashboard,
  Bike,
  Activity,
  DollarSign,
  MapPin,
  AlertTriangle,
  Users,
  Map,
  Shield,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeAdminTab, setActiveAdminTab] = useState<string>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'لوحة المتابعة', icon: LayoutDashboard },
    { id: 'map', label: 'الخريطة الحية', icon: Map },
    { id: 'drivers', label: 'السائقين والوثائق', icon: Bike },
    { id: 'rides', label: 'سجل الرحلات', icon: Activity },
    { id: 'pricing', label: 'التسعير والعمولة', icon: DollarSign },
    { id: 'areas', label: 'نطاق التغطية', icon: MapPin },
    { id: 'complaints', label: 'الشكاوى والنزاعات', icon: AlertTriangle },
    { id: 'users', label: 'الركاب', icon: Users },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-950 text-slate-100 flex flex-col md:flex-row pb-12" id="admin-panel-container">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 p-4 space-y-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>إدارة منصة MotoDrive</span>
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveAdminTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all text-right w-full ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content View Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeAdminTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveAdminTab} />}
        {activeAdminTab === 'map' && <AdminLiveMap />}
        {activeAdminTab === 'drivers' && <AdminDrivers />}
        {activeAdminTab === 'rides' && <AdminRides />}
        {activeAdminTab === 'pricing' && <AdminPricing />}
        {activeAdminTab === 'areas' && <AdminServiceAreas />}
        {activeAdminTab === 'complaints' && <AdminComplaints />}
        {activeAdminTab === 'users' && <AdminUsers />}
      </main>
    </div>
  );
};
