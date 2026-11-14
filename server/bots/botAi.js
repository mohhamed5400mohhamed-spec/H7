// @ts-check
/**
 * Server-Side Bot AI Q&A Module (ذكاء البوت للرد على الأسئلة والحوار المباشر)
 * Uses @google/genai ('gemini-4-hydrogen') on the server side when GEMINI_API_KEY is available,
 * with a rich local Arabic factual & conversational fallback so bots always answer reliably.
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const PERSONALITY_PROMPTS = {
  friendly: 'شخصيتك ودودة ولطيفة ودافئة جداً، تحبين الترحيب بالناس والإجابة بلطف وابتسامة.',
  formal: 'شخصيتك رسمية رصينة ومحترمة، تجيبين بلغة عربية فصحى واضحة ومهذبة.',
  funny: 'شخصيتك مرحة وخفيفة الظل، تجيبين بدقة وبروح لطيفة ومبتسمة دون الإخلال بصحة المعلومة.',
  smart: 'شخصيتك ذكية ومنظمة وسريعة البديهة، تعطين الإجابة الصحيحة بدقة واختصار مفيد.'
};

/** @type {GoogleGenAI | null} */
let cachedAiClient = null;
let cachedApiKey = '';

/**
 * Returns lazily initialized GoogleGenAI client if GEMINI_API_KEY is configured.
 * @returns {GoogleGenAI | null}
 */
function getGeminiClient() {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  if (!cachedAiClient || cachedApiKey !== apiKey) {
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    cachedApiKey = apiKey;
  }
  return cachedAiClient;
}

/**
 * Strips diacritics/tatweel/ornate variants for local factual matching.
 * @param {string} s
 * @returns {string}
 */
function cleanArabicSimple(s) {
  return String(s || '')
    .replace(/ﷲ/g, 'الله')
    .normalize('NFKC')
    .replace(/[\u0640\u200B-\u200F\u2060-\u206F\uFEFF]/g, '')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ةهۂہھ]/g, 'ه')
    .replace(/[يىیئ]/g, 'ي')
    .trim()
    .toLowerCase();
}

/**
 * Deterministic Arabic factual, arithmetic, time/date, and conversational fallback
 * used when GEMINI_API_KEY is not set or the remote API is temporarily unreachable.
 * @param {{ botName: string, personality: string, senderUsername: string, questionText: string }} params
 * @returns {string}
 */
