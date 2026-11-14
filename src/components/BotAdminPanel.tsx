import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Plus,
  Edit3,
  Trash2,
  Power,
  Upload,
  Check,
  X,
  MessageSquare,
  Compass,
  RotateCcw,
  Clock,
  Sparkles,
  Save
} from 'lucide-react';
import { ChatRoom } from './AdminControlSuite';
import { uploadMediaWithProgress } from '../utils/connectionKeepAlive';

export type BotStatusOption = 'online' | 'offline' | 'busy' | 'hidden';
export type BotPersonalityOption = 'friendly' | 'formal' | 'funny' | 'smart';

export interface BotRecord {
  id: string;
  name: string;
  avatarUrl: string;
  status: BotStatusOption;
  statusQuote: string;
  defaultRoom: string;
  currentRoom: string;
  personality: BotPersonalityOption;
  notes?: string;
  flag?: string;
  enabled: boolean;
  roamMode: 'random' | 'selected';
  roamRooms: string[];
  roamIntervalMinutes: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface BotGlobalSettings {
  botsEnabled: boolean;
  autoRoamEnabled: boolean;
  autoRejoinOnKick: boolean;
  autoRejoinDelaySeconds: number;
  autoRepliesEnabled: boolean;
  welcomeEnabled: boolean;
  replyDelayEnabled: boolean;
  replyDelaySeconds: number;
}

export interface BotReplyRule {
  id: string;
  keyword: string;
  reply: string;
}

interface BotAdminPanelProps {
  socket: any;
  roomsList: ChatRoom[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const FALLBACK_PRESET_AVATARS = [
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ec4899'/%3E%3Cstop offset='100%25' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g1)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Ccircle cx='72' cy='24' r='6' fill='%23fde047'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2306b6d4'/%3E%3Cstop offset='100%25' stop-color='%232563eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g2)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Crect x='36' y='14' width='24' height='6' rx='3' fill='%2338bdf8'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f59e0b'/%3E%3Cstop offset='100%25' stop-color='%23d97706'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g3)'/%3E%3Ccircle cx='48' cy='37' r='15' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-14.5 11.6-24 26-24s26 9.5 26 24' fill='%23fff' opacity='0.92'/%3E%3Cpath d='M35 20l6-6 7 4 7-4 6 6' stroke='%23fef08a' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2310b981'/%3E%3Cstop offset='100%25' stop-color='%23047857'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g4)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Ccircle cx='26' cy='24' r='5' fill='%23a7f3d0'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f43f5e'/%3E%3Cstop offset='100%25' stop-color='%239f1239'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g5)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Cpath d='M48 15c2 3 6 4 6 8a6 6 0 1 1-12 0c0-4 4-5 6-8z' fill='%23fecdd3'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g6' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%23312e81'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g6)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Cpolygon points='48,12 51,18 57,19 52,23 53,29 48,26 43,29 44,23 39,19 45,18' fill='%23fde047'/%3E%3C/svg%3E"
];

