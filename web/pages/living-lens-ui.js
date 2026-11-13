/**
 * Open Arbor v2.1 Front Door, Living Cross-Section & Veil UI Controller (web/pages/living-lens-ui.js)
 * Zero-dependency browser/Node ESM module providing:
 *   1. Global Veil Chrome (#oa-veil-mode-toggle), [popovertarget] fallback, and <dialog closedby="any"> light-dismiss fallback
 *   2. Shared Arborist Handoff modal (<dialog id="arborist-handoff-dialog">) reusable across / and /demo/
 *   3. Interactive Living Tree Lens (#landing-quick-calc) wired to certified Open Arbor core engines:
 *      rootZone.js, ordinanceEngine.js, ecosystemBenefits.js, rapEngine.js, leoRapEngine.js, and soilFunction.js
 */

import {
  calculateCRZ,
  calculateTPZ,
  calculateSRZ,
} from '../../src/core/rootZone.js';

import {
  evaluateTreeInventory,
  permitDetermination,
  permitSummary,
  computeMitigationPlan,
  statusLabel,
  isOakSpecies,
} from '../../src/core/ordinanceEngine.js';

import {
  calculateTreeEcosystemBenefits,
  estimateTreeAge,
} from '../../src/core/ecosystemBenefits.js';

import {
  evaluateBiomechanicsAndRhizosphere,
  computeHolobiontValuation,
  computeRegenerativePracticeEconomics,
} from '../../src/core/rapEngine.js';

import {
  computePhasedStewardshipTriage,
  compileLeoRapBrief,
  composeArboristHandoffBrief,
} from '../../src/core/leoRapEngine.js';

import {
  estimateSoilSpongeCapacity,
} from '../../src/core/soilFunction.js';

import txOrdinances from '../../data/ordinances/central_texas_ordinances.json';
import orOrdinances from '../../data/ordinances/rogue_valley_oregon_ordinances.json';
import { FIXED_PARITY_CASES } from '../presets.js';
import { encodeAssessmentPermalink, inspectMunicipalityProvenance } from './masterwork-core.js';
import {
  isImperialUnits,
  fmtDualInCm,
  fmtDualFromCm,
  fmtDualFtM,
  fmtDualAreaSqftSqm,
  fmtDualGallons,
  ftToM,
} from './unit-system.js';

const ALL_MUNICIPALITIES = [
  ...(txOrdinances.municipalities || []),
  ...(orOrdinances.municipalities || []),
];

const VEIL_STORAGE_KEY = 'openarbor-veil-mode';

const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function formatUsd(n) {
  return `$${Math.round(Number(n || 0)).toLocaleString('en-US')}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export const ARCHETYPE_SPECIMENS = [
  {
    key: 'austin-live-oak',
    buttonLabel: '300-Yr Austin Live Oak',
    shortCaption: '30 in · 62% hollow (t/R 0.38)',
    caseIndex: 0,
    ordinanceId: 'tx-austin',
    dbhIn: 30,
    cavityPct: 62,
    disturbancePct: 10,
    growthFactor: 4.5,
  },
  {
    key: 'ashland-white-oak',
    buttonLabel: 'Hollow Ashland White Oak',
    shortCaption: '41 in · 66% hollow (t/R 0.34)',
    caseIndex: 3,
    ordinanceId: 'or-ashland',
    dbhIn: 41,
    cavityPct: 66,
    disturbancePct: 12,
    growthFactor: 5.0,
  },
  {
    key: 'georgetown-pecan',
    buttonLabel: 'Multi-Stem Georgetown Pecan',
    shortCaption: '27 in · 54% hollow (t/R 0.46)',
    caseIndex: 1,
    ordinanceId: 'tx-georgetown',
    dbhIn: 27,
    cavityPct: 54,
    disturbancePct: 10,
    growthFactor: 4.0,
  },
  {
    key: 'yard-post-oak',
    buttonLabel: 'Yard Post Oak',
    shortCaption: '20 in · 68% hollow (t/R 0.32)',
    caseIndex: 2,
    ordinanceId: 'tx-liberty-hill',
    dbhIn: 20,
    cavityPct: 68,
    disturbancePct: 22,
    growthFactor: 5.0,
  },
];

let latestHandoffBundle = null;
let activeHandoffAudience = 'steward';

function bindDialogLightDismissFallback(dialog) {
  if (!dialog || dialog.dataset.oaLightDismissBound === 'true') return;
  dialog.dataset.oaLightDismissBound = 'true';

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const clickedInDialog =
          rect.top <= event.clientY &&
          event.clientY <= rect.bottom &&
          rect.left <= event.clientX &&
          event.clientX <= rect.right;
        if (!clickedInDialog) {
          dialog.close();
        }
      }
    });
  }
}

function buildDemoPermalinkUrl(permalinkHash) {
  const hash = String(permalinkHash || '').startsWith('#')
    ? permalinkHash
    : `#${permalinkHash || ''}`;
  if (typeof window === 'undefined' || !window.location) {
    return `https://openarbor.org/demo/${hash}`;
  }
  const demoUrl = new URL(
    window.location.pathname.includes('/demo/') ? './index.html' : './demo/index.html',
    window.location.href
  );
  demoUrl.hash = hash;
  return demoUrl.href;
}

function copyTextWithFeedback(text, buttonEl, copiedLabel = 'Copied') {
  const payload = String(text || '');
  const showFeedback = () => {
    if (!buttonEl) return;
    const prev = buttonEl.dataset.oaOrigLabel || buttonEl.textContent;
    buttonEl.dataset.oaOrigLabel = prev;
    buttonEl.textContent = copiedLabel;
    window.setTimeout(() => {
      buttonEl.textContent = prev;
    }, 1600);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload).then(showFeedback).catch(() => {
      fallbackExecCopy(payload);
      showFeedback();
    });
    return;
  }
  fallbackExecCopy(payload);
  showFeedback();
}

function fallbackExecCopy(text) {
  if (typeof document === 'undefined') return;
  const temp = document.createElement('textarea');
  temp.value = text;
  temp.setAttribute('readonly', '');
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  document.body.appendChild(temp);
  temp.select();
  try {
    document.execCommand('copy');
  } catch {
    // Ignore clipboard restriction in non-interactive headless harnesses
  }
  document.body.removeChild(temp);
}

/**
 * Ensure the shared Arborist Handoff modal exists in the current document and is wired.
 */
