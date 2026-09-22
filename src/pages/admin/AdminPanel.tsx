import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AdminDriversPanel } from '../../components/admin/AdminDriversPanel';
import {
  ShieldCheck,
  Bike,
  Users,
  BarChart3,
  LogOut,
  Bell,
  Settings,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { setCurrentRole, broadcastNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'drivers' | 'stats' | 'settings'>('drivers');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl pb-12" dir="rtl">
      {/* هيدر لوحة الإدارة */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>إدارة منصة MotoDrive</span>
              </h1>
              <p className="text-[10px] text-slate-400">متابعة طلبات السائقين والعمليات المباشرة</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                broadcastNotification('تنبيه الإدارة', 'تم إرسال إشعار عام لجميع مستخدمي التطبيق');
                alert('تم إرسال الإشعار العام بنجاح');
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition-colors"
              title="إشعار عام"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentRole('client')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <span>الخروج</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* شريط التنقل بين التبويبات */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'drivers'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>طلبات السائقين</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>الإعدادات</span>
          </button>
        </div>

        {/* 1. تبويب إدارة السائقين المربوط بـ Supabase */}
        {activeTab === 'drivers' && <AdminDriversPanel />}

        {/* 2. تبويب الإحصائيات */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>إجمالي الرحلات</span>
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-black text-white">0</p>
              <p className="text-[10px] text-slate-500">لا توجد رحلات مسجلة حالياً</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>المستخدمين النشطين</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-black text-white">1</p>
              <p className="text-[10px] text-emerald-400">حساب المدير الحالي</p>
            </div>
          </div>
        )}

        {/* 3. تبويب الإعدادات */}
        {activeTab === 'settings' && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 text-xs">
            <h3 className="font-bold text-white border-b border-slate-800 pb-2">
              إعدادات التسجيل
            </h3>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <p className="font-bold text-white">استقبال طلبات السائقين</p>
                <p className="text-[10px] text-slate-400">السماح بتسجيل السائقين عبر النموذج</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 cursor-pointer" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
