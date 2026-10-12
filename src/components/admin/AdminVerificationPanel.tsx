import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { toggleDriverVerification } from '../../services/firestoreService';
import { Loader2, CheckCircle2, User, MapPin, Phone } from 'lucide-react';

export const AdminVerificationPanel: React.FC = () => {
  const { drivers } = useApp();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const pendingVerification = drivers.filter(d => !d.isVerified && d.status === 'approved');

  const handleVerify = async (driverId: string) => {
    setUpdatingId(driverId);
    try {
      await toggleDriverVerification(driverId, true);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-white">طلبات توثيق الحسابات</h2>
      {pendingVerification.length === 0 ? (
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
          لا توجد طلبات توثيق حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingVerification.map(drv => (
            <div key={drv.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden">
                    <img src={drv.photoUrl || '/icon.jpg'} alt={drv.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">{drv.name}</h3>
                  <p className="text-[10px] text-slate-400">{drv.phone}</p>
                </div>
              </div>
              <button
                onClick={() => handleVerify(drv.id)}
                disabled={updatingId === drv.id}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {updatingId === drv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'توثيق الحساب'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
