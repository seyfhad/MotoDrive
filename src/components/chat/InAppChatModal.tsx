import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, CheckCheck } from 'lucide-react';
import { db, isFirestoreQuotaExceeded } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { saveToLocalCache, getFromLocalCache, addToOfflineQueue } from '../../services/dbService';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: 'passenger' | 'driver';
  text: string;
  createdAt: string;
}

interface InAppChatModalProps {
  rideId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole?: 'passenger' | 'driver';
  otherPartyName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const PASSENGER_QUICK_REPLIES = [
  '📍 أنا بانتظارك في نقطة الانطلاق',
  '🏠 أنا أمام المدخل الرئيسي',
  '🪖 من فضلك أحضر خوذة إضافية',
  '⏱️ كم تبقى لك للوصول؟',
];

const DRIVER_QUICK_REPLIES = [
  '🏍️ أنا في طريقي إليك الآن',
  '📍 وصلت إلى نقطة الانطلاق',
  '⏱️ سأصل خلال دقيقتين',
  '🪖 معي خوذة إضافية جاهزة لك',
];

export const InAppChatModal: React.FC<InAppChatModalProps> = ({
  rideId,
  currentUserId,
  currentUserName,
  currentUserRole = 'passenger',
  otherPartyName,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cacheKey = `ride_chat_${rideId}`;

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen || !rideId) return;

    let isMounted = true;

    // 1. Load cached messages immediately from IndexedDB (0 reads from Firestore)
    getFromLocalCache<ChatMessage[]>(cacheKey).then((cached) => {
      if (isMounted && cached && cached.length > 0) {
        setMessages(cached);
      }
    });

    // Listen to local custom event for instant same-device/tab sync
    const handleLocalChatUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ rideId: string; messages: ChatMessage[] }>;
      if (customEvent.detail?.rideId === rideId && isMounted) {
        setMessages(customEvent.detail.messages);
      }
    };
    window.addEventListener('motodrive_chat_updated', handleLocalChatUpdate);

    // 2. Subscribe to Firestore subcollection if quota allows
    let unsubscribe: (() => void) | undefined;
    if (!isFirestoreQuotaExceeded()) {
      try {
        const q = query(
          collection(db, 'rides', rideId, 'messages'),
          orderBy('createdAt', 'asc')
        );
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!isMounted) return;
            const cloudMsgs: ChatMessage[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              const createdStr =
                typeof data.createdAt === 'string'
                  ? data.createdAt
                  : data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString();
              return {
                id: docSnap.id,
                senderId: data.senderId || '',
                senderName: data.senderName || 'مستخدم',
                senderRole: data.senderRole,
                text: data.text || '',
                createdAt: createdStr,
              };
            });

            if (cloudMsgs.length > 0) {
              setMessages((prev) => {
                const map = new Map<string, ChatMessage>();
                prev.forEach((m) => map.set(m.id, m));
                cloudMsgs.forEach((m) => map.set(m.id, m));
                const merged = Array.from(map.values()).sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                saveToLocalCache(cacheKey, merged);
                return merged;
              });
            }
          },
          () => {}
        );
      } catch {}
    }

    return () => {
      isMounted = false;
      window.removeEventListener('motodrive_chat_updated', handleLocalChatUpdate);
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, rideId, cacheKey]);

  const sendTextMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || sending) return;

    setInputText('');
    setSending(true);

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole === 'driver' ? 'driver' : 'passenger',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    try {
      const updated = [...messages, newMsg];
      setMessages(updated);
      await saveToLocalCache(cacheKey, updated);

      window.dispatchEvent(
        new CustomEvent('motodrive_chat_updated', {
          detail: { rideId, messages: updated },
        })
      );

      if (!isFirestoreQuotaExceeded() && navigator.onLine) {
        try {
          await addDoc(collection(db, 'rides', rideId, 'messages'), {
            senderId: currentUserId,
            senderName: currentUserName,
            senderRole: currentUserRole,
            text: trimmed,
            createdAt: serverTimestamp(),
          });
        } catch {
          // If Firestore write fails or quota is reached, queue in IndexedDB offlineQueue
          await addToOfflineQueue(`rides/${rideId}/messages`, 'set', newMsg, newMsg.id);
        }
      } else {
        await addToOfflineQueue(`rides/${rideId}/messages`, 'set', newMsg, newMsg.id);
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendTextMessage(inputText);
  };

  if (!isOpen) return null;

  const quickReplies =
    currentUserRole === 'driver' ? DRIVER_QUICK_REPLIES : PASSENGER_QUICK_REPLIES;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      dir="rtl"
      id="in-app-chat-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md h-[540px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                الدردشة مع {otherPartyName || (currentUserRole === 'driver' ? 'الراكب' : 'السائق')}
              </h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>متصل الآن • رحلة #{rideId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Replies Bar */}
        <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendTextMessage(reply)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-300 font-semibold transition-all cursor-pointer"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
          {messages.length === 0 ? (
            <div className="text-center py-14 text-slate-500 text-xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800/70 mx-auto flex items-center justify-center text-amber-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-300">ابدأ المحادثة الفورية</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                يمكنك إرسال رسالة نصية أو اختيار رد سريع من الأعلى لتنسيق نقطة الالتقاء بدون رصيد مكالمات.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[10px] text-slate-500 px-1 mb-0.5">
                    {isMe ? 'أنت' : msg.senderName}
                  </span>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-amber-500 text-slate-950 font-bold rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div
                      className={`text-[9px] mt-1 flex items-center gap-1 justify-end ${
                        isMe ? 'text-slate-900/70' : 'text-slate-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString('ar-DZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
