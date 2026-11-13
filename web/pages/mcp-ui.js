/**
 * Open Arbor v2.2 Model Context Protocol (MCP) Playground UI (web/pages/mcp-ui.js)
 * Connects the browser playground directly to server/mcp/mcpCore.mjs so every
 * client-side simulation runs identical logic to server/mcp/openarbor-mcp.mjs.
 *
 * License: AGPL-3.0-only
 */

import txOrdinances from '../../data/ordinances/central_texas_ordinances.json';
import orOrdinances from '../../data/ordinances/rogue_valley_oregon_ordinances.json';
import { FIXED_PARITY_CASES } from '../presets.js';
import {
  MCP_TOOLS as CORE_MCP_TOOLS,
  executeMcpTool,
  MAX_EVALUATE_TREES,
  MAX_JURISDICTION_ID_LENGTH,
  MAX_NARRATIVE_LENGTH,
} from '../../server/mcp/mcpCore.mjs';

export { MAX_EVALUATE_TREES, MAX_JURISDICTION_ID_LENGTH, MAX_NARRATIVE_LENGTH };

const SAMPLE_RAP_ASSESSMENT = FIXED_PARITY_CASES?.[0]?.assessment || {
  specimen: {
    species_scientific: 'Quercus garryana',
    species_common: 'Oregon White Oak',
    dbh_inches: 32,
  },
  structural_baseline: {
    t_over_r_ratio: 0.52,
    srz_feet: 9.8,
  },
  soil_and_rhizosphere: {
    tiz_area_m2: 120,
    crz_disturbance_pct: 12,
  },
  recommendation: 'RETAIN_AND_REMEDIATE',
};

const ALL_ORDINANCE_ENTRIES = [
  ...(txOrdinances.municipalities || []).map((record) => ({
    record,
    file: 'data/ordinances/central_texas_ordinances.json',
    region: txOrdinances.region,
  })),
  ...(orOrdinances.municipalities || []).map((record) => ({
    record,
    file: 'data/ordinances/rogue_valley_oregon_ordinances.json',
    region: orOrdinances.region,
  })),
];

const ORDINANCE_CATALOG = new Map(
  ALL_ORDINANCE_ENTRIES.map((entry) => [entry.record.id.toLowerCase(), entry])
);

const MCP_UI_TOOL_META = {
  openarbor_consult: {
    module: 'Unified Consult',
    defaultArgs: {
      dbh_inches: 30,
      species: 'Live Oak',
      jurisdiction_id: 'tx-austin',
      audience: 'homeowner',
      cavity_pct: 62,
      crz_disturbed_pct: 10,
      decay_measurement_method: 'visual_only',
    },
  },
  calculate_root_zone: {
    module: 'rootZone.js',
    defaultArgs: {
      dbh: 30,
      unit: 'inches',
      standard: 'US_1_1',
      multiplier: 1.0,
      min_radius_feet: 0,
    },
  },
  evaluate_ordinance: {
    module: 'ordinanceEngine.js',
    defaultArgs: {
      jurisdiction_id: 'tx-austin',
      trees: [
        {
          tag: 'T-01',
          species_common: 'Live Oak',
          species_scientific: 'Quercus virginiana',
          dbh: 30,
          crz_disturbed_pct: 10,
          removal: false,
        },
      ],
    },
  },
  calculate_ecosystem_benefits: {
    module: 'ecosystemBenefits.js',
    defaultArgs: {
      dbh_inches: 30,
      species: 'Quercus virginiana',
      condition: 'Good',
      land_use: 'Residential',
      projection_years: 20,
    },
  },
  rap_biomechanics: {
    module: 'rapEngine.js',
    defaultArgs: {
      assessment: SAMPLE_RAP_ASSESSMENT,
    },
  },
  rap_lint: {
    module: 'rapEngine.js',
    defaultArgs: {
      assessment: SAMPLE_RAP_ASSESSMENT,
    },
  },
  lookup_ordinance: {
    module: 'ordinanceCatalog',
    defaultArgs: {
      jurisdiction_id: 'tx-austin',
    },
  },
  validate_soil_function: {
    module: 'soilFunction.js',
    defaultArgs: {
      soil_function: {
        infiltration_mm_hr: 24,
        organic_matter_percent: 4.5,
        measurement_dates: ['2026-09-15'],
        source: 'Double-ring infiltrometer + Loss-on-Ignition lab',
        method: 'ASTM D3385',
      },
      tiz_area_m2: 110,
    },
  },
  leo_rap_verify: {
    module: 'leoRapEngine.js',
    defaultArgs: {
      assessment: SAMPLE_RAP_ASSESSMENT,
      jurisdiction_id: 'or-ashland',
      run_self_audit: true,
    },
  },
};

