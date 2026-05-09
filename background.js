// ═══════════════════════════════════════════════════
// MESSAGE LISTENER
// ═══════════════════════════════════════════════════
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === 'ASK_AI' || request?.type === 'CHAT_CONVERSATION') {
    handleAIRequest(request)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message || String(err) }));
    return true;
  }

  // ── Fetch ảnh từ background — bypass CORS hoàn toàn ──
  if (request?.type === 'FETCH_IMAGE_BASE64') {
    fetchImageAsBase64(request.url)
      .then(sendResponse)
      .catch(() => sendResponse({ base64: null }));
    return true;
  }

  // ── Xóa cache ──
  if (request?.type === 'CLEAR_CACHE') {
    clearQuestionCache().then(() => sendResponse({ success: true }));
    return true;
  }
});

// ── Keyboard shortcuts → forward tới tab hiện tại ──
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'KEYBOARD_COMMAND', command });
    }
  });
});

// ═══════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ

/** Tạo hash đơn giản từ chuỗi để làm cache key */
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return 'q_' + Math.abs(h).toString(36);
}

async function getCachedResult(payload, richFormat = false) {
  const key = simpleHash(payload.title + JSON.stringify(payload.options || []) + '_' + (richFormat ? '1' : '0'));
  const store = await chrome.storage.local.get(key);
  const entry = store[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return { hit: true, data: entry.data };
  }
  return { hit: false };
}

async function setCachedResult(payload, data, richFormat = false) {
  const key = simpleHash(payload.title + JSON.stringify(payload.options || []) + '_' + (richFormat ? '1' : '0'));
  await chrome.storage.local.set({ [key]: { data, ts: Date.now() } });
}

async function clearQuestionCache() {
  const all = await chrome.storage.local.get(null);
  const cacheKeys = Object.keys(all).filter(k => k.startsWith('q_'));
  if (cacheKeys.length) await chrome.storage.local.remove(cacheKeys);
}

// ═══════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════
async function recordStat(entry) {
  const store = await chrome.storage.local.get('stats');
  const stats = Array.isArray(store.stats) ? store.stats : [];
  stats.push({ ...entry, ts: Date.now() });
  // Giữ tối đa 500 bản ghi
  if (stats.length > 500) stats.splice(0, stats.length - 500);
  await chrome.storage.local.set({ stats });
}

// ═══════════════════════════════════════════════════
// FETCH ẢNH
// ═══════════════════════════════════════════════════
async function fetchImageAsBase64(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error('[HoangDZ-BG] HTTP lỗi khi fetch ảnh:', resp.status, url);
      return { base64: null, error: `HTTP ${resp.status}` };
    }
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const mimeType = resp.headers.get('content-type') || 'image/png';
    console.log('[HoangDZ-BG] Ảnh OK:', mimeType, bytes.length, 'bytes');
    return { base64: `data:${mimeType};base64,${base64}` };
  } catch (err) {
    console.error('[HoangDZ-BG] Exception fetch ảnh:', url, err.message);
    return { base64: null, error: err.message };
  }
}

// ═══════════════════════════════════════════════════
// HANDLE AI REQUEST
// ═══════════════════════════════════════════════════
async function handleAIRequest(req) {
  const settings = await chrome.storage.local.get([
    'providerId', 'modelName', 'apiKey', 'chatHistory', 'richFormat'
  ]);

  const apiKey = settings.apiKey;
  const modelName = settings.modelName || 'gemini/gemini-1.5-flash';
  const richFormat = settings.richFormat === true;

  if (!apiKey) return { success: false, error: 'Chưa cấu hình API Key.' };

  if (req.type === 'ASK_AI') {
    const mode = req.mode || 'portal';
    const payload = req.payload || {};
    const images = Array.isArray(payload.images) ? payload.images : [];

    // ── Kiểm tra cache (chỉ cache khi không có ảnh) ──
    if (images.length === 0) {
      const cached = await getCachedResult(payload, richFormat);
      if (cached.hit) {
        console.log('[HoangDZ-BG] Cache hit!');
        await recordStat({ model: modelName, questionType: payload.questionType, cached: true, confidence: cached.data.confidence });
        return { success: true, data: cached.data, fromCache: true };
      }
    }

    const prompt = buildQuizPrompt(payload, mode, richFormat);
    const rawText = await callAIWithRetry({ apiKey, modelName, prompt, images });
    const data = parseAIResponse(rawText, payload);

    // ── Lưu cache ──
    if (images.length === 0) await setCachedResult(payload, data, richFormat);

    // ── Ghi thống kê ──
    await recordStat({ model: modelName, questionType: payload.questionType, cached: false, confidence: data.confidence });

    return { success: true, data, raw: rawText, fromCache: false };
  }

  // CHAT_CONVERSATION
  const history = Array.isArray(settings.chatHistory) ? settings.chatHistory.slice(-10) : [];
  const prompt = buildChatPrompt(history, req.text || '', richFormat);
  const chatImages = Array.isArray(req.images) ? req.images : [];
  const reply = await callAIWithRetry({ apiKey, modelName, prompt, images: chatImages });

  history.push({ role: 'user', text: req.text || '' });
  history.push({ role: 'assistant', text: reply });
  await chrome.storage.local.set({ chatHistory: history.slice(-20) });

  return { success: true, reply };
}

