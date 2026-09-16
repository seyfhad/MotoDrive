import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Complaint } from '../../types';
import { AlertTriangle, CheckCircle2, Clock, Search, MessageSquare, Shield, Check, X } from 'lucide-react';

export const AdminComplaints: React.FC = () => {
  const { complaints, resolveComplaint } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const filtered = complaints.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const handleResolve = () => {
    if (!selectedComplaint) return;
    resolveComplaint(selectedComplaint.id, adminNote || 'تمت معالجة الشكوى والتواصل مع الأطراف المعنية.');
    setSelectedComplaint(null);
    setAdminNote('');
  };

  return (
    <div className="space-y-6 text-right text-slate-100 max-w-4xl" id="admin-complaints-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">إدارة الشكاوى وحل النزاعات (Complaints & Disputes)</h2>
          <p className="text-xs text-slate-400">متابعة شكاوى الركاب والسائقين بخصوص الأمان والأسعار وجودة الخدمة</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold">
        {(['all', 'pending', 'investigating', 'resolved'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 rounded-xl transition-all ${
              filter === tab ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
            }`}
          >
            {tab === 'all' && `الكل (${complaints.length})`}
            {tab === 'pending' && `المعلقة (${complaints.filter(c => c.status === 'pending').length})`}
            {tab === 'investigating' && `قيد التحقيق (${complaints.filter(c => c.status === 'investigating').length})`}
            {tab === 'resolved' && `المحلولة (${complaints.filter(c => c.status === 'resolved').length})`}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-300">لا توجد شكاوى في هذا القسم</h3>
            <p className="text-xs text-slate-500 mt-1">كل العمليات تسير بشكل سليم</p>
          </div>
        ) : (
          filtered.map(comp => (
            <div
              key={comp.id}
              className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400">{comp.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      comp.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {comp.status === 'resolved' ? 'تم الحل' : 'قيد التحقيق'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(comp.createdAt).toLocaleDateString('ar-DZ')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span className="text-red-400">⚠️</span>
                  <span>{comp.reason}</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  {comp.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <div>
                  <span>مقدمة من: </span>
                  <span className="font-bold text-white">{comp.userName}</span> (رحلة: #{comp.rideId})
                </div>

                {comp.status !== 'resolved' && (
                  <button
                    onClick={() => setSelectedComplaint(comp)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                  >
                    معالجة الشكوى
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Dialog */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-black text-white">معالجة شكوى #{selectedComplaint.id}</h3>
              <div className="w-8"></div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-bold block">ملاحظات الإدارة والإجراء المتخذ:</label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="اكتب الإجراء المتخذ (مثال: تم التواصل مع السائق وتنبيهه بشأن السرعة)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleResolve}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs"
              >
                إغلاق الشكوى كـ "تم الحل"
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
