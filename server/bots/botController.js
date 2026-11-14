// @ts-check
/**
 * Bot Controller (وحدة تحكم البوتات للإدارة - للأدمن فقط)
 * تدير عمليات الإنشاء والتعديل والحذف والتشغيل/الإيقاف وحفظ إعدادات البوتات والكلمات في MongoDB
 * مع بث فوري عبر Socket.IO لكل المتصلين دون إعادة تحميل الصفحة.
 */

import { botEngine, DEFAULT_BOT_AVATARS } from './bot.js';

/**
 * Checks whether the acting user is strictly an Admin ('hassan', 'admin', or role level >= 100).
 * @param {any} user
 * @param {any} hostContext
 * @returns {boolean}
 */
export function isAdminForBots(user, hostContext) {
  if (!user) return false;
  if (hostContext.isSupremeHassan?.(user)) return true;
  if (user.role === 'admin' || user.role === 'hassan') return true;
  const lvl = hostContext.getRoleLevel?.(user.role) || 0;
  return lvl >= 100;
}

/**
 * Broadcasts the full bots state to all currently connected Admin sockets.
 * @param {any} hostContext
 */
export function broadcastBotsStateToAdmins(hostContext) {
  const { io, users } = hostContext;
  const payload = botEngine.getPublicAdminState();
  for (const u of users) {
    if (u.isBot) continue;
    if (isAdminForBots(u, hostContext)) {
      io.to(u.id).emit('botsStateUpdated', payload);
    }
  }
}

/**
 * Attaches all Bot Admin Socket.IO listeners for a connected socket.
 * @param {any} socket
 * @param {any} hostContext
 */
