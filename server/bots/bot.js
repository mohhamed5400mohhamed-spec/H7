// @ts-check
/**
 * Chat Bots Engine (نظام البوتات الاحترافي للشات)
 * - يدير وجود البوتات كأعضاء حقيقيين في قاعدة البيانات وقوائم المتصلين
 * - يدير مؤقت تنقل مستقل لكل بوت (بدون setInterval موحد)
 * - يدير الترحيب بالأعضاء الجدد والردود التلقائية والفهم الذكي وإعادة الدخول بعد الطرد
 */

export const BOT_PERSONALITY_LABELS = {
  friendly: 'ودود',
  formal: 'رسمي',
  funny: 'مرح',
  smart: 'ذكي'
};

export const BOT_STATUS_LABELS = {
  online: 'متصل - أخضر',
  offline: 'غير متصل - رمادي',
  busy: 'مشغول - أصفر',
  hidden: 'مخفي'
};

export const DEFAULT_BOT_AVATARS = [
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ec4899'/%3E%3Cstop offset='100%25' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g1)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Ccircle cx='72' cy='24' r='6' fill='%23fde047'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2306b6d4'/%3E%3Cstop offset='100%25' stop-color='%232563eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g2)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Crect x='36' y='14' width='24' height='6' rx='3' fill='%2338bdf8'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f59e0b'/%3E%3Cstop offset='100%25' stop-color='%23d97706'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g3)'/%3E%3Ccircle cx='48' cy='37' r='15' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-14.5 11.6-24 26-24s26 9.5 26 24' fill='%23fff' opacity='0.92'/%3E%3Cpath d='M35 20l6-6 7 4 7-4 6 6' stroke='%23fef08a' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2310b981'/%3E%3Cstop offset='100%25' stop-color='%23047857'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g4)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Ccircle cx='26' cy='24' r='5' fill='%23a7f3d0'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f43f5e'/%3E%3Cstop offset='100%25' stop-color='%239f1239'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g5)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Cpath d='M48 15c2 3 6 4 6 8a6 6 0 1 1-12 0c0-4 4-5 6-8z' fill='%23fecdd3'/%3E%3C/svg%3E",
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g6' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%23312e81'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='url(%23g6)'/%3E%3Ccircle cx='48' cy='36' r='16' fill='%23fff' opacity='0.95'/%3E%3Cpath d='M22 80c0-15 11.6-25 26-25s26 10 26 25' fill='%23fff' opacity='0.9'/%3E%3Cpolygon points='48,12 51,18 57,19 52,23 53,29 48,26 43,29 44,23 39,19 45,18' fill='%23fde047'/%3E%3C/svg%3E"
];

export const DEFAULT_BOT_SETTINGS = {
  botsEnabled: true,
  autoRoamEnabled: false,
  autoRejoinOnKick: true,
  autoRejoinDelaySeconds: 10,
  autoRepliesEnabled: true,
  welcomeEnabled: true,
  replyDelayEnabled: true,
  replyDelaySeconds: 2
};

export const DEFAULT_BOT_REPLIES = [
  { id: 'br-1', keyword: 'السلام عليكم', reply: 'وعليكم السلام ورحمة الله، نورتنا يا {اسم العضو} 🌹' },
  { id: 'br-2', keyword: 'سلام', reply: 'هلا والله، نورت الشات كله ❤️' },
  { id: 'br-3', keyword: 'هلا', reply: 'هلا والله، نورتنا' },
  { id: 'br-4', keyword: 'صباح الخير', reply: 'صباح النور والسرور، يومك جميل إن شاء الله ☀️' },
  { id: 'br-5', keyword: 'مساء الخير', reply: 'مساء النور، نورتنا والله 🌙' },
  { id: 'br-6', keyword: 'كيفك', reply: 'الحمدلله بخير، وانت كيفك؟ طمنا عليك' },
  { id: 'br-7', keyword: 'منور', reply: 'النور نورك يا غالي' },
  { id: 'br-8', keyword: 'باي', reply: 'الله يحفظك، لا تطول علينا 🙏' },
  { id: 'br-9', keyword: 'شكرا', reply: 'العفو، هذا واجبنا' },
  { id: 'br-10', keyword: 'وينك', reply: 'موجودين، بس انت اللي غايب عنا، وينك مختفي؟' },
  { id: 'br-11', keyword: 'احبك', reply: 'واحنا نحبك أكثر والله ❤️' },
  { id: 'br-12', keyword: 'كم الساعة', reply: 'الساعة الآن هي {الوقت الحقيقي}' },
  { id: 'br-13', keyword: 'من انت', reply: 'أنا بوت شات حسن برو، هنا أساعدكم وأسليكم' },
  { id: 'br-14', keyword: 'نكته', reply: 'مرة واحد دخل الشات قال السلام عليكم، قالوا وعليكم السلام، قال طيب دام سلمتوا خلاص بروح 😂' },
  { id: 'br-15', keyword: 'زعلان', reply: 'لا تزعل، الدنيا ما تسوى، احنا كلنا معك، وش فيك؟' },
  { id: 'br-16', keyword: 'بوت', reply: 'نعم معك، تفضل وش تريد؟' },
  { id: 'br-17', keyword: 'ايش اخبارك', reply: 'الحمدلله تمام، وانت ايش اخبارك؟ فينك مختفي؟' },
  { id: 'br-18', keyword: 'ارحب', reply: 'ارحب ارحب، نورتنا والله، حياك' },
  { id: 'br-19', keyword: 'حياك', reply: 'الله يحييك، نورت المكان كله' }
];