export function resolveLocalDirectAnswer({ botName, personality, senderUsername, questionText }) {
  const q = cleanArabicSimple(questionText);

  // 1. Safe basic arithmetic detector (e.g. "كم 12 * 5" or "5 + 7")
  const mathMatch = q.match(/(\d+(?:\.\d+)?)\s*([+\-*/×÷])\s*(\d+(?:\.\d+)?)/);
  if (mathMatch) {
    const a = Number(mathMatch[1]);
    const op = mathMatch[2];
    const b = Number(mathMatch[3]);
    let res = NaN;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*' || op === '×') res = a * b;
    else if ((op === '/' || op === '÷') && b !== 0) res = Number((a / b).toFixed(4));
    if (Number.isFinite(res)) {
      return `يا ${senderUsername}، ناتج ${a} ${op} ${b} هو: ${res} ✅`;
    }
  }

  // 2. Continents of the world (عدد قارات العالم)
  if (q.includes('قارات العالم') || (q.includes('كم') && q.includes('قاره')) || (q.includes('عدد') && q.includes('قارات'))) {
    return `يا ${senderUsername}، عدد قارات العالم 7 قارات وهي: آسيا، أفريقيا، أوروبا، أمريكا الشمالية، أمريكا الجنوبية، أستراليا (أوقيانوسيا)، والقارة القطبية الجنوبية (أنتاركتيكا) 🌍`;
  }

  // 3. Planets
  if (q.includes('كواكب') || q.includes('المجموعه الشمسيه')) {
    return `عدد كواكب المجموعة الشمسية 8 كواكب يا ${senderUsername}: عطارد، الزهرة، الأرض، المريخ، المشتري، زحل، أورانوس، ونبتون 🪐`;
  }

  // 4. Oceans
  if (q.includes('محيط') && (q.includes('عدد') || q.includes('كم') || q.includes('اكبر'))) {
    return `عدد المحيطات في العالم 5 محيطات (الهادئ، الأطلسي، الهندي، المتجمد الجنوبي، المتجمد الشمالي)، وأكبرها وأعمقها هو المحيط الهادئ 🌊`;
  }

  // 5. Days / Months / Hours
  if (q.includes('عدد اشهر') || q.includes('كم شهر')) {
    return `عدد أشهر السنة 12 شهراً يا ${senderUsername} 📅`;
  }
  if (q.includes('ايام الاسبوع') || q.includes('كم يوم في الاسبوع')) {
    return `أيام الأسبوع 7 أيام يا ${senderUsername} 😊`;
  }
  if (q.includes('التاريخ') || q.includes('تاريخ اليوم') || q.includes('اي يوم اليوم')) {
    try {
      const todayStr = new Date().toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return `اليوم هو ${todayStr} يا ${senderUsername} 📅`;
    } catch {
      return `اليوم هو ${new Date().toDateString()} يا ${senderUsername} 📅`;
    }
  }

  // 6. Islamic & Quranic common facts
  if (q.includes('عدد سور القران') || (q.includes('كم سوره') && q.includes('القران'))) {
    return `عدد سور القرآن الكريم 114 سورة يا ${senderUsername} 📖`;
  }
  if (q.includes('اركان الاسلام')) {
    return `أركان الإسلام خمسة: الشهادتان، إقام الصلاة، إيتاء الزكاة، صوم رمضان، وحج البيت لمن استطاع إليه سبيلاً 🕌`;
  }

  // 7. Common Capitals
  const capitals = [
    ['السعوديه', 'الرياض'],
    ['مصر', 'القاهرة'],
    ['الامارات', 'أبوظبي'],
    ['الكويت', 'مدينة الكويت'],
    ['قطر', 'الدوحة'],
    ['البحرين', 'المنامة'],
    ['عمان', 'مسقط'],
    ['اليمن', 'صنعاء'],
    ['العراق', 'بغداد'],
    ['سوريا', 'دمشق'],
    ['الاردن', 'عمان'],
    ['لبنان', 'بيروت'],
    ['فلسطين', 'القدس'],
    ['المغرب', 'الرباط'],
    ['الجزائر', 'الجزائر'],
    ['تونس', 'تونس'],
    ['ليبيا', 'طرابلس'],
    ['السودان', 'الخرطوم'],
    ['تركيا', 'أنقرة'],
    ['فرنسا', 'باريس'],
    ['بريطانيا', 'لندن'],
    ['اليابان', 'طوكيو']
  ];
  if (q.includes('عاصمه')) {
    for (const [country, cap] of capitals) {
      if (q.includes(country)) {
        return `عاصمة ${country} هي ${cap} يا ${senderUsername} 🌍`;
      }
    }
  }

  // 8. Conversational greetings / small talk directed at the bot
  if (q.includes('اسمك') || q.includes('من انت') || q.includes('عرفينا بنفسك') || q.includes('عرفنا بنفسك')) {
    return `أنا ${botName}، عضو متواجد معكم هنا في شات حسان برو لأرحب بكم وأجيب على أسئلتكم بكل سرور 🌹`;
  }
  if (q.includes('رايك') || q.includes('كيف') || q.includes('اخبارك') || q.includes('شلونك') || q.includes('عامله ايه') || q.includes('عامل ايه')) {
    if (personality === 'funny') {
      return `هلا يا ${senderUsername}! أموري تمام التمام ورايقة على الآخر 😄 انت كيفك وش أخبارك؟`;
    }
    if (personality === 'formal') {
      return `أهلاً بك يا ${senderUsername}، أنا بخير والحمد لله، أتمنى لك وقتاً ممتعاً ومفيداً في شات حسان برو.`;
    }
    return `هلا فيك يا ${senderUsername} 🌹 الحمدلله بأفضل حال، وجودكم في الشات يسعدنا!`;
  }
  if (q.includes('شكرا') || q.includes('يسلمو') || q.includes('مشكور') || q.includes('مقصر')) {
    return `العفو يا ${senderUsername}، بالخدمة دائماً وبكل سرور ❤️`;
  }

  // 9. Graceful fallback if question requires general LLM & API key isn't configured
  return `هلا فيك يا ${senderUsername} 🌹 وصلني سؤالك، وأنا دائماً هنا للدردشة والمساعدة. (لإجابات موسوعة شاملة لكل الأسئلة تأكد من تفعيل مفتاح Gemini API في إعدادات السيرفر).`;
}

/**
 * Generates an accurate answer to a user message explicitly addressed to a bot.
 * Uses Gemini ('gemini-4-hydrogen') on server side when configured, with clean fallback.
 * @param {{ bot: any, senderUsername: string, questionText: string, room: string }} params
 * @returns {Promise<string>}
 */
export async function answerDirectBotQuestion({ bot, senderUsername, questionText, room }) {
  const botName = String(bot?.name || 'البوت');
  const personalityKey = String(bot?.personality || 'friendly');
  const personalityHint =
    /** @type {Record<string, string>} */ (PERSONALITY_PROMPTS)[personalityKey] || PERSONALITY_PROMPTS.friendly;

  const ai = getGeminiClient();
  if (!ai) {
    return resolveLocalDirectAnswer({
      botName,
      personality: personalityKey,
      senderUsername,
      questionText
    });
  }

  const systemInstruction = [
    `أنت عضو مشارك داخل غرفة الدردشة "${room}" في تطبيق "شات حسان برو"، واسمك هو "${botName}".`,
    personalityHint,
    `العضو "${senderUsername}" يوجه كلامه أو سؤاله لك مباشرة الآن.`,
    'القواعد الصارمة للإجابة:',
    '- أجب بإجابة صحيحة ودقيقة ومباشرة على السؤال.',
    '- اجعل ردك طبيعياً ومختصراً ومناسباً لغرفة دردشة (من سطر واحد إلى 3 أسطر كحد أقصى).',
    '- لا تستخدم تنسيقات Markdown معقدة مثل العناوين أو القوائم الطويلة أو النجوم المزدوجة.',
    '- خاطب العضو بلطف (مثلاً باسمه عند الحاجة) وبنفس اللغة أو اللهجة المناسبة.'
  ].join('\n');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: questionText,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        },
        abortSignal: controller.signal
      }
    });

    clearTimeout(timeoutId);
    const answer = String(response?.text || '').trim();
    if (answer) {
      return answer;
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[BotAI] Gemini generateContent fallback for bot [${botName}]:`, errMsg);
  }

  return resolveLocalDirectAnswer({
    botName,
    personality: personalityKey,
    senderUsername,
    questionText
  });
}
