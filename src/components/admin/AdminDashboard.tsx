import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AdminDriversPanel } from './AdminDriversPanel';
import {
  ShieldCheck,
  Bike,
  Users,
  BarChart3,
  LogOut,
  Bell,
  Settings,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { setCurrentRole, broadcastNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'drivers' | 'stats' | 'settings'>('drivers');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl" dir="rtl">
      {/* الشريط العلوي للوحة الإدارة */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                <span>لوحة تحكم الإدارة</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  MotoDrive Admin
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">متابعة طلبات السائقين والعمليات المباشرة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                broadcastNotification('تنبيه الإدارة', 'تم إرسال إشعار عام لجميع مستخدمي التطبيق');
                alert('تم إرسال الإشعار العام بنجاح');
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition-colors"
              title="إرسال إشعار عام"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentRole('client')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span>الخروج للواجهة</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* أزرار التبويبات */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'drivers'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>طلبات السائقين والوثائق</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات العامة</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات النظام</span>
          </button>
        </div>

        {/* عرض التبويب المختار */}
        {activeTab === 'drivers' && <AdminDriversPanel />}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>إجمالي الرحلات</span>
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">128</p>
              <p className="text-[10px] text-emerald-400">↑ 12% مقارنة بالأسبوع الماضي</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>المستخدمين النشطين</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">342</p>
              <p className="text-[10px] text-slate-500">سائقين وزبائن مسجلين</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>نسبة التقييم العام</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">4.9 / 5.0</p>
              <p className="text-[10px] text-amber-400">ممتاز بناءً على 94 تقييم</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              إعدادات تطبيق MotoDrive
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <p className="font-bold text-white">تفعيل تسجيل السائقين الجدد</p>
                  <p className="text-[10px] text-slate-400">السماح باستقبال طلبات الانضمام عبر الاستمارة</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 cursor-pointer" />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <p className="font-bold text-white">الموافقة التلقائية على الطلبات</p>
                  <p className="text-[10px] text-slate-400">تفعيل حسابات السائقين فور إرسال الوثائق (غير موصى به)</p>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-amber-500 cursor-pointer" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
