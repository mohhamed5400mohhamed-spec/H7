import React from 'react';
import { Search, X, AtSign, Image as ImageIcon, Mic, MessageSquare } from 'lucide-react';

export type ChatFilterType = 'all' | 'mentions' | 'media' | 'voice';

interface ChatFilterSearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  filterType: ChatFilterType;
  onFilterTypeChange: (type: ChatFilterType) => void;
  matchedCount: number;
  totalCount: number;
  onClose: () => void;
  isLightTheme?: boolean;
}

const FILTER_OPTIONS: Array<{ id: ChatFilterType; label: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'all', label: 'الكل', Icon: MessageSquare },
  { id: 'mentions', label: '@ إشاراتي', Icon: AtSign },
  { id: 'media', label: 'صور وفيديو', Icon: ImageIcon },
  { id: 'voice', label: 'صوتيات', Icon: Mic }
];

export const ChatFilterSearchBar: React.FC<ChatFilterSearchBarProps> = ({
  searchQuery,
  onSearchQueryChange,
  filterType,
  onFilterTypeChange,
  matchedCount,
  totalCount,
  onClose,
  isLightTheme = false
}) => {
  const hasActiveFilter = filterType !== 'all' || searchQuery.trim().length > 0;

  return (
    <div
      dir="rtl"
      className={`shrink-0 px-2.5 py-1.5 border-b flex flex-wrap items-center gap-1.5 transition-all ${
        isLightTheme
          ? 'bg-slate-100/95 border-slate-300 text-slate-800'
          : 'bg-slate-900/95 border-amber-500/20 text-slate-100'
      }`}
    >
      <div className="relative flex-1 min-w-[150px]">
        <Search className="w-3.5 h-3.5 opacity-60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="ابحث داخل رسائل الغرفة..."
          className={`w-full pr-8 pl-7 py-1 rounded-lg text-[11px] font-medium border focus:outline-none ${
            isLightTheme
              ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
              : 'bg-black/40 border-white/15 text-white placeholder:text-slate-400 focus:border-amber-400'
          }`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchQueryChange('')}
            title="مسح البحث"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/15 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {FILTER_OPTIONS.map(({ id, label, Icon }) => {
          const active = filterType === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilterTypeChange(id)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                active
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : isLightTheme
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 mr-auto">
        {hasActiveFilter && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {matchedCount} / {totalCount}
          </span>
        )}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              onSearchQueryChange('');
              onFilterTypeChange('all');
            }}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 cursor-pointer"
          >
            إلغاء الفلتر
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          title="إغلاق شريط البحث والفلترة"
          className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