const STATUS_DISPLAY: Record<BotStatusOption, { label: string; dotClass: string; badgeClass: string }> = {
  online: { label: 'متصل - أخضر', dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' },
  offline: { label: 'غير متصل - رمادي', dotClass: 'bg-slate-400', badgeClass: 'bg-slate-800 text-slate-300 border-slate-600' },
  busy: { label: 'مشغول - أصفر', dotClass: 'bg-amber-400', badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/40' },
  hidden: { label: 'مخفي', dotClass: 'bg-blue-500', badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40' }
};

const PERSONALITY_LABELS: Record<BotPersonalityOption, string> = {
  friendly: 'ودود',
  formal: 'رسمي',
  funny: 'مرح',
  smart: 'ذكي'
};

const BOT_COUNTRY_FLAGS: Array<{ code: string; name: string; flag: string }> = [
  { code: 'SA', name: 'المملكة العربية السعودية', flag: '🇸🇦' },
  { code: 'YE', name: 'الجمهورية اليمنية', flag: '🇾🇪' },
  { code: 'EG', name: 'جمهورية مصر العربية', flag: '🇪🇬' },
  { code: 'AE', name: 'الإمارات العربية المتحدة', flag: '🇦🇪' },
  { code: 'KW', name: 'دولة الكويت', flag: '🇰🇼' },
  { code: 'QA', name: 'دولة قطر', flag: '🇶🇦' },
  { code: 'BH', name: 'مملكة البحرين', flag: '🇧🇭' },
  { code: 'OM', name: 'سلطنة عُمان', flag: '🇴🇲' },
  { code: 'IQ', name: 'جمهورية العراق', flag: '🇮🇶' },
  { code: 'SY', name: 'الجمهورية العربية السورية', flag: '🇸🇾' },
  { code: 'JO', name: 'المملكة الأردنية الهاشمية', flag: '🇯🇴' },
  { code: 'LB', name: 'الجمهورية اللبنانية', flag: '🇱🇧' },
  { code: 'PS', name: 'دولة فلسطين', flag: '🇵🇸' },
  { code: 'DZ', name: 'الجمهورية الجزائرية', flag: '🇩🇿' },
  { code: 'MA', name: 'المملكة المغربية', flag: '🇲🇦' },
  { code: 'TN', name: 'الجمهورية التونسية', flag: '🇹🇳' },
  { code: 'LY', name: 'دولة ليبيا', flag: '🇱🇾' },
  { code: 'SD', name: 'جمهورية السودان', flag: '🇸🇩' },
  { code: 'MR', name: 'الجمهورية الموريتانية', flag: '🇲🇷' },
  { code: 'TR', name: 'تركيا', flag: '🇹🇷' },
  { code: 'GB', name: 'المملكة المتحدة', flag: '🇬🇧' },
  { code: 'US', name: 'الولايات المتحدة الأمريكية', flag: '🇺🇸' },
  { code: 'DE', name: 'ألمانيا', flag: '🇩🇪' },
  { code: 'FR', name: 'فرنسا', flag: '🇫🇷' },
  { code: 'CA', name: 'كندا', flag: '🇨🇦' }
];

export const BotAdminPanel: React.FC<BotAdminPanelProps> = ({ socket, roomsList, showToast }) => {
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [settings, setSettings] = useState<BotGlobalSettings>({
    botsEnabled: true,
    autoRoamEnabled: false,
    autoRejoinOnKick: true,
    autoRejoinDelaySeconds: 10,
    autoRepliesEnabled: true,
    welcomeEnabled: true,
    replyDelayEnabled: true,
    replyDelaySeconds: 2
  });
  const [replies, setReplies] = useState<BotReplyRule[]>([]);
  const [presetAvatars, setPresetAvatars] = useState<string[]>(FALLBACK_PRESET_AVATARS);

  // Create / Edit Bot Modal Form State
  const [showBotForm, setShowBotForm] = useState(false);
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [botName, setBotName] = useState('');
  const [botAvatarUrl, setBotAvatarUrl] = useState(FALLBACK_PRESET_AVATARS[0]);
  const [botStatus, setBotStatus] = useState<BotStatusOption>('online');
  const [botStatusQuote, setBotStatusQuote] = useState('أهلاً بكم في شات حسان برو');
  const [botDefaultRoom, setBotDefaultRoom] = useState(roomsList[0]?.id || 'الغرفة العامة');
  const [botPersonality, setBotPersonality] = useState<BotPersonalityOption>('friendly');
  const [botFlag, setBotFlag] = useState<string>('🇸🇦');
  const [botRoamMode, setBotRoamMode] = useState<'random' | 'selected'>('random');
  const [botRoamRooms, setBotRoamRooms] = useState<string[]>([]);
  const [botRoamMinutes, setBotRoamMinutes] = useState<number>(5);
  const [botNotes, setBotNotes] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation dialog (in-app)
  const [botPendingDelete, setBotPendingDelete] = useState<BotRecord | null>(null);

  // Bot Replies section ("كلمات البوت")
  const [showNewReplyForm, setShowNewReplyForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newReplyText, setNewReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editKeyword, setEditKeyword] = useState('');
  const [editReplyText, setEditReplyText] = useState('');
  const [replySearch, setReplySearch] = useState('');

  useEffect(() => {
    if (!socket) return;

    const handleState = (data: any) => {
      if (!data) return;
      if (Array.isArray(data.bots)) setBots(data.bots);
      if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      if (Array.isArray(data.replies)) setReplies(data.replies);
      if (Array.isArray(data.presetAvatars) && data.presetAvatars.length > 0) {
        setPresetAvatars(data.presetAvatars);
      }
    };

    socket.on('botsStateUpdated', handleState);
    socket.emit('getBotsState');

    return () => {
      socket.off('botsStateUpdated', handleState);
    };
  }, [socket]);

  const updateGlobalSetting = (patch: Partial<BotGlobalSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    socket?.emit('updateBotSettings', patch);
  };

  const openCreateBotForm = () => {
    setEditingBotId(null);
    setBotName('');
    setBotAvatarUrl(presetAvatars[0] || FALLBACK_PRESET_AVATARS[0]);
    setBotStatus('online');
    setBotStatusQuote('أهلاً بكم في شات حسان برو');
    setBotDefaultRoom(roomsList[0]?.id || 'الغرفة العامة');
    setBotPersonality('friendly');
    setBotFlag('🇸🇦');
    setBotRoamMode('random');
    setBotRoamRooms([]);
    setBotRoamMinutes(5);
    setBotNotes('');
    setShowBotForm(true);
  };

  const openEditBotForm = (bot: BotRecord) => {
    setEditingBotId(bot.id);
    setBotName(bot.name);
    setBotAvatarUrl(bot.avatarUrl || presetAvatars[0] || FALLBACK_PRESET_AVATARS[0]);
    setBotStatus(bot.status || 'online');
    setBotStatusQuote(bot.statusQuote || '');
    setBotDefaultRoom(bot.defaultRoom || roomsList[0]?.id || 'الغرفة العامة');
    setBotPersonality(bot.personality || 'friendly');
    setBotFlag(bot.flag || '🇸🇦');
    setBotRoamMode(bot.roamMode === 'selected' ? 'selected' : 'random');
    setBotRoamRooms(Array.isArray(bot.roamRooms) ? bot.roamRooms : []);
    setBotRoamMinutes(bot.roamIntervalMinutes || 5);
    setBotNotes(bot.notes || '');
    setShowBotForm(true);
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح.', 'error');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const uploaded = await uploadMediaWithProgress(file);
      if (uploaded?.url) {
        setBotAvatarUrl(uploaded.url);
        showToast('تم رفع صورة البوت بنجاح ✅', 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'تعذر رفع صورة البوت.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  const handleToggleRoamRoom = (roomId: string) => {
    setBotRoamRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSaveBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botName.trim() || !botStatusQuote.trim() || !botDefaultRoom || !botAvatarUrl || !botStatus || !botPersonality) {
      showToast('جميع الحقول الأساسية إجبارية ما عدا الملاحظة.', 'error');
      return;
    }
    if (botRoamMode === 'selected' && botRoamRooms.length === 0) {
      showToast('اختر غرفة واحدة على الأقل لقائمة التنقل المحددة، أو اختر تنقل عشوائي.', 'error');
      return;
    }

    const payload = {
      id: editingBotId || undefined,
      name: botName.trim(),
      avatarUrl: botAvatarUrl,
      status: botStatus,
      statusQuote: botStatusQuote.trim(),
      defaultRoom: botDefaultRoom,
      personality: botPersonality,
      flag: botFlag || '🇸🇦',
      roamMode: botRoamMode,
      roamRooms: botRoamRooms,
      roamIntervalMinutes: Math.max(0.1, Number(botRoamMinutes) || 5),
      notes: botNotes.trim()
    };

    const eventName = editingBotId ? 'updateBot' : 'createBot';
    socket?.emit(eventName, payload, (res: { ok?: boolean; error?: string }) => {
      if (res?.ok) {
        setShowBotForm(false);
        setEditingBotId(null);
      } else if (res?.error) {
        showToast(res.error, 'error');
      }
    });
  };

  const handleSaveNewReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newReplyText.trim()) {
      showToast('يرجى إدخال الكلمة والرد.', 'error');
      return;
    }
    socket?.emit(
      'addBotReply',
      { keyword: newKeyword.trim(), reply: newReplyText.trim() },
      (res: { ok?: boolean; error?: string }) => {
        if (res?.ok) {
          setNewKeyword('');
          setNewReplyText('');
          setShowNewReplyForm(false);
        } else if (res?.error) {
          showToast(res.error, 'error');
        }
      }
    );
  };

  const handleSaveEditedReply = (id: string) => {
    if (!editKeyword.trim() || !editReplyText.trim()) {
      showToast('الكلمة والرد حقول مطلوبة.', 'error');
      return;
    }
    socket?.emit(
      'updateBotReply',
      { id, keyword: editKeyword.trim(), reply: editReplyText.trim() },
      (res: { ok?: boolean }) => {
        if (res?.ok) {
          setEditingReplyId(null);
          showToast('تم تعديل الرد بنجاح ✅', 'success');
        }
      }
    );
  };

  const filteredReplies = replies.filter((r) => {
    const q = replySearch.trim().toLowerCase();
    if (!q) return true;
    return r.keyword.toLowerCase().includes(q) || r.reply.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/70">
      {/* Header Card */}
      <div className="bg-slate-800/90 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-2 shadow">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-amber-200 text-xs sm:text-sm">إدارة البوتات والتشغيل الذكي</h4>
            <p className="text-[10px] text-slate-400">
              محفوظة بالكامل في قاعدة البيانات وتعمل تلقائياً عند إعادة تشغيل السيرفر • ({bots.length} بوت)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateBotForm}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1 shadow cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إنشاء بوت جديد</span>
        </button>
      </div>

      {/* Section 1: 6 Persistent Global Control Buttons */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-2.5">
        <div className="font-black text-amber-300 text-xs flex items-center gap-1.5 border-b border-slate-700 pb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>أزرار التحكم العامة (تحفظ حالتها فوراً في قاعدة البيانات)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* 1. Global Bots On/Off */}
          <button
            type="button"
            onClick={() => updateGlobalSetting({ botsEnabled: !settings.botsEnabled })}
            className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
              settings.botsEnabled
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              <Power className="w-4 h-4" />
              <span>1. تشغيل البوتات بشكل عام</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${settings.botsEnabled ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
              {settings.botsEnabled ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          {/* 2. Auto-Roam On/Off */}
          <button
            type="button"
            onClick={() => updateGlobalSetting({ autoRoamEnabled: !settings.autoRoamEnabled })}
            className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
              settings.autoRoamEnabled
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>2. التنقل التلقائي بين الغرف</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${settings.autoRoamEnabled ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {settings.autoRoamEnabled ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          {/* 3. Auto-Rejoin After Kick + Delay seconds */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
              settings.autoRejoinOnKick
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => updateGlobalSetting({ autoRejoinOnKick: !settings.autoRejoinOnKick })}
                className="font-bold flex items-center gap-1.5 cursor-pointer flex-1 text-right"
              >
                <RotateCcw className="w-4 h-4" />
                <span>3. الدخول التلقائي بعد الطرد</span>
              </button>
              <button
                type="button"
                onClick={() => updateGlobalSetting({ autoRejoinOnKick: !settings.autoRejoinOnKick })}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${settings.autoRejoinOnKick ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}
              >
                {settings.autoRejoinOnKick ? 'مفعّل' : 'متوقف'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] border-t border-white/10 pt-1.5">
              <label className="text-slate-300">مدة الانتظار قبل الرجوع (بالثواني):</label>
              <input
                type="number"
                min={1}
                max={3600}
                value={settings.autoRejoinDelaySeconds}
                onChange={(e) => updateGlobalSetting({ autoRejoinDelaySeconds: Math.max(1, Number(e.target.value) || 10) })}
                className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-600 text-amber-300 font-mono text-center"
              />
            </div>
          </div>

          {/* 4. Auto Replies On/Off */}
          <button
            type="button"
            onClick={() => updateGlobalSetting({ autoRepliesEnabled: !settings.autoRepliesEnabled })}
            className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
              settings.autoRepliesEnabled
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>4. الردود التلقائية</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${settings.autoRepliesEnabled ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
              {settings.autoRepliesEnabled ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          {/* 5. Welcome Message On/Off */}
          <button
            type="button"
            onClick={() => updateGlobalSetting({ welcomeEnabled: !settings.welcomeEnabled })}
            className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
              settings.welcomeEnabled
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>5. رسالة الترحيب بالداخلين</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${settings.welcomeEnabled ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {settings.welcomeEnabled ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          {/* 6. Reply Delay On/Off + Delay seconds */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col gap-2 ${
              settings.replyDelayEnabled
                ? 'bg-teal-950/50 border-teal-500/50 text-teal-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => updateGlobalSetting({ replyDelayEnabled: !settings.replyDelayEnabled })}
                className="font-bold flex items-center gap-1.5 cursor-pointer flex-1 text-right"
              >
                <Clock className="w-4 h-4" />
                <span>6. الرد بعد تأخير (افتراضي 2 ثواني)</span>
              </button>
              <button
                type="button"
                onClick={() => updateGlobalSetting({ replyDelayEnabled: !settings.replyDelayEnabled })}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${settings.replyDelayEnabled ? 'bg-teal-500 text-black' : 'bg-slate-700 text-slate-300'}`}
              >
                {settings.replyDelayEnabled ? 'مفعّل' : 'فوري'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] border-t border-white/10 pt-1.5">
              <label className="text-slate-300">تأخير الرد (ثواني):</label>
              <input
                type="number"
                min={0}
                max={60}
                value={settings.replyDelaySeconds}
                onChange={(e) => updateGlobalSetting({ replyDelaySeconds: Math.max(0, Number(e.target.value) || 0) })}
                className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-600 text-teal-300 font-mono text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Create / Edit Bot Full Form */}
      {showBotForm && (
        <form
          onSubmit={handleSaveBot}
          className="bg-slate-800 border-2 border-amber-500/60 rounded-xl p-3.5 space-y-3 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h5 className="font-black text-amber-300 text-xs sm:text-sm">
              {editingBotId ? `تعديل بيانات البوت: ${botName}` : 'إنشاء بوت جديد'}
            </h5>
            <button
              type="button"
              onClick={() => setShowBotForm(false)}
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bot Avatar Upload + 6 Quick Presets */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-200 text-[11px]">
              صورة البوت (إجباري — رفع من الجهاز أو اختيار سريع من 6 صور جاهزة) *
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              <img
                src={botAvatarUrl}
                alt="معاينة البوت"
                className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400 shadow"
              />
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileUpload}
              />
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => avatarFileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingAvatar ? 'جاري الرفع...' : 'رفع صورة من الجهاز'}</span>
              </button>

              <div className="flex items-center gap-1.5 flex-wrap">
                {presetAvatars.slice(0, 6).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBotAvatarUrl(preset)}
                    className={`relative rounded-lg p-0.5 transition-all cursor-pointer border-2 ${
                      botAvatarUrl === preset
                        ? 'border-amber-400 scale-105 shadow-md'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                    title={`صورة جاهزة ${idx + 1}`}
                  >
                    <img src={preset} alt={`صورة ${idx + 1}`} className="w-9 h-9 rounded-md object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Bot Name */}
            <div>
              <label className="block font-bold text-slate-200 text-[11px] mb-1">اسم البوت *</label>
              <input
                type="text"
                required
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="مثال: سارة"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-amber-400 outline-none"
              />
            </div>

            {/* Status (4 options only) */}
            <div>
              <label className="block font-bold text-slate-200 text-[11px] mb-1">الحالة *</label>
              <select
                required
                value={botStatus}
                onChange={(e) => setBotStatus(e.target.value as BotStatusOption)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-amber-400 outline-none"
              >
                <option value="online">متصل - أخضر</option>
                <option value="offline">غير متصل - رمادي</option>
                <option value="busy">مشغول - أصفر</option>
                <option value="hidden">مخفي</option>
              </select>
            </div>

            {/* Status Quote */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-200 text-[11px] mb-1">الحالة الكتابية (تظهر تحت الاسم) *</label>
              <input
                type="text"
                required
                value={botStatusQuote}
                onChange={(e) => setBotStatusQuote(e.target.value)}
                placeholder="مثال: أهلاً بكم في شات حسن برو"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-amber-400 outline-none"
              />
            </div>

            {/* Default Room */}
            <div>
              <label className="block font-bold text-slate-200 text-[11px] mb-1">الغرفة الافتراضية *</label>
              <select
                required
                value={botDefaultRoom}
                onChange={(e) => setBotDefaultRoom(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-amber-400 outline-none"
              >
                {roomsList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Personality */}
            <div>
              <label className="block font-bold text-slate-200 text-[11px] mb-1">شخصية البوت *</label>
              <select
                required
                value={botPersonality}
                onChange={(e) => setBotPersonality(e.target.value as BotPersonalityOption)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-amber-400 outline-none"
              >
                <option value="friendly">ودود</option>
                <option value="formal">رسمي</option>
                <option value="funny">مرح</option>
                <option value="smart">ذكي</option>
              </select>
            </div>

            {/* Country Flag Manual Picker */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-200 text-[11px] mb-1">علم الدولة (اختيار يدوي) *</label>
              <select
                required
                value={botFlag}
                onChange={(e) => setBotFlag(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-amber-400 outline-none"
              >
                {BOT_COUNTRY_FLAGS.map((country) => (
                  <option key={country.code} value={country.flag}>
                    {country.flag} — {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bot Roaming Configuration */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-2.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-indigo-300 text-[11px]">إعدادات التنقل بين الغرف للبوت</span>
              <div className="flex items-center gap-2 text-[10px]">
                <label className="text-slate-300">وقت التنقل (دقائق):</label>
                <input
                  type="number"
                  step="any"
                  min={0.1}
                  max={1440}
                  value={botRoamMinutes}
                  onChange={(e) => setBotRoamMinutes(Math.max(0.1, Number(e.target.value) || 5))}
                  className="w-20 px-2 py-0.5 rounded bg-slate-950 border border-slate-600 text-indigo-300 font-mono text-center"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="botRoamMode"
                  checked={botRoamMode === 'random'}
                  onChange={() => setBotRoamMode('random')}
                  className="accent-indigo-500"
                />
                <span>أ) تنقل عشوائي بين كل الغرف</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="botRoamMode"
                  checked={botRoamMode === 'selected'}
                  onChange={() => setBotRoamMode('selected')}
                  className="accent-indigo-500"
                />
                <span>ب) تنقل حسب قائمة غرف محددة</span>
              </label>
            </div>

            {botRoamMode === 'selected' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 border-t border-slate-800">
                {roomsList.map((room) => {
                  const checked = botRoamRooms.includes(room.id);
                  return (
                    <label
                      key={room.id}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10.5px] cursor-pointer ${
                        checked
                          ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 font-bold'
                          : 'bg-slate-950 border-slate-700 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleRoamRoom(room.id)}
                        className="accent-indigo-500"
                      />
                      <span className="truncate">{room.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block font-bold text-slate-300 text-[11px] mb-1">ملاحظة (اختياري)</label>
            <input
              type="text"
              value={botNotes}
              onChange={(e) => setBotNotes(e.target.value)}
              placeholder="ملاحظة إدارية داخلية عن هذا البوت..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:border-amber-400 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowBotForm(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 3: Bots Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-700 font-black text-amber-200 flex items-center justify-between">
          <span>جدول البوتات المسجلة ({bots.length})</span>
          <span className="text-[10px] text-slate-400 font-normal">يظهر البوت كعضو حقيقي في الشات</span>
        </div>

        {bots.length === 0 ? (
          <div className="p-6 text-center text-slate-400 space-y-2">
            <Bot className="w-8 h-8 mx-auto text-slate-500 opacity-70" />
            <p className="font-bold">لا توجد بوتات حتى الآن.</p>
            <p className="text-[10px]">اضغط على زر [إنشاء بوت جديد] لإضافة أول بوت وتفعيله فوراً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-900/70 text-[10px] text-slate-400 border-b border-slate-700">
                  <th className="p-2">البوت</th>
                  <th className="p-2">الحالة</th>
                  <th className="p-2">الغرفة الحالية</th>
                  <th className="p-2 text-center">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {bots.map((bot) => {
                  const st = STATUS_DISPLAY[bot.status] || STATUS_DISPLAY.online;
                  return (
                    <tr key={bot.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0">
                            <img
                              src={bot.avatarUrl}
                              alt={bot.name}
                              className="w-9 h-9 rounded-lg object-cover border border-amber-500/40"
                            />
                            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${st.dotClass}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-amber-200 truncate flex items-center gap-1">
                              <span>{bot.flag || '🇸🇦'}</span>
                              <span className="truncate">{bot.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {PERSONALITY_LABELS[bot.personality] || 'ودود'} • {bot.statusQuote}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                          <span>{st.label}</span>
                        </span>
                      </td>
                      <td className="p-2 text-[11px] font-bold text-indigo-300">
                        {bot.currentRoom || bot.defaultRoom}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => socket?.emit('toggleBotEnabled', { botId: bot.id, enabled: !bot.enabled })}
                            className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer flex items-center gap-1 ${
                              bot.enabled
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                            title={bot.enabled ? 'إيقاف البوت' : 'تشغيل البوت'}
                          >
                            <Power className="w-3 h-3" />
                            <span>{bot.enabled ? 'شغال' : 'متوقف'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditBotForm(bot)}
                            className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black cursor-pointer flex items-center gap-1"
                            title="تعديل البوت"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBotPendingDelete(bot)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black cursor-pointer flex items-center gap-1"
                            title="حذف البوت"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Bot Replies ("كلمات البوت") */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
          <div>
            <h5 className="font-black text-cyan-300 text-xs sm:text-sm">كلمات البوت والردود التلقائية ({replies.length})</h5>
            <p className="text-[10px] text-slate-400">
              يدعم المتغيرات الذكية: {'{اسم العضو}'} و {'{الوقت الحقيقي}'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewReplyForm((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة كلمة جديدة</span>
          </button>
        </div>

        {showNewReplyForm && (
          <form onSubmit={handleSaveNewReply} className="bg-slate-900 border border-cyan-500/40 rounded-lg p-2.5 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-300 font-bold mb-1">الكلمة *</label>
                <input
                  type="text"
                  required
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="مثال: السلام عليكم"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-300 font-bold mb-1">الرد *</label>
                <input
                  type="text"
                  required
                  value={newReplyText}
                  onChange={(e) => setNewReplyText(e.target.value)}
                  placeholder="مثال: وعليكم السلام، نورت يا {اسم العضو} 🌹"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewReplyForm(false)}
                className="px-2.5 py-1 rounded bg-slate-700 text-slate-200 font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-black flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3 h-3" />
                <span>حفظ</span>
              </button>
            </div>
          </form>
        )}

        <input
          type="text"
          value={replySearch}
          onChange={(e) => setReplySearch(e.target.value)}
          placeholder="ابحث في كلمات البوت..."
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] outline-none focus:border-cyan-400"
        />

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/60 border border-slate-700 rounded-lg bg-slate-900/50">
          {filteredReplies.map((rule) => (
            <div key={rule.id} className="p-2 flex items-center justify-between gap-2 hover:bg-white/5">
              {editingReplyId === rule.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-1.5">
                  <input
                    type="text"
                    value={editKeyword}
                    onChange={(e) => setEditKeyword(e.target.value)}
                    className="sm:w-1/3 px-2 py-1 rounded bg-slate-950 border border-cyan-500 text-white text-[11px]"
                  />
                  <input
                    type="text"
                    value={editReplyText}
                    onChange={(e) => setEditReplyText(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-slate-950 border border-cyan-500 text-white text-[11px]"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveEditedReply(rule.id)}
                      className="p-1.5 rounded bg-emerald-600 text-white cursor-pointer"
                      title="حفظ"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReplyId(null)}
                      className="p-1.5 rounded bg-slate-700 text-slate-200 cursor-pointer"
                      title="إلغاء"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-black text-[10.5px] ml-2">
                      {rule.keyword}
                    </span>
                    <span className="text-slate-200 text-[11px]">{rule.reply}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReplyId(rule.id);
                        setEditKeyword(rule.keyword);
                        setEditReplyText(rule.reply);
                      }}
                      className="p-1.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 cursor-pointer"
                      title="تعديل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => socket?.emit('deleteBotReply', { id: rule.id })}
                      className="p-1.5 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Bot Confirmation Modal */}
      {botPendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-xl p-4 max-w-sm w-full space-y-3 shadow-2xl">
            <h5 className="font-black text-rose-300 text-sm">تأكيد حذف البوت</h5>
            <p className="text-xs text-slate-300">
              هل أنت متأكد من حذف البوت <span className="font-black text-white">[{botPendingDelete.name}]</span> نهائياً من الشات وقاعدة البيانات؟
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBotPendingDelete(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  socket?.emit('deleteBot', { botId: botPendingDelete.id });
                  setBotPendingDelete(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black cursor-pointer"
              >
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