// ═══════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════
const RICH_FORMAT_INSTRUCTION = `
Định dạng phần "explanation":
- Dùng **bold** để nhấn mạnh.
- Dùng \\n để xuống dòng giữa các bước.
- Dùng LaTeX inline $...$ cho công thức nhỏ (ví dụ: $x^2 + y^2$).
- Dùng LaTeX block $$...$$ cho công thức lớn cần hiển thị riêng (ví dụ: $$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$).
- Ký hiệu đặc biệt: dùng → thay "ra", ≈ thay "xấp xỉ", ± thay "cộng trừ".`;

function buildQuizPrompt(payload = {}, mode = 'portal', richFormat = false) {
  const {
    title = '',
    options = [],
    questionType = 'multiple_choice',
    canvasType = '',
    hasImages = false,
    imageAlts = [],
    images = [],
  } = payload;

  const isFillin = questionType === 'fill_in';
  const hasVision = images.length > 0;

  const imageNote = hasImages && !hasVision
    ? `\n[Lưu ý: Câu hỏi có hình ảnh (${imageAlts.join(', ')}) nhưng không thể tải được. Phân tích dựa trên text có sẵn.]`
    : hasVision
      ? `\n[ℹ️ ${images.length} hình ảnh đã được đính kèm — hãy phân tích cả hình vẽ.]`
      : '';

  const formatNote = richFormat ? RICH_FORMAT_INSTRUCTION : '';

  if (isFillin) {
    return `Bạn là AI chuyên giải bài tập toán/kỹ thuật. Hãy giải câu hỏi sau và trả về DUY NHẤT JSON hợp lệ, không markdown bên ngoài JSON, không giải thích ngoài JSON.

Schema:
{
  "answer": string,
  "explanation": string,
  "confidence": number
}

Quy tắc:
- answer: kết quả số thập phân (mặc định làm tròn chính xác đến 4 chữ số sau dấu phẩy trừ khi đề bài yêu cầu khác).
- explanation: trình bày các bước tính toán.
- confidence: từ 0 đến 1.
- Nếu câu hỏi yêu cầu điền 0 khi không tuần hoàn, hãy kiểm tra và điền đúng.${formatNote}${imageNote}

Loại câu hỏi: ${canvasType || 'numerical/short_answer'}

Câu hỏi:
${title}`;

  } else {
    const selectedOption = options.find(o => o.selected);
    const optionsText = options.length
      ? options.map(o => `  ${o.index}. ${o.text}${o.selected ? '  ← [ĐANG ĐƯỢC CHỌN]' : ''}`).join('\n')
      : '(Không có đáp án text — câu hỏi có thể chứa hình ảnh)';

    const selectedNote = selectedOption
      ? `\n\n⚠️ LƯU Ý: Người dùng đã chọn đáp án ${selectedOption.index} ("${selectedOption.text}"). Xác nhận đúng/sai và giải thích.`
      : '';

    return `Bạn là AI giải câu hỏi trắc nghiệm. Hãy phân tích và trả về DUY NHẤT JSON hợp lệ, không markdown bên ngoài JSON, không giải thích ngoài JSON.

⚠️ RÀNG BUỘC BẮT BUỘC:
- Bạn CHỈ được chọn MỘT trong các đáp án đã cho bên dưới.
- TUYỆT ĐỐI KHÔNG tự tạo ra đáp án mới.
- correct_index phải là số thứ tự của một đáp án trong danh sách.
- correct_text phải là NỘI DUNG NGUYÊN VĂN của đáp án đó.

Schema:
{
  "correct_index": number,
  "correct_text": string,
  "explanation": string,
  "confidence": number
}

Quy tắc:
- correct_index: số thứ tự đáp án đúng (1, 2, 3, 4...).
- correct_text: sao chép nguyên văn nội dung đáp án.
- explanation: giải thích tại sao đáp án đó đúng.
- confidence: từ 0 đến 1.${formatNote}${imageNote}${selectedNote}

Loại câu hỏi: ${canvasType || 'multiple_choice'}

Câu hỏi:
${title}

Danh sách đáp án (CHỈ chọn trong số này):
${optionsText}`;
  }
}