export function ensureArboristHandoffDialog() {
  if (typeof document === 'undefined') return null;

  let dialog = document.getElementById('arborist-handoff-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'arborist-handoff-dialog';
    dialog.setAttribute('closedby', 'any');
    dialog.setAttribute('aria-labelledby', 'handoff-dialog-title');
    dialog.className = 'oa-handoff-dialog';
    dialog.innerHTML = `
      <div class="oa-handoff-dialog-inner">
        <div class="oa-handoff-header">
          <div>
            <span class="eyebrow">Word-of-Mouth Field Handoff &middot; Zero Account Required</span>
            <h2 id="handoff-dialog-title">Send This Tree to Your Arborist</h2>
          </div>
          <button type="button" id="btn-close-handoff-dialog" class="oa-handoff-close-btn" aria-label="Close arborist handoff dialog">Close</button>
        </div>
        <p class="subtitle" id="handoff-subject-line">
          Share a calm, pre-computed field baseline with your preferred arborist or property steward. Every figure opens directly in the Field Studio with zero login.
        </p>
        <div class="oa-handoff-tabs" role="tablist" aria-label="Select handoff message format">
          <button type="button" role="tab" class="tab-btn active" data-handoff-tab="steward" aria-selected="true">Note for My Arborist</button>
          <button type="button" role="tab" class="tab-btn" data-handoff-tab="arborist" aria-selected="false">Arborist-to-Client Note</button>
          <button type="button" role="tab" class="tab-btn" data-handoff-tab="truck" aria-selected="false">Crew &amp; Truck Summary</button>
        </div>
        <div class="field">
          <label for="handoff-message-textarea" id="handoff-textarea-label">Copy-Ready Note (Editable before sending)</label>
          <textarea id="handoff-message-textarea" class="oa-handoff-textarea" rows="8" spellcheck="true"></textarea>
        </div>
        <div class="field">
          <label for="handoff-share-url-input">Zero-Server Tree Link (Opens exact sliders &amp; municipal code in Field Studio)</label>
          <div class="oa-handoff-url-row">
            <input type="text" id="handoff-share-url-input" readonly />
            <button type="button" id="btn-copy-handoff-url" class="btn btn-secondary btn-sm">Copy Direct Tree Link</button>
          </div>
        </div>
        <div class="oa-handoff-actions">
          <span class="hint" id="handoff-share-status">No data is uploaded to any server; the tree state lives inside the link hash.</span>
          <div class="oa-word-of-mouth-actions">
            <button type="button" id="btn-copy-handoff-note" class="btn btn-copper">Copy Note</button>
            <button type="button" id="btn-native-share-handoff" class="btn btn-primary">Share via Phone or Email</button>
            <a href="./demo/index.html" id="handoff-open-studio-link" class="btn btn-secondary">Open Full Studio</a>
            <button type="button" data-close-handoff class="btn btn-outline">Done</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  bindDialogLightDismissFallback(dialog);

  if (dialog.dataset.oaHandoffWired !== 'true') {
    dialog.dataset.oaHandoffWired = 'true';

    const closeBtn = dialog.querySelector('#btn-close-handoff-dialog');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => dialog.close());
    }
    dialog.querySelectorAll('[data-close-handoff]').forEach((btn) => {
      btn.addEventListener('click', () => dialog.close());
    });

    const tabButtons = dialog.querySelectorAll('[data-handoff-tab]');
    const textarea = dialog.querySelector('#handoff-message-textarea');
    const copyNoteBtn = dialog.querySelector('#btn-copy-handoff-note');
    const copyUrlBtn = dialog.querySelector('#btn-copy-handoff-url');
    const urlInput = dialog.querySelector('#handoff-share-url-input');
    const shareBtn = dialog.querySelector('#btn-native-share-handoff');
    const statusEl = dialog.querySelector('#handoff-share-status');

    const syncTabContent = (tabKey) => {
      activeHandoffAudience = tabKey;
      tabButtons.forEach((b) => {
        const isCurrent = b.getAttribute('data-handoff-tab') === tabKey;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-selected', String(isCurrent));
      });
      if (!latestHandoffBundle || !textarea) return;
      if (tabKey === 'arborist') {
        textarea.value = latestHandoffBundle.arborist_to_client_message;
      } else if (tabKey === 'truck') {
        textarea.value = latestHandoffBundle.arborist_truck_summary;
      } else {
        textarea.value = latestHandoffBundle.steward_to_arborist_message;
      }
    };

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        syncTabContent(btn.getAttribute('data-handoff-tab') || 'steward');
      });
    });

    if (copyNoteBtn && textarea) {
      copyNoteBtn.addEventListener('click', () => {
        copyTextWithFeedback(textarea.value, copyNoteBtn, 'Copied Note');
        if (statusEl) {
          statusEl.textContent = 'Note copied to clipboard. Paste into a text message or email to your arborist.';
        }
      });
    }

    if (copyUrlBtn && urlInput) {
      copyUrlBtn.addEventListener('click', () => {
        copyTextWithFeedback(urlInput.value, copyUrlBtn, 'Copied Link');
        if (statusEl) {
          statusEl.textContent = 'Direct Field Studio link copied to clipboard.';
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const subject = latestHandoffBundle?.subject || 'Open Arbor Tree Stewardship Brief';
        const bodyText = textarea ? textarea.value : '';
        const shareUrl = urlInput ? urlInput.value : '';

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          try {
            await navigator.share({
              title: subject,
              text: bodyText,
              url: shareUrl,
            });
            if (statusEl) statusEl.textContent = 'Shared via device share sheet.';
            return;
          } catch (err) {
            if (err && err.name === 'AbortError') return;
          }
        }

        const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
        window.location.href = mailto;
      });
    }
  }

  return dialog;
}

/**
 * Populate and open the Arborist Handoff modal using composeArboristHandoffBrief.
 */
export function openArboristHandoffDialog(handoffParams = {}) {
  const dialog = ensureArboristHandoffDialog();
  if (!dialog) return null;

  latestHandoffBundle = composeArboristHandoffBrief(handoffParams);
  const shareUrl = handoffParams.shareUrl || 'https://openarbor.org/demo/';

  const subjectEl = dialog.querySelector('#handoff-subject-line');
  const textarea = dialog.querySelector('#handoff-message-textarea');
  const urlInput = dialog.querySelector('#handoff-share-url-input');
  const studioLink = dialog.querySelector('#handoff-open-studio-link');

  if (subjectEl) subjectEl.textContent = latestHandoffBundle.subject;
  if (urlInput) urlInput.value = shareUrl;
  if (studioLink) studioLink.setAttribute('href', shareUrl);

  if (textarea) {
    if (activeHandoffAudience === 'arborist') {
      textarea.value = latestHandoffBundle.arborist_to_client_message;
    } else if (activeHandoffAudience === 'truck') {
      textarea.value = latestHandoffBundle.arborist_truck_summary;
    } else {
      textarea.value = latestHandoffBundle.steward_to_arborist_message;
    }
  }

  if (typeof dialog.showModal === 'function' && !dialog.open) {
    dialog.showModal();
  }
  return latestHandoffBundle;
}

/**
 * Initialize global Veil toggle, [popovertarget] fallback, <dialog closedby="any"> fallback,
 * and shared copy buttons across every Open Arbor web surface.
 */
export function initVeilAndHandoffChrome() {
  if (typeof document === 'undefined') return;

  // 1. Bind light-dismiss JS fallback on all modal dialogs with closedby="any"
  document.querySelectorAll('dialog[closedby="any"]').forEach((dlg) => {
    bindDialogLightDismissFallback(dlg);
  });

  // 2. Global Header Forest OS Layer Toggle (#oa-veil-mode-toggle)
  const veilToggleBtn = document.getElementById('oa-veil-mode-toggle');
  const syncVeilButtonLabel = (isDeep) => {
    if (!veilToggleBtn) return;
    veilToggleBtn.setAttribute('aria-pressed', String(Boolean(isDeep)));
    veilToggleBtn.textContent = isDeep ? 'Layer: Heartwood' : 'Layer: Canopy';
  };

  const applyVeilModeToPage = (isDeep, persist = false) => {
    const veils = document.querySelectorAll('details.oa-veil');
    veils.forEach((d) => {
      d.open = Boolean(isDeep);
    });
    syncVeilButtonLabel(isDeep);
    if (persist) {
      try {
        localStorage.setItem(VEIL_STORAGE_KEY, isDeep ? 'deep' : 'canopy');
      } catch {
        // Ignore storage quota errors in restricted browsing modes
      }
    }
  };

  let savedVeilDeep = false;
  try {
    savedVeilDeep = localStorage.getItem(VEIL_STORAGE_KEY) === 'deep';
  } catch {
    savedVeilDeep = false;
  }

  if (savedVeilDeep) {
    applyVeilModeToPage(true, false);
  } else {
    syncVeilButtonLabel(false);
  }

  if (veilToggleBtn && veilToggleBtn.dataset.oaVeilBound !== 'true') {
    veilToggleBtn.dataset.oaVeilBound = 'true';
    veilToggleBtn.addEventListener('click', () => {
      const nextDeep = veilToggleBtn.getAttribute('aria-pressed') !== 'true';
      applyVeilModeToPage(nextDeep, true);
    });
  }

  if (document.documentElement.dataset.oaVeilSyncListener !== 'true') {
    document.documentElement.dataset.oaVeilSyncListener = 'true';
    document.addEventListener(
      'toggle',
      (event) => {
        const target = event.target;
        if (target && target.matches && target.matches('details.oa-veil')) {
          const allVeils = Array.from(document.querySelectorAll('details.oa-veil'));
          if (allVeils.length > 0) {
            const allOpen = allVeils.every((d) => d.open);
            syncVeilButtonLabel(allOpen);
          }
        }
      },
      true
    );
  }

  // 3. Under the Veil Navigation Popover: native aria-expanded sync + zero-dependency fallback
  const supportsPopover = Object.hasOwn(HTMLElement.prototype, 'popover');
  const popoverTriggers = document.querySelectorAll('[popovertarget]');

  popoverTriggers.forEach((trigger) => {
    if (trigger.dataset.oaPopoverBound === 'true') return;
    trigger.dataset.oaPopoverBound = 'true';

    const targetId = trigger.getAttribute('popovertarget');
    const popoverEl = targetId ? document.getElementById(targetId) : null;
    if (!popoverEl) return;

    if (!trigger.hasAttribute('aria-expanded')) {
      trigger.setAttribute('aria-expanded', 'false');
    }

    if (supportsPopover) {
      popoverEl.addEventListener('toggle', (ev) => {
        const isOpen = ev.newState === 'open';
        trigger.setAttribute('aria-expanded', String(isOpen));
      });
    } else {
      // Lightweight zero-dependency fallback for browsers without native Popover API
      const closeFallbackPopover = () => {
        popoverEl.classList.remove(':popover-open');
        trigger.setAttribute('aria-expanded', 'false');
      };

      trigger.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const willOpen = !popoverEl.classList.contains(':popover-open');
        popoverEl.classList.toggle(':popover-open', willOpen);
        trigger.setAttribute('aria-expanded', String(willOpen));
      });

      document.addEventListener('click', (ev) => {
        if (
          popoverEl.classList.contains(':popover-open') &&
          !popoverEl.contains(ev.target) &&
          !trigger.contains(ev.target)
        ) {
          closeFallbackPopover();
        }
      });

      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && popoverEl.classList.contains(':popover-open')) {
          closeFallbackPopover();
          trigger.focus();
        }
      });
    }
  });

  // 4. Shared [data-copy-target] buttons on surfaces that do not mount mcp-ui
  document.querySelectorAll('[data-copy-target]').forEach((btn) => {
    if (btn.dataset.oaCopyBound === 'true') return;
    btn.dataset.oaCopyBound = 'true';
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-copy-target');
      const sourceEl = id ? document.getElementById(id) : null;
      if (!sourceEl) return;
      const text = 'value' in sourceEl ? sourceEl.value : sourceEl.textContent;
      copyTextWithFeedback(text, btn, 'Copied');
    });
  });

  // 4b. Delegated 1-tap copy handler for expandable SHA-256 / permalink hash chips ([data-copy-hash])
  if (document.documentElement.dataset.oaHashCopyDelegated !== 'true') {
    document.documentElement.dataset.oaHashCopyDelegated = 'true';
    document.addEventListener('click', (event) => {
      const target = event.target;
      const btn = target && target.closest ? target.closest('[data-copy-hash]') : null;
      if (!btn) return;
      const hashText = btn.getAttribute('data-copy-hash') || '';
      if (hashText) {
        copyTextWithFeedback(hashText, btn, 'Copied');
      }
    });
  }

  // 4c. Delegated WAI-ARIA Tablist Keyboard Navigation (ArrowLeft, ArrowRight, Home, End)
  if (document.documentElement.dataset.oaTablistKeybound !== 'true') {
    document.documentElement.dataset.oaTablistKeybound = 'true';
    document.addEventListener('keydown', (event) => {
      const key = event.key;
      if (
        key !== 'ArrowRight' &&
        key !== 'ArrowLeft' &&
        key !== 'Home' &&
        key !== 'End'
      ) {
        return;
      }
      const target = event.target;
      const tab = target && target.closest ? target.closest('[role="tab"]') : null;
      if (!tab) return;
      const tablist = tab.closest('[role="tablist"]');
      if (!tablist) return;

      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]')).filter(
        (el) => !el.hidden && el.getAttribute('aria-disabled') !== 'true' && !el.disabled
      );
      if (tabs.length < 2) return;

      const currentIndex = tabs.indexOf(tab);
      if (currentIndex === -1) return;

      event.preventDefault();
      let nextIndex = currentIndex;
      if (key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (key === 'Home') {
        nextIndex = 0;
      } else if (key === 'End') {
        nextIndex = tabs.length - 1;
      }

      const nextTab = tabs[nextIndex];
      if (nextTab) {
        nextTab.focus();
        nextTab.click();
      }
    });
  }

  // 5. Ensure handoff dialog is ready if already rendered in DOM
  if (document.getElementById('arborist-handoff-dialog')) {
    ensureArboristHandoffDialog();
  }
}

/**
 * Render the responsive dual-panel Botanical Cross-Section & Mattheck Trunk Ring SVGs.
 * Stacks vertically on mobile (< 760px) so every label is full-width legible,
 * and sits side-by-side on desktop (>= 760px).
 */
function renderLivingLensSVG({
  speciesCommon,
  dbhIn,
  cavityPct,
  tOverR,
  disturbancePct,
  crzFt,
  srzFt,
  tizFt,
  stormGallons,
  trunkRadiusCm,
  soundShellCm,
}) {
  const isSound = tOverR >= 0.30;

  // Tree & Root Sponge viewport geometry (viewBox 0 0 472 308, center trunk x = 236, grade y = 180)
  const cxTree = 236;
  const gradeY = 180;
  const maxHalfSpanPx = 198;

  // Scale TIZ to fit cleanly inside tree viewport while keeping exact CRZ/SRZ ratios relative to TIZ
  const safeTizFt = Math.max(tizFt, 12);
  const pxPerFoot = Math.min(9.2, maxHalfSpanPx / safeTizFt);
  const tizHalfPx = Math.max(64, Math.min(maxHalfSpanPx, round1(tizFt * pxPerFoot)));
  const crzHalfPx = Math.max(42, Math.min(tizHalfPx - 10, round1(crzFt * pxPerFoot)));
  const srzHalfPx = Math.max(20, Math.min(crzHalfPx - 10, round1(srzFt * pxPerFoot)));

  const trunkHalfPx = Math.max(5, Math.min(20, round1(dbhIn * 0.3)));
  const flareHalfPx = trunkHalfPx + 7;
  const canopyRx = Math.max(52, Math.min(148, round1(40 + dbhIn * 1.95)));
  const canopyRy = Math.max(36, Math.min(70, round1(28 + dbhIn * 0.76)));
  const canopyCy = gradeY - 60 - Math.round(canopyRy * 0.55);

  // Trench encroachment cut enters from right edge of CRZ inward
  const crzRightEdge = cxTree + crzHalfPx;
  const cutFraction = Math.max(0, Math.min(0.82, (disturbancePct / 50) * 0.76));
  const trenchX = round1(crzRightEdge - crzHalfPx * cutFraction * 1.15);
  const trenchBreachesSrz = disturbancePct > 0 && trenchX <= cxTree + srzHalfPx;

  // Trunk Ring viewport geometry: Claus Mattheck Trunk Cross-Section (viewBox 0 0 280 308, center 140, 144)
  const ringCx = 140;
  const ringCy = 144;
  const barkOuterR = 84;
  const woodOuterR = 76;
  const cavityR = round1(Math.max(0, Math.min(woodOuterR - 4, woodOuterR * (1 - tOverR))));
  const mattheckThresholdR = round1(woodOuterR * 0.70); // t/R = 0.30 boundary

  const shellBadgeFill = isSound ? 'var(--highlight-bg)' : 'var(--danger-bg)';
  const shellBadgeStroke = isSound ? 'var(--accent-green)' : 'var(--danger-red)';
  const shellBadgeText = isSound ? 'var(--accent-bright)' : 'var(--danger-red)';
  const imp = isImperialUnits();
  const shellVerdictLabel = isSound
    ? `SOUND SHELL · t/R = ${tOverR.toFixed(2)} (>= 0.30)`
    : `THIN SHELL · t/R = ${tOverR.toFixed(2)} (< 0.30)`;
  const shellSubLabel = isSound
    ? `${fmtDualFromCm(soundShellCm)} live wall holds windload`
    : `${fmtDualFromCm(soundShellCm)} wall; run Level 3 tomogram`;

  const trenchMarkup =
    disturbancePct > 0
      ? `
      <rect
        x="${trenchX}"
        y="${gradeY - 8}"
        width="${Math.max(8, round1(crzRightEdge - trenchX + 12))}"
        height="96"
        rx="4"
        fill="var(--danger-red)"
        fill-opacity="0.14"
      />
      <line
        x1="${trenchX}"
        y1="${gradeY - 22}"
        x2="${trenchX}"
        y2="${gradeY + 92}"
        stroke="var(--danger-red)"
        stroke-width="2.5"
        stroke-dasharray="5 3"
      />
      <rect x="${Math.max(246, Math.min(340, trenchX - 54))}" y="${gradeY - 38}" width="118" height="20" rx="5" fill="var(--danger-bg)" stroke="var(--danger-red)" stroke-width="1" />
      <text x="${Math.max(305, Math.min(399, trenchX + 5))}" y="${gradeY - 24}" text-anchor="middle" font-size="10.2" font-weight="700" fill="var(--danger-red)">
        ${disturbancePct}% CRZ Trench Cut${trenchBreachesSrz ? ' (Hits SRZ)' : ''}
      </text>
    `
      : `
      <rect x="${cxTree + crzHalfPx - 108}" y="${gradeY - 32}" width="114" height="19" rx="5" fill="var(--highlight-bg)" stroke="var(--accent-green)" stroke-width="1" />
      <text x="${cxTree + crzHalfPx - 51}" y="${gradeY - 19}" text-anchor="middle" font-size="9.8" font-weight="700" fill="var(--accent-bright)">
        0% Trenching (Intact)
      </text>
    `;

  return `
    <div class="oa-living-lens-dual">
      <svg
        class="oa-living-lens-svg oa-living-lens-tree-svg"
        viewBox="0 0 472 308"
        role="img"
        aria-label="${escapeHtml(speciesCommon)} living canopy and root sponge cross-section: ${dbhIn} inch DBH, ${crzFt.toFixed(1)} ft Critical Root Zone, ${srzFt.toFixed(1)} ft Structural Root Zone"
      >
        <title>${escapeHtml(speciesCommon)} Living Canopy, Root Plate and Mycorrhizal Sponge</title>
        <desc>Diagram shows canopy, root flare, AS 4970 Structural Root Zone (${srzFt.toFixed(1)} ft), ANSI A300 Critical Root Zone (${crzFt.toFixed(1)} ft), 1.5x Tree Influence Zone (${tizFt.toFixed(1)} ft), and ${disturbancePct}% trench disturbance.</desc>

        <text x="18" y="20" font-size="11" font-weight="700" fill="var(--text-muted)" letter-spacing="0.04em">
          LIVING CANOPY, ROOT PLATE &amp; SOIL SPONGE (SCALE VIEW)
        </text>

        <!-- Underground Vadose Soil Sponge Horizon -->
        <rect x="14" y="${gradeY}" width="444" height="116" rx="10" fill="var(--accent-copper)" fill-opacity="0.07" />

        <!-- 1.5x TIZ Mycorrhizal Influence Zone Band -->
        <rect
          x="${round1(cxTree - tizHalfPx)}"
          y="${gradeY + 8}"
          width="${round1(tizHalfPx * 2)}"
          height="84"
          rx="12"
          fill="var(--accent-copper)"
          fill-opacity="0.09"
          stroke="var(--accent-copper)"
          stroke-width="1.2"
          stroke-dasharray="5 4"
        />

        <!-- ANSI A300 1.0x CRZ Feeder Root Zone Band -->
        <rect
          x="${round1(cxTree - crzHalfPx)}"
          y="${gradeY + 14}"
          width="${round1(crzHalfPx * 2)}"
          height="58"
          rx="10"
          fill="var(--accent-green)"
          fill-opacity="0.14"
          stroke="var(--accent-bright)"
          stroke-width="1.6"
        />

        <!-- AS 4970 Structural Windthrow Plate (SRZ) -->
        <rect
          x="${round1(cxTree - srzHalfPx)}"
          y="${gradeY + 18}"
          width="${round1(srzHalfPx * 2)}"
          height="34"
          rx="8"
          fill="var(--accent-copper)"
          fill-opacity="0.24"
          stroke="var(--accent-copper)"
          stroke-width="1.8"
        />

        <!-- Organic Lateral Root Architecture & Mycorrhizal Filaments -->
        <path
          d="M ${cxTree - trunkHalfPx} ${gradeY + 6} Q ${cxTree - srzHalfPx} ${gradeY + 26}, ${cxTree - crzHalfPx + 8} ${gradeY + 34}
             M ${cxTree + trunkHalfPx} ${gradeY + 6} Q ${cxTree + srzHalfPx} ${gradeY + 26}, ${cxTree + crzHalfPx - 8} ${gradeY + 34}
             M ${cxTree - 4} ${gradeY + 10} Q ${cxTree - srzHalfPx * 0.7} ${gradeY + 42}, ${cxTree - tizHalfPx + 14} ${gradeY + 56}
             M ${cxTree + 4} ${gradeY + 10} Q ${cxTree + srzHalfPx * 0.7} ${gradeY + 42}, ${cxTree + tizHalfPx - 14} ${gradeY + 56}"
          fill="none"
          stroke="var(--accent-copper)"
          stroke-width="2.1"
          stroke-linecap="round"
          opacity="0.82"
        />

        <!-- Canopy Crown Layered Botanical Silhouette -->
        <ellipse
          cx="${cxTree - Math.round(canopyRx * 0.28)}"
          cy="${canopyCy + 8}"
          rx="${round1(canopyRx * 0.68)}"
          ry="${round1(canopyRy * 0.78)}"
          fill="var(--accent-green)"
          fill-opacity="0.2"
          stroke="var(--accent-bright)"
          stroke-width="1.2"
        />
        <ellipse
          cx="${cxTree + Math.round(canopyRx * 0.28)}"
          cy="${canopyCy + 10}"
          rx="${round1(canopyRx * 0.66)}"
          ry="${round1(canopyRy * 0.76)}"
          fill="var(--accent-green)"
          fill-opacity="0.2"
          stroke="var(--accent-bright)"
          stroke-width="1.2"
        />
        <ellipse
          cx="${cxTree}"
          cy="${canopyCy}"
          rx="${canopyRx}"
          ry="${canopyRy}"
          fill="var(--accent-green)"
          fill-opacity="0.28"
          stroke="var(--accent-bright)"
          stroke-width="1.8"
        />

        <!-- Trunk & Basal Root Flare -->
        <path
          d="M ${cxTree - trunkHalfPx * 0.8} ${canopyCy + 14}
             L ${cxTree - trunkHalfPx} ${gradeY - 14}
             Q ${cxTree - trunkHalfPx - 2} ${gradeY - 2}, ${cxTree - flareHalfPx} ${gradeY + 6}
             L ${cxTree + flareHalfPx} ${gradeY + 6}
             Q ${cxTree + trunkHalfPx + 2} ${gradeY - 2}, ${cxTree + trunkHalfPx} ${gradeY - 14}
             L ${cxTree + trunkHalfPx * 0.8} ${canopyCy + 14} Z"
          fill="var(--accent-copper)"
          fill-opacity="0.88"
        />
        <!-- Scaffold limbs -->
        <path
          d="M ${cxTree - 2} ${canopyCy + 26} Q ${cxTree - 24} ${canopyCy + 4}, ${cxTree - 46} ${canopyCy - 6}
             M ${cxTree + 2} ${canopyCy + 22} Q ${cxTree + 26} ${canopyCy + 2}, ${cxTree + 48} ${canopyCy - 8}"
          fill="none"
          stroke="var(--accent-copper)"
          stroke-width="3.2"
          stroke-linecap="round"
        />

        <!-- Soil Grade Line -->
        <line x1="14" y1="${gradeY}" x2="458" y2="${gradeY}" stroke="var(--text-main)" stroke-opacity="0.45" stroke-width="1.5" />
        <text x="22" y="${gradeY - 6}" font-size="10" font-weight="600" fill="var(--text-muted)">Soil Line</text>

        <!-- Trench / Disturbance Cut Overlay -->
        ${trenchMarkup}

        <!-- Zone Labels Below Grade -->
        <text x="${cxTree}" y="${gradeY + 39}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-main)">
          SRZ Windthrow Plate: ${fmtDualFtM(srzFt)}
        </text>
        <text x="${cxTree}" y="${gradeY + 66}" text-anchor="middle" font-size="10.4" font-weight="700" fill="var(--accent-bright)">
          ANSI A300 CRZ: ${fmtDualFtM(crzFt)} radius
        </text>
        <text x="${cxTree}" y="${gradeY + 86}" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--accent-copper)">
          1.5x Sponge (TIZ: ${imp ? `${tizFt.toFixed(1)} ft` : `${ftToM(tizFt, 1)} m`} · ${fmtDualGallons(stormGallons)} / storm)
        </text>
      </svg>

      <svg
        class="oa-living-lens-svg oa-living-lens-ring-svg"
        viewBox="0 0 280 308"
        role="img"
        aria-label="${escapeHtml(speciesCommon)} trunk shell ring cross-section: Mattheck t over R ratio ${tOverR.toFixed(2)}"
      >
        <title>${escapeHtml(speciesCommon)} Trunk Shell Ring (Mattheck t/R)</title>
        <desc>Trunk cross-section with ${cavityPct}% internal cavity width and t/R = ${tOverR.toFixed(2)} relative to the 0.30 Claus Mattheck hollow-shell buckling threshold.</desc>

        <text x="${ringCx}" y="20" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-muted)" letter-spacing="0.04em">
          TRUNK SHELL RING (MATTHECK t/R)
        </text>

        <text x="${ringCx}" y="46" text-anchor="middle" font-size="9.8" font-weight="600" fill="var(--text-muted)">
          Dashed ring: Mattheck 0.30 limit
        </text>

        <!-- Outer Bark Circle -->
        <circle cx="${ringCx}" cy="${ringCy}" r="${barkOuterR}" fill="var(--accent-copper)" fill-opacity="0.82" stroke="var(--border-main)" stroke-width="1.5" />

        <!-- Living Cambium & Sapwood Ring -->
        <circle cx="${ringCx}" cy="${ringCy}" r="${woodOuterR + 3}" fill="none" stroke="var(--accent-bright)" stroke-width="3.2" />

        <!-- Sound Structural Wood Cylinder -->
        <circle cx="${ringCx}" cy="${ringCy}" r="${woodOuterR}" fill="var(--veil-bg)" stroke="var(--accent-copper)" stroke-width="1.2" />

        <!-- Subtle Growth Rings -->
        <circle cx="${ringCx}" cy="${ringCy}" r="${round1(woodOuterR * 0.85)}" fill="none" stroke="var(--accent-copper)" stroke-opacity="0.3" stroke-width="1" />
        <circle cx="${ringCx}" cy="${ringCy}" r="${round1(woodOuterR * 0.52)}" fill="none" stroke="var(--accent-copper)" stroke-opacity="0.24" stroke-width="1" />

        <!-- Internal Heartwood Cavity (R - t) -->
        ${
          cavityR > 1.5
            ? `<circle cx="${ringCx}" cy="${ringCy}" r="${cavityR}" fill="var(--bg-deep)" stroke="var(--text-muted)" stroke-width="1.4" />`
            : ''
        }

        <!-- Claus Mattheck t/R = 0.30 Buckling Threshold Reference Ring -->
        <circle
          cx="${ringCx}"
          cy="${ringCy}"
          r="${mattheckThresholdR}"
          fill="none"
          stroke="${isSound ? 'var(--accent-bright)' : 'var(--danger-red)'}"
          stroke-width="1.6"
          stroke-dasharray="4 3"
        />

        <!-- Center Readout inside Trunk Ring -->
        <text x="${ringCx}" y="${ringCy - 4}" text-anchor="middle" font-size="13.5" font-weight="800" fill="var(--text-main)">
          t/R = ${tOverR.toFixed(2)}
        </text>
        <text x="${ringCx}" y="${ringCy + 13}" text-anchor="middle" font-size="9.8" font-weight="600" fill="var(--text-muted)">
          ${cavityPct === 0 ? 'Solid cylinder' : `${cavityPct}% hollow width`}
        </text>
        <text x="${ringCx}" y="${ringCy + 27}" text-anchor="middle" font-size="8.8" font-weight="600" fill="var(--text-muted)">
          R = ${fmtDualFromCm(trunkRadiusCm)}
        </text>

        <!-- Structural Verdict Pill -->
        <rect
          x="18"
          y="246"
          width="244"
          height="48"
          rx="9"
          fill="${shellBadgeFill}"
          stroke="${shellBadgeStroke}"
          stroke-width="1.4"
        />
        <text x="${ringCx}" y="266" text-anchor="middle" font-size="11" font-weight="800" fill="${shellBadgeText}">
          ${shellVerdictLabel}
        </text>
        <text x="${ringCx}" y="282" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--text-main)">
          ${shellSubLabel}
        </text>
      </svg>
    </div>
  `;
}

/**
 * Initialize the Interactive Living Tree Lens on web/index.html (#landing-quick-calc)
 * and global Veil/Popover/Dialog chrome across all routes.
 */
export function initLivingLensUI() {
  initVeilAndHandoffChrome();

  if (typeof document === 'undefined') return;
  const qcRoot = document.getElementById('landing-quick-calc');
  if (!qcRoot || qcRoot.dataset.oaLivingLensReady === 'true') return;
  qcRoot.dataset.oaLivingLensReady = 'true';

  const dbhSlider = document.getElementById('qc-dbh-slider');
  const jurSelect = document.getElementById('qc-jurisdiction-select');
  const cavitySlider = document.getElementById('qc-cavity-slider');
  const disturbanceSlider = document.getElementById('qc-disturbance-slider');
  if (!dbhSlider || !jurSelect) return;

  let activeArchetype = ARCHETYPE_SPECIMENS[0];

  const archetypeButtons = qcRoot.querySelectorAll('[data-archetype-key]');

  const setActiveArchetypeButton = (key) => {
    archetypeButtons.forEach((btn) => {
      const match = btn.getAttribute('data-archetype-key') === key;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-pressed', String(match));
    });
  };

  const updateLivingLens = () => {
    const dbhIn = Number(dbhSlider.value) || 30;
    const dbhCm = round2(dbhIn * 2.54);
    const circumferenceIn = round1(dbhIn * Math.PI);
    const circFeet = Math.floor(circumferenceIn / 12);
    const circRemIn = round1(circumferenceIn - circFeet * 12);

    const cavityPct = cavitySlider ? Math.max(0, Math.min(80, Number(cavitySlider.value) || 0)) : 62;
    const tOverR = round2(Math.max(0.15, Math.min(1.0, 1 - cavityPct / 100)));
    const disturbancePct = disturbanceSlider
      ? Math.max(0, Math.min(50, Number(disturbanceSlider.value) || 0))
      : 10;

    const jurId = jurSelect.value || 'tx-austin';
    const muni =
      ALL_MUNICIPALITIES.find((m) => m.id === jurId) || ALL_MUNICIPALITIES[0];

    const baseCase =
      FIXED_PARITY_CASES[activeArchetype?.caseIndex ?? 0] || FIXED_PARITY_CASES[0];
    const clonedCase = deepClone(baseCase);
    const synthAssessment = clonedCase.assessment;
    const sb = synthAssessment.structural_baseline;
    const rh = synthAssessment.rhizosphere_and_root_collar;
    const soil = synthAssessment.soil_and_microbiome_baseline;

    const crzMult = Number(muni?.plan_rules?.root_zone?.crz_ft_per_inch) || 1.0;
    const crzMin = Number(muni?.plan_rules?.root_zone?.crz_min_ft) || 0;
    const crz = calculateCRZ(dbhIn, crzMult, crzMin);
    const tpz = calculateTPZ(dbhIn, 'inches', 'US_1_1', crzMult);

    const baseDbhIn = activeArchetype?.dbhIn || 30;
    const scaleRatio = dbhIn / baseDbhIn;

    // Keep multi-stem proportional only when matching Georgetown Pecan archetype at 27 in
    const isMulti =
      activeArchetype?.key === 'georgetown-pecan' && Math.abs(dbhIn - 27) < 0.5;
    sb.dbh_cm = dbhCm;
    sb.is_multistem = isMulti;
    if (!isMulti) {
      sb.multistem_aggregation_method = 'single_stem';
      delete sb.stem_diameters_cm;
    }
    sb.sound_shell_thickness_ratio_t_over_r = tOverR;
    sb.height_m = round1(Math.max(6.0, (Number(sb.height_m) || 16.5) * scaleRatio));
    sb.crown_spread_ns_m = round1(
      Math.max(5.0, (Number(sb.crown_spread_ns_m) || 22.0) * scaleRatio)
    );
    sb.crown_spread_ew_m = round1(
      Math.max(5.0, (Number(sb.crown_spread_ew_m) || 24.0) * scaleRatio)
    );

    const scaledFlareCm = round1(
      Math.max(dbhCm * 1.15, (Number(rh.root_flare_diameter_cm) || dbhCm * 1.25) * scaleRatio)
    );
    const srz = calculateSRZ(scaledFlareCm / 2.54, dbhIn);
    const tizRadiusFt = round2(crz.radius_feet * 1.5);
    const tizRadiusM = round2(crz.radius_meters * 1.5);
    const tizAreaM2 = round2(Math.PI * tizRadiusM * tizRadiusM);
    const tizAreaSqft = Math.round(Math.PI * tizRadiusFt * tizRadiusFt);

    rh.root_flare_diameter_cm = scaledFlareCm;
    rh.crz_radius_m = round2(crz.radius_meters);
    rh.srz_radius_m = round2(srz.radius_meters);
    rh.tiz_radius_m = tizRadiusM;

    if (synthAssessment.understory_and_guild_prescription) {
      synthAssessment.understory_and_guild_prescription.mulch_coverage_area_m2 = tizAreaM2;
    }

    const speciesCommon = sb.species_common || 'Live Oak';
    const speciesSci = sb.species_scientific || 'Quercus virginiana';

    // Evaluate municipal protection & removal liability
    const baseTreeRow = {
      id: 1,
      tag: sb.tree_tag || 'LENS-01',
      species: speciesCommon,
      species_common: speciesCommon,
      species_scientific: speciesSci,
      stems_inches: isMulti ? [20, 14] : [dbhIn],
      dbh_inches: dbhIn,
      condition_score: 8,
      removal: false,
      lat: muni?.coordinates?.lat || 30.2672,
      lng: muni?.coordinates?.lng || -97.7431,
    };

    const evaluatedKeep = evaluateTreeInventory([baseTreeRow], muni);
    const keepRow = evaluatedKeep[0];
    const protLabel = statusLabel(keepRow);

    const evaluatedRemoved = evaluateTreeInventory(
      [{ ...baseTreeRow, removal: true }],
      muni
    );
    const permitIfRemoved = permitDetermination(evaluatedRemoved, muni);
    const permitKeep = permitDetermination(evaluatedKeep, muni);
    const permitText = permitSummary(permitKeep);
    const mitIfRemoved = computeMitigationPlan(evaluatedRemoved, muni);
    const cashInLieuUsd = Math.round(Number(mitIfRemoved?.cash_in_lieu_usd) || 0);

    const maxAllowedCrzPct = Number(
      muni?.plan_rules?.root_zone?.max_disturbed_pct ??
        muni?.plan_rules?.root_zone?.max_encroachment_pct ??
        25
    );
    const rootRuleViolated = disturbancePct > maxAllowedCrzPct;

    sb.municipal_permit_disposition = {
      jurisdiction_id: muni.id,
      ordinance_citation: muni.ordinance_numbers,
      protection_tier: keepRow.heritage
        ? 'Heritage'
        : keepRow.protected
        ? 'Protected'
        : 'Unregulated',
      permit_required: Boolean(permitIfRemoved.required),
      recommended_disposition:
        tOverR >= 0.30
          ? 'Preservation_With_Rhizosphere_Remediation'
          : 'Structural_Risk_Reduction_Pruning',
      seasonal_oak_wilt_restriction_active: false,
    };

    clonedCase.ordinance_id = muni.id;
    clonedCase.crz_disturbed_pct = disturbancePct;
    clonedCase.proposed_removal = false;

    // Core biomechanical, allometric, holobiont, soil sponge, triage & LEO-RAP engines
    const biomechanics = evaluateBiomechanicsAndRhizosphere(synthAssessment);
    const valuation = computeHolobiontValuation(synthAssessment);
    const economics = computeRegenerativePracticeEconomics(synthAssessment);
    const triage = computePhasedStewardshipTriage(synthAssessment, economics);
    const ecoBenefits = calculateTreeEcosystemBenefits({
      species_name: speciesSci,
      common_name: speciesCommon,
      dbh_inches: dbhIn,
      condition_class: clonedCase.condition_class || 'Good',
    });
    const ageEst = estimateTreeAge({
      dbh_inches: dbhIn,
      base_growth_factor: activeArchetype?.growthFactor || 4.5,
      site_condition: clonedCase.site_condition || 'Open Grown / Parkland',
    });
    const sponge = estimateSoilSpongeCapacity({
      tiz_area_m2: tizAreaM2,
      infiltration_mm_hr: Number(soil?.infiltration_rate_mm_hr) || 18,
      organic_matter_percent: Number(soil?.organic_matter_pct) || 2.6,
    });

    const provenance = inspectMunicipalityProvenance(muni);
    const leoBrief = compileLeoRapBrief(synthAssessment, {
      municipality: muni,
      evaluatedRow: keepRow,
      permitText,
      mitigationIfRemoved: mitIfRemoved,
      biomechanics,
      valuation,
      economics,
      triage,
      rootZones: { crz, tpz, srz },
      provenance,
    });

    const permalinkHash = encodeAssessmentPermalink(clonedCase);
    const shareUrl = buildDemoPermalinkUrl(permalinkHash);

    const holobiontUsd = Math.round(
      Number(valuation.holobiont_200yr_biological_equity_usd) || 0
    );
    const ctlaUsd = Math.round(Number(valuation.ctla_10th_ed_depreciated_usd) || 0);
    const stage1Usd = Math.round(Number(triage.stages[0]?.client_price_usd) || 0);

    // 1. Update Control Readouts
    const imp = isImperialUnits();
    const setElText = (id, val) => {
      const node = document.getElementById(id);
      if (node) node.textContent = val;
    };

    setElText('qc-dbh-display', imp ? `${dbhIn} in` : `${dbhCm.toFixed(1)} cm`);
    setElText('qc-dbh-cm-display', imp ? `${dbhCm.toFixed(1)} cm` : `${dbhIn} in`);
    setElText(
      'qc-tape-circumference',
      imp
        ? `Tape around trunk at 4.5 ft: ${circumferenceIn.toFixed(1)} in (${circFeet} ft ${circRemIn.toFixed(1)} in)`
        : `Tape around trunk at 1.37 m: ${round1(dbhCm * Math.PI)} cm (${round2((dbhCm * Math.PI) / 100)} m / ${circumferenceIn.toFixed(1)} in)`
    );
    setElText(
      'qc-cavity-display',
      cavityPct === 0 ? '0% (Solid Wood)' : `${cavityPct}% hollow`
    );

    const tOverREl = document.getElementById('qc-toverr-display');
    if (tOverREl) {
      tOverREl.textContent = `t/R = ${tOverR.toFixed(2)} (${
        tOverR >= 0.30 ? 'Sound >= 0.30' : 'Thin < 0.30'
      })`;
      tOverREl.className = tOverR >= 0.30 ? 'oa-tape-pill' : 'oa-tape-pill badge-removal';
    }

    setElText('qc-disturbance-display', `${disturbancePct}% of CRZ`);
    const disturbedSqft = Math.round((crz.area_sqft * disturbancePct) / 100);
    const disturbedAreaLabel = fmtDualAreaSqftSqm(disturbedSqft);
    const pressureLabel = imp ? '150 psi (10.3 bar)' : '10.3 bar (150 psi)';
    const disturbanceHintText =
      disturbancePct === 0
        ? 'Zero trenching or grade cut inside the Critical Root Zone.'
        : disturbancePct <= 15
        ? `Affects ~${disturbedAreaLabel} of outer feeder roots; specify ${pressureLabel} AirSpade trenching rather than mechanical cutting.`
        : rootRuleViolated
        ? `Affects ~${disturbedAreaLabel} and exceeds the ${maxAllowedCrzPct}% CRZ disturbance threshold (${muni.name}).`
        : `Affects ~${disturbedAreaLabel} inside the ${fmtDualFtM(crz.radius_feet, crz.radius_meters)} CRZ; protect the inner ${fmtDualFtM(srz.radius_feet, srz.radius_meters)} windthrow plate.`;
    setElText('qc-disturbance-hint', disturbanceHintText);

    // 2. Update Core Layer-1 Determination Grid (preserving #qc-* IDs)
    setElText('qc-species-val', speciesCommon);
    setElText('qc-species-sub', `${speciesSci} · ${fmtDualInCm(dbhIn, dbhCm)} DBH`);
    setElText('qc-status-val', protLabel);
    setElText('qc-tier-sub', `${muni.ordinance_numbers} | Shell t/R = ${tOverR.toFixed(2)}`);

    const permitLabel = permitIfRemoved.required
      ? 'Removal Permit Req.'
      : permitIfRemoved.unknown
      ? 'Verify City Rule'
      : 'No Permit Req.';
    setElText('qc-permit-val', permitLabel);
    const mitigationSub =
      cashInLieuUsd > 0
        ? `Mitigation: ${formatUsd(cashInLieuUsd)} if removed`
        : mitIfRemoved?.replacement_inches_owed > 0
        ? `Replacement: ${fmtDualInCm(mitIfRemoved.replacement_inches_owed)} caliper if removed`
        : permitIfRemoved.unknown
        ? 'Thresholds verified; verify sub-rules'
        : 'Protected threshold not triggered';
    setElText('qc-permit-sub', mitigationSub);

    setElText('qc-crz-val', fmtDualFtM(crz.radius_feet, crz.radius_meters));
    setElText(
      'qc-tpz-val',
      imp
        ? `${Math.round(crz.area_sqft).toLocaleString('en-US')} sq ft CRZ`
        : `${round1(crz.area_sqm).toLocaleString('en-US')} m2 CRZ`
    );
    setElText('qc-srz-val', fmtDualFtM(srz.radius_feet, srz.radius_meters));

    setElText('qc-ctla-val', formatUsd(ctlaUsd));
    setElText(
      'qc-ctla-note',
      `CTLA Trunk Formula Method model: assumes regional unit trunk cost ($65/sq in) depreciated by species, site, and condition ratings (Nowak annual ecosystem services estimate: ${formatUsd(ecoBenefits.total_annual_benefits_usd)}/yr).`
    );
    setElText('qc-holobiont-val', formatUsd(holobiontUsd));
    setElText(
      'qc-holobiont-note',
      `Experimental 200-yr holobiont ecosystem model (${valuation.veteran_keystone_habitat_multiplier}x keystone multiplier over base annual flow; uncalibrated long-horizon survival assumption, see docs/LAYERS.md kill criteria).`
    );
    setElText(
      'qc-citation-line',
      `Citation: ${muni.ordinance_numbers} | ${speciesCommon} (~${ageEst.estimated_age_years} yrs est.) | Mattheck t/R = ${tOverR.toFixed(2)}`
    );

    const demoLink = document.getElementById('qc-open-demo-link');
    if (demoLink) {
      demoLink.setAttribute('href', `./demo/index.html${permalinkHash}`);
    }

    // 3. Render Dual Real-Time Botanical SVG
    const svgStage = document.getElementById('qc-living-svg-container');
    if (svgStage) {
      svgStage.innerHTML = renderLivingLensSVG({
        speciesCommon,
        dbhIn,
        cavityPct,
        tOverR,
        disturbancePct,
        crzFt: crz.radius_feet,
        srzFt: srz.radius_feet,
        tizFt: tizRadiusFt,
        stormGallons: sponge.storm_1in_capture_gallons,
        trunkRadiusCm: biomechanics.biomechanics.trunk_radius_cm,
        soundShellCm: biomechanics.biomechanics.sound_shell_cm,
      });
    }

    // 4. Update Primary Statutory & Physical Determination Summary (Layer 1)
    const verdictCard = document.getElementById('qc-innate-verdict-card');
    if (verdictCard) {
      verdictCard.classList.toggle('is-thin-shell', tOverR < 0.30);
    }
    const dbhDualText = fmtDualInCm(dbhIn, dbhCm);
    const shellDualText = fmtDualFromCm(biomechanics.biomechanics.sound_shell_cm);
    const srzDualText = fmtDualFtM(srz.radius_feet, srz.radius_meters);
    const crzDualText = fmtDualFtM(crz.radius_feet, crz.radius_meters);
    const stormDualText = fmtDualGallons(sponge.storm_1in_capture_gallons);
    const rainDepthText = imp ? '1-inch (25 mm)' : '25 mm (1-inch)';

    setElText(
      'qc-innate-verdict-headline',
      `${speciesCommon} (${activeArchetype?.treeTag || 'SPECIMEN'}): ${protLabel} tier | ${permitLabel} | CRZ ${crzDualText} | Shell t/R = ${tOverR.toFixed(2)}`
    );

    const threeSentenceDiagnosis = [
      `${
        tOverR >= 0.30
          ? `At ${dbhDualText} DBH (~${ageEst.estimated_age_years} yrs estimated), this ${speciesCommon} retains a ${shellDualText} living outer cylinder (t/R = ${tOverR.toFixed(2)}, above Claus Mattheck's 0.30 buckling threshold) anchored by a ${srzDualText} structural root plate.`
          : `At ${dbhDualText} DBH (~${ageEst.estimated_age_years} yrs estimated), the sound wood wall measures ${shellDualText} (t/R = ${tOverR.toFixed(2)}, below Claus Mattheck's 0.30 threshold), so on-site sonic tomography and crown load reduction come before soil work.`
      }`,
      `Under ${muni.name}, ${muni.state} (${muni.ordinance_numbers}), it classifies as ${protLabel} (${permitLabel}) with a ${crzDualText} Critical Root Zone${
        disturbancePct > 0 ? ` and ${disturbancePct}% proposed root-zone trenching` : ''
      }.`,
      `Modeled soil sponge capture is ${stormDualText} in a ${rainDepthText} rain event.`,
    ].join(' ');
    setElText('qc-innate-verdict-body', threeSentenceDiagnosis);
    setElText('qc-innate-falsifier', `Physical check: ${leoBrief.answer_first.falsifier}`);

    // 4b. Render Municipality Provenance & Visible Gaps Panel on First Screen
    const provPanel = document.getElementById('qc-provenance-panel');
    if (provPanel) {
      const isFull = provenance.record_tier === 'Full_Rule_Record';
      provPanel.className = `oa-provenance-panel ${
        isFull ? 'oa-provenance-tier-full' : 'oa-provenance-tier-threshold'
      }`;
      const gapCount = provenance.unverified_gaps.length;
      const gapsHtml =
        gapCount > 0
          ? `<div class="oa-provenance-gaps">
              <strong>Visible Gaps (${gapCount} UNVERIFIED Sub-Section${gapCount === 1 ? '' : 's'}):</strong>
              <ul class="oa-provenance-list">
                ${provenance.unverified_gaps
                  .map(
                    (g) =>
                      `<li><code>${escapeHtml(g.field)}</code>: <span class="badge badge-warn">${escapeHtml(g.status)}</span> ${escapeHtml(g.description)}</li>`
                  )
                  .join('')}
              </ul>
            </div>`
          : `<div class="oa-provenance-gaps" style="background: transparent; border-left: 3px solid var(--accent-green); padding: 4px 10px;">
              <strong>Visible Gaps (UNVERIFIED Sub-Sections):</strong> 0 missing core schema domains (${provenance.verified_sections.length} statutory sections encoded with primary citations; verify site-specific variances before construction).
            </div>`;

      provPanel.innerHTML = `
        <div class="oa-provenance-header">
          <strong>Provenance &amp; Statutory Coverage: ${escapeHtml(provenance.municipality_name)} (${escapeHtml(provenance.record_id)})</strong>
          <span class="badge ${isFull ? 'badge-protected' : 'badge-warn'}">${escapeHtml(provenance.record_tier)}</span>
        </div>
        <p class="hint" style="margin: 4px 0 8px 0;">
          Primary Citation: ${escapeHtml(provenance.primary_citation)} &middot; Dataset ${escapeHtml(provenance.dataset_version)} &middot; Verified ${escapeHtml(provenance.last_verified)}${
            provenance.source_url
              ? ` &middot; <a href="${escapeHtml(provenance.source_url)}" target="_blank" rel="noopener">Primary Code Link</a>`
              : ''
          }
        </p>
        ${gapsHtml}
      `;
    }

    // 5. Update Secondary Practice Economics & Valuation Model Strip (inside disclosure)
    setElText('qc-future-a-bid', formatUsd(triage.removal_bid_usd));
    setElText(
      'qc-future-a-mitigation',
      cashInLieuUsd > 0
        ? `${formatUsd(cashInLieuUsd)} city mitigation fee`
        : `${fmtDualInCm(mitIfRemoved?.replacement_inches_owed || 0)} caliper replacement`
    );
    setElText(
      'qc-future-a-lost',
      `CTLA appraisal model: ${formatUsd(ctlaUsd)} | Experimental 200-yr holobiont hypothesis: ${formatUsd(holobiontUsd)}`
    );

    setElText('qc-future-b-stage1', formatUsd(stage1Usd));
    setElText(
      'qc-future-b-savings',
      triage.day_one_undercuts_removal
        ? `${formatUsd(triage.day_one_savings_vs_removal_usd)} less than Day-1 removal`
        : 'Phased Stage 1 diagnostic & root-collar relief'
    );
    setElText(
      'qc-future-b-sponge',
      `${fmtDualGallons(sponge.storm_1in_capture_gallons)}${imp ? ' / 1-in storm' : ' / 25 mm storm'} + ${fmtDualGallons(sponge.som_sponge_capacity_gallons)} SOM reserve`
    );
    setElText(
      'qc-future-b-margin',
      `${triage.net_margin_multiplier.toFixed(2)}x higher 5-yr arborist net margin (${formatUsd(triage.full_5yr_practitioner_net_usd)} vs ${formatUsd(triage.removal_practitioner_net_usd)})`
    );

    // 6. Update Act II 3-Stage Triage Breakdown & Act IV Live LEO-RAP Preview
    const triageGrid = document.getElementById('qc-triage-stages-grid');
    if (triageGrid && Array.isArray(triage.stages)) {
      triageGrid.innerHTML = triage.stages
        .map((st) => {
          const stageNum = st.stage_number || st.stage || 1;
          const desc = st.scope || st.summary || '';
          return `
            <div class="oa-triage-stage">
              <span class="oa-stage-tag">Stage ${escapeHtml(stageNum)} &middot; ${escapeHtml(st.window)}</span>
              <strong>${escapeHtml(st.title)}</strong>
              <span class="oa-stage-price">${formatUsd(st.client_price_usd)}</span>
              <span class="hint">Practitioner net: ${formatUsd(st.practitioner_net_usd)}</span>
              <p class="hint">${escapeHtml(desc)}</p>
            </div>
          `;
        })
        .join('');
    }

    setElText('qc-leo-status-preview', leoBrief.status_line);
    const leoAnchorsEl = document.getElementById('qc-leo-anchors-preview');
    if (leoAnchorsEl) {
      const anchors = leoBrief.oracle_anchors || {};
      const lines = Object.entries(anchors).map(
        ([k, v]) => `[[oracle:${k}=${v}]]`
      );
      lines.push(`sha256:${String(leoBrief.assessment_sha256 || '').slice(0, 24)}...`);
      leoAnchorsEl.textContent = lines.join('\n');
    }

    // 7. Store current handoff state for #btn-open-handoff-dialog
    const oakWiltWarn =
      isOakSpecies(speciesCommon, speciesSci) && String(muni.id).startsWith('tx-')
        ? 'Avoid non-emergency oak pruning Feb 1 through Jun 30 in Texas and paint any fresh wound within 10 minutes.'
        : '';

    qcRoot._currentHandoffParams = {
      speciesCommon,
      speciesScientific: speciesSci,
      dbhInches: dbhIn,
      cityLabel: `${muni.name}, ${muni.state} (${muni.ordinance_numbers})`,
      protectionStatus: protLabel,
      tOverR,
      sonicTomographyVerified: Boolean(
        synthAssessment?.structural_baseline?.sonic_tomography_or_resistograph_uri
      ),
      crzFeet: crz.radius_feet,
      holobiontUsd,
      ctlaUsd,
      cashInLieuUsd,
      stage1Usd,
      removalBidUsd: triage.removal_bid_usd,
      marginMultiplier: triage.net_margin_multiplier,
      oakWiltWarning: oakWiltWarn,
      shareUrl,
    };
  };

  // Archetype preset buttons
  archetypeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-archetype-key');
      const found = ARCHETYPE_SPECIMENS.find((a) => a.key === key);
      if (!found) return;
      activeArchetype = found;
      setActiveArchetypeButton(found.key);

      dbhSlider.value = String(found.dbhIn);
      jurSelect.value = found.ordinanceId;
      if (cavitySlider) cavitySlider.value = String(found.cavityPct);
      if (disturbanceSlider) disturbanceSlider.value = String(found.disturbancePct);
      updateLivingLens();
    });
  });

  // Bubble-phase listeners on #landing-quick-calc always execute AFTER target-phase listeners in spec-ui.js
  qcRoot.addEventListener('input', () => {
    updateLivingLens();
  });
  qcRoot.addEventListener('change', () => {
    updateLivingLens();
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('oa:unitschange', () => {
      updateLivingLens();
    });
  }

  // Wire "Send This Tree to Your Arborist" button
  const openHandoffBtn = document.getElementById('btn-open-handoff-dialog');
  if (openHandoffBtn) {
    openHandoffBtn.addEventListener('click', () => {
      if (!qcRoot._currentHandoffParams) updateLivingLens();
      openArboristHandoffDialog(qcRoot._currentHandoffParams);
    });
  }

  // Run immediately and queue microtask so Living Lens wins regardless of init order in web/app.js
  updateLivingLens();
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => updateLivingLens());
  }
}
