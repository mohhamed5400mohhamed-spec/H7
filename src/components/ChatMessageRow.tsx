import React, { useState, useEffect } from 'react';
import {
  Trash2,
  X,
  Reply,
  Copy,
  Volume2,
  Star,
  MessageSquare,
  User as UserIcon,
  Edit3,
  Pin,
  AlertTriangle,
  Play,
  Video
} from 'lucide-react';
import type { Message } from '../types/chat';
import { VoicePlayer } from './VoiceNoteModule';
import {
  AVAILABLE_REACTIONS,
  getAutoContrastMessageTextColor,
  type ThemeFullStyle
} from '../constants/themeStyles';

export interface ChatMessageRowProps {
  msg: Message;
  formattedTime: string;
  companionGift?: string;
  bannerUrl?: string;
  replyBannerUrl?: string;
  renderedTextNode?: React.ReactNode;
  currentUsername?: string;
  currentUserRole?: string;
  isMenuOpen: boolean;
  isEditing: boolean;
  isStarred: boolean;
  userCanDeleteMessage: boolean;
  activeWallpaper: string;
  isNightMode: boolean;
  isHighContrastMode: boolean;
  bubbleStyle: string;
  chatFontSize: 'sm' | 'base' | 'lg' | 'xl';
  curTheme: ThemeFullStyle;
  falconIcon: string;
  onToggleMenu: (msgId: string) => void;
  onCloseMenu: () => void;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
  onToggleStar: (msg: Message) => void;
  onOpenPm: (msg: Message) => void;
  onOpenProfile: (username: string) => void;
  onToggleEdit: (msg: Message) => void;
  onSaveEdit: (msgId: string, newText: string) => void;
  onCancelEdit: () => void;
  onPin: (msgId: string) => void;
  onDelete: (msgId: string) => void;
  onReport: (msg: Message) => void;
  onOpenMediaViewer: (viewer: { url: string; type: 'image' | 'video'; title: string }) => void;
}