function buildChatPrompt(history, message, richFormat = false) {
  const historyText = history
    .map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.text}`)
    .join('\n');

  const formatNote = richFormat
    ? '\nKhi giải thích công thức, dùng LaTeX $...$ và $$...$$ và Markdown **bold**.'
    : '';

  return `Bạn là trợ lý AI ngắn gọn, hữu ích, trả lời bằng tiếng Việt nếu người dùng dùng tiếng Việt.${formatNote}

Lịch sử gần đây:
${historyText || '(chưa có)'}

Tin nhắn mới:
${message}`;
}

// ═══════════════════════════════════════════════════
// 9ROUTER API CALL + AUTO RETRY
// ═══════════════════════════════════════════════════
const NINE_ROUTER_BASE_URL = 'http://localhost:20128/v1';

function isRetryableError(err) {
  const msg = err.message || '';
  // Retry khi rate limit (429) hoặc server error (5xx)
  return /429|500|502|503|504|rate.?limit|timeout/i.test(msg);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Gọi AI với tự động thử lại 3 lần khi gặp lỗi có thể retry */
async function callAIWithRetry(opts, maxRetries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callAI(opts);
    } catch (err) {
      lastErr = err;
      console.warn(`[HoangDZ-BG] Lần ${attempt}/${maxRetries} thất bại:`, err.message);
      if (attempt === maxRetries || !isRetryableError(err)) break;
      // Exponential backoff: 1s, 2s, 4s
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  throw lastErr;
}

/**
 * Gọi AI qua 9Router.
 * Nếu `images` có dữ liệu base64, gửi theo format Vision (multimodal content array).
 */
async function callAI({ apiKey, modelName, prompt, images = [] }) {
  let userContent;
  if (images.length > 0) {
    userContent = [
      { type: 'text', text: prompt },
      ...images.map(dataUrl => ({
        type: 'image_url',
        image_url: { url: dataUrl, detail: 'high' }
      }))
    ];
  } else {
    userContent = prompt;
  }

  const response = await fetch(`${NINE_ROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: 'Bạn là trợ lý AI giải toán/trắc nghiệm, trả lời bằng tiếng Việt.' },
        { role: 'user', content: userContent }
      ],
      temperature: 0.2
    })
  });

  const data = await safeJson(response);

  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || `9Router API lỗi HTTP ${response.status}`);
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('9Router không trả về nội dung.');
  return text;
}

async function safeJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: { message: text || 'Response không phải JSON.' } };
  }
}

// ═══════════════════════════════════════════════════
// PARSE AI RESPONSE
// ═══════════════════════════════════════════════════
function parseAIResponse(rawText, payload = {}) {
  const cleaned = String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (_) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI không trả về JSON hợp lệ. Nội dung: ' + cleaned.slice(0, 300));
    parsed = JSON.parse(match[0]);
  }

  const isFillin = payload.questionType === 'fill_in';

  if (isFillin) {
    return {
      questionType: 'fill_in',
      answer: String(parsed.answer ?? parsed.correct_text ?? parsed.result ?? ''),
      explanation: String(parsed.explanation || parsed.reason || 'Không có giải thích.'),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
    };
  }

  // ── Normalize correct_index: hỗ trợ số, string số, và chữ cái A/B/C/D ──
  let rawIndex = parsed.correct_index ?? parsed.answer ?? parsed.index ?? parsed.correct_option;
  let correctIndex;

  if (typeof rawIndex === 'string') {
    const upper = rawIndex.trim().toUpperCase();
    if (/^[A-E]$/.test(upper)) {
      correctIndex = upper.charCodeAt(0) - 64;
    } else {
      correctIndex = parseInt(upper, 10);
    }
  } else {
    correctIndex = Number(rawIndex);
  }

  // Nếu vẫn không hợp lệ, tìm theo correct_text
  if (!Number.isInteger(correctIndex) || correctIndex < 1) {
    const correctText = String(parsed.correct_text || parsed.answer_text || '').toLowerCase().trim();
    if (correctText && Array.isArray(payload.options)) {
      const matched = payload.options.find(o =>
        String(o.text || '').toLowerCase().trim().includes(correctText) ||
        correctText.includes(String(o.text || '').toLowerCase().trim())
      );
      if (matched) correctIndex = matched.index;
    }
  }

  if (!Number.isInteger(correctIndex) || correctIndex < 1) {
    console.error('[HoangDZ] parseAIResponse thất bại. Raw AI:', rawText);
    throw new Error(`AI trả về correct_index không hợp lệ: "${rawIndex}". Raw: ${cleaned.slice(0, 200)}`);
  }

  let correctText = String(parsed.correct_text || parsed.answer_text || '');
  if (!correctText && Array.isArray(payload.options)) {
    const opt = payload.options.find(o => o.index === correctIndex);
    if (opt) correctText = opt.text || '';
  }

  return {
    questionType: 'multiple_choice',
    correct_index: correctIndex,
    correct_text: correctText,
    explanation: String(parsed.explanation || parsed.reason || 'Không có giải thích.'),
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
  };
}