export function registerBotSocketHandlers(socket, hostContext) {
  const getActingAdmin = () => {
    const actor = hostContext.users.find((/** @type {any} */ u) => u.id === socket.id);
    if (!actor || !isAdminForBots(actor, hostContext)) {
      socket.emit('systemAlert', '🚫 صلاحية إدارة البوتات محصورة بالأدمن فقط.');
      return null;
    }
    return actor;
  };

  socket.on('getBotsState', () => {
    const admin = getActingAdmin();
    if (!admin) return;
    socket.emit('botsStateUpdated', botEngine.getPublicAdminState());
  });

  socket.on('updateBotSettings', (/** @type {Record<string, any>} */ patch = {}) => {
    const admin = getActingAdmin();
    if (!admin) return;

    const s = botEngine.settings;
    if (typeof patch.botsEnabled === 'boolean') s.botsEnabled = patch.botsEnabled;
    if (typeof patch.autoRoamEnabled === 'boolean') s.autoRoamEnabled = patch.autoRoamEnabled;
    if (typeof patch.autoRejoinOnKick === 'boolean') s.autoRejoinOnKick = patch.autoRejoinOnKick;
    if (patch.autoRejoinDelaySeconds !== undefined) {
      const n = Number(patch.autoRejoinDelaySeconds);
      if (Number.isFinite(n)) s.autoRejoinDelaySeconds = Math.max(1, Math.min(3600, Math.round(n)));
    }
    if (typeof patch.autoRepliesEnabled === 'boolean') s.autoRepliesEnabled = patch.autoRepliesEnabled;
    if (typeof patch.welcomeEnabled === 'boolean') s.welcomeEnabled = patch.welcomeEnabled;
    if (typeof patch.replyDelayEnabled === 'boolean') s.replyDelayEnabled = patch.replyDelayEnabled;
    if (patch.replyDelaySeconds !== undefined) {
      const n = Number(patch.replyDelaySeconds);
      if (Number.isFinite(n)) s.replyDelaySeconds = Math.max(0, Math.min(60, Math.round(n)));
    }

    botEngine.persistSettings();
    botEngine.reconcileAllBots(true);
    broadcastBotsStateToAdmins(hostContext);

    hostContext.logMonitorEvent?.(
      'security',
      `تحديث إعدادات البوتات العامة بواسطة ${admin.username}`,
      admin.username
    );
  });

  socket.on('createBot', (/** @type {Record<string, any>} */ payload = {}, /** @type {((res: any) => void) | undefined} */ callback) => {
    const admin = getActingAdmin();
    if (!admin) {
      callback?.({ ok: false, error: 'غير مصرح لك بإدارة البوتات.' });
      return;
    }

    const cleanName = hostContext.sanitizeText(String(payload.name || '')).trim();
    const cleanQuote = hostContext.sanitizeText(String(payload.statusQuote || '')).trim();
    const avatarUrl = hostContext.sanitizeUrl(String(payload.avatarUrl || '')) || DEFAULT_BOT_AVATARS[0];
    const status = String(payload.status || '').trim();
    const defaultRoom = String(payload.defaultRoom || '').trim();
    const personality = String(payload.personality || '').trim();
    const notes = hostContext.sanitizeText(String(payload.notes || '')).trim();
    const roamMode = payload.roamMode === 'selected' ? 'selected' : 'random';
    const roamRooms = Array.isArray(payload.roamRooms) ? payload.roamRooms.map(String) : [];
    const roamIntervalMinutes = Math.max(0.1, Number(payload.roamIntervalMinutes) || 5);

    if (!cleanName || !cleanQuote || !status || !defaultRoom || !personality || !avatarUrl) {
      const err = 'جميع الحقول الأساسية إجبارية (الاسم، الصورة، الحالة، الحالة الكتابية، الغرفة الافتراضية، والشخصية).';
      socket.emit('systemAlert', err);
      callback?.({ ok: false, error: err });
      return;
    }

    const lowerName = cleanName.toLowerCase();
    const duplicateBot = botEngine.bots.find((b) => b.name.toLowerCase() === lowerName);
    const existingHuman = Object.keys(hostContext.registeredMembers).find(
      (k) => k.toLowerCase() === lowerName && !hostContext.registeredMembers[k]?.isBot
    );
    if (duplicateBot || existingHuman) {
      const err = `الاسم [${cleanName}] مستخدم مسبقاً، يرجى اختيار اسم آخر للبوت.`;
      socket.emit('systemAlert', err);
      callback?.({ ok: false, error: err });
      return;
    }

    const newBot = botEngine.normalizeBotRecord({
      id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      avatarUrl,
      status,
      statusQuote: cleanQuote,
      defaultRoom,
      currentRoom: defaultRoom,
      personality,
      notes,
      flag: payload.flag || '🇸🇦',
      enabled: payload.enabled !== false,
      roamMode,
      roamRooms,
      roamIntervalMinutes,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    botEngine.bots.push(newBot);
    botEngine.syncBotIntoRegisteredMembers(newBot);
    botEngine.persistBots();
    botEngine.reconcileAllBots(true);
    broadcastBotsStateToAdmins(hostContext);

    hostContext.logMonitorEvent?.(
      'role',
      `إنشاء بوت جديد [${newBot.name}] في غرفة [${newBot.currentRoom}] بواسطة ${admin.username}`,
      admin.username,
      newBot.name
    );
    socket.emit('systemAlert', `✅ تم إنشاء البوت [${newBot.name}] وتشغيله في الشات بنجاح.`);
    callback?.({ ok: true, bot: newBot });
  });

  socket.on('updateBot', (/** @type {Record<string, any>} */ payload = {}, /** @type {((res: any) => void) | undefined} */ callback) => {
    const admin = getActingAdmin();
    if (!admin) {
      callback?.({ ok: false, error: 'غير مصرح لك بتعديل البوتات.' });
      return;
    }

    const bot = botEngine.findBotById(String(payload.id || ''));
    if (!bot) {
      const err = 'البوت المطلوب غير موجود.';
      socket.emit('systemAlert', err);
      callback?.({ ok: false, error: err });
      return;
    }

    const cleanName = hostContext.sanitizeText(String(payload.name || '')).trim();
    const cleanQuote = hostContext.sanitizeText(String(payload.statusQuote || '')).trim();
    const avatarUrl = hostContext.sanitizeUrl(String(payload.avatarUrl || '')) || bot.avatarUrl;
    const status = String(payload.status || '').trim();
    const defaultRoom = String(payload.defaultRoom || '').trim();
    const personality = String(payload.personality || '').trim();
    const notes = hostContext.sanitizeText(String(payload.notes ?? bot.notes ?? '')).trim();
    const roamMode = payload.roamMode === 'selected' ? 'selected' : 'random';
    const roamRooms = Array.isArray(payload.roamRooms) ? payload.roamRooms.map(String) : bot.roamRooms;
    const roamIntervalMinutes = Math.max(0.1, Number(payload.roamIntervalMinutes) || bot.roamIntervalMinutes || 5);

    if (!cleanName || !cleanQuote || !status || !defaultRoom || !personality || !avatarUrl) {
      const err = 'جميع الحقول الأساسية إجبارية (الاسم، الصورة، الحالة، الحالة الكتابية، الغرفة الافتراضية، والشخصية).';
      socket.emit('systemAlert', err);
      callback?.({ ok: false, error: err });
      return;
    }

    const lowerName = cleanName.toLowerCase();
    const conflictBot = botEngine.bots.find((b) => b.id !== bot.id && b.name.toLowerCase() === lowerName);
    const conflictHuman = Object.keys(hostContext.registeredMembers).find(
      (k) => k.toLowerCase() === lowerName && !hostContext.registeredMembers[k]?.isBot
    );
    if (conflictBot || conflictHuman) {
      const err = `الاسم [${cleanName}] مستخدم مسبقاً، يرجى اختيار اسم آخر.`;
      socket.emit('systemAlert', err);
      callback?.({ ok: false, error: err });
      return;
    }

    const prevName = bot.name;
    const prevDefaultRoom = bot.defaultRoom;
    const prevAvatar = bot.avatarUrl;

    bot.name = cleanName;
    bot.avatarUrl = avatarUrl;
    bot.status = ['online', 'offline', 'busy', 'hidden'].includes(status) ? status : bot.status;
    bot.statusQuote = cleanQuote;
    bot.defaultRoom = defaultRoom;
    if (prevDefaultRoom !== defaultRoom) {
      bot.currentRoom = defaultRoom;
    }
    bot.personality = ['friendly', 'formal', 'funny', 'smart'].includes(personality) ? personality : bot.personality;
    bot.notes = notes;
    bot.roamMode = roamMode;
    bot.roamRooms = roamRooms;
    bot.roamIntervalMinutes = roamIntervalMinutes;
    bot.updatedAt = Date.now();
    if (typeof payload.enabled === 'boolean') {
      bot.enabled = payload.enabled;
    }

    botEngine.syncBotIntoRegisteredMembers(bot, prevName);
    botEngine.persistBots();
    botEngine.reconcileAllBots(true);

    if (prevAvatar !== bot.avatarUrl) {
      hostContext.io.emit('userAvatarUpdated', {
        username: bot.name,
        avatarUrl: bot.avatarUrl
      });
    }

    broadcastBotsStateToAdmins(hostContext);
    socket.emit('systemAlert', `✅ تم حفظ تعديلات البوت [${bot.name}] وتحديثها فوراً لدى الجميع.`);
    callback?.({ ok: true, bot });
  });

  socket.on('toggleBotEnabled', (/** @type {Record<string, any>} */ data = {}) => {
    const { botId, enabled } = data;
    const admin = getActingAdmin();
    if (!admin) return;

    const bot = botEngine.findBotById(String(botId || ''));
    if (!bot) return;

    bot.enabled = typeof enabled === 'boolean' ? enabled : !bot.enabled;
    bot.updatedAt = Date.now();

    if (!bot.enabled) {
      botEngine.clearBotRoamTimer(bot.id);
      botEngine.clearBotRejoinTimer(bot.id);
      botEngine.kickedBotIds.delete(bot.id);
    } else {
      botEngine.kickedBotIds.delete(bot.id);
    }

    botEngine.persistBots();
    botEngine.reconcileAllBots(true);
    broadcastBotsStateToAdmins(hostContext);

    socket.emit(
      'systemAlert',
      bot.enabled ? `🟢 تم تشغيل البوت [${bot.name}] في الشات.` : `⏸️ تم إيقاف البوت [${bot.name}].`
    );
  });

  socket.on('deleteBot', (/** @type {Record<string, any>} */ data = {}) => {
    const { botId } = data;
    const admin = getActingAdmin();
    if (!admin) return;

    const idx = botEngine.bots.findIndex((b) => b.id === String(botId || ''));
    if (idx === -1) return;

    const removed = botEngine.bots.splice(idx, 1)[0];
    botEngine.clearBotRoamTimer(removed.id);
    botEngine.clearBotRejoinTimer(removed.id);
    botEngine.kickedBotIds.delete(removed.id);
    botEngine.removeBotFromRegisteredMembers(removed.name);
    botEngine.persistBots();
    botEngine.reconcileAllBots(true);
    broadcastBotsStateToAdmins(hostContext);

    hostContext.logMonitorEvent?.(
      'role',
      `حذف البوت [${removed.name}] بواسطة ${admin.username}`,
      admin.username,
      removed.name
    );
    socket.emit('systemAlert', `🗑️ تم حذف البوت [${removed.name}] نهائياً.`);
  });

  socket.on('addBotReply', (/** @type {Record<string, any>} */ data = {}, /** @type {((res: any) => void) | undefined} */ callback) => {
    const { keyword, reply } = data;
    const admin = getActingAdmin();
    if (!admin) {
      callback?.({ ok: false, error: 'غير مصرح لك.' });
      return;
    }

    const cleanKeyword = hostContext.sanitizeText(String(keyword || '')).trim();
    const cleanReply = hostContext.sanitizeText(String(reply || '')).trim();
    if (!cleanKeyword || !cleanReply) {
      const err = 'يرجى كتابة الكلمة المفتاحية والرد الخاص بها.';
      socket.emit('systemAlert', err);
      callback?.({ ok: false, error: err });
      return;
    }

    const existing = botEngine.replies.find(
      (r) => r.keyword.trim().toLowerCase() === cleanKeyword.toLowerCase()
    );
    if (existing) {
      existing.reply = cleanReply;
    } else {
      botEngine.replies.unshift({
        id: `br-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        keyword: cleanKeyword,
        reply: cleanReply
      });
    }

    botEngine.persistReplies();
    broadcastBotsStateToAdmins(hostContext);
    socket.emit('systemAlert', `✅ تم حفظ رد الكلمة [${cleanKeyword}] في قاعدة البيانات.`);
    callback?.({ ok: true });
  });

  socket.on('updateBotReply', (/** @type {Record<string, any>} */ data = {}, /** @type {((res: any) => void) | undefined} */ callback) => {
    const { id, keyword, reply } = data;
    const admin = getActingAdmin();
    if (!admin) {
      callback?.({ ok: false, error: 'غير مصرح لك.' });
      return;
    }

    const target = botEngine.replies.find((r) => r.id === String(id || ''));
    if (!target) {
      callback?.({ ok: false, error: 'الرد غير موجود.' });
      return;
    }

    const cleanKeyword = hostContext.sanitizeText(String(keyword || '')).trim();
    const cleanReply = hostContext.sanitizeText(String(reply || '')).trim();
    if (!cleanKeyword || !cleanReply) {
      callback?.({ ok: false, error: 'الكلمة والرد حقول مطلوبة.' });
      return;
    }

    target.keyword = cleanKeyword;
    target.reply = cleanReply;
    botEngine.persistReplies();
    broadcastBotsStateToAdmins(hostContext);
    callback?.({ ok: true });
  });

  socket.on('deleteBotReply', (/** @type {Record<string, any>} */ data = {}) => {
    const { id } = data;
    const admin = getActingAdmin();
    if (!admin) return;

    const idx = botEngine.replies.findIndex((r) => r.id === String(id || ''));
    if (idx === -1) return;

    const removed = botEngine.replies.splice(idx, 1)[0];
    botEngine.persistReplies();
    broadcastBotsStateToAdmins(hostContext);
    socket.emit('systemAlert', `🗑️ تم حذف كلمة البوت [${removed.keyword}].`);
  });
}
