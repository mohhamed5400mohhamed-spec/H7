import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BotEngine,
  DEFAULT_BOT_REPLIES,
  DEFAULT_BOT_SETTINGS,
  DEFAULT_BOT_AVATARS,
  normalizeArabicForMatch,
  findMatchingBotReply,
  resolveSmartBotReply,
  mapBotStatusToPresence
} from '../server/bots/bot.js';
import { answerDirectBotQuestion } from '../server/bots/botAi.js';

describe('server/bots/bot.js - Bot Engine & Smart Replies', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('includes all 19 default botReplies and matches ornate/decorated Arabic shortcuts accurately', () => {
    expect(DEFAULT_BOT_REPLIES.length).toBe(19);
    const salam = findMatchingBotReply('السلام عليكم يا جماعة', DEFAULT_BOT_REPLIES);
    expect(salam?.keyword).toBe('السلام عليكم');

    // Exact ornate shortcut string from user's s1 shortcut:
    const ornateSalam = findMatchingBotReply('ٱلسًلٱم عليّكم وِرحًمة ٱللۂ وِبـٌركآتًہ', DEFAULT_BOT_REPLIES);
    expect(ornateSalam?.keyword).toBe('السلام عليكم');
    expect(normalizeArabicForMatch('ٱلسًلٱم عليّكم وِرحًمة ٱللۂ وِبـٌركآتًہ')).toBe(
      'السلام عليكم ورحمه الله وبركاته'
    );

    const unknown = findMatchingBotReply('كلمة عشوائية لا توجد في الجدول أبداً', DEFAULT_BOT_REPLIES);
    expect(unknown).toBeNull();
  });

  it('resolves smart replies, direct AI questions prefixed by bot name, and ignores mid-sentence random chatter', async () => {
    const bot = { id: 'b1', name: 'سارة', personality: 'friendly' };

    const greet = resolveSmartBotReply({
      text: 'ٱلسًلٱم عليّكم وِرحًمة ٱللۂ وِبـٌركآتًہ',
      senderUsername: 'أحمد',
      bot,
      repliesList: DEFAULT_BOT_REPLIES
    });
    expect(greet?.text).toContain('وعليكم السلام');
    expect(greet?.text).toContain('أحمد');

    const clock = resolveSmartBotReply({
      text: 'كم الساعة',
      senderUsername: 'أحمد',
      bot,
      repliesList: DEFAULT_BOT_REPLIES
    });
    expect(clock?.text).not.toContain('{الوقت الحقيقي}');
    expect(clock?.text).toContain('الساعة الآن هي');

    const who = resolveSmartBotReply({
      text: 'من انت',
      senderUsername: 'أحمد',
      bot,
      repliesList: DEFAULT_BOT_REPLIES
    });
    expect(who?.text).toContain('سارة');
    expect(who?.text).toContain('ودود');

    // Direct question starting with bot's name -> triggers AI/smart Q&A
    const directQ = resolveSmartBotReply({
      text: 'سارة قولي لي ما عدد قارات العالم',
      senderUsername: 'أحمد',
      bot,
      activeBotsInRoom: [bot],
      repliesList: DEFAULT_BOT_REPLIES
    });
    expect(directQ?.isAiQuestion).toBe(true);
    expect(directQ?.questionText).toContain('ما عدد قارات العالم');

    const aiAnswer = await answerDirectBotQuestion({
      bot,
      senderUsername: 'أحمد',
      questionText: directQ!.questionText!,
      room: 'الغرفة العامة'
    });
    expect(aiAnswer).toContain('7 قارات');

    const mentionOnly = resolveSmartBotReply({
      text: 'وينك يا سارة مختفية',
      senderUsername: 'أحمد',
      bot,
      activeBotsInRoom: [bot],
      repliesList: []
    });
    expect(mentionOnly?.text).toBe('هلا فيك يا أحمد، أنا هنا');

    // Unknown words not starting with bot name stay completely silent
    const silent = resolveSmartBotReply({
      text: 'برمجة الخادم تعمل بسلاسة',
      senderUsername: 'أحمد',
      bot,
      activeBotsInRoom: [bot],
      repliesList: DEFAULT_BOT_REPLIES
    });
    expect(silent).toBeNull();
  });

  it('maps the 4 allowed bot statuses cleanly to presenceState / isGhost', () => {
    expect(mapBotStatusToPresence('online')).toEqual({ presenceState: 'online', isGhost: false });
    expect(mapBotStatusToPresence('offline')).toEqual({ presenceState: 'offline', isGhost: false });
    expect(mapBotStatusToPresence('busy')).toEqual({ presenceState: 'away', isGhost: false });
    expect(mapBotStatusToPresence('hidden')).toEqual({ presenceState: 'online', isGhost: true });
  });

  it('normalizes Arabic text properly without altering meaning', () => {
    expect(normalizeArabicForMatch('أهلاً   إبراهيم  آل نكتة')).toBe('اهلا ابراهيم ال نكته');
  });

  it('emits entry/leave/transfer announcements, supports manual flag, enforces cooldowns, and handles kick auto-rejoin', () => {
    const store = new Map<string, any>();
    const emitted: Array<{ room?: string; event: string; payload: any }> = [];
    const users: any[] = [
      { id: 'sock-human-1', username: 'خالد', room: 'الغرفة العامة', role: 'member', presenceState: 'online' },
      { id: 'sock-human-2', username: 'ليلى', room: 'غرفة الحب', role: 'member', presenceState: 'online' }
    ];
    const registeredMembers: Record<string, any> = {};
    const chatRooms = [
      { id: 'الغرفة العامة', name: 'الغرفة العامة' },
      { id: 'غرفة الحب', name: 'غرفة الحب' }
    ];
    const chatHistory: any[] = [];

    const engine = new BotEngine();
    engine.init({
      io: {
        to: (room: string) => ({
          emit: (event: string, payload: any) => emitted.push({ room, event, payload })
        }),
        emit: (event: string, payload: any) => emitted.push({ event, payload })
      },
      dataManager: {
        loadSync: (key: string, def: any) => (store.has(key) ? store.get(key) : def),
        save: (key: string, val: any) => store.set(key, val)
      },
      users,
      registeredMembers,
      chatRooms,
      chatHistory,
      saveMembers: () => {},
      saveHistory: () => {},
      pruneRoomChatHistory: () => {},
      broadcastRoomUsers: () => {},
      broadcastAllUsers: () => {},
      broadcastRoomsUpdate: () => {},
      getCurrentTimeString: () => '10:00 ص',
      sanitizeText: (s: string) => s,
      sanitizeUrl: (u: string) => u,
      logMonitorEvent: () => {}
    });

    const bot = engine.normalizeBotRecord({
      id: 'b_sara',
      name: 'سارة',
      avatarUrl: DEFAULT_BOT_AVATARS[0],
      status: 'busy',
      statusQuote: 'أهلاً بكم في شات حسن برو',
      defaultRoom: 'الغرفة العامة',
      personality: 'friendly',
      flag: '🇾🇪',
      enabled: true,
      roamIntervalMinutes: 5
    });
    engine.bots.push(bot);
    engine.syncBotIntoRegisteredMembers(bot);
    engine.reconcileAllBots(true);

    // Check member registration, manual flag & entry announcement
    expect(registeredMembers['سارة'].role).toBe('member');
    expect(registeredMembers['سارة'].flag).toBe('🇾🇪');
    const liveBot = users.find((u) => u.username === 'سارة');
    expect(liveBot).toBeDefined();
    expect(liveBot.role).toBe('member');
    expect(liveBot.flag).toBe('🇾🇪');
    expect(liveBot.presenceState).toBe('away'); // yellow dot
    expect(emitted.some((e) => e.event === 'message' && e.room === 'الغرفة العامة' && e.payload.text.includes('دخل سارة إلى الغرفة العامة'))).toBe(true);

    // Trigger welcome greeting for human user (after 3 seconds)
    engine.handleUserEnteredRoom({ username: 'خالد', room: 'الغرفة العامة', isBot: false, isGhost: false });
    vi.advanceTimersByTime(3000);
    expect(emitted.some((e) => e.event === 'message' && e.payload.text.includes('نورت يا خالد'))).toBe(true);

    // Trigger keyword reply (2s default delay) with ornate text & check 1-minute cooldown
    engine.handleRoomChatMessage({
      senderUser: { id: 'sock-human-1', username: 'خالد', role: 'member' },
      text: 'ٱلسًلٱم عليّكم وِرحًمة ٱللۂ وِبـٌركآتًہ',
      room: 'الغرفة العامة'
    });
    vi.advanceTimersByTime(2000);
    expect(emitted.some((e) => e.event === 'message' && e.payload.text.includes('وعليكم السلام'))).toBe(true);

    // Same user & same word within 1 minute should not trigger another reply
    const beforeCooldownCount = emitted.filter((e) => e.event === 'message').length;
    engine.handleRoomChatMessage({
      senderUser: { id: 'sock-human-1', username: 'خالد', role: 'member' },
      text: 'السلام عليكم',
      room: 'الغرفة العامة'
    });
    vi.advanceTimersByTime(3000);
    expect(emitted.filter((e) => e.event === 'message').length).toBe(beforeCooldownCount);

    // Bot must NEVER reply to another bot
    engine.handleRoomChatMessage({
      senderUser: { id: 'bot_other', username: 'بوت آخر', isBot: true, role: 'member' },
      text: 'هلا',
      room: 'الغرفة العامة'
    });
    vi.advanceTimersByTime(3000);
    expect(emitted.filter((e) => e.event === 'message').length).toBe(beforeCooldownCount);

    // Enable autoRoam and test room transfer + entry + exit messages
    engine.settings.autoRoamEnabled = true;
    engine.executeBotRoam(bot.id);
    expect(bot.currentRoom).toBe('غرفة الحب');
    expect(emitted.some((e) => e.event === 'message' && e.room === 'الغرفة العامة' && e.payload.text.includes('انتقل إلى غرفة [غرفة الحب]'))).toBe(true);
    expect(emitted.some((e) => e.event === 'message' && e.room === 'غرفة الحب' && e.payload.text.includes('دخل سارة إلى غرفة الحب'))).toBe(true);
    expect(emitted.some((e) => e.event === 'message' && e.room === 'غرفة الحب' && e.payload.text.includes('أهلاً، وصلت، منورين 🌹'))).toBe(true);

    // Kick bot -> emits leave notice & disappears, then auto-rejoins after 10 seconds with entry notice
    expect(DEFAULT_BOT_SETTINGS.autoRejoinDelaySeconds).toBe(10);
    engine.handleBotKicked(liveBot, 'غرفة الحب', 'admin');
    expect(users.find((u) => u.username === 'سارة')).toBeUndefined();
    expect(emitted.some((e) => e.event === 'message' && e.room === 'غرفة الحب' && e.payload.text.includes('غادر سارة'))).toBe(true);
    vi.advanceTimersByTime(9999);
    expect(users.find((u) => u.username === 'سارة')).toBeUndefined();
    vi.advanceTimersByTime(2);
    const rejoinedBot = users.find((u) => u.username === 'سارة');
    expect(rejoinedBot).toBeDefined();
    expect(rejoinedBot.room).toBe('غرفة الحب');
  });
});