export const MCP_TOOLS = CORE_MCP_TOOLS.map((tool) => {
  const uiMeta = MCP_UI_TOOL_META[tool.name] || { module: 'mcpCore.mjs', defaultArgs: {} };
  return {
    ...tool,
    module: uiMeta.module,
    defaultArgs: uiMeta.defaultArgs,
  };
});

const CONSULT_PRESETS = {
  homeowner: {
    circumference_inches: 94.25,
    species: 'Live Oak',
    jurisdiction_id: 'tx-austin',
    audience: 'homeowner',
    cavity_pct: 62,
    crz_disturbed_pct: 10,
    decay_measurement_method: 'visual_only',
  },
  practitioner: {
    dbh_inches: 32,
    species: 'Oregon White Oak',
    jurisdiction_id: 'or-ashland',
    audience: 'practitioner',
    cavity_pct: 48,
    crz_disturbed_pct: 12,
    decay_measurement_method: 'sonic_tomography',
    infiltration_mm_hr: 12,
    organic_matter_percent: 4.5,
  },
  municipal: {
    dbh_inches: 30,
    species: 'Live Oak',
    jurisdiction_id: 'tx-austin',
    audience: 'municipal',
    crz_disturbed_pct: 20,
    proposed_removal: true,
  },
  'cedar-park': {
    dbh_inches: 24,
    species: 'Live Oak',
    jurisdiction_id: 'tx-cedar-park',
    audience: 'homeowner',
    crz_disturbed_pct: 10,
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function copyTextWithFeedback(button, text) {
  if (!button || !text) return;
  const originalLabel = button.dataset.origLabel || button.textContent;
  button.dataset.origLabel = originalLabel;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.style.position = 'absolute';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Copy Failed';
  }
  setTimeout(() => {
    button.textContent = originalLabel;
  }, 1500);
}

/**
 * Execute an Open Arbor MCP tool synchronously in the browser with identical
 * semantics and security limits to server/mcp/openarbor-mcp.mjs.
 */
export function executeMcpToolInBrowser(name, args = {}) {
  return executeMcpTool(name, args, ORDINANCE_CATALOG);
}

/**
 * Mount harness setup tabs, Steward Agent Pack previews, consult audience presets,
 * and the 9-tool interactive JSON-RPC 2.0 inspector on /mcp/.
 */
export function initMcpPlaygroundUI() {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('mcp-playground-root');
  if (!root) return;

  // 1. Harness connection tabs (Claude Code, Codex, Hermes, Cursor, Claude Desktop, Antigravity)
  const harnessTabs = Array.from(root.querySelectorAll('[data-harness-tab]'));
  const harnessPanels = Array.from(root.querySelectorAll('[data-harness-panel]'));

  function selectHarness(harnessId) {
    harnessTabs.forEach((tab) => {
      const isSelected = tab.getAttribute('data-harness-tab') === harnessId;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
    harnessPanels.forEach((panel) => {
      const matches = panel.getAttribute('data-harness-panel') === harnessId;
      panel.hidden = !matches;
    });
  }

  harnessTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      selectHarness(tab.getAttribute('data-harness-tab'));
    });
  });

  // 2. Copy command / snippet buttons
  root.querySelectorAll('[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (targetEl) {
        copyTextWithFeedback(btn, targetEl.textContent || '');
      }
    });
  });

  // 3. Steward Agent Pack live preview and copy drawer
  const previewWrap = document.getElementById('mcp-agent-preview-wrap');
  const previewTitle = document.getElementById('mcp-agent-preview-title');
  const previewCode = document.getElementById('mcp-agent-preview-code');
  const btnCopyAgentPreview = document.getElementById('btn-copy-agent-preview');
  const btnCloseAgentPreview = document.getElementById('btn-close-agent-preview');

  root.querySelectorAll('[data-agent-preview]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const url = btn.getAttribute('data-agent-preview');
      const label = btn.getAttribute('data-agent-label') || url || 'Agent File';
      if (!url || !previewWrap || !previewCode) return;

      previewWrap.hidden = false;
      if (previewTitle) previewTitle.textContent = label;
      previewCode.textContent = `Loading ${label}...`;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        previewCode.textContent = text;
      } catch (err) {
        previewCode.textContent = `Unable to load ${label} from static server (${err.message}). Check agents/openarbor-steward/ in the repository.`;
      }
    });
  });

  btnCopyAgentPreview?.addEventListener('click', () => {
    copyTextWithFeedback(btnCopyAgentPreview, previewCode?.textContent || '');
  });

  btnCloseAgentPreview?.addEventListener('click', () => {
    if (previewWrap) previewWrap.hidden = true;
  });

  // 4. Interactive JSON-RPC 2.0 9-tool inspector
  let activeToolName = MCP_TOOLS[0].name;
  let requestCounter = 1;

  const selectorEl = document.getElementById('mcp-tool-selector');
  const metaEl = document.getElementById('mcp-active-tool-meta');
  const argsEditor = document.getElementById('mcp-args-editor');
  const argsError = document.getElementById('mcp-args-error');
  const reqPreview = document.getElementById('mcp-request-preview');
  const resPreview = document.getElementById('mcp-response-preview');
  const latencyBadge = document.getElementById('mcp-latency-badge');

  function getActiveTool() {
    return MCP_TOOLS.find((t) => t.name === activeToolName) || MCP_TOOLS[0];
  }

  function renderToolSelector() {
    if (!selectorEl) return;
    selectorEl.innerHTML = MCP_TOOLS.map(
      (t) => `<button
        type="button"
        role="tab"
        aria-selected="${t.name === activeToolName ? 'true' : 'false'}"
        class="oa-mcp-tool-btn ${t.name === activeToolName ? 'active' : ''}"
        data-mcp-tool="${escapeHtml(t.name)}"
      >
        <span class="oa-mcp-tool-name">${escapeHtml(t.name)}</span>
        <span class="oa-mcp-tool-mod">${escapeHtml(t.module)}</span>
      </button>`
    ).join('');

    selectorEl.querySelectorAll('[data-mcp-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeToolName = btn.getAttribute('data-mcp-tool') || MCP_TOOLS[0].name;
        renderToolSelector();
        loadToolDefaults(true);
      });
    });
  }

  function renderMeta(tool) {
    if (!metaEl) return;
    const reqFields = tool.inputSchema?.required || [];
    const propKeys = Object.keys(tool.inputSchema?.properties || {});
    metaEl.innerHTML = `
      <div class="muni-row">
        <div>
          <strong><code>${escapeHtml(tool.name)}</code></strong>
          <span class="badge badge-protected" style="margin-left: 6px;">${escapeHtml(tool.module)}</span>
          <p class="hint" style="margin-top: 6px;">${escapeHtml(tool.description)}</p>
        </div>
        <div class="hint" style="text-align: right; max-width: 320px;">
          <div><strong>Required:</strong> ${reqFields.length ? reqFields.map((f) => `<code>${escapeHtml(f)}</code>`).join(', ') : 'None (all fields optional)'}</div>
          <div style="margin-top: 4px;"><strong>Parameters (${propKeys.length}):</strong> ${propKeys.map((k) => `<code>${escapeHtml(k)}</code>`).join(', ')}</div>
        </div>
      </div>
    `;
  }

  function setArgsError(message) {
    if (!argsError) return;
    if (!message) {
      argsError.hidden = true;
      argsError.textContent = '';
    } else {
      argsError.hidden = false;
      argsError.textContent = message;
    }
  }

  function runCurrentToolCall() {
    const tool = getActiveTool();
    if (!argsEditor) return;

    let parsedArgs;
    try {
      parsedArgs = JSON.parse(argsEditor.value || '{}');
      setArgsError('');
    } catch (err) {
      setArgsError(`Invalid JSON payload in params.arguments: ${err.message}`);
      return;
    }

    const reqId = requestCounter++;
    const rpcRequest = {
      jsonrpc: '2.0',
      id: reqId,
      method: 'tools/call',
      params: {
        name: tool.name,
        arguments: parsedArgs,
      },
    };
    if (reqPreview) {
      reqPreview.textContent = JSON.stringify(rpcRequest, null, 2);
    }

    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const result = executeMcpToolInBrowser(tool.name, parsedArgs);
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsedMs = Math.max(0, t1 - t0);

    if (latencyBadge) {
      latencyBadge.textContent = `${elapsedMs.toFixed(2)} ms`;
    }

    const rpcResponse = {
      jsonrpc: '2.0',
      id: reqId,
      result,
    };
    if (resPreview) {
      resPreview.textContent = JSON.stringify(rpcResponse, null, 2);
    }
  }

  function loadToolDefaults(shouldRun = true) {
    const tool = getActiveTool();
    renderMeta(tool);
    if (argsEditor) {
      argsEditor.value = JSON.stringify(tool.defaultArgs, null, 2);
    }
    setArgsError('');
    if (shouldRun) {
      runCurrentToolCall();
    }
  }

  // Consult audience preset buttons
  root.querySelectorAll('[data-consult-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-consult-preset');
      const presetArgs = CONSULT_PRESETS[presetKey];
      if (!presetArgs) return;
      activeToolName = 'openarbor_consult';
      renderToolSelector();
      renderMeta(getActiveTool());
      if (argsEditor) {
        argsEditor.value = JSON.stringify(presetArgs, null, 2);
      }
      setArgsError('');
      runCurrentToolCall();
    });
  });

  document.getElementById('btn-mcp-run')?.addEventListener('click', () => {
    runCurrentToolCall();
  });

  document.getElementById('btn-mcp-reset')?.addEventListener('click', () => {
    loadToolDefaults(true);
  });

  document.getElementById('btn-mcp-test-guard')?.addEventListener('click', () => {
    activeToolName = 'evaluate_ordinance';
    renderToolSelector();
    renderMeta(getActiveTool());
    const oversizedTrees = Array.from({ length: MAX_EVALUATE_TREES + 1 }, (_, idx) => ({
      tag: `T-${String(idx + 1).padStart(3, '0')}`,
      species_common: 'Live Oak',
      species_scientific: 'Quercus virginiana',
      dbh: 20,
      removal: false,
    }));
    if (argsEditor) {
      argsEditor.value = JSON.stringify(
        {
          jurisdiction_id: 'tx-austin',
          trees: oversizedTrees,
        },
        null,
        2
      );
    }
    setArgsError('');
    runCurrentToolCall();
  });

  document.getElementById('btn-mcp-test-id-guard')?.addEventListener('click', () => {
    activeToolName = 'evaluate_ordinance';
    renderToolSelector();
    renderMeta(getActiveTool());
    if (argsEditor) {
      argsEditor.value = JSON.stringify(
        {
          jurisdiction_id: `tx-${'a'.repeat(MAX_JURISDICTION_ID_LENGTH + 4)}`,
          trees: [
            {
              tag: 'T-01',
              species_common: 'Live Oak',
              species_scientific: 'Quercus virginiana',
              dbh: 30,
              removal: false,
            },
          ],
        },
        null,
        2
      );
    }
    setArgsError('');
    runCurrentToolCall();
  });

  argsEditor?.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      runCurrentToolCall();
    }
  });

  const btnCopyReq = document.getElementById('btn-copy-mcp-req');
  const btnCopyRes = document.getElementById('btn-copy-mcp-res');
  btnCopyReq?.addEventListener('click', () => {
    copyTextWithFeedback(btnCopyReq, reqPreview?.textContent || '');
  });
  btnCopyRes?.addEventListener('click', () => {
    copyTextWithFeedback(btnCopyRes, resPreview?.textContent || '');
  });

  renderToolSelector();
  loadToolDefaults(true);
}
