(function () {

  // ═══════════════════════════════════════════════════
  // SELECTORS theo từng chế độ trang
  // ═══════════════════════════════════════════════════
  const SELECTORS = {
    // LMS cũ (e-learning.hust / moodle-style)
    lms: {
      container: '.question-container',
      questionItem: '.question-item',
      questionTitle: '.question-title',
      option: '.checkbox',
    },
    // Canvas Portal (portal.uet.vnu.edu.vn)
    portal: {
      container: '#questions',
      questionItem: '.display_question',
      questionTitle: '.question_text',
      option: '.answer',
    }
  };

  // ═══════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════
  let currentMode = 'portal';
  let extensionEnabled = true;
  let richFormat = false;
  let autoFillEnabled = true;
  let observerStarted = false;
  let currentSelectors = SELECTORS.portal;

  // ═══════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════
  
  function injectKatexCss() {
    if (document.getElementById('hoangdz-katex-css')) return;
    const link = document.createElement('link');
    link.id = 'hoangdz-katex-css';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('katex/katex.min.css');
    document.head.appendChild(link);
  }

  chrome.storage.local.get(['siteMode', 'extensionEnabled', 'richFormat', 'autoFillEnabled'], (result) => {
    currentMode = result.siteMode || 'portal';
    extensionEnabled = result.extensionEnabled !== false;
    richFormat = result.richFormat === true;
    autoFillEnabled = result.autoFillEnabled !== false;
    currentSelectors = SELECTORS[currentMode] || SELECTORS.portal;
    if (extensionEnabled) {
      injectKatexCss();
      window.addEventListener('load', () => { startObserver(); createFloatingChat(); });
      startObserver();
      createFloatingChat();
    }
  });

  // Listen for messages from popup / background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'EXTENSION_TOGGLE') {
      extensionEnabled = msg.enabled;
      if (extensionEnabled) {
        const existingWrapper = document.getElementById('hoangdz-ai-chat-wrapper');
        if (existingWrapper) existingWrapper.style.display = '';
        else createFloatingChat();
        const banner = document.getElementById('hoangdz-ask-all-banner');
        if (banner) banner.style.display = '';
        startObserver();
        tryInit();
      } else {
        document.querySelectorAll('.hoangdz-ai-action-container').forEach(el => el.remove());
        const chatWrapper = document.getElementById('hoangdz-ai-chat-wrapper');
        if (chatWrapper) chatWrapper.style.display = 'none';
        const banner = document.getElementById('hoangdz-ask-all-banner');
        if (banner) banner.style.display = 'none';
      }
      return;
    }
    if (msg?.type === 'SITE_MODE_CHANGED') {
      currentMode = msg.siteMode || 'portal';
      currentSelectors = SELECTORS[currentMode] || SELECTORS.portal;
      if (extensionEnabled) tryInit();
      return;
    }
    if (msg?.type === 'RICH_FORMAT_CHANGED') {
      richFormat = msg.richFormat;
      return;
    }
    if (msg?.type === 'AUTOFILL_CHANGED') {
      autoFillEnabled = msg.autoFillEnabled;
      return;
    }
    // ── Keyboard shortcuts từ background ──
    if (msg?.type === 'KEYBOARD_COMMAND') {
      if (msg.command === 'ask-all') {
        const askAllBtn = document.getElementById('hoangdz-ask-all-btn');
        if (askAllBtn && !askAllBtn.disabled) askAllBtn.click();
      } else if (msg.command === 'toggle-chat') {
        const box = document.getElementById('hoangdz-ai-chat-box');
        if (box) box.classList.toggle('hoangdz-hidden');
      }
      return;
    }
  });

  // ═══════════════════════════════════════════════════
  // OBSERVER
  // ═══════════════════════════════════════════════════
  function startObserver() {
    if (observerStarted) return;
    observerStarted = true;

    const observer = new MutationObserver(() => tryInit());
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(tryInit, 2000);
  }

  function tryInit() {
    if (!extensionEnabled) return;
    const container = document.querySelector(currentSelectors.container);
    const questions = document.querySelectorAll(currentSelectors.questionItem);
    if (container && questions.length) initExtension();
  }

  // ═══════════════════════════════════════════════════
  // INJECT BUTTONS
  // ═══════════════════════════════════════════════════
  function initExtension() {
    const questions = document.querySelectorAll(currentSelectors.questionItem);
    questions.forEach((item) => {
      if (item.querySelector('.hoangdz-ai-action-container')) return;

      const actionDiv = document.createElement('div');
      actionDiv.className = 'hoangdz-ai-action-container';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '🤖 Hỏi AI';
      btn.className = 'hoangdz-ai-btn';

      const resultDiv = document.createElement('div');
      resultDiv.className = 'hoangdz-ai-result';

      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '⏳ Đang phân tích...';
        resultDiv.textContent = '';
        resultDiv.classList.remove('hoangdz-ai-error');

        const payload = currentMode === 'portal'
          ? extractPortalQuestion(item)
          : extractLmsQuestion(item);

        // ── Vision: fetch images as base64 within page auth context ──
        if (payload.hasImages && payload.imageSrcs?.length) {
          btn.textContent = '🖼 Đang tải ảnh...';
          console.log('[HoangDZ] Đang fetch', payload.imageSrcs.length, 'ảnh:', payload.imageSrcs);
          const base64List = await Promise.all(
            payload.imageSrcs.map(src => fetchImageBase64(src))
          );
          payload.images = base64List.filter(Boolean);
          console.log('[HoangDZ] Kết quả fetch:', payload.images.length, '/', payload.imageSrcs.length, 'ảnh thành công');
          if (payload.images.length === 0) {
            console.warn('[HoangDZ] ⚠️ Không tải được ảnh nào! AI sẽ không nhìn thấy hình.');
          }
        }

        chrome.runtime.sendMessage({ type: 'ASK_AI', payload, mode: currentMode }, (response) => {
          btn.disabled = false;
          btn.textContent = '🤖 Hỏi AI';

          if (chrome.runtime.lastError) {
            showError(resultDiv, chrome.runtime.lastError.message);
            return;
          }
          if (!response?.success) {
            showError(resultDiv, response?.error || 'Lỗi không xác định.');
            return;
          }
          showResult(resultDiv, response.data, currentMode, response.fromCache);
          if (autoFillEnabled) {
            autoFillAnswer(item, response.data, currentMode);
          }
        });
      });

      actionDiv.appendChild(btn);
      actionDiv.appendChild(resultDiv);
      item.appendChild(actionDiv);
    });

    // ── "Hỏi tất cả" banner ──
    injectAskAllBanner();
  }

  // ═══════════════════════════════════════════════════
  // ASK-ALL BANNER
  // ═══════════════════════════════════════════════════
  function injectAskAllBanner() {
    if (document.getElementById('hoangdz-ask-all-banner')) return;

    const container = document.querySelector(currentSelectors.container);
    if (!container) return;

    const banner = document.createElement('div');
    banner.id = 'hoangdz-ask-all-banner';

    const countEl = document.createElement('span');
    countEl.id = 'hoangdz-ask-all-count';
    updateAskAllCount(countEl);

    const btn = document.createElement('button');
    btn.id = 'hoangdz-ask-all-btn';
    btn.type = 'button';
    btn.innerHTML = '🚀 Hỏi tất cả câu hỏi';

    const stopBtn = document.createElement('button');
    stopBtn.id = 'hoangdz-ask-all-stop';
    stopBtn.type = 'button';
    stopBtn.textContent = '⏹ Dừng';
    stopBtn.style.display = 'none';

    const progressEl = document.createElement('span');
    progressEl.id = 'hoangdz-ask-all-progress';

    banner.append(btn, stopBtn, countEl, progressEl);
    container.insertAdjacentElement('beforebegin', banner);

    let stopRequested = false;

    btn.addEventListener('click', async () => {
      const allBtns = [...document.querySelectorAll('.hoangdz-ai-btn')]
        .filter(b => !b.disabled && b.textContent.includes('Hỏi AI'));

      if (allBtns.length === 0) {
        progressEl.textContent = ' — Không còn câu nào cần hỏi.';
        return;
      }

      stopRequested = false;
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang hỏi...';
      stopBtn.style.display = 'inline-flex';
      progressEl.textContent = '';

      for (let i = 0; i < allBtns.length; i++) {
        if (stopRequested) break;

        const qBtn = allBtns[i];
        progressEl.textContent = ` — Câu ${i + 1}/${allBtns.length}`;

        qBtn.click();

        // Chờ cho đến khi nút không còn disabled (AI đã trả lời)
        await waitForButton(qBtn, 60000);

        if (stopRequested) break;

        // Delay nhỏ giữa các request để tránh rate-limit
        if (i < allBtns.length - 1) await sleep(800);
      }

      btn.disabled = false;
      btn.innerHTML = '🚀 Hỏi tất cả câu hỏi';
      stopBtn.style.display = 'none';
      progressEl.textContent = stopRequested
        ? ' — Đã dừng.'
        : ' — ✅ Hoàn thành!';
    });

    stopBtn.addEventListener('click', () => {
      stopRequested = true;
      stopBtn.textContent = '⏳ Đang dừng...';
    });
  }

  function updateAskAllCount(el) {
    const n = document.querySelectorAll(currentSelectors.questionItem).length;
    el.textContent = `(${n} câu)`;
  }

  /** Chờ cho đến khi nút không còn bị disabled (hoặc timeout) */
  function waitForButton(btn, timeout = 60000) {
    return new Promise(resolve => {
      if (!btn.disabled) { resolve(); return; }
      const start = Date.now();
      const iv = setInterval(() => {
        if (!btn.disabled || Date.now() - start > timeout) {
          clearInterval(iv);
          resolve();
        }
      }, 300);
    });
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ═══════════════════════════════════════════════════
  // EXTRACT — LMS CŨ
  // ═══════════════════════════════════════════════════
  function extractLmsQuestion(item) {
    const title = item.querySelector(SELECTORS.lms.questionTitle)?.innerText?.trim()
      || item.innerText.slice(0, 1000);

    const options = Array.from(item.querySelectorAll(SELECTORS.lms.option)).map((opt, i) => {
      const input = opt.querySelector('input');
      const text = opt.innerText?.trim()
        || opt.querySelector('span')?.innerText?.trim()
        || '';
      return { index: i + 1, text, selected: Boolean(input?.checked) };
    });

    return { title, options, questionType: options.length ? 'multiple_choice' : 'fill_in' };
  }

  // ═══════════════════════════════════════════════════
  // EXTRACT — CANVAS PORTAL
  // ═══════════════════════════════════════════════════
  function extractPortalQuestion(item) {
    // 1. Ưu tiên lấy LaTeX source từ textarea ẩn (chính xác nhất)
    const latexTA = item.querySelector('textarea.textarea_question_text');
    let title = latexTA?.value?.trim() || '';

    // 2. Fallback: lấy text hiển thị từ .question_text
    if (!title) {
      const qtDiv = item.querySelector('.question_text');
      if (qtDiv) {
        // Lấy cả MathJax assistive text (nằm trong .MJX_Assistive_MathML)
        title = extractTextWithMath(qtDiv);
      }
    }

    // 3. Xác định loại câu hỏi
    const qTypeEl = item.querySelector('.question_type');
    const questionType = qTypeEl?.textContent?.trim() || 'unknown';

    // 4. Lấy đáp án theo loại
    let options = [];
    let isFillin = false;

    const answerEls = item.querySelectorAll('.answer');
    
    // Nếu có class .answer và không phải dạng điền khuyết
    if (answerEls.length > 0 && questionType !== 'numerical_question' && questionType !== 'short_answer_question') {
      // Trắc nghiệm (có thể là lúc đang làm hoặc đang xem lại bài)
      options = Array.from(answerEls).map((ans, i) => {
        const textEl = ans.querySelector('.answer_text');
        const labelEl = ans.querySelector('.answer_label');
        const htmlEl = ans.querySelector('.answer_html');

        const parseText = (el) => {
          let t = extractTextWithMath(el);
          return t === 'No answer text provided.' ? '' : t;
        };

        let text = parseText(textEl) || parseText(labelEl) || parseText(htmlEl) || '';
        
        if (!text) {
          // Fallback: lấy text trực tiếp từ thẻ .answer, loại bỏ text thừa trong chế độ review
          text = extractTextWithMath(ans);
          text = text.replace(/Correct Answer/ig, '').replace(/You Answered/ig, '').trim();
          if (text === 'No answer text provided.') text = '';
        }

        // Cứu cánh cuối cùng: nếu text vẫn rỗng do Canvas dùng class ẩn (display:none)
        if (!text && ans.textContent) {
          text = ans.textContent.replace(/Correct Answer/ig, '').replace(/You Answered/ig, '').trim();
          if (text === 'No answer text provided.') text = '';
        }

        const input = ans.querySelector('input[type="radio"], input[type="checkbox"]');
        const isSelected = input ? Boolean(input.checked) : ans.classList.contains('selected_answer');
        
        return { index: i + 1, text, selected: isSelected };
      }).filter(o => o.text);

    } else if (
      questionType === 'numerical_question' ||
      questionType === 'short_answer_question' ||
      item.querySelector('input.question_input')
    ) {
      // Fill-in answer — lấy giá trị đã nhập (nếu có)
      isFillin = true;
      const inputEl = item.querySelector('input.question_input');
      const submitted = inputEl?.value?.trim() || '';
      options = submitted ? [{ index: 1, text: `Đã điền: ${submitted}`, selected: true }] : [];

    } else if (questionType === 'file_upload_question') {
      isFillin = true;
      options = [{ index: 1, text: '[Câu hỏi yêu cầu nộp file]', selected: false }];
    }

    // 5. Kiểm tra có ảnh không — lấy cả src thật (dùng để fetch) và alt (mô tả)
    const imgEls = Array.from(item.querySelectorAll('.question_text img'));
    const imageSrcs = imgEls.map(img => img.src).filter(Boolean);  // absolute URL
    const imageAlts = imgEls.map(img => img.alt || '(hình vẽ)').filter(Boolean);

    return {
      title,
      options,
      questionType: isFillin ? 'fill_in' : 'multiple_choice',
      canvasType: questionType,
      hasImages: imageSrcs.length > 0,
      imageSrcs,
      imageAlts,
    };
  }

  /**
   * Trích xuất text kết hợp MathJax 2 & 3.
   *
   * MathJax 2 (Canvas cũ): dùng script[type="math/tex"] và script[type="math/tex; mode=display"]
   * MathJax 3 (Canvas mới): dùng mjx-container với thuộc tính math="..." hoặc annotation
   *
   * Output: text thô với công thức được bọc trong $...$ / $$$...$$$
   * để AI có thể đọc và renderMarkdown() hiển thị đẹp.
   */
  function extractTextWithMath(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);

    // ── MathJax 2: display math (block) ──
    clone.querySelectorAll('script[type="math/tex; mode=display"]').forEach(script => {
      const span = document.createElement('span');
      span.textContent = ` $$${script.textContent.trim()}$$ `;
      script.parentNode?.insertBefore(span, script);
    });

    // ── MathJax 2: inline math ──
    clone.querySelectorAll('script[type="math/tex"]').forEach(script => {
      const span = document.createElement('span');
      span.textContent = `$${script.textContent.trim()}$`;
      script.parentNode?.insertBefore(span, script);
    });

    // ── MathJax 3: mjx-container có thuộc tính math="..." ──
    clone.querySelectorAll('mjx-container[math]').forEach(container => {
      const latex = container.getAttribute('math') || '';
      const isDisplay = container.getAttribute('display') === 'true';
      const span = document.createElement('span');
      span.textContent = isDisplay ? ` $$${latex}$$ ` : `$${latex}$`;
      container.parentNode?.insertBefore(span, container);
    });

    // ── MathJax 3: lấy LaTeX từ annotation bên trong nếu không có thuộc tính math ──
    clone.querySelectorAll('mjx-container:not([math]) annotation[encoding="application/x-tex"]').forEach(ann => {
      const latex = ann.textContent.trim();
      const container = ann.closest('mjx-container');
      if (container && latex) {
        const isDisplay = container.getAttribute('display') === 'true';
        const span = document.createElement('span');
        span.textContent = isDisplay ? ` $$${latex}$$ ` : `$${latex}$`;
        container.parentNode?.insertBefore(span, container);
      }
    });

    // ── Image equations (Canvas) ──
    clone.querySelectorAll('img').forEach(img => {
      const span = document.createElement('span');
      if (img.classList.contains('equation_image')) {
        let latex = img.getAttribute('data-mathml') || img.alt || '';
        // Đôi khi Canvas bọc sẵn $$ hoặc \[ \] trong alt, ta làm sạch qua
        latex = latex.replace(/^\$\$?|\\\[|\\\]|\$\$?$/g, '').trim();
        span.textContent = ` $${latex}$ `;
      } else {
        span.textContent = img.alt ? ` [Ảnh: ${img.alt}] ` : ' [Ảnh] ';
      }
      img.parentNode?.insertBefore(span, img);
      img.remove();
    });

    // ── Xóa tất cả element MathJax render ──
    clone.querySelectorAll([
      '.MathJax_SVG', '.MathJax_Preview', '.MJX_Assistive_MathML',
      '.MathJax', '[id^="MathJax"]',
      'mjx-container', 'math'          // MathML/MathJax3 leftovers
    ].join(', ')).forEach(e => e.remove());

    // Dùng textContent thay vì innerText để bắt được cả text bị display:none
    const finalTxt = clone.innerText?.trim() || clone.textContent || '';
    return finalTxt.replace(/\s+/g, ' ').trim();
  }

  // ═══════════════════════════════════════════════════
  // VISION: Fetch image → base64 (dùng cookie phiên đăng nhập)
  // ═══════════════════════════════════════════════════
  /**
   * Fetch ảnh qua background.js để bypass CORS.
   * Content script bị chặn bởi CORS khi dùng credentials:'include' với CDN trả về wildcard.
   * Background script không bị giới hạn này.
   */
  async function fetchImageBase64(url) {
    console.log('[HoangDZ] Gửi yêu cầu fetch ảnh qua background:', url);
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'FETCH_IMAGE_BASE64', url }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[HoangDZ] Background error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        const base64 = response?.base64 || null;
        if (base64) {
          console.log('[HoangDZ] ✅ Background trả về ảnh OK, độ dài:', base64.length);
        } else {
          console.error('[HoangDZ] ❌ Background không lấy được ảnh:', response?.error);
        }
        resolve(base64);
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // RENDER KẾT QUẢ
  // ═══════════════════════════════════════════════════

  // ───────────────────────────────────────────────────
  // MATH RENDERING (KATEX)
  // ───────────────────────────────────────────────────

  /**
   * Tách text thành mảng segment: {type: 'block'|'inline'|'text', content: string}
   * Ưu tiên $$...$$ (block) trước $...$ (inline).
   */
  function splitByMath(text) {
    const segments = [];
    const regex = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      if (match[1] !== undefined) {
        segments.push({ type: 'block', content: match[1].trim() });
      } else {
        segments.push({ type: 'inline', content: match[2].trim() });
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      segments.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return segments;
  }

  /** Markdown đơn giản cho phần text (không có LaTeX) */
  function applyTextMarkdown(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code class="hoangdz-code">$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  /**
   * Render markdown + LaTeX bằng KaTeX cục bộ.
   */
  function renderMarkdown(text) {
    if (!text) return '';
    const parts = splitByMath(text);
    return parts.map(seg => {
      if (seg.type === 'block') {
        try {
          const html = katex.renderToString(seg.content, { displayMode: true, throwOnError: false });
          return `<div class="hoangdz-katex-block" style="overflow-x:auto; margin: 8px 0;">${html}</div>`;
        } catch (e) {
          return `<div class="hoangdz-katex-block"><span class="hoangdz-latex-block">${escapeHtml(seg.content)}</span></div>`;
        }
      }
      if (seg.type === 'inline') {
        try {
          const html = katex.renderToString(seg.content, { displayMode: false, throwOnError: false });
          return `<span class="hoangdz-katex-inline" style="margin: 0 2px;">${html}</span>`;
        } catch (e) {
          return `<code class="hoangdz-latex-inline">${escapeHtml(seg.content)}</code>`;
        }
      }
      return applyTextMarkdown(seg.content);
    }).join('');
  }

  function showResult(container, data, mode, fromCache = false) {
    container.textContent = '';

    // ── Cache badge ──
    if (fromCache) {
      const badge = document.createElement('span');
      badge.className = 'hoangdz-cache-badge';
      badge.textContent = '📦 Từ cache';
      container.appendChild(badge);
    }

    if (mode === 'portal' && data.questionType === 'fill_in') {
      const ansEl = document.createElement('p');
      ansEl.className = 'hoangdz-ai-answer';
      const textPart = richFormat
        ? renderMarkdown(String(data.answer || data.correct_text || ''))
        : escapeHtml(String(data.answer || data.correct_text || ''));
      ansEl.innerHTML = `<b>Đáp án:</b> <span class="hoangdz-answer-value">${textPart}</span>`;
      container.appendChild(ansEl);
    } else {
      const ansEl = document.createElement('p');
      ansEl.className = 'hoangdz-ai-answer';
      // Hiển thị correct_text: nếu richFormat bật thì render $LaTeX$
      const indexPart = escapeHtml(String(data.correct_index || '') + '. ');
      const textPart = richFormat
        ? renderMarkdown(data.correct_text || '')
        : escapeHtml(data.correct_text || '');
      ansEl.innerHTML = `<b>Đáp án đúng:</b> <span class="hoangdz-answer-value">${indexPart}${textPart}</span>`;
      container.appendChild(ansEl);
    }

    const expEl = document.createElement('p');
    expEl.className = 'hoangdz-ai-explanation';
    if (richFormat) {
      expEl.innerHTML = `<b>Giải thích:</b><br>${renderMarkdown(data.explanation || '')}`;
    } else {
      expEl.innerHTML = `<b>Giải thích:</b> ${escapeHtml(data.explanation || '')}`;
    }
    container.appendChild(expEl);

    if (typeof data.confidence === 'number') {
      const pct = Math.round(data.confidence * 100);
      const confEl = document.createElement('p');
      confEl.className = 'hoangdz-ai-confidence';
      const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
      confEl.innerHTML = `Độ chắc chắn: <span style="color:${color};font-weight:700">${pct}%</span>`;
      container.appendChild(confEl);
    }
  }

  function showError(container, message) {
    container.textContent = 'Lỗi: ' + message;
    container.classList.add('hoangdz-ai-error');
  }

  // ═══════════════════════════════════════════════════
  // AUTO-FILL ANSWER
  // ═══════════════════════════════════════════════════
  function autoFillAnswer(item, data, mode) {
    if (!data) return;
    
    console.log('[HoangDZ] autoFillAnswer called. Mode:', mode, 'Data:', data);

    // Hàm hỗ trợ điền giá trị cho các form có thể dùng React/Vue
    const setInputValue = (input, value) => {
      console.log('[HoangDZ] Đang điền giá trị:', value, 'vào ô:', input);
      input.focus(); // Focus vào ô trước
      
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, value);
      } else {
        input.value = value;
      }
      
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
      
      input.blur(); // Bỏ focus để kích hoạt sự kiện onBlur (nếu có)
      console.log('[HoangDZ] Đã điền xong!');
    };
    
    // Portal mode
    if (mode === 'portal') {
      if (data.questionType === 'fill_in' && data.answer !== undefined && data.answer !== '') {
        const input = item.querySelector('input.question_input, input[type="text"].numerical_question_input');
        if (input) {
          // Xóa các ký tự markdown dư thừa do AI có thể sinh ra (**6.0000** -> 6.0000)
          let cleanAns = String(data.answer).replace(/[*$`]/g, '').trim();
          setInputValue(input, cleanAns);
        } else {
          console.warn('[HoangDZ] Không tìm thấy ô input điền khuyết trong phần tử:', item);
        }
      } else if (data.questionType === 'multiple_choice' && data.correct_index) {
        const answers = item.querySelectorAll('.answer input[type="radio"], .answer input[type="checkbox"]');
        const target = answers[data.correct_index - 1];
        if (target && !target.checked) {
          target.click(); // Trigger click event
        }
      }
    }
    
    // LMS mode
    if (mode === 'lms') {
      if (data.questionType === 'fill_in' && data.answer !== undefined && data.answer !== '') {
        const input = item.querySelector('input[type="text"], input.form-control');
        if (input) {
          let cleanAns = String(data.answer).replace(/[*$`]/g, '').trim();
          setInputValue(input, cleanAns);
        }
      } else if (data.questionType === 'multiple_choice' && data.correct_index) {
        const answers = item.querySelectorAll(SELECTORS.lms.option + ' input');
        const target = answers[data.correct_index - 1];
        if (target && !target.checked) {
          target.click();
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // FLOATING CHAT
  // ═══════════════════════════════════════════════════
  function createFloatingChat() {
    if (document.getElementById('hoangdz-ai-chat-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'hoangdz-ai-chat-wrapper';

    const box = document.createElement('div');
    box.id = 'hoangdz-ai-chat-box';
    box.className = 'hoangdz-hidden';

    // ── Header (draggable) ──
    const header = document.createElement('div');
    header.id = 'hoangdz-ai-chat-header';
    header.innerHTML = `
      <span style="flex:1">🤖 AI Chat</span>
      <button id="hoangdz-ai-chat-clear-btn" title="Xóa lịch sử chat" style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:14px;padding:0 4px;">🗑</button>
      <button id="hoangdz-ai-chat-close-btn" title="Đóng" style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:16px;padding:0 4px;">✕</button>
    `;

    // ── Message area ──
    const msgArea = document.createElement('div');
    msgArea.id = 'hoangdz-ai-chat-content';

    // ── Image preview strip ──
    const imgPreview = document.createElement('div');
    imgPreview.id = 'hoangdz-ai-chat-img-preview';
    imgPreview.style.display = 'none';

    // ── Input row ──
    const inputArea = document.createElement('div');
    inputArea.id = 'hoangdz-ai-chat-input-area';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    const attachBtn = document.createElement('button');
    attachBtn.id = 'hoangdz-ai-chat-attach-btn';
    attachBtn.type = 'button';
    attachBtn.title = 'Đính kèm ảnh';
    attachBtn.textContent = '📎';

    const textInput = document.createElement('input');
    textInput.id = 'hoangdz-ai-chat-input';
    textInput.type = 'text';
    textInput.placeholder = 'Nhập tin nhắn... (Enter)';

    const sendBtn = document.createElement('button');
    sendBtn.id = 'hoangdz-ai-chat-send-btn';
    sendBtn.type = 'button';
    sendBtn.textContent = '➤';

    inputArea.append(fileInput, attachBtn, textInput, sendBtn);

    // ── Resize handles: n (top), w (left), nw (top-left corner) ──
    ['n', 'w', 'nw'].forEach(dir => {
      const h = document.createElement('div');
      h.className = `hoangdz-resize-handle hoangdz-resize-${dir}`;
      box.appendChild(h);
    });

    // ── Toggle button ──
    const toggle = document.createElement('button');
    toggle.id = 'hoangdz-ai-chat-toggle';
    toggle.type = 'button';
    toggle.textContent = '🤖';

    box.append(header, msgArea, imgPreview, inputArea);
    wrapper.append(box, toggle);
    document.body.appendChild(wrapper);

    // ── State: selected images ──
    let pendingImgs = []; // [{dataUrl, name}]

    // ── Attach ──
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      for (const f of Array.from(fileInput.files)) {
        const dataUrl = await readFileAsBase64(f);
        if (dataUrl) pendingImgs.push({ dataUrl, name: f.name });
      }
      fileInput.value = '';
      renderPreviews(imgPreview, pendingImgs);
    });

    // ── Send ──
    const doSend = () => {
      const msg = textInput.value.trim();
      if (!msg && pendingImgs.length === 0) return;
      textInput.value = '';
      const imgs = pendingImgs.map(i => i.dataUrl);
      pendingImgs = [];
      renderPreviews(imgPreview, pendingImgs);
      appendMsg('Bạn', msg, false, imgs);
      appendMsg('AI', 'Đang trả lời...', true);
      chrome.runtime.sendMessage(
        { type: 'CHAT_CONVERSATION', text: msg, images: imgs },
        (res) => {
          removeLoadingMsg();
          if (chrome.runtime.lastError) { appendMsg('Lỗi', chrome.runtime.lastError.message); return; }
          if (res?.success) appendMsg('AI', res.reply);
          else appendMsg('Lỗi', res?.error || 'Không phản hồi.');
        }
      );
    };
    textInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });
    sendBtn.addEventListener('click', doSend);

    // ── Paste ảnh bằng Ctrl+V ──
    textInput.addEventListener('paste', async (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter(it => it.type.startsWith('image/'));
      if (imageItems.length === 0) return; // không có ảnh → paste text bình thường
      e.preventDefault(); // chặn paste text khi có ảnh
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (!file) continue;
        const dataUrl = await readFileAsBase64(file);
        if (dataUrl) pendingImgs.push({ dataUrl, name: 'clipboard.png' });
      }
      renderPreviews(imgPreview, pendingImgs);
    });

    // ── Toggle open/close ──
    toggle.addEventListener('click', () => box.classList.toggle('hoangdz-hidden'));

    // ── Close button ──
    header.querySelector('#hoangdz-ai-chat-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      box.classList.add('hoangdz-hidden');
    });

    // ── Clear chat history ──
    header.querySelector('#hoangdz-ai-chat-clear-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Xóa toàn bộ lịch sử chat?')) {
        chrome.storage.local.remove('chatHistory');
        msgArea.innerHTML = '';
        appendMsg('AI', 'Lịch sử đã được xóa. Bắt đầu cuộc trò chuyện mới!');
      }
    });

    // ── Draggable header ──
    makeDraggable(wrapper, header);

    // ── Resizable borders ──
    makeResizable(box);
  }

  // ── Drag wrapper by header ──
  function makeDraggable(wrapper, handle) {
    handle.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const cs = window.getComputedStyle(wrapper);
      let r0 = parseInt(cs.right) || 20;
      let b0 = parseInt(cs.bottom) || 20;
      const onMove = e => {
        wrapper.style.right = Math.max(0, r0 - (e.clientX - startX)) + 'px';
        wrapper.style.bottom = Math.max(0, b0 - (e.clientY - startY)) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ── Resize by dragging n / w / nw handles ──
  function makeResizable(box) {
    box.querySelectorAll('.hoangdz-resize-handle').forEach(handle => {
      const dir = handle.className.includes('nw') ? 'nw'
        : handle.className.includes('n') ? 'n' : 'w';
      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        const startX = e.clientX, startY = e.clientY;
        const startW = box.offsetWidth, startH = box.offsetHeight;
        const onMove = e => {
          if (dir === 'w' || dir === 'nw') {
            // dragging left → wider (box anchored to right)
            box.style.width = Math.max(280, startW - (e.clientX - startX)) + 'px';
          }
          if (dir === 'n' || dir === 'nw') {
            // dragging up → taller (box anchored to bottom)
            box.style.height = Math.max(300, startH - (e.clientY - startY)) + 'px';
          }
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  // ── Read file as base64 data URL ──
  function readFileAsBase64(file) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(file);
    });
  }

  // ── Render image thumbnails in preview strip ──
  function renderPreviews(container, imgs) {
    container.innerHTML = '';
    container.style.display = imgs.length ? 'flex' : 'none';
    imgs.forEach((img, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'hoangdz-img-thumb';
      const el = document.createElement('img');
      el.src = img.dataUrl;
      const rm = document.createElement('button');
      rm.className = 'hoangdz-img-thumb-rm';
      rm.textContent = '×';
      rm.addEventListener('click', () => { imgs.splice(i, 1); renderPreviews(container, imgs); });
      wrap.append(el, rm);
      container.appendChild(wrap);
    });
  }

  function appendMsg(sender, text, loading = false, images = []) {
    const area = document.getElementById('hoangdz-ai-chat-content');
    if (!area) return;
    const row = document.createElement('div');
    row.className = 'hoangdz-ai-chat-msg' + (loading ? ' hoangdz-ai-loading' : '');
    const name = document.createElement('strong');
    name.textContent = sender + ': ';
    const body = document.createElement('span');
    // Render markdown trong chat khi richFormat bật
    if (richFormat && sender === 'AI' && !loading) {
      body.innerHTML = renderMarkdown(text);
      attachMathImageFallbacks(body);
    } else {
      body.textContent = text;
    }
    row.append(name, body);
    if (images.length) {
      const strip = document.createElement('div');
      strip.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;';
      images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #d1d5db;';
        strip.appendChild(img);
      });
      row.appendChild(strip);
    }
    area.appendChild(row);
    area.scrollTop = area.scrollHeight;
  }

  function removeLoadingMsg() {
    document.querySelectorAll('.hoangdz-ai-loading').forEach(el => el.remove());
  }

  // ═══════════════════════════════════════════════════
  // UTIL
  // ═══════════════════════════════════════════════════
  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

})();