export const ChatMessageRow: React.FC<ChatMessageRowProps> = React.memo(({
  msg,
  formattedTime,
  companionGift,
  bannerUrl,
  replyBannerUrl,
  renderedTextNode,
  currentUsername,
  currentUserRole,
  isMenuOpen,
  isEditing,
  isStarred,
  userCanDeleteMessage,
  activeWallpaper,
  isNightMode,
  isHighContrastMode,
  bubbleStyle,
  chatFontSize,
  curTheme,
  falconIcon,
  onToggleMenu,
  onCloseMenu,
  onReact,
  onReply,
  onCopy,
  onSpeak,
  onToggleStar,
  onOpenPm,
  onOpenProfile,
  onToggleEdit,
  onSaveEdit,
  onCancelEdit,
  onPin,
  onDelete,
  onReport,
  onOpenMediaViewer
}) => {
  const [editDraft, setEditDraft] = useState(msg.text || '');

  useEffect(() => {
    if (isEditing) {
      setEditDraft(msg.text || '');
    }
  }, [isEditing, msg.text]);

  if (msg.isDeleted) {
    const isAdminViewer = currentUserRole === 'admin' || currentUserRole === 'super' || currentUserRole === 'hassan';
    if (!isAdminViewer) return null;
    const deleterLabel =
      msg.deletedByRole === 'super'
        ? 'مدير النظام'
        : msg.deletedByRole === 'admin'
        ? 'المشرف'
        : msg.deletedBy === msg.username
        ? 'صاحب الرسالة'
        : 'المشرف';
    return (
      <div
        id={`msg-${msg.id}`}
        className={`flex items-center justify-between gap-1.5 py-1 px-2.5 rounded-lg text-[10px] italic select-none transition-all ${
          activeWallpaper.startsWith('light-')
            ? 'bg-slate-200/60 text-slate-600 border border-slate-300/70'
            : 'bg-slate-800/45 text-slate-400 border border-slate-700/50'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Trash2 className="w-3 h-3 text-rose-400/80 flex-shrink-0" />
          <span className="truncate">
            تم حذف هذه الرسالة من قبل {deleterLabel}
            {msg.deletedBy ? ` (${msg.deletedBy})` : ''}
            {msg.username ? ` — كانت لـ @${msg.username}` : ''}
          </span>
        </div>
        <span className="text-[9px] font-mono opacity-70 flex-shrink-0">
          {formattedTime}
        </span>
      </div>
    );
  }

  const isAlertMessage = Boolean(msg.badge && (msg.badge.includes('إشعار عام') || msg.badge.includes('إعلان')));
  const isMentioned = Boolean(
    currentUsername &&
    msg.username !== currentUsername &&
    msg.text &&
    (
      msg.text.includes(`@${currentUsername}`) ||
      msg.text.toLowerCase().includes(`@${currentUsername.toLowerCase()}`)
    )
  );
  const isMe = Boolean(currentUsername && msg.username === currentUsername);
  const isOwnMessageCaseInsensitive = Boolean(currentUsername && msg.username.toLowerCase() === currentUsername.toLowerCase());
  const isAdminOrSuper = currentUserRole === 'admin' || currentUserRole === 'super' || currentUserRole === 'hassan';

  return (
    <div
      id={`msg-${msg.id}`}
      className={`chat-message-row relative flex items-start gap-1 sm:gap-1.5 text-right py-0.5 sm:py-1 px-1 sm:px-1.5 rounded-lg transition-all max-w-full min-w-0 ${
        isMenuOpen ? 'z-50' : 'z-0'
      } ${
        isAlertMessage
          ? 'bg-amber-50/90 border-r-4 border-amber-500 shadow-xs my-0.5'
          : isMentioned
          ? 'mention-pink-flash border-r-4 border-rose-500 ring-2 ring-pink-300/80 shadow-md my-0.5'
          : activeWallpaper.startsWith('light-')
          ? 'border-b border-slate-200/70 last:border-b-0 hover:bg-black/5'
          : 'border-b border-slate-800/40 last:border-b-0 hover:bg-white/5'
      }`}
    >
      <img
        src={msg.avatarUrl || falconIcon}
        alt={msg.username}
        onClick={() => onOpenProfile(msg.username)}
        className="w-6 h-6 sm:w-7 sm:h-7 rounded-md object-cover border border-slate-300 shadow-2xs flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80"
      />

      <div className={`flex-1 min-w-0 relative ${isMenuOpen ? 'z-50' : ''}`}>
        <div className="flex items-center justify-between text-[11px] mb-0.5 gap-1 leading-tight">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0">
            {msg.badge && (
              <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${msg.badgeColor || 'bg-red-600 text-white'}`}>
                {msg.badge}
              </span>
            )}
            {companionGift && (
              <img
                src={companionGift}
                alt="هدية"
                title="هدية تكريمية مرافقة للاسم"
                onClick={() => onOpenProfile(msg.username)}
                className="w-4 h-4 sm:w-5 sm:h-5 max-w-[20px] max-h-[20px] object-contain inline-block drop-shadow-sm select-none shrink-0 align-middle hover:scale-125 transition-transform cursor-pointer"
              />
            )}
            {bannerUrl ? (
              <span
                onClick={() => onOpenProfile(msg.username)}
                title={msg.username}
                className="inline-flex items-center cursor-pointer select-none"
              >
                <img
                  src={bannerUrl}
                  alt={msg.username}
                  title={msg.username}
                  className="h-5 max-h-[22px] max-w-[140px] sm:max-w-[180px] object-contain drop-shadow-xs rounded inline-block align-middle hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              </span>
            ) : (
              <span
                onClick={() => onOpenProfile(msg.username)}
                style={{ color: msg.nameColor || '#000000' }}
                className={`font-bold cursor-pointer hover:underline text-[11px] sm:text-xs ${!msg.nameColor ? 'text-black' : ''}`}
              >
                {msg.username}
              </span>
            )}
            {isMentioned && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-200/90 text-rose-800 text-[9px] font-black flex items-center gap-1 shadow-2xs border border-rose-300 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                <span>@ إشارة خاصة بك</span>
              </span>
            )}
          </div>

          {/* Consolidated Actions: Time + Single Dropdown Menu (⋮) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 relative">
            <span
              className="text-[10px] text-slate-400 font-mono font-medium select-none"
              title={msg.timestamp ? new Date(msg.timestamp).toLocaleString('ar-EG') : undefined}
            >
              {formattedTime}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(msg.id);
              }}
              className={`msg-action-btn relative z-20 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 border ${
                isMenuOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black scale-105 ring-2 ring-amber-400/50'
                  : activeWallpaper.startsWith('light-')
                  ? 'bg-white/90 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700/80'
              }`}
              title="خيارات وإجراءات الرسالة (رد، نسخ، نطق، تفاعل، تعديل، تثبيت، حذف، إبلاغ)"
            >
              ⋮
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="msg-action-panel absolute top-full mt-2 left-0 z-50 p-2 bg-slate-900/95 text-slate-100 border-2 border-amber-500/80 rounded-2xl shadow-2xl backdrop-blur-md w-[86vw] max-w-[340px] sm:max-w-[380px] overflow-hidden transition-all duration-200 ease-out transform opacity-100 scale-100 animate-in fade-in zoom-in-95 slide-in-from-top-2 ring-2 ring-amber-500/30"
              >
                {/* Upper Row: Quick Emojis + Close Button */}
                <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-slate-800/90">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[11px] text-amber-400 font-bold ml-1 select-none flex-shrink-0">
                      تفاعل:
                    </span>
                    {AVAILABLE_REACTIONS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          onCloseMenu();
                          onReact(msg.id, em);
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm hover:scale-130 transition-transform hover:bg-slate-800 active:scale-95 cursor-pointer flex-shrink-0"
                        title={`تفاعل بـ ${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={onCloseMenu}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0 transition-colors cursor-pointer"
                    title="إغلاق خيارات الرسالة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lower Row: Action Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onCloseMenu();
                      onReply(msg);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-600/30 hover:text-amber-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                    title="رد على الرسالة"
                  >
                    <Reply className="w-3.5 h-3.5 rotate-180 text-amber-400" />
                    <span>رد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onCloseMenu();
                      onCopy(msg.text || msg.mediaUrl || '');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                    title="نسخ النص أو الرابط"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>نسخ</span>
                  </button>

                  {msg.text && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onSpeak(msg.text);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                      title="قراءة صوتية (نطق)"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>نطق</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onCloseMenu();
                      onToggleStar(msg);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-600/30 hover:text-amber-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                    title={isStarred ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                  >
                    <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                    <span>{isStarred ? 'إلغاء المفضلة' : 'مفضلة'}</span>
                  </button>

                  {currentUsername && !isOwnMessageCaseInsensitive && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onOpenPm(msg);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-600/30 hover:text-emerald-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                      title="محادثة خاصة مع العضو"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>خاص</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onCloseMenu();
                      onOpenProfile(msg.username);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-sky-600/30 hover:text-sky-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                    title="عرض الملف الشخصي"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>بروفايل</span>
                  </button>

                  {(isOwnMessageCaseInsensitive || isAdminOrSuper) && !msg.voiceNote && !msg.mediaUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onToggleEdit(msg);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-sky-600/30 hover:text-sky-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                      title="تعديل الرسالة"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>تعديل</span>
                    </button>
                  )}

                  {isAdminOrSuper && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onPin(msg.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-600/30 hover:text-amber-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                      title="تثبيت في الروم"
                    >
                      <Pin className="w-3.5 h-3.5 text-amber-400" />
                      <span>تثبيت</span>
                    </button>
                  )}

                  {(isOwnMessageCaseInsensitive || isAdminOrSuper || userCanDeleteMessage) && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onDelete(msg.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-rose-600/30 hover:text-rose-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                      title="حذف الرسالة"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>حذف</span>
                    </button>
                  )}

                  {currentUsername && !isOwnMessageCaseInsensitive && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onReport(msg);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-orange-600/30 hover:text-orange-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                      title="إبلاغ عن مخالفة"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                      <span>إبلاغ</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Snug Message Bubble */}
        <div className={`block w-full max-w-full text-right px-2 py-0.5 sm:px-2.5 sm:py-1 transition-all [overflow-wrap:anywhere] break-words shadow-2xs ${
          isAlertMessage
            ? isNightMode
              ? 'rounded-xl bg-amber-950/80 text-amber-200 border border-amber-600/70 shadow-xs'
              : 'rounded-xl bg-amber-100/95 text-amber-950 border border-amber-300 shadow-2xs'
            : isMentioned
            ? isNightMode
              ? 'rounded-xl bg-rose-950/80 text-rose-200 border border-rose-500/60 ring-1 ring-rose-500/30 shadow-xs'
              : 'rounded-xl bg-rose-50 text-rose-950 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
            : bubbleStyle === 'transparent'
            ? 'bg-transparent border-0 border-transparent shadow-none px-1 py-0.5'
            : bubbleStyle === 'pill'
            ? isMe
              ? isNightMode
                ? 'rounded-xl sm:rounded-2xl shadow-xs px-3 py-1 sm:px-3.5 sm:py-1.5 bg-[#241a12] text-amber-100 border border-amber-600/50'
                : 'rounded-xl sm:rounded-2xl shadow-2xs px-3 py-1 sm:px-3.5 sm:py-1.5 bg-amber-50/95 text-slate-900 border border-amber-300/80'
              : isNightMode
                ? 'rounded-xl sm:rounded-2xl shadow-xs px-3 py-1 sm:px-3.5 sm:py-1.5 bg-[#161f33] text-slate-100 border border-slate-700/80'
                : 'rounded-xl sm:rounded-2xl shadow-2xs px-3 py-1 sm:px-3.5 sm:py-1.5 bg-white text-slate-900 border border-slate-200/90'
            : bubbleStyle === 'classic'
            ? isMe
              ? isNightMode
                ? 'rounded-xs border-2 border-amber-500/70 shadow-xs font-medium bg-[#241a12] text-amber-100'
                : 'rounded-xs border-2 border-amber-300 shadow-2xs font-medium bg-amber-50/90 text-slate-900'
              : isNightMode
                ? 'rounded-xs border-2 border-slate-700 shadow-xs font-medium bg-[#161f33] text-slate-100'
                : 'rounded-xs border-2 border-slate-300 shadow-2xs font-medium bg-white text-slate-900'
            : bubbleStyle === 'glass'
            ? isMe
              ? isNightMode
                ? 'rounded-xl backdrop-blur-md bg-amber-950/50 border border-amber-500/50 text-amber-100 shadow-xs'
                : 'rounded-xl backdrop-blur-md bg-amber-100/80 border border-amber-300/70 text-slate-900 shadow-xs'
              : isNightMode
                ? 'rounded-xl backdrop-blur-md bg-slate-900/80 border border-slate-700/60 text-slate-100 shadow-xs'
                : 'rounded-xl backdrop-blur-md bg-white/80 border border-white/60 text-slate-900 shadow-xs'
            : bubbleStyle === 'sharp'
            ? isMe
              ? isNightMode
                ? 'rounded-tl-xl rounded-br-xl rounded-tr-xs rounded-bl-xs border-r-3 border-amber-500 bg-[#241a12] text-amber-100 shadow-xs'
                : 'rounded-tl-xl rounded-br-xl rounded-tr-xs rounded-bl-xs border-r-3 border-amber-400 bg-amber-50/90 text-slate-900 shadow-2xs'
              : isNightMode
                ? 'rounded-tl-xl rounded-br-xl rounded-tr-xs rounded-bl-xs border-r-3 border-slate-600 bg-[#161f33] text-slate-100 shadow-xs'
                : 'rounded-tl-xl rounded-br-xl rounded-tr-xs rounded-bl-xs border-r-3 border-slate-400 bg-white text-slate-900 shadow-2xs'
            : bubbleStyle === 'speech'
            ? isMe
              ? isNightMode
                ? 'rounded-xl rounded-tr-xs shadow-xs bg-[#241a12] text-amber-100 border border-amber-600/50'
                : 'rounded-xl rounded-tr-xs shadow-2xs bg-amber-50/90 text-slate-900 border border-amber-200/90'
              : isNightMode
                ? 'rounded-xl rounded-tl-xs shadow-xs bg-[#161f33] text-slate-100 border border-slate-700/80'
                : 'rounded-xl rounded-tl-xs shadow-2xs bg-white text-slate-900 border border-slate-200/90'
            : bubbleStyle === 'neon'
            ? isMe
              ? 'rounded-xl shadow-xs shadow-amber-500/25 border-2 border-amber-500/80 bg-[#241a12] text-amber-100'
              : 'rounded-xl shadow-xs shadow-indigo-500/20 border-2 border-indigo-400/70 bg-[#161f33] text-slate-100'
            : bubbleStyle === 'compact'
            ? isMe
              ? isNightMode
                ? 'rounded-md shadow-xs py-0.5 px-1.5 text-xs border border-amber-600/50 bg-[#241a12] text-amber-100'
                : 'rounded-md shadow-2xs py-0.5 px-1.5 text-xs border border-amber-200 bg-amber-50/90 text-slate-900'
              : isNightMode
                ? 'rounded-md shadow-xs py-0.5 px-1.5 text-xs border border-slate-700 bg-[#161f33] text-slate-100'
                : 'rounded-md shadow-2xs py-0.5 px-1.5 text-xs border border-slate-200 bg-white text-slate-900'
            : bubbleStyle === 'royal-gold'
            ? isMe
              ? 'rounded-xl shadow-xs border-2 border-amber-400 bg-gradient-to-r from-amber-950/80 to-yellow-950/70 text-amber-100 font-medium'
              : 'rounded-xl shadow-xs border-2 border-amber-500/60 bg-gradient-to-r from-slate-900/90 to-amber-950/60 text-amber-100 font-medium'
            : isMe
            ? isNightMode
              ? 'rounded-xl rounded-tr-xs shadow-xs bg-[#241a12] text-amber-100 border border-amber-600/50'
              : 'rounded-xl rounded-tr-xs shadow-2xs bg-amber-50/85 text-slate-900 border border-amber-200/90'
            : isNightMode
              ? 'rounded-xl rounded-tl-xs shadow-xs bg-[#161f33] text-slate-100 border border-slate-700/80'
              : 'rounded-xl rounded-tl-xs shadow-2xs bg-white text-slate-900 border border-slate-200/90'
        }`}>
          {msg.replyTo && (
            <div
              onClick={() => {
                const targetEl = document.getElementById(`msg-${msg.replyTo?.id}`);
                if (targetEl) {
                  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  targetEl.classList.add('ring-2', 'ring-amber-500');
                  setTimeout(() => targetEl.classList.remove('ring-2', 'ring-amber-500'), 2200);
                }
              }}
              className="mb-1 px-2 py-0.5 bg-amber-100/80 border-r-3 border-amber-500 rounded-md text-[10px] cursor-pointer hover:bg-amber-200/70 transition-colors flex flex-col gap-0.5 shadow-2xs"
              title="انقر للذهاب إلى الرسالة الأصلية المردود عليها"
            >
              <div className="font-bold text-amber-900 flex items-center gap-1 text-[10px]">
                <Reply className="w-3 h-3 rotate-180 text-amber-700" />
                <span>رد على:</span>
                {replyBannerUrl ? (
                  <img
                    src={replyBannerUrl}
                    alt={msg.replyTo.username}
                    title={msg.replyTo.username}
                    className="h-4 max-h-[18px] max-w-[120px] object-contain rounded inline-block"
                  />
                ) : (
                  <span>@{msg.replyTo.username}</span>
                )}
              </div>
              <div className="text-slate-600 truncate max-w-full sm:max-w-md text-[10px]">
                {msg.replyTo.text || 'مرفق وسائط / صوت 📎'}
              </div>
            </div>
          )}

          {msg.voiceNote && (
            <div className="my-0.5">
              <VoicePlayer
                audioUrl={msg.voiceNote.audioUrl}
                duration={msg.voiceNote.duration}
                isMe={isMe}
                senderName={msg.username}
              />
            </div>
          )}

          {isEditing ? (
            <div className="my-1.5 p-2 bg-white/95 border border-blue-400 rounded-xl space-y-2 shadow-sm text-right">
              <textarea
                rows={2}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSaveEdit(msg.id, editDraft);
                  } else if (e.key === 'Escape') {
                    onCancelEdit();
                  }
                }}
                className="w-full p-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none font-medium"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onSaveEdit(msg.id, editDraft)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold cursor-pointer shadow-xs"
                >
                  حفظ التعديل
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[10px] font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : msg.isGiftAnnouncement && msg.giftInfo ? (
            <div className="my-1.5 p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 border-2 border-amber-400 shadow-md text-right">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative shrink-0">
                  <img
                    src={msg.giftInfo.giftUrl}
                    alt="هدية"
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md select-none animate-bounce duration-1000"
                  />
                  <span className="absolute -top-1 -right-1 text-xs">✨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-center gap-1.5 flex-wrap">
                    <span>🎁 أهدى [{msg.giftInfo.fromUsername}]</span>
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] sm:text-[11px] font-black shadow-xs">
                      {msg.giftInfo.giftTitle}
                    </span>
                    <span>إلى [{msg.giftInfo.toUsername}] 💎</span>
                  </div>
                  {msg.giftInfo.giftMessage && (
                    <div className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 mt-1 italic font-medium bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg border border-amber-400/30">
                      💌 "{msg.giftInfo.giftMessage}"
                    </div>
                  )}
                  <div className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-1 flex items-center gap-1">
                    <span>✓</span>
                    <span>تم تثبيت الهدية كمرافقة لاسم العضو بجانب صورته الشخصية في كل مكان بالشات ✨</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            msg.text && (
              <div
                style={{
                  color: getAutoContrastMessageTextColor({
                    textColor: msg.textColor,
                    isMe,
                    isNight: isNightMode,
                    bubbleStyle,
                    curTheme,
                    isMentioned,
                    isAlert: isAlertMessage,
                    forceHighContrast: isHighContrastMode
                  })
                }}
                dir="auto"
                className={`${
                  chatFontSize === 'sm' ? 'text-xs' : chatFontSize === 'lg' ? 'text-base' : chatFontSize === 'xl' ? 'text-lg' : 'text-sm'
                } leading-snug font-normal break-words [overflow-wrap:anywhere] whitespace-pre-wrap`}
              >
                {renderedTextNode}
                {msg.isEdited && (
                  <span className="text-[10px] text-slate-400 font-normal mr-1.5 select-none">(معدلة ✏️)</span>
                )}
              </div>
            )
          )}

          {msg.mediaUrl && (
            <div className="mt-1.5">
              {msg.mediaType === 'sticker' ? (
                <span className="text-3xl sm:text-4xl">{msg.mediaUrl}</span>
              ) : msg.mediaType === 'video' || msg.mediaUrl.startsWith('data:video') || msg.mediaUrl.endsWith('.mp4') || msg.mediaUrl.endsWith('.webm') ? (
                <div
                  onClick={() =>
                    onOpenMediaViewer({
                      url: msg.mediaUrl!,
                      type: 'video',
                      title: `فيديو من @${msg.username}`
                    })
                  }
                  className="relative rounded-xl overflow-hidden border border-slate-300 bg-black cursor-pointer group max-h-56 max-w-xs shadow-md"
                  title="انقر لفتح الفيديو في الوسط وتكبيره وتحميله"
                >
                  <video src={msg.mediaUrl} className="max-h-56 w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white font-mono flex items-center gap-1">
                    <Video className="w-3 h-3 text-amber-400" />
                    <span>فيديو (انقر للعرض)</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() =>
                    onOpenMediaViewer({
                      url: msg.mediaUrl!,
                      type: 'image',
                      title: `صورة من @${msg.username}`
                    })
                  }
                  className="relative cursor-pointer group rounded-xl overflow-hidden"
                  title="انقر لفتح الصورة في الوسط وتكبيرها وتحميلها"
                >
                  <img
                    src={msg.mediaUrl}
                    alt="وسائط"
                    loading="lazy"
                    className="max-h-56 max-w-full rounded-xl border border-slate-300 object-cover shadow-sm group-hover:scale-[1.02] transition-transform"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    🔍 تكبير وتحميل
                  </div>
                </div>
              )}
            </div>
          )}

          {msg.reactions && Object.entries(msg.reactions).length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1 border-t border-slate-100/60">
              {Object.entries(msg.reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(msg.id, emoji)}
                  className="px-1.5 py-0.5 rounded-full bg-slate-100/80 hover:bg-amber-100/80 text-[10px] font-bold flex items-center gap-0.5 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  <span>{emoji}</span>
                  <span className="font-mono text-slate-700">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessageRow.displayName = 'ChatMessageRow';
