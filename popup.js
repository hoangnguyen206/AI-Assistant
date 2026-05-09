// =====================================================
// Danh sách nhà cung cấp & model cho 9Router
// Format model: prefix/tên-model (theo chuẩn 9Router)
// =====================================================
const PROVIDERS = [
  {
    group: '🆓 Free Tier (không cần API Key riêng)',
    items: [
      {
        id: 'kr', name: 'Kiro AI (Free)',
        models: [
          { label: 'Claude Sonnet 4.5', value: 'kr/claude-sonnet-4.5' },
          { label: 'Claude 3.5 Haiku', value: 'kr/claude-3-5-haiku-20241022' },
          { label: 'Claude 3.7 Sonnet', value: 'kr/claude-3-7-sonnet-20250219' },
        ]
      },
      {
        id: 'oc', name: 'OpenCode Free',
        models: [
          { label: 'GPT-4o', value: 'oc/gpt-4o' },
          { label: 'GPT-4o Mini', value: 'oc/gpt-4o-mini' },
          { label: 'o3 Mini', value: 'oc/o3-mini' },
        ]
      },
      {
        id: 'openrouter', name: 'OpenRouter (Free Models)',
        models: [
          { label: 'Gemini Flash 1.5', value: 'openrouter/google/gemini-flash-1.5' },
          { label: 'Llama 3.1 8B Instruct', value: 'openrouter/meta-llama/llama-3.1-8b-instruct:free' },
          { label: 'Mistral 7B Instruct', value: 'openrouter/mistralai/mistral-7b-instruct:free' },
        ]
      },
    ]
  },
  {
    group: '🔑 API Key (cần nhập key riêng)',
    items: [
      {
        id: 'gemini', name: 'Google Gemini',
        models: [
          { label: 'Gemini 2.5 Pro', value: 'gemini/gemini-2.5-pro' },
          { label: 'Gemini 2.0 Flash', value: 'gemini/gemini-2.0-flash' },
          { label: 'Gemini 1.5 Pro', value: 'gemini/gemini-1.5-pro' },
          { label: 'Gemini 1.5 Flash', value: 'gemini/gemini-1.5-flash' },
        ]
      },
      {
        id: 'oa', name: 'OpenAI',
        models: [
          { label: 'GPT-4o', value: 'oa/gpt-4o' },
          { label: 'GPT-4o Mini', value: 'oa/gpt-4o-mini' },
          { label: 'o4 Mini', value: 'oa/o4-mini' },
          { label: 'o3 Mini', value: 'oa/o3-mini' },
        ]
      },
      {
        id: 'anthropic', name: 'Anthropic',
        models: [
          { label: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3-5-sonnet-20241022' },
          { label: 'Claude 3.5 Haiku', value: 'anthropic/claude-3-5-haiku-20241022' },
          { label: 'Claude 3 Opus', value: 'anthropic/claude-3-opus-20240229' },
        ]
      },
      {
        id: 'deepseek', name: 'DeepSeek',
        models: [
          { label: 'DeepSeek Flash', value: 'ds/deepseek-v4-flash' },
          { label: 'DeepSeek Chat', value: 'ds/deepseek-chat' },
          { label: 'DeepSeek-R1', value: 'ds/deepseek-reasoner' }
        ]
      },
      {
        id: 'groq', name: 'Groq',
        models: [
          { label: 'Llama 3.3 70B', value: 'groq/llama-3.3-70b-versatile' },
          { label: 'Llama 3.1 8B', value: 'groq/llama-3.1-8b-instant' },
          { label: 'Mixtral 8x7B', value: 'groq/mixtral-8x7b-32768' },
        ]
      },
      {
        id: 'xai', name: 'xAI (Grok)',
        models: [
          { label: 'Grok 3', value: 'xai/grok-3' },
          { label: 'Grok 3 Mini', value: 'xai/grok-3-mini' },
          { label: 'Grok 2', value: 'xai/grok-2' },
        ]
      },
      {
        id: 'mistral', name: 'Mistral AI',
        models: [
          { label: 'Mistral Large', value: 'mistral/mistral-large-latest' },
          { label: 'Mistral Small', value: 'mistral/mistral-small-latest' },
          { label: 'Codestral', value: 'mistral/codestral-latest' },
        ]
      },
      {
        id: 'together', name: 'Together AI',
        models: [
          { label: 'Llama 3.1 405B', value: 'together/meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo' },
          { label: 'Mixtral 8x22B', value: 'together/mistralai/Mixtral-8x22B-Instruct-v0.1' },
        ]
      },
      {
        id: 'cohere', name: 'Cohere',
        models: [
          { label: 'Command R+', value: 'cohere/command-r-plus' },
          { label: 'Command R', value: 'cohere/command-r' },
        ]
      },
      {
        id: 'siliconflow', name: 'SiliconFlow',
        models: [
          { label: 'Qwen2.5 72B', value: 'siliconflow/Qwen/Qwen2.5-72B-Instruct' },
          { label: 'DeepSeek V3', value: 'siliconflow/deepseek-ai/DeepSeek-V3' },
        ]
      },
      {
        id: 'ollama', name: 'Ollama Local',
        models: [
          { label: 'Llama3.2', value: 'ollama/llama3.2' },
          { label: 'Qwen2.5', value: 'ollama/qwen2.5' },
          { label: 'Gemma3', value: 'ollama/gemma3' },
        ]
      },
    ]
  },
  {
    group: '🔐 OAuth (đăng nhập qua IDE)',
    items: [
      {
        id: 'cx', name: 'OpenAI Codex (OAuth)',
        models: [
          { label: 'GPT 5.5 (mới nhất)', value: 'cx/gpt-5.5' },
          { label: 'GPT 5.3 Codex (xHigh)', value: 'cx/gpt-5.3-codex-xhigh' },
          { label: 'GPT 5.3 Codex (High)', value: 'cx/gpt-5.3-codex-high' },
          { label: 'GPT 5.3 Codex', value: 'cx/gpt-5.3-codex' },
          { label: 'GPT 5.3 Codex Spark', value: 'cx/gpt-5.3-codex-spark' },
          { label: 'GPT 5.3 Codex (Low)', value: 'cx/gpt-5.3-codex-low' },
          { label: 'GPT 5.2 Codex', value: 'cx/gpt-5.2-codex' },
          { label: 'GPT 5.2', value: 'cx/gpt-5.2' },
          { label: 'GPT 5.1 Codex Max', value: 'cx/gpt-5.1-codex-max' },
          { label: 'GPT 5.1 Codex (High)', value: 'cx/gpt-5.1-codex-mini-high' },
          { label: 'GPT 5.1 Codex Mini', value: 'cx/gpt-5.1-codex-mini' },
          { label: 'GPT 5.1 Codex', value: 'cx/gpt-5.1-codex' },
          { label: 'GPT 5.1', value: 'cx/gpt-5.1' },
          { label: 'GPT 5 Codex', value: 'cx/gpt-5-codex' },
          { label: 'GPT 5 Codex Mini', value: 'cx/gpt-5-codex-mini' },
        ]
      },
      {
        id: 'gh', name: 'GitHub Copilot',
        models: [
          { label: 'GPT-4o', value: 'gh/gpt-4o' },
          { label: 'Claude 3.5 Sonnet', value: 'gh/claude-3.5-sonnet' },
          { label: 'o3 Mini', value: 'gh/o3-mini' },
        ]
      },
      {
        id: 'cursor', name: 'Cursor IDE',
        models: [
          { label: 'Claude 3.5 Sonnet', value: 'cursor/claude-3.5-sonnet' },
          { label: 'GPT-4o', value: 'cursor/gpt-4o' },
          { label: 'Claude 3.7 Sonnet', value: 'cursor/claude-3.7-sonnet' },
        ]
      },
      {
        id: 'cc', name: 'Claude Code',
        models: [
          { label: 'Claude Sonnet 4.5', value: 'cc/claude-sonnet-4.5' },
          { label: 'Claude Opus 4.5', value: 'cc/claude-opus-4.5' },
        ]
      },
    ]
  }
];

// =====================================================
// Khởi tạo popup
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  // ── Element refs ──
  const providerSelect = document.getElementById('providerSelect');
  const modelSelect = document.getElementById('modelSelect');
  const customModelRow = document.getElementById('customModelRow');
  const customModelInput = document.getElementById('customModelInput');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');
  const enabledToggle = document.getElementById('enabledToggle');
  const powerLabel = document.getElementById('powerLabel');
  const settingsArea = document.getElementById('settingsArea');
  const richFormatToggle = document.getElementById('richFormatToggle');
  const autoFillToggle = document.getElementById('autoFillToggle');
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  const cacheStatusEl = document.getElementById('cacheStatus');

  // ── Tab switching ──
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'panelStats') loadStats();
    });
  });

  // ── Build provider dropdown ──
  PROVIDERS.forEach(group => {
    const optGroup = document.createElement('optgroup');
    optGroup.label = group.group;
    group.items.forEach(provider => {
      const opt = document.createElement('option');
      opt.value = provider.id;
      opt.textContent = provider.name;
      optGroup.appendChild(opt);
    });
    providerSelect.appendChild(optGroup);
  });

  // ── Populate model dropdown ──
  function populateModels(providerId) {
    modelSelect.innerHTML = '';
    const allProviders = PROVIDERS.flatMap(g => g.items);
    const provider = allProviders.find(p => p.id === providerId);
    if (provider) {
      provider.models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.label;
        modelSelect.appendChild(opt);
      });
    }
    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = '✏️ Khác (nhập tay)...';
    modelSelect.appendChild(customOpt);
    toggleCustomInput();
  }

  function toggleCustomInput() {
    customModelRow.style.display = modelSelect.value === '__custom__' ? 'block' : 'none';
  }

  providerSelect.addEventListener('change', () => populateModels(providerSelect.value));
  modelSelect.addEventListener('change', toggleCustomInput);

  // ── Load saved settings ──
  chrome.storage.local.get(
    ['providerId', 'modelName', 'apiKey', 'siteMode', 'extensionEnabled', 'richFormat', 'autoFillEnabled'],
    (result) => {
      // Extension toggle
      const isEnabled = result.extensionEnabled !== false;
      applyEnabledState(isEnabled);

      // Site mode
      const savedMode = result.siteMode || 'portal';
      const modeRadio = document.querySelector(`input[name="siteMode"][value="${savedMode}"]`);
      if (modeRadio) modeRadio.checked = true;

      // Provider + model
      const savedProvider = result.providerId || 'kr';
      providerSelect.value = savedProvider;
      populateModels(savedProvider);

      const savedModel = result.modelName || '';
      let matched = false;
      for (const opt of modelSelect.options) {
        if (opt.value === savedModel) { modelSelect.value = savedModel; matched = true; break; }
      }
      if (!matched && savedModel) {
        modelSelect.value = '__custom__';
        customModelInput.value = savedModel;
        toggleCustomInput();
      }

      apiKeyInput.value = result.apiKey || '';

      // Toggles
      richFormatToggle.checked = result.richFormat === true;
      autoFillToggle.checked = result.autoFillEnabled !== false; // Mặc định bật
    }
  );

  // ── Power toggle ──
  enabledToggle.addEventListener('change', () => {
    const enabled = enabledToggle.checked;
    applyEnabledState(enabled);
    chrome.storage.local.set({ extensionEnabled: enabled }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTENSION_TOGGLE', enabled });
        }
      });
    });
  });

  function applyEnabledState(enabled) {
    enabledToggle.checked = enabled;
    powerLabel.textContent = enabled ? 'ON' : 'OFF';
    powerLabel.className = 'power-label ' + (enabled ? 'on' : 'off');
    document.body.classList.toggle('disabled-mode', !enabled);
    settingsArea.classList.toggle('dimmed', !enabled);
  }

  // ── Rich format toggle ──
  richFormatToggle.addEventListener('change', () => {
    const isRich = richFormatToggle.checked;
    chrome.storage.local.set({ richFormat: isRich }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'RICH_FORMAT_CHANGED', richFormat: isRich });
        }
      });
    });
  });

  // ── Auto Fill toggle ──
  autoFillToggle.addEventListener('change', () => {
    const isAutoFill = autoFillToggle.checked;
    chrome.storage.local.set({ autoFillEnabled: isAutoFill }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'AUTOFILL_CHANGED', autoFillEnabled: isAutoFill });
        }
      });
    });
  });

  // ── Save settings ──
  saveBtn.addEventListener('click', () => {
    const siteMode = document.querySelector('input[name="siteMode"]:checked')?.value || 'portal';
    const providerId = providerSelect.value;
    const modelName = modelSelect.value === '__custom__'
      ? customModelInput.value.trim()
      : modelSelect.value;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) { setStatus('Vui lòng nhập Bearer Token.', true); return; }
    if (!modelName) { setStatus('Vui lòng chọn hoặc nhập tên model.', true); return; }

    chrome.storage.local.set({ siteMode, providerId, modelName, apiKey }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SITE_MODE_CHANGED', siteMode });
        }
      });
      setStatus('✅ Đã lưu — trang sẽ tự cập nhật!', false);
    });
  });

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#dc2626' : '#16a34a';
  }

  // ── Clear cache ──
  clearCacheBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, () => {
      cacheStatusEl.textContent = '✅ Đã xóa cache câu hỏi!';
      setTimeout(() => { cacheStatusEl.textContent = ''; }, 3000);
      loadStats(); // refresh stats
    });
  });

  // ── Load Stats ──
  function loadStats() {
    chrome.storage.local.get('stats', ({ stats }) => {
      const data = Array.isArray(stats) ? stats : [];

      const total = data.length;
      const cacheHits = data.filter(d => d.cached).length;
      const cacheHitPct = total > 0 ? Math.round((cacheHits / total) * 100) : 0;

      const withConf = data.filter(d => typeof d.confidence === 'number');
      const avgConf = withConf.length > 0
        ? Math.round((withConf.reduce((s, d) => s + d.confidence, 0) / withConf.length) * 100)
        : null;

      const fillInCount = data.filter(d => d.questionType === 'fill_in').length;

      document.getElementById('statTotal').textContent = total;
      document.getElementById('statCacheHit').textContent = cacheHitPct + '%';
      document.getElementById('statConfidence').textContent = avgConf !== null ? avgConf + '%' : '—';
      document.getElementById('statFillIn').textContent = fillInCount;

      // Model stats
      const modelCounts = {};
      data.forEach(d => { if (d.model) modelCounts[d.model] = (modelCounts[d.model] || 0) + 1; });
      const sortedModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

      const modelsEl = document.getElementById('statModels');
      if (sortedModels.length === 0) {
        modelsEl.textContent = 'Chưa có dữ liệu.';
      } else {
        modelsEl.innerHTML = '';
        sortedModels.forEach(([model, count]) => {
          const pct = Math.round((count / total) * 100);
          const shortName = model.split('/').pop();
          const wrap = document.createElement('div');
          wrap.className = 'stat-bar-wrap';
          wrap.innerHTML = `
            <div class="stat-bar-label">
              <span title="${model}">${shortName}</span>
              <span>${count} lần (${pct}%)</span>
            </div>
            <div class="stat-bar"><div class="stat-bar-fill" style="width:${pct}%"></div></div>`;
          modelsEl.appendChild(wrap);
        });
      }
    });
  }
});
