import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, ArrowLeft } from 'lucide-react';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Strict Admin Passcode: Only seyyffhd##54 is accepted
const STRICT_ADMIN_PASSCODE = 'seyyffhd##54';
export const ADMIN_OWNER_EMAIL = 'seyfhad@gmail.com';

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { setCurrentUser, setActivePassenger, setCurrentRole } = useApp();
  const [passcode, setPasscode] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setIsError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const performLogin = () => {
    const ownerUser: any = {
      uid: 'admin-owner-seyfhad',
      displayName: 'مالك التطبيق (Admin)',
      email: ADMIN_OWNER_EMAIL,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    const ownerProfile: any = {
      id: 'admin-owner-seyfhad',
      name: 'مالك التطبيق (Seyf)',
      email: ADMIN_OWNER_EMAIL,
      phone: '0662688714',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Set state and persist session
    setCurrentUser(ownerUser);
    setActivePassenger(ownerProfile);
    setCurrentRole('admin');

    localStorage.setItem('motodrive_user_session', JSON.stringify({ user: ownerProfile, timestamp: Date.now() }));
    localStorage.setItem('motodrive_v3_role', 'admin');

    if (onSuccess) onSuccess();
    onClose();
  };

  const handleCheck = (codeToTest: string) => {
    const cleanCode = codeToTest.trim();
    if (cleanCode === STRICT_ADMIN_PASSCODE) {
      performLogin();
      return true;
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleCheck(passcode)) {
      setIsError(true);
      setTimeout(() => setIsError(false), 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPasscode(val);
    setIsError(false);
    // Instant unlock as soon as exact passcode is entered/pasted
    if (val.trim() === STRICT_ADMIN_PASSCODE) {
      performLogin();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      id="admin-passcode-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-5 text-right text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Discreet Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Empty Form with only input field and subtle enter action */}
        <form onSubmit={handleSubmit} className="pt-8 pb-3">
          <div className="relative flex items-center">
            <input
              type="password"
              value={passcode}
              onChange={handleChange}
              placeholder=""
              autoFocus
              className={`w-full bg-slate-950 border ${
                isError
                  ? 'border-red-500 ring-2 ring-red-500/30'
                  : 'border-slate-800 focus:border-amber-500'
              } rounded-2xl px-4 py-3 text-base text-white placeholder:text-transparent focus:outline-none text-center font-mono tracking-widest transition-all`}
            />
            <button
              type="submit"
              className="absolute right-2 w-8 h-8 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