/**
 * Normalizes Arabic text for accurate keyword comparison without altering display text.
 * @param {string} input
 * @returns {string}
 */
export function normalizeArabicForMatch(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip Arabic diacritics/tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

/**
 * Checks whether a normalized keyword appears as a full message or whole-word token sequence.
 * @param {string} normalizedMsg
 * @param {string} normalizedKeyword
 * @returns {boolean}
 */
function matchesWholeKeyword(normalizedMsg, normalizedKeyword) {
  if (!normalizedMsg || !normalizedKeyword) return false;
  if (normalizedMsg === normalizedKeyword) return true;
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const boundary = '(?:^|[\\s،,.:;!؟?\\-_"\\\'`()\\[\\]{}«»])';
  const endBoundary = '(?:$|[\\s،,.:;!؟?\\-_"\\\'`()\\[\\]{}«»])';
  const regex = new RegExp(`${boundary}${escaped}${endBoundary}`, 'i');
  return regex.test(normalizedMsg);
}

/**
 * Finds the best matching reply rule from botReplies (longest keyword wins first).
 * @param {string} text
 * @param {Array<{ id?: string, keyword: string, reply: string }>} repliesList
 */
export function findMatchingBotReply(text, repliesList) {
  const normMsg = normalizeArabicForMatch(text);
  if (!normMsg || !Array.isArray(repliesList) || repliesList.length === 0) {
    return null;
  }

  const sorted = [...repliesList]
    .filter((r) => r && r.keyword && r.reply)
    .sort((a, b) => normalizeArabicForMatch(b.keyword).length - normalizeArabicForMatch(a.keyword).length);

  for (const item of sorted) {
    const normKw = normalizeArabicForMatch(item.keyword);
    if (!normKw) continue;
    if (matchesWholeKeyword(normMsg, normKw)) {
      return item;
    }
  }
  return null;
}

/**
 * Resolves smart replies including {اسم العضو}, {الوقت الحقيقي}, "من انت", and direct bot-name mention.
 * Returns null if nothing matches (so the bot stays silent).
 * @param {{ text: string, senderUsername: string, bot: any, activeBotsInRoom?: any[], repliesList: any[] }} params
 */
export function resolveSmartBotReply({ text, senderUsername, bot, activeBotsInRoom = [], repliesList }) {
  if (!text || !senderUsername || !bot) return null;

  const normMsg = normalizeArabicForMatch(text);
  const candidates = activeBotsInRoom.length > 0 ? activeBotsInRoom : [bot];

  // Check if message mentions any active bot in room by name
  const mentionedBot = candidates.find((candidate) => {
    const normBotName = normalizeArabicForMatch(candidate.name || '');
    return normBotName && matchesWholeKeyword(normMsg, normBotName);
  });

  const actingBot = mentionedBot || bot;
  const matchedRule = findMatchingBotReply(text, repliesList);

  if (matchedRule) {
    const normKw = normalizeArabicForMatch(matchedRule.keyword);
    let replyText = String(matchedRule.reply || '');
    const liveTimeStr = formatLiveTimeString();
    const personalityMap = /** @type {Record<string, string>} */ (BOT_PERSONALITY_LABELS);
    const personalityLabel =
      personalityMap[String(actingBot.personality || '')] || actingBot.personality || 'ودود';

    if (normKw === normalizeArabicForMatch('من انت')) {
      if (replyText === 'أنا بوت شات حسن برو، هنا أساعدكم وأسليكم') {
        replyText = `أنا ${actingBot.name} (شخصيتي: ${personalityLabel})، عضو في شات حسن برو هنا أساعدكم وأسليكم 🌹`;
      } else {
        replyText = replyText
          .replace(/\{اسم البوت\}/g, actingBot.name)
          .replace(/\{الشخصية\}/g, personalityLabel);
        if (!replyText.includes(actingBot.name)) {
          replyText = `أنا ${actingBot.name} (${personalityLabel}) — ${replyText}`;
        }
      }
    }

    replyText = replyText
      .replace(/\{اسم العضو\}/g, senderUsername)
      .replace(/\{الوقت الحقيقي\}/g, liveTimeStr)
      .replace(/\{اسم البوت\}/g, actingBot.name)
      .replace(/\{الشخصية\}/g, personalityLabel);

    return {
      bot: actingBot,
      cooldownKey: `kw:${normKw}`,
      text: replyText
    };
  }

  // Direct mention of bot's name even if word is not in botReplies table
  if (mentionedBot) {
    return {
      bot: mentionedBot,
      cooldownKey: `mention:${mentionedBot.id}`,
      text: `هلا فيك يا ${senderUsername}، أنا هنا`
    };
  }

  return null;
}

/**
 * Formats live local clock time for {الوقت الحقيقي}.
 */
export function formatLiveTimeString() {
  try {
    return new Date().toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return new Date().toLocaleTimeString();
  }
}

/**
 * Maps bot status ('online' | 'offline' | 'busy' | 'hidden') to ConnectedUser presence fields.
 * @param {string} status
 * @returns {{ presenceState: 'online' | 'away' | 'offline', isGhost: boolean }}
 */
export function mapBotStatusToPresence(status) {
  switch (status) {
    case 'offline':
      return { presenceState: 'offline', isGhost: false };
    case 'busy':
      return { presenceState: 'away', isGhost: false };
    case 'hidden':
      return { presenceState: 'online', isGhost: true };
    case 'online':
    default:
      return { presenceState: 'online', isGhost: false };
  }
}

export class BotEngine {
  constructor() {
    /** @type {any} */
    this.ctx = null;
    /** @type {Array<any>} */
    this.bots = [];
    /** @type {typeof DEFAULT_BOT_SETTINGS} */
    this.settings = { ...DEFAULT_BOT_SETTINGS };
    /** @type {Array<{ id: string, keyword: string, reply: string }>} */
    this.replies = [];

    /** @type {Map<string, ReturnType<typeof setTimeout>>} */
    this.roamTimers = new Map();
    /** @type {Map<string, ReturnType<typeof setTimeout>>} */
    this.rejoinTimers = new Map();
    /** @type {Set<string>} */
    this.kickedBotIds = new Set();
    /** @type {Map<string, number>} */
    this.roomLastBotArrival = new Map();
    /** @type {Map<string, number>} */
    this.welcomeCooldowns = new Map();
    /** @type {Map<string, number>} */
    this.replyCooldowns = new Map();
    /** @type {Set<ReturnType<typeof setTimeout>>} */
    this.pendingTimers = new Set();
  }

  /**
   * Connects BotEngine to the main server runtime context and boots persisted bots.
   * @param {any} hostContext
   */
  init(hostContext) {
    this.ctx = hostContext;
    this.loadFromStorage(false);
  }

  /**
   * Loads bots, global settings, and botReplies from MongoDB / LocalJson via dataManager.
   * Seeds the 19 default botReplies on first boot if empty/unset.
   * @param {boolean} isRehydration
   */
  loadFromStorage(isRehydration = false) {
    if (!this.ctx) return;
    const { dataManager } = this.ctx;

    try {
      const loadedSettings = dataManager.loadSync('bot_settings', null);
      if (loadedSettings && typeof loadedSettings === 'object') {
        this.settings = { ...DEFAULT_BOT_SETTINGS, ...loadedSettings };
      } else {
        this.settings = { ...DEFAULT_BOT_SETTINGS };
        dataManager.save('bot_settings', this.settings);
      }

      const loadedReplies = dataManager.loadSync('botReplies', null);
      if (Array.isArray(loadedReplies) && loadedReplies.length > 0) {
        this.replies = loadedReplies.map((r, idx) => ({
          id: String(r.id || `br-${idx}-${Date.now()}`),
          keyword: String(r.keyword || '').trim(),
          reply: String(r.reply || '').trim()
        })).filter((r) => r.keyword && r.reply);
      } else {
        this.replies = DEFAULT_BOT_REPLIES.map((r) => ({ ...r }));
        dataManager.save('botReplies', this.replies);
      }

      const loadedBots = dataManager.loadSync('bots', null);
      if (Array.isArray(loadedBots)) {
        this.bots = loadedBots.map((b) => this.normalizeBotRecord(b));
      } else {
        this.bots = [];
        dataManager.save('bots', this.bots);
      }

      // Ensure every persisted bot exists as a real 'member' in registeredMembers
      for (const bot of this.bots) {
        this.syncBotIntoRegisteredMembers(bot);
      }

      this.reconcileAllBots(isRehydration);
    } catch (err) {
      console.error('[BotEngine] Failed loading bots from storage:', err);
    }
  }

  /** @param {any} raw */
  normalizeBotRecord(raw) {
    const validStatuses = ['online', 'offline', 'busy', 'hidden'];
    const validPersonalities = ['friendly', 'formal', 'funny', 'smart'];
    const fallbackRoom =
      this.ctx?.chatRooms?.[0]?.id || 'الغرفة العامة';

    const defaultRoom = String(raw?.defaultRoom || fallbackRoom).trim() || fallbackRoom;
    const currentRoom = String(raw?.currentRoom || defaultRoom).trim() || defaultRoom;

    return {
      id: String(raw?.id || `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
      name: String(raw?.name || 'بوت').trim(),
      avatarUrl: String(raw?.avatarUrl || DEFAULT_BOT_AVATARS[0]),
      status: validStatuses.includes(raw?.status) ? raw.status : 'online',
      statusQuote: String(raw?.statusQuote || 'عضو في شات حسان برو').trim(),
      defaultRoom,
      currentRoom,
      personality: validPersonalities.includes(raw?.personality) ? raw.personality : 'friendly',
      notes: String(raw?.notes || '').trim(),
      flag: String(raw?.flag || '🇸🇦'),
      enabled: raw?.enabled !== false,
      roamMode: raw?.roamMode === 'selected' ? 'selected' : 'random',
      roamRooms: Array.isArray(raw?.roamRooms) ? raw.roamRooms.map(String) : [],
      roamIntervalMinutes: Math.max(0.1, Number(raw?.roamIntervalMinutes) || 5),
      createdAt: Number(raw?.createdAt) || Date.now(),
      updatedAt: Number(raw?.updatedAt) || Date.now()
    };
  }

  /** @param {string} botId */
  getBotUserId(botId) {
    return `bot_${botId}`;
  }

  /**
   * Checks whether a ConnectedUser or username belongs to an active/stored bot.
   * @param {any} userOrName
   * @returns {boolean}
   */
  isBotUser(userOrName) {
    if (!userOrName) return false;
    if (typeof userOrName === 'object') {
      if (userOrName.isBot) return true;
      if (typeof userOrName.id === 'string' && userOrName.id.startsWith('bot_')) return true;
      return Boolean(this.findBotByUsername(userOrName.username));
    }
    if (typeof userOrName === 'string') {
      return Boolean(this.findBotByUsername(userOrName));
    }
    return false;
  }

  /** @param {string} botId */
  findBotById(botId) {
    return this.bots.find((b) => b.id === botId) || null;
  }

  /** @param {string} username */
  findBotByUsername(username) {
    if (!username || typeof username !== 'string') return null;
    const lower = username.trim().toLowerCase();
    return this.bots.find((b) => b.name.trim().toLowerCase() === lower) || null;
  }

  /**
   * Registers/updates the bot as a standard registered member (`role: 'member'`, never guest/system).
   * @param {any} bot
   * @param {string} [previousName]
   */
  syncBotIntoRegisteredMembers(bot, previousName) {
    if (!this.ctx) return;
    const { registeredMembers, saveMembers } = this.ctx;

    if (previousName && previousName.trim().toLowerCase() !== bot.name.trim().toLowerCase()) {
      for (const k of Object.keys(registeredMembers)) {
        if (k.toLowerCase() === previousName.trim().toLowerCase() && registeredMembers[k]?.isBot) {
          delete registeredMembers[k];
        }
      }
    }

    const existingKey = Object.keys(registeredMembers).find(
      (k) => k.toLowerCase() === bot.name.trim().toLowerCase()
    );
    const prevRecord = existingKey ? registeredMembers[existingKey] : null;
    if (existingKey && existingKey !== bot.name) {
      delete registeredMembers[existingKey];
    }

    registeredMembers[bot.name] = {
      ...(prevRecord || {}),
      password: prevRecord?.password || 'BOT_PROTECTED_ACCOUNT',
      role: 'member',
      flag: bot.flag || prevRecord?.flag || '🇸🇦',
      statusQuote: bot.statusQuote || 'عضو في شات حسان برو',
      avatarUrl: bot.avatarUrl || DEFAULT_BOT_AVATARS[0],
      likes: typeof prevRecord?.likes === 'number' ? prevRecord.likes : 150,
      points: typeof prevRecord?.points === 'number' ? prevRecord.points : 1000,
      isBot: true,
      botId: bot.id,
      lastSeen: Date.now()
    };

    saveMembers();
  }

  /** @param {string} botName */
  removeBotFromRegisteredMembers(botName) {
    if (!this.ctx || !botName) return;
    const { registeredMembers, saveMembers } = this.ctx;
    let deleted = false;
    for (const k of Object.keys(registeredMembers)) {
      if (k.toLowerCase() === botName.trim().toLowerCase() && registeredMembers[k]?.isBot) {
        delete registeredMembers[k];
        deleted = true;
      }
    }
    if (deleted) saveMembers();
  }

  /**
   * Builds a genuine ConnectedUser record for a running bot.
   * @param {any} bot
   */
  buildConnectedBotUser(bot) {
    const { presenceState, isGhost } = mapBotStatusToPresence(bot.status);
    const regMember = this.ctx?.registeredMembers?.[bot.name];

    return {
      id: this.getBotUserId(bot.id),
      username: bot.name,
      room: bot.currentRoom || bot.defaultRoom || 'الغرفة العامة',
      avatarSeed: bot.name,
      avatarUrl: bot.avatarUrl || DEFAULT_BOT_AVATARS[0],
      statusQuote: bot.statusQuote || 'عضو في شات حسان برو',
      flag: bot.flag || '🇸🇦',
      role: 'member', // Strict requirement: NEVER 'guest' or 'system'
      likes: typeof regMember?.likes === 'number' ? regMember.likes : 150,
      points: typeof regMember?.points === 'number' ? regMember.points : 1000,
      isVoice: false,
      micSlot: null,
      isMuted: false,
      isTextMuted: false,
      isSpeaking: false,
      presenceState,
      isGhost,
      isBot: true,
      botId: bot.id,
      joinedAt: bot.createdAt || Date.now(),
      lastActiveTime: Date.now()
    };
  }

  /**
   * Synchronizes all bots into the live `users` array and refreshes per-bot timers.
   * @param {boolean} [broadcastImmediately]
   */
  reconcileAllBots(broadcastImmediately = true) {
    if (!this.ctx) return;
    const { users, chatRooms, broadcastRoomUsers, broadcastAllUsers, broadcastRoomsUpdate } = this.ctx;
    const touchedRooms = new Set();

    // Remove stale bot entries that no longer exist or are disabled/kicked
    for (let i = users.length - 1; i >= 0; i--) {
      const u = users[i];
      if (!u?.isBot) continue;
      const bot = this.findBotById(u.botId) || this.findBotByUsername(u.username);
      const shouldBeLive =
        Boolean(bot) &&
        this.settings.botsEnabled &&
        Boolean(bot.enabled) &&
        !this.kickedBotIds.has(bot.id);

      if (!shouldBeLive) {
        if (u.room) touchedRooms.add(u.room);
        users.splice(i, 1);
      }
    }

    // Add or update every active enabled bot in `users`
    for (const bot of this.bots) {
      const shouldBeLive =
        this.settings.botsEnabled &&
        Boolean(bot.enabled) &&
        !this.kickedBotIds.has(bot.id);

      if (!shouldBeLive) {
        this.clearBotRoamTimer(bot.id);
        if (!bot.enabled || !this.settings.botsEnabled) {
          this.clearBotRejoinTimer(bot.id);
        }
        continue;
      }

      // Verify bot's room exists, otherwise fall back to defaultRoom or first room
      const roomExists = chatRooms.some((/** @type {any} */ r) => r.id === bot.currentRoom);
      if (!roomExists) {
        const defExists = chatRooms.some((/** @type {any} */ r) => r.id === bot.defaultRoom);
        bot.currentRoom = defExists ? bot.defaultRoom : (chatRooms[0]?.id || 'الغرفة العامة');
      }

      const botUserId = this.getBotUserId(bot.id);
      const existingIdx = users.findIndex((/** @type {any} */ u) => u.id === botUserId || (u.isBot && u.botId === bot.id));
      const freshUser = this.buildConnectedBotUser(bot);

      if (existingIdx !== -1) {
        const prevRoom = users[existingIdx].room;
        if (prevRoom && prevRoom !== freshUser.room) {
          touchedRooms.add(prevRoom);
        }
        users[existingIdx] = freshUser;
      } else {
        users.push(freshUser);
      }

      touchedRooms.add(freshUser.room);
      this.scheduleBotRoam(bot);
    }

    if (broadcastImmediately) {
      for (const room of touchedRooms) {
        broadcastRoomUsers(room);
      }
      broadcastAllUsers(true);
      broadcastRoomsUpdate();
    }
  }

  /** @param {string} botId */
  clearBotRoamTimer(botId) {
    const existing = this.roamTimers.get(botId);
    if (existing) {
      clearTimeout(existing);
      this.roamTimers.delete(botId);
    }
  }

  /** @param {string} botId */
  clearBotRejoinTimer(botId) {
    const existing = this.rejoinTimers.get(botId);
    if (existing) {
      clearTimeout(existing);
      this.rejoinTimers.delete(botId);
    }
  }

  /**
   * Schedules an independent per-bot roaming timer (never a single global interval).
   * @param {any} bot
   */
  scheduleBotRoam(bot) {
    this.clearBotRoamTimer(bot.id);

    if (!this.settings.botsEnabled || !this.settings.autoRoamEnabled || !bot.enabled) {
      return;
    }

    const minutes = Math.max(0.1, Number(bot.roamIntervalMinutes) || 5);
    const delayMs = Math.round(minutes * 60 * 1000);

    const timer = setTimeout(() => {
      this.roamTimers.delete(bot.id);
      this.executeBotRoam(bot.id);
    }, delayMs);

    if (typeof timer.unref === 'function') timer.unref();
    this.roamTimers.set(bot.id, timer);
  }

  /**
   * Executes room roaming for a single bot honoring:
   * 1. random vs selected rooms mode
   * 2. destination room must have at least 1 other user
   * 3. max 1 bot entry per room per minute
   * 4. sends greeting "أهلاً، وصلت، منورين 🌹" if autoRepliesEnabled
   * @param {string} botId
   */
  executeBotRoam(botId) {
    const bot = this.findBotById(botId);
    if (!bot || !bot.enabled || !this.settings.botsEnabled) return;
    if (!this.settings.autoRoamEnabled) return;
    if (this.kickedBotIds.has(bot.id)) return;

    const { users, chatRooms, io, broadcastRoomUsers, broadcastAllUsers, broadcastRoomsUpdate } = this.ctx;
    const now = Date.now();
    const botUserId = this.getBotUserId(bot.id);

    // Determine allowed destination rooms
    let allowedRoomIds = chatRooms
      .map((/** @type {any} */ r) => r.id)
      .filter((/** @type {string} */ id) => id && id !== bot.currentRoom && id !== 'سجن حسان برو');

    if (bot.roamMode === 'selected' && Array.isArray(bot.roamRooms) && bot.roamRooms.length > 0) {
      const selectedSet = new Set(bot.roamRooms);
      allowedRoomIds = allowedRoomIds.filter((/** @type {string} */ id) => selectedSet.has(id));
    }

    // Rule: room must have >= 1 other member AND no other bot moved there in last 60s
    const eligibleRooms = allowedRoomIds.filter((/** @type {string} */ roomId) => {
      const othersInRoom = users.filter((/** @type {any} */ u) => u.room === roomId && u.id !== botUserId && u.presenceState !== 'offline');
      if (othersInRoom.length < 1) return false;
      const lastArrival = this.roomLastBotArrival.get(roomId) || 0;
      if (now - lastArrival < 60_000) return false;
      return true;
    });

    if (eligibleRooms.length > 0) {
      const nextRoom = eligibleRooms[Math.floor(Math.random() * eligibleRooms.length)];
      const oldRoom = bot.currentRoom;

      bot.currentRoom = nextRoom;
      bot.updatedAt = now;
      this.roomLastBotArrival.set(nextRoom, now);
      this.persistBots();

      const liveUser = users.find((/** @type {any} */ u) => u.id === botUserId);
      if (liveUser) {
        liveUser.room = nextRoom;
        liveUser.lastActiveTime = now;
      }

      if (oldRoom) broadcastRoomUsers(oldRoom);
      broadcastRoomUsers(nextRoom);
      broadcastAllUsers(true);
      broadcastRoomsUpdate();
      io.emit('botsPresenceChanged', { botId: bot.id, room: nextRoom, oldRoom });

      // Send entry greeting in the new room if auto-replies are enabled
      if (this.settings.autoRepliesEnabled) {
        this.emitBotMessage(bot, nextRoom, 'أهلاً، وصلت، منورين 🌹');
      }
    }

    // Schedule next independent cycle for this bot
    this.scheduleBotRoam(bot);
  }

  /**
   * Emits a genuine member chat message from the bot into a room & stores it in chatHistory.
   * @param {any} bot
   * @param {string} room
   * @param {string} text
   */
  emitBotMessage(bot, room, text) {
    if (!this.ctx || !bot || !room || !text) return;
    const {
      io,
      chatHistory,
      pruneRoomChatHistory,
      saveHistory,
      getCurrentTimeString,
      registeredMembers
    } = this.ctx;

    const reg = registeredMembers[bot.name];
    const msg = {
      id: `bot-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      room,
      username: bot.name,
      avatarUrl: bot.avatarUrl || DEFAULT_BOT_AVATARS[0],
      nameBannerUrl: reg?.nameBannerUrl,
      flag: bot.flag || '🇸🇦',
      // Do NOT set badge to 'نظام' or 'ضيف' — appears as a normal member
      text,
      time: getCurrentTimeString(),
      timestamp: Date.now(),
      reactions: {},
      nameColor: reg?.nameColor,
      textColor: reg?.textColor,
      nameGradient: reg?.nameGradient,
      giftBadges: reg?.giftBadges
    };

    chatHistory.push(msg);
    pruneRoomChatHistory(room);
    saveHistory();
    io.to(room).emit('message', msg);
  }

  /**
   * Handles welcoming a human user who just joined a room (after 3s delay, 5-min per-user cooldown).
   * @param {{ username: string, room: string, isBot?: boolean, isGhost?: boolean }} params
   */
  handleUserEnteredRoom({ username, room, isBot, isGhost }) {
    if (!this.ctx || !username || !room || isBot || isGhost) return;
    if (this.isBotUser(username)) return;
    if (!this.settings.botsEnabled || !this.settings.welcomeEnabled) return;

    const activeBotsInRoom = this.bots.filter(
      (b) => b.enabled && b.currentRoom === room && b.status !== 'offline' && !this.kickedBotIds.has(b.id)
    );
    if (activeBotsInRoom.length === 0) return;

    const bot = activeBotsInRoom[0];
    const cooldownKey = `${bot.id}::${username.trim().toLowerCase()}`;
    const lastWelcomed = this.welcomeCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    if (now - lastWelcomed < 5 * 60 * 1000) {
      return;
    }
    this.welcomeCooldowns.set(cooldownKey, now);

    const roomObj = this.ctx.chatRooms.find((/** @type {any} */ r) => r.id === room);
    const roomTitle = roomObj?.name || room;
    const welcomeText = `نورت يا ${username} 🌹 أهلاً فيك في ${roomTitle}`;

    const timer = setTimeout(() => {
      this.pendingTimers.delete(timer);
      const freshBot = this.findBotById(bot.id);
      if (!freshBot || !freshBot.enabled || !this.settings.botsEnabled || !this.settings.welcomeEnabled) {
        return;
      }
      if (freshBot.currentRoom !== room || this.kickedBotIds.has(freshBot.id)) {
        return;
      }
      this.emitBotMessage(freshBot, room, welcomeText);
    }, 3000);

    if (typeof timer.unref === 'function') timer.unref();
    this.pendingTimers.add(timer);
  }

  /**
   * Handles incoming room chat messages for keyword auto-replies and smart bot understanding.
   * @param {{ senderUser: any, text: string, room: string }} params
   */
  handleRoomChatMessage({ senderUser, text, room }) {
    if (!this.ctx || !senderUser || !text || !room) return;
    if (this.isBotUser(senderUser)) return;
    if (!this.settings.botsEnabled || !this.settings.autoRepliesEnabled) return;

    const activeBotsInRoom = this.bots.filter(
      (b) => b.enabled && b.currentRoom === room && b.status !== 'offline' && !this.kickedBotIds.has(b.id)
    );
    if (activeBotsInRoom.length === 0) return;

    const primaryBot = activeBotsInRoom[0];
    const resolution = resolveSmartBotReply({
      text,
      senderUsername: senderUser.username,
      bot: primaryBot,
      activeBotsInRoom,
      repliesList: this.replies
    });

    if (!resolution) return; // Stay silent on unknown words

    const now = Date.now();
    const cooldownKey = `${senderUser.username.trim().toLowerCase()}::${resolution.cooldownKey}`;
    const lastReplyAt = this.replyCooldowns.get(cooldownKey) || 0;
    if (now - lastReplyAt < 60_000) {
      return; // Do not reply to same user with same keyword within 1 minute
    }
    this.replyCooldowns.set(cooldownKey, now);

    const delayMs = this.settings.replyDelayEnabled
      ? Math.max(0, Number(this.settings.replyDelaySeconds ?? 2)) * 1000
      : 0;

    const targetBot = resolution.bot;
    const replyText = resolution.text;

    if (delayMs > 0) {
      // Show subtle typing indicator during delay
      this.ctx.io.to(room).emit('userTyping', {
        userId: this.getBotUserId(targetBot.id),
        username: targetBot.name,
        avatarUrl: targetBot.avatarUrl,
        flag: targetBot.flag || '🇸🇦',
        role: 'member',
        room,
        isTyping: true,
        timestamp: Date.now()
      });
    }

    const timer = setTimeout(() => {
      this.pendingTimers.delete(timer);
      const freshBot = this.findBotById(targetBot.id);
      if (!freshBot || !freshBot.enabled || !this.settings.botsEnabled || !this.settings.autoRepliesEnabled) {
        this.ctx.io.to(room).emit('userTyping', {
          userId: this.getBotUserId(targetBot.id),
          username: targetBot.name,
          room,
          isTyping: false,
          timestamp: Date.now()
        });
        return;
      }
      if (freshBot.currentRoom !== room || this.kickedBotIds.has(freshBot.id)) {
        return;
      }
      this.ctx.io.to(room).emit('userTyping', {
        userId: this.getBotUserId(freshBot.id),
        username: freshBot.name,
        room,
        isTyping: false,
        timestamp: Date.now()
      });
      this.emitBotMessage(freshBot, room, replyText);
    }, delayMs);

    if (typeof timer.unref === 'function') timer.unref();
    this.pendingTimers.add(timer);
  }

  /**
   * Handles kicking a bot from a room/chat. Automatically rejoins the kicked room after delay if enabled.
   * If bot is disabled from control panel before timer fires, it stays offline.
   * @param {any} targetUser
   * @param {string} kickedFromRoom
   * @param {string} actorUsername
   */
  handleBotKicked(targetUser, kickedFromRoom, actorUsername) {
    if (!this.ctx || !targetUser) return;
    const bot =
      this.findBotById(targetUser.botId) ||
      this.findBotByUsername(targetUser.username);
    if (!bot) return;

    const { users, io, broadcastRoomUsers, broadcastAllUsers, broadcastRoomsUpdate, logMonitorEvent } = this.ctx;
    const returnRoom = kickedFromRoom || bot.currentRoom || bot.defaultRoom || 'الغرفة العامة';

    this.kickedBotIds.add(bot.id);
    this.clearBotRoamTimer(bot.id);
    this.clearBotRejoinTimer(bot.id);

    const idx = users.findIndex((/** @type {any} */ u) => u.id === this.getBotUserId(bot.id) || (u.isBot && u.botId === bot.id));
    if (idx !== -1) {
      users.splice(idx, 1);
    }

    broadcastRoomUsers(returnRoom);
    broadcastAllUsers(true);
    broadcastRoomsUpdate();
    logMonitorEvent?.('kick', `طرد البوت ${bot.name} من [${returnRoom}] بواسطة ${actorUsername}`, actorUsername, bot.name);

    if (!this.settings.botsEnabled || !this.settings.autoRejoinOnKick || !bot.enabled) {
      return;
    }

    const delayMs = Math.max(1, Number(this.settings.autoRejoinDelaySeconds ?? 10)) * 1000;
    const timer = setTimeout(() => {
      this.rejoinTimers.delete(bot.id);
      this.kickedBotIds.delete(bot.id);

      const freshBot = this.findBotById(bot.id);
      if (!freshBot || !freshBot.enabled || !this.settings.botsEnabled || !this.settings.autoRejoinOnKick) {
        return;
      }

      freshBot.currentRoom = returnRoom;
      freshBot.updatedAt = Date.now();
      this.persistBots();
      this.reconcileAllBots(true);

      io.to(returnRoom).emit('message', {
        id: `bot-rejoin-${Date.now()}`,
        room: returnRoom,
        username: freshBot.name,
        avatarUrl: freshBot.avatarUrl || DEFAULT_BOT_AVATARS[0],
        flag: freshBot.flag || '🇸🇦',
        text: `دخل ${freshBot.name} إلى ${returnRoom} أهلاً وسهلاً 🦅`,
        time: this.ctx.getCurrentTimeString(),
        timestamp: Date.now()
      });
    }, delayMs);

    if (typeof timer.unref === 'function') timer.unref();
    this.rejoinTimers.set(bot.id, timer);
  }

  persistBots() {
    this.ctx?.dataManager?.save('bots', this.bots);
  }

  persistSettings() {
    this.ctx?.dataManager?.save('bot_settings', this.settings);
  }

  persistReplies() {
    this.ctx?.dataManager?.save('botReplies', this.replies);
  }

  getPublicAdminState() {
    return {
      bots: this.bots,
      settings: this.settings,
      replies: this.replies,
      presetAvatars: DEFAULT_BOT_AVATARS
    };
  }
}

export const botEngine = new BotEngine();
