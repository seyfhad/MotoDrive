import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Shield, AlertCircle } from 'lucide-react';

interface InAppCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherPartyName: string;
  otherPartyRole: 'passenger' | 'driver';
  otherPartyPhone?: string;
  otherPartyPhoto?: string;
  rideId: string;
}

export const InAppCallModal: React.FC<InAppCallModalProps> = ({
  isOpen,
  onClose,
  otherPartyName,
  otherPartyRole,
  otherPartyPhone = '0550000000',
  otherPartyPhoto,
  rideId,
}) => {
  const [callState, setCallState] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Masked phone format (e.g. 05** *** 28)
  const maskedPhone = React.useMemo(() => {
    if (!otherPartyPhone || otherPartyPhone.length < 6) return '05** *** **';
    const prefix = otherPartyPhone.slice(0, 2);
    const suffix = otherPartyPhone.slice(-2);
    return `${prefix}** *** *${suffix}`;
  }, [otherPartyPhone]);

  // Web Audio synthesizer for phone tones (Dial tone, Ringing, Connected chime)
  const playTone = (type: 'ringing' | 'connected' | 'ended') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'ringing') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
        oscRef.current = osc;
      } else if (type === 'connected') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) {
      setCallState('connecting');
      setCallDuration(0);
      setIsMuted(false);
      return;
    }

    setCallState('connecting');
    setCallDuration(0);

    // Step 1: Connecting -> Ringing after 1.2s
    const ringTimer = setTimeout(() => {
      setCallState('ringing');
      playTone('ringing');
    }, 1200);

    // Step 2: Ringing repeat
    const ringTimer2 = setTimeout(() => {
      playTone('ringing');
    }, 2800);

    // Step 3: Connected after 3.8s
    const connectTimer = setTimeout(() => {
      setCallState('connected');
      playTone('connected');
    }, 3800);

    return () => {
      clearTimeout(ringTimer);
      clearTimeout(ringTimer2);
      clearTimeout(connectTimer);
    };
  }, [isOpen]);

  // Duration timer when connected
  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in"
      id="in-app-call-modal"
      dir="rtl"
    >
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center text-slate-100 shadow-2xl relative space-y-6 overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Masked Call Privacy Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-emerald-500/30 rounded-full text-[11px] text-emerald-400 font-bold shadow-sm">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>مكالمة آمنة ومحمية الخصوصية (VoIP)</span>
        </div>

        {/* Avatar & Pulse Wave */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          {callState !== 'ended' && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
          )}
          <img
            src={
              otherPartyPhoto ||
              (otherPartyRole === 'driver'
                ? '/assets/images/driver_logo.jpg'
                : '/assets/images/passenger_logo.jpg')
            }
            alt={otherPartyName}
            className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 relative z-10 shadow-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/icon.jpg';
            }}
          />
        </div>

        {/* Contact Info */}
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white">{otherPartyName}</h3>
          <p className="text-xs text-slate-400">
            {otherPartyRole === 'driver' ? 'سائق MotoDrive' : 'راكب MotoDrive'} •{' '}
            <span className="font-mono text-slate-500" dir="ltr">
              {maskedPhone}
            </span>
          </p>

          <div className="pt-2">
            {callState === 'connecting' && (
              <span className="text-xs text-amber-400 font-bold animate-pulse">جاري إنشاء الاتصال المشفر...</span>
            )}
            {callState === 'ringing' && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">يرن الآن (Ringing)...</span>
            )}
            {callState === 'connected' && (
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-sm font-black text-white font-mono">{formatTimer(callDuration)}</span>
              </div>
            )}
            {callState === 'ended' && (
              <span className="text-xs text-red-400 font-bold">تم إنهاء المكالمة</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
          {/* Mute Button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-2xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              isMuted
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px]">{isMuted ? 'مكتوم' : 'كتم'}</span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="p-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex flex-col items-center gap-1.5 text-xs font-bold transition-all shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-[10px]">إنهاء</span>
          </button>

          {/* Speaker Button */}
          <button
            type="button"
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`p-3.5 rounded-2xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              isSpeaker
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-[10px]">{isSpeaker ? 'مكبر الصوت' : 'عادي'}</span>
          </button>
        </div>

        {/* Direct Phone Fallback Option */}
        <div className="pt-2">
          <a
            href={`tel:${otherPartyPhone}`}
            onClick={onClose}
            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>أو الاتصال المباشر عبر شبكة الهاتف (GSM)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
