import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { saveActiveSessionSecurely } from '../../services/dataVaultService';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ADMIN_OWNER_EMAIL = 'seyfhad@gmail.com';

// Normalized admin secret passcodes (requires the full secret 54 suffix, rejecting incomplete 'seyyffhd')
const VALID_PASSCODES = [
  'seyyffhd##54',
  'seyfhad##54',
  'seyyffhd#54',
  'seyfhad#54',
  'seyyffhd54',
  'seyfhad54',
];

const normalizePasscode = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
};

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { setCurrentUser, setActivePassenger, setCurrentRole } = useApp();
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setIsError(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const performLogin = () => {
    const ownerUser: any = {
      uid: 'admin-owner-seyfhad',
      displayName: 'المسؤول',
      email: ADMIN_OWNER_EMAIL,
      photoURL: '/assets/images/admin_logo.jpg',
    };

    const ownerProfile: any = {
      id: 'admin-owner-seyfhad',
      name: 'المسؤول',
      email: ADMIN_OWNER_EMAIL,
      phone: '',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem('motodrive_web_admin_unlocked', 'true');
      localStorage.setItem('motodrive_web_admin_unlocked', 'true');
      localStorage.setItem('motodz_v2_role', 'admin');
      localStorage.setItem('motodrive_current_role', 'admin');
      localStorage.setItem('motodrive_v3_role', 'admin');
    } catch {}

    setCurrentUser(ownerUser);
    setActivePassenger(ownerProfile);
    setCurrentRole('admin');
    saveActiveSessionSecurely(ownerProfile);

    window.dispatchEvent(new CustomEvent('motodrive_admin_logged_in'));

    if (onSuccess) onSuccess();
    onClose();
  };

  const handleCheck = (rawCode: string) => {
    const clean = normalizePasscode(rawCode);
    if (VALID_PASSCODES.includes(clean)) {
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
    // Instant unlock as soon as any valid admin passcode variation is typed
    if (handleCheck(val)) {
      // successfully logged in
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
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-4 text-right text-slate-100 shadow-2xl relative overflow-hidden"
        dir="ltr"
      >
        {/* Discreet Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Minimal input only - opens immediately when exact passcode is typed */}
        <form onSubmit={handleSubmit} className="pt-6 pb-2">
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passcode}
              onChange={handleChange}
              placeholder="••••••••••••"
              autoFocus
              className={`w-full bg-slate-950 border ${
                isError
                  ? 'border-red-500 ring-2 ring-red-500/30'
                  : 'border-slate-800 focus:border-amber-500'
              } rounded-2xl px-9 py-2.5 text-base text-white placeholder:text-slate-700 focus:outline-none text-center font-mono tracking-widest transition-all`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              className="absolute right-2 w-7 h-7 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
