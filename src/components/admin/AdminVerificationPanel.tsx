import React, { useEffect, useState } from 'react';
import { db, isFirestoreQuotaExceeded } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { toggleUserVerification } from '../../services/firestoreService';
import { VerificationRequest } from '../../types';
import { Loader2, CheckCircle2, XCircle, Eye, ShieldCheck, User } from 'lucide-react';

export const AdminVerificationPanel: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  // Load from localStorage fallback + Firestore real-time listener
  const loadLocalRequests = (): VerificationRequest[] => {
    try {
      const saved = localStorage.getItem('motodrive_verification_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  };

  const saveLocalRequests = (list: VerificationRequest[]) => {
    try {
      localStorage.setItem('motodrive_verification_requests', JSON.stringify(list));
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    // Initialize with local requests immediately so admin sees them instantly
    const local = loadLocalRequests();
    if (local.length > 0) {
      setRequests(local);
      setLoading(false);
    }

    if (isFirestoreQuotaExceeded()) {
      setLoading(false);
      return;
    }

    const reqRef = collection(db, 'verification_requests');
    const unsub = onSnapshot(reqRef, (snapshot) => {
      const fsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VerificationRequest));
      
      // Merge with local requests to ensure 100% reliability
      const localList = loadLocalRequests();
      const mergedMap = new Map<string, VerificationRequest>();
      
      [...localList, ...fsList].forEach(r => {
        if (!mergedMap.has(r.userId) || r.status === 'approved') {
          mergedMap.set(r.id, r);
        }
      });

      const finalMerged = Array.from(mergedMap.values());
      setRequests(finalMerged);
      saveLocalRequests(finalMerged);
      setLoading(false);
    }, (err) => {
      console.warn('Error fetching verification requests from Firestore, using local:', err);
      setLoading(false);
    });

    const handleNewRequest = () => {
      setRequests(loadLocalRequests());
    };
    window.addEventListener('motodrive_verification_submitted', handleNewRequest);

    return () => {
      unsub();
      window.removeEventListener('motodrive_verification_submitted', handleNewRequest);
    };
  }, []);

  const handleApprove = async (req: VerificationRequest) => {
    setUpdatingId(req.id);
    try {
      await toggleUserVerification(req.userId, true);
      
      // Update local storage status
      const updated = requests.map(r => r.id === req.id ? { ...r, status: 'approved' as const } : r);
      setRequests(updated);
      saveLocalRequests(updated);

      if (!isFirestoreQuotaExceeded()) {
        const reqRef = doc(db, 'verification_requests', req.id);
        await setDoc(reqRef, { status: 'approved', reviewedAt: new Date().toISOString() }, { merge: true });
      }
    } catch (e) {
      console.warn('Error approving verification:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (req: VerificationRequest) => {
    setUpdatingId(req.id);
    try {
      const updated = requests.map(r => r.id === req.id ? { ...r, status: 'rejected' as const } : r);
      setRequests(updated);
      saveLocalRequests(updated);

      if (!isFirestoreQuotaExceeded()) {
        const reqRef = doc(db, 'verification_requests', req.id);
        await setDoc(reqRef, { status: 'rejected', reviewedAt: new Date().toISOString() }, { merge: true });
      }
    } catch (e) {
      console.warn('Error rejecting verification:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>طلبات توثيق حسابات المستخدمين (بطاقة الهوية)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مراجعة بطاقات الهوية المرسلة من الركاب والسائقين وتوثيق حساباتهم رسمياً
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold text-xs">
          الطلبات المعلقة: {pendingRequests.length}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="text-center p-10 bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-400 text-xs">
          لا توجد طلبات توثيق هوية معلقة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingRequests.map((req) => (
            <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center text-slate-400">
                    {req.userPhoto ? (
                      <img src={req.userPhoto} alt={req.userName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{req.userName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-amber-400" dir="ltr">{req.userPhone}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {req.role === 'driver' ? 'سائق' : 'راكب'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ID Card Image Preview */}
              {req.idCardUrl ? (
                <div
                  onClick={() => setSelectedImage({ url: req.idCardUrl, title: `بطاقة هوية: ${req.userName}` })}
                  className="relative h-36 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer group"
                >
                  <img src={req.idCardUrl} alt="ID Card" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>معاينة بطاقة الهوية</span>
                  </div>
                </div>
              ) : (
                <div className="h-24 rounded-2xl bg-slate-950 border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                  لم يتم إرفاق صورة البطاقة
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleApprove(req)}
                  disabled={updatingId === req.id}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {updatingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>قبول وتوثيق الحساب</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(req)}
                  disabled={updatingId === req.id}
                  className="py-2.5 px-4 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>رفض</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">{selectedImage.title}</h4>
              <button
                onClick={() => setSelectedImage(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-hidden rounded-2xl bg-black flex items-center justify-center">
              <img src={selectedImage.url} alt="Preview" className="max-h-[75vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
