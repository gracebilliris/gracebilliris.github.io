(function () {
  const dataApi = window.PracticeRxData;

  if (!dataApi) {
    return;
  }

  const {
    loadState,
    saveState,
    resetState,
    createAuditEntry,
    createDispenseNumber,
    generateId,
    calculateMockPrice,
    numberToWords,
    toDateStamp,
    toCurrencyNumber,
  } = dataApi;

  const appRoot = document.getElementById('app');
  const navRoot = document.getElementById('app-nav');
  const labelModal = document.getElementById('label-modal');
  const labelModalContent = document.getElementById('label-modal-content');
  const labelModalTitle = document.getElementById('label-modal-title');
  const labelModalEyebrow = document.getElementById('label-modal-eyebrow');
  const modalDialog = labelModal ? labelModal.querySelector('.modal__dialog') : null;
  const toastRegion = document.getElementById('toast-region');
  const pendingCountNode = document.getElementById('header-pending-count');
  const dispensedCountNode = document.getElementById('header-dispensed-count');
  const statusPendingNode = document.getElementById('status-pending-count');
  const statusDateTimeNode = document.getElementById('status-datetime');
  const statusVersionNode = document.getElementById('status-version');

  if (
    !appRoot ||
    !navRoot ||
    !labelModal ||
    !labelModalContent ||
    !labelModalTitle ||
    !labelModalEyebrow ||
    !modalDialog ||
    !toastRegion ||
    !pendingCountNode ||
    !dispensedCountNode ||
    !statusPendingNode ||
    !statusDateTimeNode ||
    !statusVersionNode
  ) {
    return;
  }

  const VERSION_LABEL = 'PracticeRx Trainer v1.0 (Practice Mode)';
  const VIEW_SHORTCUTS = {
    1: 'dashboard',
    2: 'patient-search',
    3: 'new-script',
    4: 'drug-lookup',
    5: 'final-check',
    6: 'history',
  };

  const SCRIPT_TYPE_OPTIONS = [
    { value: 'N', label: 'N (PBS)' },
    { value: 'P', label: 'P (Private)' },
    { value: 'R', label: 'R (RPBS/Repat)' },
    { value: 'D', label: 'D (Defer)' },
    { value: 'T', label: 'T (Schedule 3)' },
  ];

  const SIG_EXPANSIONS = {
    '1d': 'Take ONE tablet daily.',
    '1bd': 'Take ONE tablet twice daily.',
    '1tds': 'Take ONE tablet THREE times a day.',
    '1nocte': 'Take ONE tablet at night.',
    '2p q4h prn': 'Inhale TWO puffs every 4 hours as needed.',
  };

  let state = loadState();
  let toastTimer = null;

  const ui = {
    currentView: 'dashboard',
    patientSearchQuery: '',
    selectedPatientId: state.patients[0] ? state.patients[0].id : '',
    newScript: createNewScriptDraft(),
    dispenseFlow: createDispenseFlowState(),
    drugLookupQuery: '',
    expandedDrugId: '',
    documentPreview: { scriptId: '', mode: 'label' },
    finalCheck: {
      selectedScriptId: state.queue[0] ? state.queue[0].id : '',
      checklist: createEmptyChecklist(),
      initials: '',
      error: '',
    },
    historyFilters: {
      search: '',
      from: '',
      to: '',
    },
    sorts: {
      dashboardQueue: { key: 'createdAt', dir: 'desc' },
      patientHistory: { key: 'date', dir: 'desc' },
      drugLookup: { key: 'brandName', dir: 'asc' },
      history: { key: 'dispensedAt', dir: 'desc' },
    },
  };

  function createDispenseFlowState() {
    return {
      mode: 'entry',
      lastQueuedScriptId: '',
      samePatientId: '',
      historyRange: '12mo',
      historyOpen: false,
      allHistory: false,
      lookupPopover: '',
    };
  }

  function createEmptyChecklist() {
    return {
      patient: false,
      drug: false,
      dose: false,
      directions: false,
    };
  }

  function createNewScriptDraft(overrides) {
    const patientId = overrides && overrides.patientId ? overrides.patientId : '';
    const patient = patientId ? getPatient(patientId) : null;
    return {
      patientQuery: patient ? `${patient.name} • ${formatDob(patient.dob)}` : '',
      selectedPatientId: patientId,
      prescriberQuery: '',
      prescriberId: '',
      drugQuery: '',
      selectedDrugId: '',
      scriptDate: toDateStamp(new Date()),
      scriptType: 'N',
      isOwing: false,
      isAuthority: false,
      authorityNumber: '',
      brandSubstitutionNotPermitted: false,
      quantity: '',
      repeats: '0',
      directions: '',
      price: '',
      pharmacistInitials: '',
      editingScriptId: '',
      errors: {},
      success: '',
    };
  }

  function persistState() {
    saveState(state);
  }

  function getPatient(patientId) {
    return state.patients.find((patient) => patient.id === patientId) || null;
  }

  function getPrescriber(prescriberId) {
    return state.prescribers.find((prescriber) => prescriber.id === prescriberId) || null;
  }

  function getDrug(drugId) {
    return state.drugs.find((drug) => drug.id === drugId) || null;
  }

  function getQueueScript(scriptId) {
    return state.queue.find((script) => script.id === scriptId) || null;
  }

  function getAnyScript(scriptId) {
    return getQueueScript(scriptId) || state.history.find((script) => script.id === scriptId) || null;
  }

  function getLocalDateStamp(dateLike) {
    const date = new Date(dateLike);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function normalise(value) {
    return String(value || '').toLowerCase().trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parseLocalDateOnly(value));
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  function formatStatusDateTime(value) {
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value));
  }

  function parseLocalDateOnly(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(value);
  }

  function formatDob(value) {
    return new Intl.DateTimeFormat('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parseLocalDateOnly(value));
  }

  function calculateAge(dob) {
    const birth = parseLocalDateOnly(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  function formatPriceInput(value) {
    if (value === '' || value === null || value === undefined) {
      return '';
    }
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return '';
    }
    return amount.toFixed(2);
  }

  function getTodayDispensedCount() {
    const today = getLocalDateStamp(new Date());
    return state.history.filter((record) => getLocalDateStamp(record.dispensedAt) === today).length;
  }

  function showToast(message, tone) {
    toastRegion.innerHTML = `<div class="toast toast--${tone || 'info'}">${escapeHtml(message)}</div>`;
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(() => {
      toastRegion.innerHTML = '';
    }, 3200);
  }

  function renderShortcutBadge(value) {
    return `<span class="button-shortcut">${escapeHtml(value)}</span>`;
  }

  function updateStatusBar() {
    statusPendingNode.textContent = String(state.queue.length);
    statusDateTimeNode.textContent = formatStatusDateTime(new Date());
    statusVersionNode.textContent = VERSION_LABEL;
  }

  function navigate(viewName, focusTargetId) {
    ui.currentView = viewName;
    if (viewName === 'new-script' && ui.dispenseFlow.mode !== 'wait') {
      ui.dispenseFlow.mode = 'entry';
    }
    if (viewName === 'final-check') {
      ensureFinalCheckSelection();
    }
    render(focusTargetId);
  }

  function ensureFinalCheckSelection() {
    if (!state.queue.length) {
      ui.finalCheck.selectedScriptId = '';
      ui.finalCheck.checklist = createEmptyChecklist();
      ui.finalCheck.initials = '';
      ui.finalCheck.error = '';
      return;
    }

    const current = getQueueScript(ui.finalCheck.selectedScriptId);
    if (current && current.scriptStatus !== 'cancelled') {
      return;
    }

    const nextScript = state.queue.find((script) => script.scriptStatus !== 'cancelled') || state.queue[0];
    ui.finalCheck.selectedScriptId = nextScript ? nextScript.id : '';
    ui.finalCheck.checklist = createEmptyChecklist();
    ui.finalCheck.initials = '';
    ui.finalCheck.error = '';
  }

  function setFinalCheckSelection(scriptId) {
    ui.finalCheck.selectedScriptId = scriptId;
    ui.finalCheck.checklist = createEmptyChecklist();
    ui.finalCheck.initials = '';
    ui.finalCheck.error = '';
  }

  function restoreFocus(targetId) {
    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    target.focus();
    if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && target.selectionStart !== null) {
      const end = target.value.length;
      target.setSelectionRange(end, end);
    }
  }

  function compareValues(left, right, type) {
    if (type === 'number') {
      return Number(left || 0) - Number(right || 0);
    }

    if (type === 'date') {
      return new Date(left).getTime() - new Date(right).getTime();
    }

    return normalise(left).localeCompare(normalise(right), 'en', { numeric: true, sensitivity: 'base' });
  }

  function getSortMeta(tableName, key) {
    if (tableName === 'dashboardQueue') {
      if (key === 'patient') {
        return { type: 'text', value: (script) => (getPatient(script.patientId) || {}).name || '' };
      }
      if (key === 'drug') {
        return { type: 'text', value: (script) => {
          const drug = getDrug(script.drugId);
          return drug ? `${drug.brandName} ${drug.strength}` : '';
        } };
      }
      if (key === 'quantity') {
        return { type: 'number', value: (script) => script.quantity };
      }
      if (key === 'repeats') {
        return { type: 'number', value: (script) => script.repeats };
      }
      if (key === 'price') {
        return { type: 'number', value: (script) => script.price };
      }
      if (key === 'dispenseNumber') {
        return { type: 'text', value: (script) => script.dispenseNumber };
      }
      return { type: 'date', value: (script) => script.createdAt };
    }

    if (tableName === 'patientHistory') {
      if (key === 'quantity') {
        return { type: 'number', value: (item) => item.quantity };
      }
      return { type: key === 'date' ? 'date' : 'text', value: (item) => item[key] };
    }

    if (tableName === 'drugLookup') {
      if (key === 'stockQuantity') {
        return { type: 'number', value: (item) => item.stockQuantity };
      }
      return { type: 'text', value: (item) => item[key] };
    }

    if (key === 'patient') {
      return { type: 'text', value: (record) => (getPatient(record.patientId) || {}).name || '' };
    }
    if (key === 'drug') {
      return { type: 'text', value: (record) => {
        const drug = getDrug(record.drugId);
        return drug ? `${drug.brandName} ${drug.strength}` : '';
      } };
    }
    if (key === 'quantity') {
      return { type: 'number', value: (record) => record.quantity };
    }
    if (key === 'price') {
      return { type: 'number', value: (record) => record.price };
    }
    if (key === 'dispenseNumber') {
      return { type: 'text', value: (record) => record.dispenseNumber };
    }
    if (key === 'pharmacistInitials') {
      return { type: 'text', value: (record) => record.pharmacistInitials };
    }
    return { type: 'date', value: (record) => record.dispensedAt };
  }

  function getSortedItems(items, tableName) {
    const sortState = ui.sorts[tableName];
    if (!sortState) {
      return items.slice();
    }
    const meta = getSortMeta(tableName, sortState.key);
    return items.slice().sort((left, right) => {
      const result = compareValues(meta.value(left), meta.value(right), meta.type);
      return sortState.dir === 'asc' ? result : result * -1;
    });
  }

  function setSort(tableName, key) {
    const current = ui.sorts[tableName] || { key, dir: 'asc' };
    const nextDir = current.key === key && current.dir === 'asc' ? 'desc' : 'asc';
    ui.sorts[tableName] = { key, dir: nextDir };
    render();
  }

  function renderSortHeader(tableName, key, label, options) {
    const current = ui.sorts[tableName] || {};
    const isActive = current.key === key;
    const indicator = isActive ? (current.dir === 'asc' ? '▲' : '▼') : '↕';
    return `
      <button class="table-sort ${isActive ? 'is-active' : ''} ${options && options.numeric ? 'is-numeric' : ''}" type="button" data-sort-table="${tableName}" data-sort-key="${key}" aria-label="Sort by ${escapeHtml(label)}">
        <span>${escapeHtml(label)}</span>
        <span class="sort-indicator" aria-hidden="true">${indicator}</span>
      </button>
    `;
  }

  function getPrescriberMatches() {
    const query = normalise(ui.newScript.prescriberQuery);
    return state.prescribers.filter((prescriber) => {
      if (!query) {
        return true;
      }
      return (
        normalise(prescriber.name).includes(query) ||
        normalise(prescriber.clinic).includes(query) ||
        normalise(prescriber.providerNumber).includes(query)
      );
    });
  }

  function getPatientMatches() {
    const patientQuery = normalise(ui.newScript.patientQuery);
    return state.patients
      .filter((patient) => {
        if (!patientQuery) {
          return true;
        }
        return (
          normalise(patient.name).includes(patientQuery) ||
          normalise(formatDob(patient.dob)).includes(patientQuery) ||
          normalise(patient.dob).includes(patientQuery)
        );
      })
      .slice(0, 6);
  }

  function getDrugMatches() {
    const drugQuery = normalise(ui.newScript.drugQuery);
    return state.drugs
      .filter((drug) => {
        if (!drugQuery) {
          return true;
        }
        return (
          normalise(drug.brandName).includes(drugQuery) ||
          normalise(drug.genericName).includes(drugQuery) ||
          normalise(drug.itemCode).includes(drugQuery)
        );
      })
      .slice(0, 8);
  }

  function getDraftPatient() {
    return getPatient(ui.newScript.selectedPatientId);
  }

  function getDraftDrug() {
    return getDrug(ui.newScript.selectedDrugId);
  }

  function getDraftPrescriber() {
    return getPrescriber(ui.newScript.prescriberId);
  }

  function getCalculatedDraftPrice() {
    const patient = getDraftPatient();
    return calculateMockPrice(ui.newScript.scriptType, patient ? patient.concessionType : 'General', Number(ui.newScript.quantity) || 1);
  }

  function refreshDraftPrice(force) {
    if (force || !ui.newScript.price) {
      ui.newScript.price = formatPriceInput(getCalculatedDraftPrice());
    }
  }

  function applyDrugDefaults(drugId) {
    const drug = getDrug(drugId);
    if (!drug) {
      return;
    }
    ui.newScript.quantity = String(drug.defaultQuantity || 1);
    ui.newScript.repeats = String(drug.defaultRepeats || 0);
    ui.newScript.brandSubstitutionNotPermitted = !drug.brandSubstitutionAllowed;
    ui.newScript.isAuthority = Boolean(drug.requiresAuthority);
    if (!ui.newScript.isAuthority) {
      ui.newScript.authorityNumber = '';
    }
    refreshDraftPrice(true);
  }

  function createDraftFromScript(script, options) {
    const patient = getPatient(script.patientId);
    const drug = getDrug(script.drugId);
    return {
      patientQuery: patient ? `${patient.name} • ${formatDob(patient.dob)}` : '',
      selectedPatientId: script.patientId,
      prescriberQuery: '',
      prescriberId: script.prescriberId,
      drugQuery: drug ? `${drug.brandName} ${drug.strength}` : '',
      selectedDrugId: script.drugId,
      scriptDate: script.scriptDate || toDateStamp(script.createdAt),
      scriptType: script.scriptType || 'N',
      isOwing: Boolean(script.isOwing),
      isAuthority: Boolean(script.isAuthority),
      authorityNumber: script.authorityNumber || '',
      brandSubstitutionNotPermitted: Boolean(script.brandSubstitutionNotPermitted),
      quantity: String(script.quantity || ''),
      repeats: String(script.repeats || 0),
      directions: script.directions || '',
      price: formatPriceInput(script.price),
      pharmacistInitials: script.pharmacistInitialsEnteredAtQueue || '',
      editingScriptId: options && options.preserveIdentity ? script.id : '',
      errors: {},
      success: '',
    };
  }

  function openFreshEntry(patientId) {
    ui.dispenseFlow.mode = 'entry';
    ui.dispenseFlow.lookupPopover = '';
    ui.dispenseFlow.historyOpen = false;
    ui.dispenseFlow.allHistory = false;
    ui.newScript = createNewScriptDraft({ patientId: patientId || '' });
    if (patientId) {
      refreshDraftPrice(true);
    }
    render(patientId ? 'script-drug-search' : 'script-patient-search');
  }

  function openEditEntry(scriptId) {
    const script = getQueueScript(scriptId);
    if (!script) {
      return;
    }
    ui.dispenseFlow.mode = 'entry';
    ui.dispenseFlow.historyOpen = true;
    ui.dispenseFlow.samePatientId = script.patientId;
    ui.newScript = createDraftFromScript(script, { preserveIdentity: true });
    render('script-directions');
  }

  function getPatientHistoryForDrawer(patientId, allHistory) {
    const patient = getPatient(patientId);
    if (!patient) {
      return [];
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 12);

    const historyRecords = state.history
      .filter((record) => record.patientId === patientId)
      .map((record) => {
        const drug = getDrug(record.drugId);
        return {
          id: record.id,
          date: record.dispensedAt,
          drug: drug ? `${drug.brandName} ${drug.strength}` : 'Unknown drug',
          directions: record.directions,
          quantity: record.quantity,
          source: 'history',
          status: record.scriptStatus || 'dispensed',
        };
      });

    const profileHistory = patient.medicationHistory.map((item, index) => ({
      id: `profile-${index}`,
      date: item.date,
      drug: item.drug,
      directions: item.directions,
      quantity: item.quantity,
      source: 'profile',
      status: 'historical',
    }));

    const combined = [...historyRecords, ...profileHistory].filter((record) => {
      if (allHistory) {
        return true;
      }
      return new Date(record.date) >= cutoff;
    });

    return combined.sort((left, right) => new Date(right.date) - new Date(left.date));
  }

  function getRepeatsSummary(patientId, drugId) {
    return state.history
      .filter((record) => record.patientId === patientId && record.drugId === drugId)
      .slice(0, 6)
      .map((record) => ({
        dispenseNumber: record.dispenseNumber,
        date: record.dispensedAt,
        repeats: record.repeats,
        quantity: record.quantity,
      }));
  }

  function getOwingSummary(patientId) {
    return state.queue.filter((script) => script.patientId === patientId && script.isOwing);
  }

  function getScriptStatusTone(status) {
    if (status === 'hold') {
      return 'warning';
    }
    if (status === 'deferred') {
      return 'neutral';
    }
    if (status === 'cancelled') {
      return 'danger';
    }
    if (status === 'dispensed') {
      return 'success';
    }
    return 'success';
  }

  function getScriptTypeLabel(type) {
    const match = SCRIPT_TYPE_OPTIONS.find((option) => option.value === type);
    return match ? match.label : type;
  }

  function getStatusLabel(status) {
    if (status === 'hold') {
      return 'Hold';
    }
    if (status === 'deferred') {
      return 'Deferred';
    }
    if (status === 'cancelled') {
      return 'Cancelled';
    }
    if (status === 'dispensed') {
      return 'Dispensed';
    }
    return 'Pending';
  }

  function updatePatientMedicationHistory(script, dispensedAt) {
    const drug = getDrug(script.drugId);
    const historyEntry = {
      date: getLocalDateStamp(dispensedAt || new Date()),
      drug: drug ? `${drug.brandName} ${drug.strength} ${drug.form}` : 'Unknown drug',
      quantity: script.quantity,
      directions: script.directions,
    };

    state.patients = state.patients.map((patient) => {
      if (patient.id !== script.patientId) {
        return patient;
      }
      return {
        ...patient,
        medicationHistory: [historyEntry, ...(patient.medicationHistory || [])].slice(0, 20),
      };
    });
  }

  function render(focusTargetId) {
    ensureFinalCheckSelection();
    pendingCountNode.textContent = String(state.queue.length);
    dispensedCountNode.textContent = String(getTodayDispensedCount());
    updateStatusBar();

    navRoot.querySelectorAll('[data-nav-view]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.navView === ui.currentView);
    });

    if (ui.currentView === 'dashboard') {
      appRoot.innerHTML = renderDashboardView();
    } else if (ui.currentView === 'patient-search') {
      appRoot.innerHTML = renderPatientSearchView();
    } else if (ui.currentView === 'new-script') {
      appRoot.innerHTML = renderDispenseWorkflowView();
    } else if (ui.currentView === 'drug-lookup') {
      appRoot.innerHTML = renderDrugLookupView();
    } else if (ui.currentView === 'final-check') {
      appRoot.innerHTML = renderFinalCheckView();
    } else {
      appRoot.innerHTML = renderHistoryView();
    }

    renderDocumentModal();
    restoreFocus(focusTargetId || '');
  }

  function renderDashboardView() {
    const recentAudit = [...state.auditTrail]
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
      .slice(0, 6);

    const queueRows = getSortedItems(state.queue, 'dashboardQueue')
      .map((script) => {
        const patient = getPatient(script.patientId);
        const drug = getDrug(script.drugId);
        return `
          <tr>
            <td>${escapeHtml(patient ? patient.name : 'Unknown patient')}</td>
            <td>${escapeHtml(drug ? `${drug.brandName} ${drug.strength}` : 'Unknown drug')}</td>
            <td>${escapeHtml(getScriptTypeLabel(script.scriptType))}</td>
            <td><span class="status-pill status-pill--${getScriptStatusTone(script.scriptStatus)}">${escapeHtml(getStatusLabel(script.scriptStatus))}</span></td>
            <td class="is-numeric">${script.quantity}</td>
            <td class="is-numeric">${script.repeats}</td>
            <td class="mono-cell">${escapeHtml(formatCurrency(script.price))}</td>
            <td class="mono-cell">${escapeHtml(script.dispenseNumber)}</td>
            <td class="date-cell">${escapeHtml(formatDateTime(script.createdAt))}</td>
            <td>
              <div class="inline-actions">
                <button class="table-action" type="button" data-preview-label="${script.id}">Preview Label</button>
                <button class="secondary-button" type="button" data-view-original-script="${script.id}">View Original Script</button>
                <button class="secondary-button" type="button" data-open-final="${script.id}">Open Final Check</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    const queueSection = state.queue.length
      ? `
        <div class="table-panel">
          <div class="table-panel__header">
            <div>
              <h2 class="table-panel__title">Current Script Queue</h2>
              <p class="table-panel__subtitle">Dense worklist view for items waiting to be checked, labelled, and supplied.</p>
            </div>
            <div class="toolbar-help">Sort headers and use row actions to jump into the next workflow step.</div>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>${renderSortHeader('dashboardQueue', 'patient', 'Patient')}</th>
                  <th>${renderSortHeader('dashboardQueue', 'drug', 'Drug')}</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th class="is-numeric">${renderSortHeader('dashboardQueue', 'quantity', 'Qty', { numeric: true })}</th>
                  <th class="is-numeric">${renderSortHeader('dashboardQueue', 'repeats', 'Rpt', { numeric: true })}</th>
                  <th class="is-numeric">${renderSortHeader('dashboardQueue', 'price', 'Price', { numeric: true })}</th>
                  <th>${renderSortHeader('dashboardQueue', 'dispenseNumber', 'Dispense No.')}</th>
                  <th>${renderSortHeader('dashboardQueue', 'createdAt', 'Date Added')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>${queueRows}</tbody>
            </table>
          </div>
        </div>
      `
      : renderEmptyState(
          'No scripts are waiting',
          'Start a training run by creating a new script or searching a patient first.',
          `<button class="button" type="button" data-view="new-script">New Script</button>`
        );

    return `
      <section class="view-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Dashboard</p>
            <h2>Practice workflow snapshot</h2>
            <p>Desktop-style queue, stock, and audit overview for rapid dispensing workflow rehearsal.</p>
          </div>
          <div class="button-row">
            <button class="button" type="button" data-view="new-script">New Script ${renderShortcutBadge('Alt+3')}</button>
            <button class="secondary-button" type="button" data-view="patient-search">Search Patient ${renderShortcutBadge('Alt+2')}</button>
            <button class="ghost-button" id="reset-demo-data" type="button">Reset Demo Data</button>
          </div>
        </div>

        <div class="grid-three">
          <div class="metric-panel">
            <p class="metric-panel__label">Pending queue</p>
            <strong class="metric-panel__value">${state.queue.length}</strong>
            <p class="metric-panel__note">Items ready for label preview and final verification.</p>
          </div>
          <div class="metric-panel">
            <p class="metric-panel__label">Dispensed today</p>
            <strong class="metric-panel__value">${getTodayDispensedCount()}</strong>
            <p class="metric-panel__note">Completed supplies recorded into training history.</p>
          </div>
          <div class="metric-panel">
            <p class="metric-panel__label">Low stock alerts</p>
            <strong class="metric-panel__value">${state.drugs.filter((drug) => drug.stockQuantity < 10).length}</strong>
            <p class="metric-panel__note">Virtual catalogue items below the low-stock threshold.</p>
          </div>
        </div>

        <div class="grid-two">
          ${queueSection}
          <aside class="side-feed">
            <div>
              <h2 class="side-feed__title">Recent activity</h2>
              <p class="side-feed__subtitle">Locally stored workflow events for training continuity.</p>
            </div>
            <div class="audit-list">
              ${recentAudit
                .map(
                  (entry) => `
                    <article class="activity-item">
                      <strong class="activity-item__title">${escapeHtml(entry.action)}</strong>
                      <p class="activity-item__meta">${escapeHtml(entry.detail)}</p>
                      <div class="small-copy mono-cell">${escapeHtml(formatDateTime(entry.timestamp))}</div>
                    </article>
                  `
                )
                .join('')}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderPatientSearchView() {
    const query = normalise(ui.patientSearchQuery);
    const filteredPatients = state.patients.filter((patient) => {
      const dobMatch = formatDob(patient.dob);
      return !query || normalise(patient.name).includes(query) || normalise(dobMatch).includes(query) || normalise(patient.dob).includes(query);
    });

    const selectedPatient = getPatient(ui.selectedPatientId) || filteredPatients[0] || state.patients[0] || null;
    const allergyMarkup = selectedPatient && selectedPatient.allergies.length
      ? selectedPatient.allergies.map((allergy) => `<span class="allergy-pill">${escapeHtml(allergy)}</span>`).join('')
      : '<span class="badge">No allergies recorded</span>';

    const sortedHistory = selectedPatient ? getSortedItems(selectedPatient.medicationHistory, 'patientHistory') : [];
    const historyMarkup = selectedPatient && sortedHistory.length
      ? `
        <div class="table-wrap spacer-top">
          <table class="table">
            <thead>
              <tr>
                <th>${renderSortHeader('patientHistory', 'date', 'Date')}</th>
                <th>${renderSortHeader('patientHistory', 'drug', 'Medication')}</th>
                <th class="is-numeric">${renderSortHeader('patientHistory', 'quantity', 'Qty', { numeric: true })}</th>
                <th>${renderSortHeader('patientHistory', 'directions', 'Directions')}</th>
              </tr>
            </thead>
            <tbody>
              ${sortedHistory
                .map(
                  (historyItem) => `
                    <tr>
                      <td class="date-cell">${escapeHtml(formatDate(historyItem.date))}</td>
                      <td>${escapeHtml(historyItem.drug)}</td>
                      <td class="is-numeric">${escapeHtml(historyItem.quantity)}</td>
                      <td>${escapeHtml(historyItem.directions)}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
      : renderEmptyState('No medication history', 'This fictional profile has no prior training dispensings recorded yet.');

    return `
      <section class="view-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Patient Search</p>
            <h2>Locate a patient and review their profile</h2>
            <p>Search by patient name or date of birth, then confirm allergies and recent medication history.</p>
          </div>
          <div class="toolbar-help">Shortcut: ${renderShortcutBadge('F2')} focus search</div>
        </div>

        <div class="grid-sidebar">
          <div class="queue-column">
            <div class="panel-heading">
              <div>
                <h2>Patient register</h2>
                <p class="panel-copy">Compact list view for quick keyboard-led patient lookups.</p>
              </div>
            </div>
            <div class="search-strip spacer-top">
              <div class="form-field">
                <label class="form-label" for="patient-search-input">Search patients</label>
                <input id="patient-search-input" class="search-input" type="text" placeholder="Type patient name or DOB" value="${escapeHtml(ui.patientSearchQuery)}" />
              </div>
              <div class="shortcuts-row">
                <span class="shortcut-chip">F2</span>
              </div>
            </div>
            <div class="selection-list spacer-top">
              ${filteredPatients.length
                ? filteredPatients
                    .map(
                      (patient) => `
                        <button class="selection-item ${patient.id === (selectedPatient && selectedPatient.id) ? 'is-selected' : ''}" type="button" data-patient-id="${patient.id}">
                          <span class="selection-item__title">${escapeHtml(patient.name)}</span>
                          <span class="selection-item__meta">DOB ${formatDob(patient.dob)} • ${escapeHtml(patient.phone)} • ${escapeHtml(patient.concessionType)}</span>
                        </button>
                      `
                    )
                    .join('')
                : renderEmptyState('No matching patients', 'Try a different spelling or search by date of birth.')}
            </div>
          </div>

          <div class="profile-panel">
            ${selectedPatient
              ? `
                <div class="panel-stack">
                  <div class="panel-heading">
                    <div>
                      <p class="section-heading__eyebrow">Selected profile</p>
                      <h2>${escapeHtml(selectedPatient.name)}</h2>
                      <p class="panel-copy">${calculateAge(selectedPatient.dob)} years old • Medicare-style number <span class="mono-cell">${escapeHtml(selectedPatient.medicareNumber)}</span></p>
                    </div>
                    <button class="secondary-button" type="button" data-load-patient-into-script="${selectedPatient.id}">New Script ${renderShortcutBadge('Alt+3')}</button>
                  </div>

                  <fieldset class="group-panel">
                    <legend class="group-panel__title">Patient details</legend>
                    <dl class="kv-grid">
                      <div>
                        <dt>Date of birth</dt>
                        <dd>${formatDob(selectedPatient.dob)}</dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>${escapeHtml(selectedPatient.phone)}</dd>
                      </div>
                      <div>
                        <dt>Address</dt>
                        <dd>${escapeHtml(selectedPatient.address)}</dd>
                      </div>
                      <div>
                        <dt>Concession</dt>
                        <dd>${escapeHtml(selectedPatient.concessionType)}</dd>
                      </div>
                      <div>
                        <dt>Medicare</dt>
                        <dd>${escapeHtml(selectedPatient.medicareNumber)} / ${escapeHtml(selectedPatient.medicareReferenceNumber)}</dd>
                      </div>
                    </dl>
                  </fieldset>

                  <fieldset class="group-panel">
                    <legend class="group-panel__title">Clinical flags</legend>
                    <div class="chip-row">${allergyMarkup}</div>
                  </fieldset>

                  <fieldset class="group-panel">
                    <legend class="group-panel__title">Medication history</legend>
                    ${historyMarkup}
                  </fieldset>
                </div>
              `
              : renderEmptyState('Pick a patient', 'A profile summary will appear here once you select someone from the search list.')}
          </div>
        </div>
      </section>
    `;
  }

  function renderDispenseWorkflowView() {
    return ui.dispenseFlow.mode === 'wait' ? renderDispenseWaitView() : renderDispenseEntryView();
  }

  function renderDispenseEntryView() {
    const selectedPatient = getDraftPatient();
    const selectedDrug = getDraftDrug();
    const selectedPrescriber = getDraftPrescriber();
    const patientMatches = getPatientMatches();
    const drugMatches = getDrugMatches();
    const prescriberMatches = getPrescriberMatches();
    const patientAlert = selectedPatient && selectedPatient.allergies.length
      ? `<div class="warning-banner">Allergy alert: ${escapeHtml(selectedPatient.allergies.join(', '))}</div>`
      : '';
    const lowStockNotice = selectedDrug && Number(ui.newScript.quantity || 0) > selectedDrug.stockQuantity
      ? `<div class="warning-banner">Requested quantity exceeds virtual stock. ${escapeHtml(selectedDrug.brandName)} has ${selectedDrug.stockQuantity} unit(s) available.</div>`
      : selectedDrug && selectedDrug.stockQuantity < 10
        ? `<div class="warning-banner">Low virtual stock: only ${selectedDrug.stockQuantity} unit(s) currently available for ${escapeHtml(selectedDrug.brandName)}.</div>`
        : '';

    const alerts = [patientAlert, lowStockNotice].filter(Boolean).join('');
    const historyDrawer = renderDispenseHistoryDrawer(selectedPatient);
    const lookupPopover = renderDispenseLookupPopover(selectedPatient, selectedDrug, selectedPrescriber);

    return `
      <section class="view-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">New Script / Dispense Entry</p>
            <h2>Main dispense screen</h2>
            <p>Single-column keyboard-first training workflow with patient, script, product, pricing, and queue-save controls.</p>
          </div>
          <div class="toolbar-help">Keep Alt+1..Alt+6 for navigation. Use F2/F3/F4 inside this screen.</div>
        </div>

        <form id="new-script-form" class="dispense-screen" novalidate>
          <div class="dispense-screen__headerbar">
            <div>
              <p class="section-heading__eyebrow">PracticeRx entry workflow</p>
              <h2>${ui.newScript.editingScriptId ? 'Edit queued item' : 'Linear dispense entry'}</h2>
              <p class="panel-copy">${selectedPatient ? escapeHtml(selectedPatient.name) : 'No patient selected yet'} • Pending queue ${state.queue.length}</p>
            </div>
            <div class="dispense-screen__shortcut-bank">
              <span class="shortcut-chip">F2 History</span>
              <span class="shortcut-chip">F3 Repeats</span>
              <span class="shortcut-chip">Alt+F3 Owing</span>
              <span class="shortcut-chip">F4 Queue</span>
              <span class="shortcut-chip">Ctrl+Q Wait</span>
            </div>
          </div>

          <div class="dispense-screen__alerts">
            ${alerts || '<div class="info-banner">Select patient, prescriber, and drug, then complete script metadata before queueing.</div>'}
            <div class="chip-row">
              <span class="badge">Type ${escapeHtml(getScriptTypeLabel(ui.newScript.scriptType))}</span>
              ${ui.newScript.isOwing ? '<span class="status-pill status-pill--warning">Owing</span>' : ''}
              ${ui.newScript.isAuthority ? '<span class="status-pill status-pill--neutral">Authority</span>' : ''}
              ${ui.newScript.editingScriptId ? '<span class="status-pill status-pill--neutral">Editing existing queue item</span>' : ''}
              ${selectedDrug && selectedDrug.schedule === 'S8' ? '<span class="status-pill status-pill--danger">Schedule 8 training example</span>' : ''}
            </div>
          </div>

          ${historyDrawer}
          ${lookupPopover}

          <div class="dispense-screen__rows">
            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">1</div>
              <div class="dispense-screen__field">
                <div class="stack-between">
                  <label for="script-patient-search">Patient</label>
                  <div class="shortcuts-row"><span class="shortcut-chip">F2</span><span class="shortcut-chip">Ctrl+A</span></div>
                </div>
                <input id="script-patient-search" class="input" type="text" placeholder="Search by patient name or DOB" value="${escapeHtml(ui.newScript.patientQuery)}" autocomplete="off" />
                ${ui.newScript.errors.patient ? `<div class="error-text">${escapeHtml(ui.newScript.errors.patient)}</div>` : ''}
                ${selectedPatient
                  ? `
                    <div class="selected-chip spacer-top">
                      <div class="stack-between">
                        <div>
                          <strong>${escapeHtml(selectedPatient.name)}</strong>
                          <p>DOB ${formatDob(selectedPatient.dob)} • ${escapeHtml(selectedPatient.address)}</p>
                          <p>Medicare <span class="mono-cell">${escapeHtml(selectedPatient.medicareNumber)}</span> / ${escapeHtml(selectedPatient.medicareReferenceNumber)} • ${escapeHtml(selectedPatient.concessionType)}</p>
                        </div>
                        <button class="ghost-button" type="button" data-clear-patient="true">Change</button>
                      </div>
                    </div>
                  `
                  : `
                    <div class="selection-list spacer-top">
                      ${patientMatches.length
                        ? patientMatches
                            .map(
                              (patient) => `
                                <button class="selection-item" type="button" data-select-patient="${patient.id}">
                                  <span class="selection-item__title">${escapeHtml(patient.name)}</span>
                                  <span class="selection-item__meta">DOB ${formatDob(patient.dob)} • ${escapeHtml(patient.address)} • ${escapeHtml(patient.concessionType)}</span>
                                </button>
                              `
                            )
                            .join('')
                        : '<div class="info-banner">No patient matches that search yet.</div>'}
                    </div>
                  `}
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">2</div>
              <div class="dispense-screen__field">
                <label for="dispense-script-date">Script Date</label>
                <input id="dispense-script-date" class="input" type="date" value="${escapeHtml(ui.newScript.scriptDate)}" />
                ${ui.newScript.errors.scriptDate ? `<div class="error-text">${escapeHtml(ui.newScript.errors.scriptDate)}</div>` : ''}
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">3</div>
              <div class="dispense-screen__field">
                <div class="stack-between">
                  <label for="dispense-script-type">Script Type</label>
                  <div class="shortcuts-row"><span class="shortcut-chip">Ctrl+O</span></div>
                </div>
                <div class="dispense-screen__inline-grid">
                  <select id="dispense-script-type" class="select">
                    ${SCRIPT_TYPE_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === ui.newScript.scriptType ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
                  </select>
                  <label class="toggle-field"><input id="dispense-is-owing" type="checkbox" ${ui.newScript.isOwing ? 'checked' : ''} /> <span>Owing</span></label>
                  <label class="toggle-field"><input id="dispense-is-authority" type="checkbox" ${ui.newScript.isAuthority ? 'checked' : ''} /> <span>Authority</span></label>
                </div>
                ${ui.newScript.isAuthority
                  ? `
                    <div class="form-field spacer-top">
                      <label for="dispense-authority-number">Authority number</label>
                      <input id="dispense-authority-number" class="input" type="text" placeholder="Training authority reference" value="${escapeHtml(ui.newScript.authorityNumber)}" />
                      ${ui.newScript.errors.authorityNumber ? `<div class="error-text">${escapeHtml(ui.newScript.errors.authorityNumber)}</div>` : ''}
                    </div>
                  `
                  : ''}
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">4</div>
              <div class="dispense-screen__field">
                <label for="dispense-prescriber-search">Prescribing Doctor</label>
                <input id="dispense-prescriber-search" class="input" type="text" placeholder="Filter prescribers by doctor, clinic, or provider number" value="${escapeHtml(ui.newScript.prescriberQuery)}" />
                <select id="script-prescriber" class="select spacer-top">
                  <option value="">Select prescriber</option>
                  ${prescriberMatches
                    .map(
                      (prescriber) => `
                        <option value="${prescriber.id}" ${prescriber.id === ui.newScript.prescriberId ? 'selected' : ''}>
                          ${escapeHtml(prescriber.name)} — ${escapeHtml(prescriber.clinic)}
                        </option>
                      `
                    )
                    .join('')}
                </select>
                ${ui.newScript.errors.prescriber ? `<div class="error-text">${escapeHtml(ui.newScript.errors.prescriber)}</div>` : ''}
                ${selectedPrescriber
                  ? `
                    <div class="summary-box spacer-top">
                      <strong>${escapeHtml(selectedPrescriber.name)} ${escapeHtml(selectedPrescriber.qualifications)}</strong>
                      <p>${escapeHtml(selectedPrescriber.clinic)} • ${escapeHtml(selectedPrescriber.practiceAddress)}</p>
                      <p>${escapeHtml(selectedPrescriber.practicePhone)} • Provider ${escapeHtml(selectedPrescriber.providerNumber)}</p>
                    </div>
                  `
                  : ''}
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">5</div>
              <div class="dispense-screen__field">
                <div class="stack-between">
                  <label for="script-drug-search">Drug</label>
                  <div class="shortcuts-row"><span class="shortcut-chip">F3</span><span class="shortcut-chip">F11</span></div>
                </div>
                <input id="script-drug-search" class="input" type="text" placeholder="Search brand, generic, or code" value="${escapeHtml(ui.newScript.drugQuery)}" autocomplete="off" />
                ${ui.newScript.errors.drug ? `<div class="error-text">${escapeHtml(ui.newScript.errors.drug)}</div>` : ''}
                ${selectedDrug
                  ? `
                    <div class="selected-chip spacer-top">
                      <div class="stack-between">
                        <div>
                          <strong>${escapeHtml(selectedDrug.brandName)} ${escapeHtml(selectedDrug.strength)}</strong>
                          <p>${escapeHtml(selectedDrug.genericName)} • ${escapeHtml(selectedDrug.form)} • Code <span class="mono-cell">${escapeHtml(selectedDrug.itemCode)}</span></p>
                          <p>${escapeHtml(selectedDrug.schedule)} • Default qty ${selectedDrug.defaultQuantity} • Stock ${selectedDrug.stockQuantity}</p>
                        </div>
                        <button class="ghost-button" type="button" data-clear-drug="true">Change</button>
                      </div>
                    </div>
                  `
                  : `
                    <div class="selection-list spacer-top">
                      ${drugMatches.length
                        ? drugMatches
                            .map(
                              (drug) => `
                                <button class="selection-item" type="button" data-select-drug="${drug.id}">
                                  <span class="selection-item__title">${escapeHtml(drug.brandName)} ${escapeHtml(drug.strength)}</span>
                                  <span class="selection-item__meta">${escapeHtml(drug.genericName)} • ${escapeHtml(drug.form)} • Code ${escapeHtml(drug.itemCode)} • ${escapeHtml(drug.schedule)}</span>
                                </button>
                              `
                            )
                            .join('')
                        : '<div class="info-banner">No drug matches that search yet.</div>'}
                    </div>
                  `}
                <div class="dispense-screen__inline-grid spacer-top">
                  <label class="toggle-field"><input id="dispense-brand-substitution" type="checkbox" ${ui.newScript.brandSubstitutionNotPermitted ? 'checked' : ''} /> <span>Brand substitution not permitted</span></label>
                </div>
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">6</div>
              <div class="dispense-screen__field">
                <label for="script-directions">Directions / SIG</label>
                <textarea id="script-directions" class="textarea" placeholder="Enter directions exactly as you want the mock label to display.">${escapeHtml(ui.newScript.directions)}</textarea>
                ${ui.newScript.errors.directions ? `<div class="error-text">${escapeHtml(ui.newScript.errors.directions)}</div>` : ''}
                <div class="sig-shortcuts spacer-top">
                  <button class="ghost-button" type="button" data-sig-shortcut="Take 1 tablet once daily.">1 tablet daily</button>
                  <button class="ghost-button" type="button" data-sig-shortcut="Take 1 tablet twice daily with food.">1 tablet twice daily</button>
                  <button class="ghost-button" type="button" data-sig-shortcut="Take 1 capsule at night.">1 capsule at night</button>
                  <button class="ghost-button" type="button" data-sig-shortcut="Inhale 2 puffs every 4 hours as needed.">2 puffs PRN</button>
                  <button class="ghost-button" type="button" data-sig-shortcut="Apply a thin layer to the affected area twice daily.">Apply twice daily</button>
                </div>
                <div class="info-banner spacer-top">
                  Smart SIG examples: <span class="mono-cell">1d</span>, <span class="mono-cell">1bd</span>, <span class="mono-cell">1tds</span>, <span class="mono-cell">2p q4h prn</span>
                  <div class="button-row spacer-top">
                    <button class="secondary-button" type="button" data-expand-sig="true">Expand typed SIG</button>
                  </div>
                </div>
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">7</div>
              <div class="dispense-screen__field">
                <label for="script-repeats">Repeats</label>
                <input id="script-repeats" class="input" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(ui.newScript.repeats)}" />
                ${ui.newScript.errors.repeats ? `<div class="error-text">${escapeHtml(ui.newScript.errors.repeats)}</div>` : ''}
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">8</div>
              <div class="dispense-screen__field">
                <label for="script-quantity">Quantity</label>
                <input id="script-quantity" class="input" type="number" min="1" step="1" inputmode="numeric" value="${escapeHtml(ui.newScript.quantity)}" />
                ${ui.newScript.errors.quantity ? `<div class="error-text">${escapeHtml(ui.newScript.errors.quantity)}</div>` : ''}
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">9</div>
              <div class="dispense-screen__field">
                <div class="stack-between">
                  <label for="dispense-price">Price</label>
                  <div class="shortcuts-row"><span class="shortcut-chip">F7</span></div>
                </div>
                <input id="dispense-price" class="input" type="text" inputmode="decimal" placeholder="0.00" value="${escapeHtml(ui.newScript.price)}" />
                ${ui.newScript.errors.price ? `<div class="error-text">${escapeHtml(ui.newScript.errors.price)}</div>` : ''}
                <p class="helper-line">Suggested mock price: ${escapeHtml(formatCurrency(getCalculatedDraftPrice()))}</p>
              </div>
            </section>

            <section class="dispense-screen__row">
              <div class="dispense-screen__step-number">10</div>
              <div class="dispense-screen__field">
                <label for="dispense-initials">Pharmacist Initials</label>
                <input id="dispense-initials" class="input" type="text" maxlength="4" placeholder="Enter initials, then press Enter to queue" value="${escapeHtml(ui.newScript.pharmacistInitials)}" />
                ${ui.newScript.errors.pharmacistInitials ? `<div class="error-text">${escapeHtml(ui.newScript.errors.pharmacistInitials)}</div>` : ''}
                <p class="helper-line">Press Enter here or use F4 to queue and move to the training wait screen.</p>
              </div>
            </section>
          </div>

          <div class="dispense-screen__footerbar">
            <div>
              <strong>${ui.newScript.editingScriptId ? 'Update queued item' : 'Queue the script'}</strong>
              <p class="panel-copy">This remains a vanilla browser-based training app with localStorage state.</p>
            </div>
            <div class="button-row">
              <button class="button" type="submit">${ui.newScript.editingScriptId ? 'Save Changes' : 'Add to Queue'} ${renderShortcutBadge('F4')}</button>
              <button class="secondary-button" type="button" data-view="final-check">Open Final Check</button>
              ${ui.newScript.editingScriptId ? '<button class="ghost-button" type="button" data-cancel-edit="true">Cancel Edit</button>' : '<button class="ghost-button" type="button" data-reset-dispense-entry="true">Clear Entry</button>'}
            </div>
          </div>
        </form>
      </section>
    `;
  }

  function renderDispenseHistoryDrawer(selectedPatient) {
    if (!ui.dispenseFlow.historyOpen) {
      return '';
    }

    if (!selectedPatient) {
      return '<div class="dispense-screen__history-drawer"><div class="info-banner">Select a patient first to review training history.</div></div>';
    }

    const historyItems = getPatientHistoryForDrawer(selectedPatient.id, ui.dispenseFlow.allHistory);
    return `
      <div class="dispense-screen__history-drawer">
        <div class="panel-heading">
          <div>
            <p class="section-heading__eyebrow">Patient history</p>
            <h2>${escapeHtml(selectedPatient.name)}</h2>
            <p class="panel-copy">${ui.dispenseFlow.allHistory ? 'All recorded history' : 'Last 12 months'} for contextual review.</p>
          </div>
          <div class="button-row">
            <button class="ghost-button" type="button" data-toggle-history-range="12mo">12 months</button>
            <button class="ghost-button" type="button" data-toggle-history-range="all">All</button>
            <button class="ghost-button" type="button" data-close-history-drawer="true">Close</button>
          </div>
        </div>
        ${historyItems.length
          ? `
            <div class="table-wrap spacer-top">
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medication</th>
                    <th class="is-numeric">Qty</th>
                    <th>Source</th>
                    <th>Directions</th>
                  </tr>
                </thead>
                <tbody>
                  ${historyItems
                    .map(
                      (item) => `
                        <tr>
                          <td class="date-cell">${escapeHtml(item.source === 'history' ? formatDateTime(item.date) : formatDate(item.date))}</td>
                          <td>${escapeHtml(item.drug)}</td>
                          <td class="is-numeric">${item.quantity}</td>
                          <td>${escapeHtml(item.source === 'history' ? 'Dispense history' : 'Profile history')}</td>
                          <td>${escapeHtml(item.directions)}</td>
                        </tr>
                      `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          : renderEmptyState('No matching history', 'No training history exists for the selected range.')}
      </div>
    `;
  }

  function renderDispenseLookupPopover(selectedPatient, selectedDrug, selectedPrescriber) {
    if (!ui.dispenseFlow.lookupPopover) {
      return '';
    }

    let title = 'Lookup';
    let body = '<div class="info-banner">No contextual details are available.</div>';

    if (ui.dispenseFlow.lookupPopover === 'repeats') {
      title = 'Repeats summary';
      if (selectedPatient && selectedDrug) {
        const items = getRepeatsSummary(selectedPatient.id, selectedDrug.id);
        body = items.length
          ? `
            <div class="summary-box">
              <strong>${escapeHtml(selectedPatient.name)} • ${escapeHtml(selectedDrug.brandName)} ${escapeHtml(selectedDrug.strength)}</strong>
              <ul>
                ${items.map((item) => `<li>${escapeHtml(formatDateTime(item.date))} • ${escapeHtml(item.dispenseNumber)} • Qty ${item.quantity} • Repeats ${item.repeats}</li>`).join('')}
              </ul>
            </div>
          `
          : '<div class="info-banner">No completed repeat history exists yet for this patient and drug combination.</div>';
      } else {
        body = '<div class="info-banner">Select both a patient and drug first.</div>';
      }
    }

    if (ui.dispenseFlow.lookupPopover === 'owing') {
      title = 'Owing scripts summary';
      if (selectedPatient) {
        const items = getOwingSummary(selectedPatient.id);
        body = items.length
          ? `
            <div class="summary-box">
              <strong>${escapeHtml(selectedPatient.name)}</strong>
              <ul>
                ${items.map((item) => {
                  const drug = getDrug(item.drugId);
                  return `<li>${escapeHtml(drug ? `${drug.brandName} ${drug.strength}` : 'Unknown drug')} • ${escapeHtml(item.dispenseNumber)} • Qty ${item.quantity}</li>`;
                }).join('')}
              </ul>
            </div>
          `
          : '<div class="info-banner">No owing scripts are queued for this patient.</div>';
      } else {
        body = '<div class="info-banner">Select a patient first.</div>';
      }
    }

    if (ui.dispenseFlow.lookupPopover === 'price') {
      title = 'Mock price lookup';
      const calculated = getCalculatedDraftPrice();
      body = `
        <div class="summary-box">
          <strong>Price estimate</strong>
          <p>Suggested by script type ${escapeHtml(getScriptTypeLabel(ui.newScript.scriptType))} and concession ${escapeHtml(selectedPatient ? selectedPatient.concessionType : 'General')}.</p>
          <p><strong>${escapeHtml(formatCurrency(calculated))}</strong></p>
          <p>You can keep the suggested value or override it in the Price field for training scenarios.</p>
        </div>
      `;
    }

    if (ui.dispenseFlow.lookupPopover === 'patient') {
      title = 'Patient summary';
      if (selectedPatient) {
        body = `
          <div class="summary-box">
            <strong>${escapeHtml(selectedPatient.name)}</strong>
            <p>DOB ${formatDob(selectedPatient.dob)} • ${escapeHtml(selectedPatient.phone)}</p>
            <p>${escapeHtml(selectedPatient.address)}</p>
            <p>Medicare <span class="mono-cell">${escapeHtml(selectedPatient.medicareNumber)}</span> / ${escapeHtml(selectedPatient.medicareReferenceNumber)}</p>
            <p>Concession ${escapeHtml(selectedPatient.concessionType)}</p>
          </div>
        `;
      } else {
        body = '<div class="info-banner">Select a patient first.</div>';
      }
    }

    if (ui.dispenseFlow.lookupPopover === 'allergy') {
      title = 'Allergy summary';
      if (selectedPatient && selectedPatient.allergies.length) {
        body = `<div class="warning-banner">Recorded allergies: ${escapeHtml(selectedPatient.allergies.join(', '))}</div>`;
      } else if (selectedPatient) {
        body = '<div class="info-banner">No allergies are recorded for the selected patient.</div>';
      } else {
        body = '<div class="info-banner">Select a patient first.</div>';
      }
    }

    if (ui.dispenseFlow.lookupPopover === 'brand-family') {
      title = 'Brand family / substitution chooser';
      if (selectedDrug) {
        const alternatives = (selectedDrug.alternatives || []).map((drugId) => getDrug(drugId)).filter(Boolean);
        body = alternatives.length
          ? `
            <div class="summary-box">
              <strong>${escapeHtml(selectedDrug.brandName)} ${escapeHtml(selectedDrug.strength)}</strong>
              <ul>
                ${alternatives.map((drug) => `<li>${escapeHtml(drug.brandName)} ${escapeHtml(drug.strength)} • ${escapeHtml(drug.genericName)} • Stock ${drug.stockQuantity}</li>`).join('')}
              </ul>
            </div>
          `
          : '<div class="info-banner">No related brand-family examples are stored for this training drug.</div>';
      } else {
        body = '<div class="info-banner">Select a drug first.</div>';
      }
    }

    if (ui.dispenseFlow.lookupPopover === 'prescriber') {
      title = 'Prescriber details';
      if (selectedPrescriber) {
        body = `
          <div class="summary-box">
            <strong>${escapeHtml(selectedPrescriber.name)} ${escapeHtml(selectedPrescriber.qualifications)}</strong>
            <p>${escapeHtml(selectedPrescriber.clinic)}</p>
            <p>${escapeHtml(selectedPrescriber.practiceAddress)}</p>
            <p>${escapeHtml(selectedPrescriber.practicePhone)} • Provider ${escapeHtml(selectedPrescriber.providerNumber)}</p>
          </div>
        `;
      } else {
        body = '<div class="info-banner">Select a prescriber first.</div>';
      }
    }

    return `
      <div class="dispense-screen__lookup-popover">
        <div class="panel-heading">
          <div>
            <p class="section-heading__eyebrow">Context panel</p>
            <h2>${escapeHtml(title)}</h2>
          </div>
          <button class="ghost-button" type="button" data-close-lookup-popover="true">Close</button>
        </div>
        <div class="spacer-top">${body}</div>
      </div>
    `;
  }

  function renderDispenseWaitView() {
    const script = getQueueScript(ui.dispenseFlow.lastQueuedScriptId);
    if (!script) {
      ui.dispenseFlow.mode = 'entry';
      return renderDispenseEntryView();
    }

    const patient = getPatient(script.patientId);
    const drug = getDrug(script.drugId);
    const prescriber = getPrescriber(script.prescriberId);

    return `
      <section class="view-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Queued successfully</p>
            <h2>Queued Successfully — Training Workflow</h2>
            <p>Use the wait-screen actions below to continue with the same patient, edit, hold, label preview, or open the original training facsimile.</p>
          </div>
          <div class="toolbar-help">Shortcuts: N S E H C D O L V • Ctrl+Q returns here from entry mode.</div>
        </div>

        <div class="dispense-wait-screen">
          <div class="dispense-wait-screen__summary">
            <div class="summary-box">
              <strong>${escapeHtml(patient ? patient.name : 'Unknown patient')}</strong>
              <p>${escapeHtml(drug ? `${drug.brandName} ${drug.strength}` : 'Unknown drug')}</p>
              <p>${escapeHtml(script.directions)}</p>
            </div>
            ${patient && patient.allergies.length ? `<div class="warning-banner">Allergy reminder: ${escapeHtml(patient.allergies.join(', '))}</div>` : ''}
            <dl class="kv-grid kv-grid--wait">
              <div>
                <dt>Dispense no.</dt>
                <dd class="mono-cell">${escapeHtml(script.dispenseNumber)}</dd>
              </div>
              <div>
                <dt>Script type</dt>
                <dd>${escapeHtml(getScriptTypeLabel(script.scriptType))}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><span class="status-pill status-pill--${getScriptStatusTone(script.scriptStatus)}">${escapeHtml(getStatusLabel(script.scriptStatus))}</span></dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>${script.quantity}</dd>
              </div>
              <div>
                <dt>Repeats</dt>
                <dd>${script.repeats}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>${escapeHtml(formatCurrency(script.price))}</dd>
              </div>
              <div>
                <dt>Initials</dt>
                <dd>${escapeHtml(script.pharmacistInitialsEnteredAtQueue || '—')}</dd>
              </div>
              <div>
                <dt>Queued</dt>
                <dd>${escapeHtml(formatDateTime(script.createdAt))}</dd>
              </div>
              <div>
                <dt>Original serial</dt>
                <dd class="mono-cell">${escapeHtml(script.originalScriptSerial)}</dd>
              </div>
            </dl>
            <div class="summary-box">
              <strong>Prescriber</strong>
              <p>${escapeHtml(prescriber ? `${prescriber.name} • ${prescriber.clinic}` : 'Unknown prescriber')}</p>
            </div>
          </div>

          <div class="dispense-wait-screen__actions">
            ${renderWaitAction('N', 'New patient / new script', 'Clear all fields and start a fresh entry.', 'new')}
            ${renderWaitAction('S', 'Same patient', 'Preserve the selected patient and start a new script.', 'same-patient')}
            ${renderWaitAction('E', 'Edit queued item', 'Return to entry mode with this queued item loaded.', 'edit')}
            ${renderWaitAction('H', 'Hold', 'Mark the queued item as on hold.', 'hold')}
            ${renderWaitAction('C', 'Cancel queued item', 'Remove it from the queue and write an audit entry.', 'cancel')}
            ${renderWaitAction('D', 'Defer', 'Set the queued item to deferred training status.', 'defer')}
            ${renderWaitAction('O', 'Toggle owing', 'Switch the owing flag on the queued item.', 'toggle-owing')}
            ${renderWaitAction('L', 'Preview label', 'Open the existing dispensing label preview.', 'preview-label')}
            ${renderWaitAction('V', 'View original script', 'Open the PBS-style training facsimile.', 'view-original')}
          </div>
        </div>
      </section>
    `;
  }

  function renderWaitAction(shortcut, title, copy, action) {
    return `
      <button class="dispense-wait-screen__action" type="button" data-wait-action="${action}">
        <span class="dispense-wait-screen__shortcut">${escapeHtml(shortcut)}</span>
        <strong>${escapeHtml(title)}</strong>
        <span class="small-copy">${escapeHtml(copy)}</span>
      </button>
    `;
  }

  function renderDrugLookupView() {
    const query = normalise(ui.drugLookupQuery);
    const filteredDrugs = state.drugs.filter((drug) => {
      if (!query) {
        return true;
      }
      return (
        normalise(drug.brandName).includes(query) ||
        normalise(drug.genericName).includes(query) ||
        normalise(drug.form).includes(query) ||
        normalise(drug.itemCode).includes(query)
      );
    });

    const rows = getSortedItems(filteredDrugs, 'drugLookup')
      .map((drug) => {
        const isExpanded = ui.expandedDrugId === drug.id;
        const alternatives = drug.alternatives
          .map((alternativeId) => getDrug(alternativeId))
          .filter(Boolean)
          .map((alternative) => `${alternative.brandName} ${alternative.strength} (${alternative.genericName})`);
        const stockTone = drug.stockQuantity < 10 ? 'danger' : drug.stockQuantity < 20 ? 'warning' : 'success';
        const stockText = drug.stockQuantity < 10 ? 'Low stock' : drug.stockQuantity < 20 ? 'Watch stock' : 'Stock OK';
        return `
          <tr>
            <td>${escapeHtml(drug.brandName)}</td>
            <td>${escapeHtml(drug.genericName)}</td>
            <td>${escapeHtml(drug.strength)}</td>
            <td>${escapeHtml(drug.form)}</td>
            <td>${escapeHtml(drug.schedule)}</td>
            <td class="code-cell">${escapeHtml(drug.itemCode)}</td>
            <td class="is-numeric"><span class="status-pill status-pill--${stockTone}">${stockText}: ${drug.stockQuantity}</span></td>
            <td>
              <button class="toggle-button" type="button" data-toggle-alt="${drug.id}">${isExpanded ? 'Hide alternatives' : 'Suggest alternatives'}</button>
            </td>
          </tr>
          ${isExpanded ? `
            <tr class="alternatives-row">
              <td colspan="8">
                ${alternatives.length
                  ? `<strong>Possible training substitutions:</strong> ${escapeHtml(alternatives.join(' • '))}`
                  : 'No substitution examples stored for this training item.'}
              </td>
            </tr>
          ` : ''}
        `;
      })
      .join('');

    return `
      <section class="view-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Drug Lookup</p>
            <h2>Search the fictional product catalogue</h2>
            <p>Review brand and generic names, stock levels, item codes, schedules, and substitution examples before queuing or checking a script.</p>
          </div>
          <div class="toolbar-help">Shortcut: ${renderShortcutBadge('F3')} focus lookup search</div>
        </div>

        <div class="table-panel">
          <div class="table-panel__header">
            <div>
              <h2 class="table-panel__title">Catalogue</h2>
              <p class="table-panel__subtitle">Sortable enterprise grid with dense stock visibility and alternative suggestions.</p>
            </div>
            <div class="search-strip">
              <input id="drug-lookup-search" class="search-input" type="text" placeholder="Search drug name, generic, form, or code" value="${escapeHtml(ui.drugLookupQuery)}" />
              <span class="shortcut-chip">F3</span>
            </div>
          </div>
          ${filteredDrugs.length
            ? `
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>${renderSortHeader('drugLookup', 'brandName', 'Brand')}</th>
                      <th>${renderSortHeader('drugLookup', 'genericName', 'Generic')}</th>
                      <th>${renderSortHeader('drugLookup', 'strength', 'Strength')}</th>
                      <th>${renderSortHeader('drugLookup', 'form', 'Form')}</th>
                      <th>Schedule</th>
                      <th>${renderSortHeader('drugLookup', 'itemCode', 'Item Code')}</th>
                      <th class="is-numeric">${renderSortHeader('drugLookup', 'stockQuantity', 'Stock', { numeric: true })}</th>
                      <th>Options</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
            `
            : renderEmptyState('No matching drugs', 'Try a broader search term such as the generic name or the item code.')}
        </div>
      </section>
    `;
  }

  function renderFinalCheckView() {
    const selectedScript = getQueueScript(ui.finalCheck.selectedScriptId);

    if (!state.queue.length) {
      return `
        <section class="view-stack">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Final Check</p>
              <h2>Nothing is waiting for pharmacist verification</h2>
              <p>Once scripts are queued they will appear here for a structured right-patient, right-drug, right-dose, right-directions check.</p>
            </div>
          </div>
          ${renderEmptyState('Queue complete', 'You have no pending items. Add a new script to continue practising the full workflow.', '<button class="button" type="button" data-view="new-script">New Script</button>')}
        </section>
      `;
    }

    const selectedPatient = selectedScript ? getPatient(selectedScript.patientId) : null;
    const selectedDrug = selectedScript ? getDrug(selectedScript.drugId) : null;
    const selectedPrescriber = selectedScript ? getPrescriber(selectedScript.prescriberId) : null;
    const hasEnoughStock = Boolean(selectedDrug && selectedScript && selectedDrug.stockQuantity >= selectedScript.quantity);
    const isChecklistComplete = Object.values(ui.finalCheck.checklist).every(Boolean) && ui.finalCheck.initials.trim();
    const disableConfirm = !isChecklistComplete || !hasEnoughStock;

    return `
      <section class="view-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Final Check</p>
            <h2>Verify each queued item before completing supply</h2>
            <p>Use the checklist, initials field, and preview controls to simulate a professional final accuracy check.</p>
          </div>
          <div class="toolbar-help">Shortcuts: ${renderShortcutBadge('F6')} preview label, ${renderShortcutBadge('F12')} confirm & dispense</div>
        </div>

        <div class="grid-sidebar">
          <div class="queue-column">
            <div class="panel-heading">
              <div>
                <h2>Awaiting final check</h2>
                <p class="panel-copy">Select a script from the worklist to complete the verification steps.</p>
              </div>
            </div>
            <div class="queue-list spacer-top">
              ${state.queue
                .map((script) => {
                  const patient = getPatient(script.patientId);
                  const drug = getDrug(script.drugId);
                  const isSelected = selectedScript && script.id === selectedScript.id;
                  return `
                    <button class="queue-item ${isSelected ? 'is-selected' : ''}" type="button" data-final-script="${script.id}">
                      <span class="queue-item__title">${escapeHtml(patient ? patient.name : 'Unknown patient')}</span>
                      <span class="queue-item__meta">${escapeHtml(drug ? `${drug.brandName} ${drug.strength}` : 'Unknown drug')} • ${escapeHtml(getScriptTypeLabel(script.scriptType))} • ${escapeHtml(getStatusLabel(script.scriptStatus))}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>
          </div>

          <div class="detail-panel">
            ${selectedScript && selectedPatient && selectedDrug && selectedPrescriber
              ? `
                <div class="panel-stack">
                  <div class="panel-heading">
                    <div>
                      <p class="section-heading__eyebrow">Selected item</p>
                      <h2>${escapeHtml(selectedPatient.name)}</h2>
                      <p class="panel-copy">${escapeHtml(selectedDrug.brandName)} ${escapeHtml(selectedDrug.strength)} • Prescriber ${escapeHtml(selectedPrescriber.name)}</p>
                    </div>
                    <div class="button-row">
                      <button class="ghost-button" type="button" data-preview-label="${selectedScript.id}">Preview Label ${renderShortcutBadge('F6')}</button>
                      <button class="secondary-button" type="button" data-view-original-script="${selectedScript.id}">View Original Script</button>
                    </div>
                  </div>

                  <fieldset class="group-panel">
                    <legend class="group-panel__title">Script details</legend>
                    <div class="summary-grid">
                      <span class="badge">DOB ${formatDob(selectedPatient.dob)}</span>
                      <span class="badge">Date ${formatDate(selectedScript.scriptDate)}</span>
                      <span class="badge">Type ${escapeHtml(getScriptTypeLabel(selectedScript.scriptType))}</span>
                      <span class="badge">Qty ${selectedScript.quantity}</span>
                      <span class="badge">Repeats ${selectedScript.repeats}</span>
                      <span class="badge">Price ${escapeHtml(formatCurrency(selectedScript.price))}</span>
                      <span class="badge mono-cell">${escapeHtml(selectedScript.dispenseNumber)}</span>
                      ${selectedScript.isOwing ? '<span class="status-pill status-pill--warning">Owing</span>' : ''}
                      ${selectedScript.isAuthority ? `<span class="status-pill status-pill--neutral">Authority ${escapeHtml(selectedScript.authorityNumber || 'required')}</span>` : ''}
                    </div>
                    <div class="summary-box spacer-top">
                      <strong>Directions</strong>
                      <p>${escapeHtml(selectedScript.directions)}</p>
                    </div>
                  </fieldset>

                  ${selectedPatient.allergies.length ? `<div class="warning-banner">Allergy reminder: ${escapeHtml(selectedPatient.allergies.join(', '))}</div>` : ''}
                  ${!hasEnoughStock ? `<div class="warning-banner">Insufficient virtual stock. ${escapeHtml(selectedDrug.brandName)} has ${selectedDrug.stockQuantity} unit(s) available for a requested quantity of ${selectedScript.quantity}.</div>` : ''}
                  ${ui.finalCheck.error ? `<div class="error-banner">${escapeHtml(ui.finalCheck.error)}</div>` : ''}

                  <form id="final-check-form" novalidate>
                    <fieldset class="group-panel">
                      <legend class="group-panel__title">Verification checklist</legend>
                      <div class="checklist">
                        <label class="checklist-item">
                          <input id="check-right-patient" type="checkbox" data-final-check-item="patient" ${ui.finalCheck.checklist.patient ? 'checked' : ''} />
                          <span>Right Patient</span>
                        </label>
                        <label class="checklist-item">
                          <input id="check-right-drug" type="checkbox" data-final-check-item="drug" ${ui.finalCheck.checklist.drug ? 'checked' : ''} />
                          <span>Right Drug</span>
                        </label>
                        <label class="checklist-item">
                          <input id="check-right-dose" type="checkbox" data-final-check-item="dose" ${ui.finalCheck.checklist.dose ? 'checked' : ''} />
                          <span>Right Dose</span>
                        </label>
                        <label class="checklist-item">
                          <input id="check-right-directions" type="checkbox" data-final-check-item="directions" ${ui.finalCheck.checklist.directions ? 'checked' : ''} />
                          <span>Right Directions</span>
                        </label>
                      </div>
                    </fieldset>

                    <fieldset class="group-panel spacer-top">
                      <legend class="group-panel__title">Authorisation</legend>
                      <div class="form-field">
                        <label for="final-check-initials">Pharmacist initials</label>
                        <input id="final-check-initials" class="input" type="text" maxlength="4" placeholder="e.g. GB" value="${escapeHtml(ui.finalCheck.initials)}" />
                      </div>
                    </fieldset>

                    <div class="button-row spacer-top">
                      <button class="button" type="submit" ${disableConfirm ? 'disabled' : ''}>Confirm &amp; Dispense ${renderShortcutBadge('F12')}</button>
                      <button class="secondary-button" type="button" data-view="history">Open History</button>
                    </div>
                  </form>
                </div>
              `
              : renderEmptyState('Pick a script', 'Select any queued item from the left to start the final check.')}
          </div>
        </div>
      </section>
    `;
  }

  function renderHistoryView() {
    const searchQuery = normalise(ui.historyFilters.search);
    const filteredHistory = state.history.filter((record) => {
      const patient = getPatient(record.patientId);
      const patientName = patient ? patient.name : '';
      const matchesSearch = !searchQuery || normalise(patientName).includes(searchQuery);
      const recordStamp = getLocalDateStamp(record.dispensedAt);
      const matchesFrom = !ui.historyFilters.from || recordStamp >= ui.historyFilters.from;
      const matchesTo = !ui.historyFilters.to || recordStamp <= ui.historyFilters.to;
      return matchesSearch && matchesFrom && matchesTo;
    });

    const sortedHistory = getSortedItems(filteredHistory, 'history');
    const auditItems = [...state.auditTrail].sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));

    return `
      <section class="view-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">History</p>
            <h2>Dispensed scripts and audit trail</h2>
            <p>Filter by patient or date range to review completed training activity and recorded workflow actions.</p>
          </div>
          <div class="toolbar-help">Shortcuts: ${renderShortcutBadge('Alt+6')} history module, ${renderShortcutBadge('F2')} focus search</div>
        </div>

        <div class="table-panel">
          <div class="table-panel__header">
            <div>
              <h2 class="table-panel__title">Dispensed history</h2>
              <p class="table-panel__subtitle">Completed supplies retain initials, timestamp, script type, and fictional dispense numbers.</p>
            </div>
            <div class="filters-row">
              <div class="form-field">
                <label for="history-search">Patient filter</label>
                <input id="history-search" class="search-input" type="text" placeholder="Filter by patient name" value="${escapeHtml(ui.historyFilters.search)}" />
              </div>
              <div class="form-field">
                <label for="history-from">From</label>
                <input id="history-from" class="input" type="date" value="${escapeHtml(ui.historyFilters.from)}" />
              </div>
              <div class="form-field">
                <label for="history-to">To</label>
                <input id="history-to" class="input" type="date" value="${escapeHtml(ui.historyFilters.to)}" />
              </div>
            </div>
          </div>
          ${sortedHistory.length
            ? `
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>${renderSortHeader('history', 'patient', 'Patient')}</th>
                      <th>${renderSortHeader('history', 'drug', 'Drug')}</th>
                      <th>Type</th>
                      <th class="is-numeric">${renderSortHeader('history', 'quantity', 'Qty', { numeric: true })}</th>
                      <th class="is-numeric">${renderSortHeader('history', 'price', 'Price', { numeric: true })}</th>
                      <th>${renderSortHeader('history', 'pharmacistInitials', 'Initials')}</th>
                      <th>${renderSortHeader('history', 'dispenseNumber', 'Dispense No.')}</th>
                      <th>${renderSortHeader('history', 'dispensedAt', 'Timestamp')}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sortedHistory
                      .map((record) => {
                        const patient = getPatient(record.patientId);
                        const drug = getDrug(record.drugId);
                        return `
                          <tr>
                            <td>${escapeHtml(patient ? patient.name : 'Unknown patient')}</td>
                            <td>${escapeHtml(drug ? `${drug.brandName} ${drug.strength}` : 'Unknown drug')}</td>
                            <td>${escapeHtml(getScriptTypeLabel(record.scriptType))}</td>
                            <td class="is-numeric">${record.quantity}</td>
                            <td class="mono-cell">${escapeHtml(formatCurrency(record.price))}</td>
                            <td class="mono-cell">${escapeHtml(record.pharmacistInitials)}</td>
                            <td class="mono-cell">${escapeHtml(record.dispenseNumber)}</td>
                            <td class="date-cell">${escapeHtml(formatDateTime(record.dispensedAt))}</td>
                            <td>
                              <div class="inline-actions">
                                <button class="table-action" type="button" data-view-original-script="${record.id}">View Original Script</button>
                                <button class="secondary-button" type="button" data-preview-label="${record.id}">Preview Label</button>
                              </div>
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
            : renderEmptyState('No dispensed scripts match', 'Complete a final check or broaden the filters to see history records.')}
        </div>

        <div class="audit-panel">
          <div>
            <h2 class="table-panel__title">Audit trail</h2>
            <p class="table-panel__subtitle">Locally stored queueing, editing, wait-screen, dispensing, and reset actions.</p>
          </div>
          <div class="audit-list spacer-top">
            ${auditItems
              .map(
                (entry) => `
                  <article class="activity-item">
                    <strong class="activity-item__title">${escapeHtml(entry.action)}</strong>
                    <p class="activity-item__meta">${escapeHtml(entry.detail)}</p>
                    <div class="small-copy mono-cell">${escapeHtml(formatDateTime(entry.timestamp))}</div>
                  </article>
                `
              )
              .join('')}
          </div>
        </div>
      </section>
    `;
  }

  function openDocumentPreview(scriptId, mode) {
    ui.documentPreview = {
      scriptId,
      mode,
    };
    renderDocumentModal();
  }

  function renderDocumentModal() {
    if (!ui.documentPreview.scriptId) {
      labelModal.classList.remove('is-open');
      labelModal.setAttribute('aria-hidden', 'true');
      modalDialog.classList.remove('modal__dialog--wide');
      labelModalContent.innerHTML = '';
      return;
    }

    const script = getAnyScript(ui.documentPreview.scriptId);
    const patient = script ? getPatient(script.patientId) : null;
    const drug = script ? getDrug(script.drugId) : null;
    const prescriber = script ? getPrescriber(script.prescriberId) : null;

    if (!script || !patient || !drug || !prescriber) {
      ui.documentPreview.scriptId = '';
      renderDocumentModal();
      return;
    }

    if (ui.documentPreview.mode === 'original-script') {
      labelModalEyebrow.textContent = 'Training original-script preview';
      labelModalTitle.textContent = 'PBS Training Facsimile';
      modalDialog.classList.add('modal__dialog--wide');
      labelModalContent.innerHTML = renderOriginalScriptFacsimile(script, patient, drug, prescriber);
    } else {
      labelModalEyebrow.textContent = 'Training label preview';
      labelModalTitle.textContent = 'Dispensing Label';
      modalDialog.classList.remove('modal__dialog--wide');
      labelModalContent.innerHTML = renderLabelCard(script, patient, drug, prescriber);
    }

    labelModal.classList.add('is-open');
    labelModal.setAttribute('aria-hidden', 'false');
  }

  function renderLabelCard(script, patient, drug, prescriber) {
    const supplyDate = script.dispensedAt || script.createdAt;
    return `
      <div class="document-preview document-preview--label">
        <div class="label-card">
          <p class="section-heading__eyebrow">Practice Pharmacy (Training Mode)</p>
          <h3>${escapeHtml(patient.name)}</h3>
          <p>${escapeHtml(patient.address)}</p>
          <div class="label-grid">
            <div>
              <strong>Medication</strong>
              <p>${escapeHtml(drug.brandName)} ${escapeHtml(drug.strength)}</p>
              <p>${escapeHtml(drug.genericName)} • ${escapeHtml(drug.form)}</p>
            </div>
            <div>
              <strong>Quantity</strong>
              <p>${script.quantity}</p>
            </div>
            <div class="label-directions">
              <strong>Directions</strong>
              <p>${escapeHtml(script.directions)}</p>
            </div>
            <div>
              <strong>Prescriber</strong>
              <p>${escapeHtml(prescriber.name)}</p>
            </div>
            <div>
              <strong>Date</strong>
              <p>${formatDate(supplyDate)}</p>
            </div>
            <div>
              <strong>Dispense no.</strong>
              <p>${escapeHtml(script.dispenseNumber)}</p>
            </div>
            <div>
              <strong>Repeats</strong>
              <p>${script.repeats}</p>
            </div>
            <div>
              <strong>Price</strong>
              <p>${escapeHtml(formatCurrency(script.price))}</p>
            </div>
          </div>
        </div>
        <div class="label-actions document-actions">
          <button class="ghost-button" type="button" data-close-modal="true">Close</button>
          <button class="button" type="button" data-print-label="true">Print</button>
        </div>
      </div>
    `;
  }

  function renderOriginalScriptFacsimile(script, patient, drug, prescriber) {
    const isS8 = drug.schedule === 'S8';
    const quantityWords = script.s8QuantityWords || (isS8 ? numberToWords(script.quantity) : '');
    const blankSlots = [2, 3]
      .map(
        (slot) => `
          <div class="pbs-script-item pbs-script-item--empty">
            <div class="pbs-script-item__slot">Item ${slot}</div>
            <div class="pbs-script-item__empty-copy">Reserved training slot — no item entered on this facsimile.</div>
          </div>
        `
      )
      .join('');

    return `
      <div class="document-preview document-preview--pbs-script">
        <article class="pbs-script-sheet ${isS8 ? 'pbs-script-sheet--s8' : ''}">
          <div class="pbs-script-sheet__training-banner">TRAINING FACSIMILE — NOT A VALID PRESCRIPTION</div>
          <div class="pbs-script-sheet__paper">
            <aside class="pbs-script-sheet__claim-strip">
              <div class="claim-box">
                <span class="claim-box__label">Serial</span>
                <strong class="mono-cell">${escapeHtml(script.originalScriptSerial)}</strong>
              </div>
              <div class="claim-box">
                <span class="claim-box__label">Amount</span>
                <strong>${escapeHtml(formatCurrency(script.price))}</strong>
              </div>
              <div class="claim-box">
                <span class="claim-box__label">No.</span>
                <strong class="mono-cell">${escapeHtml(script.dispenseNumber)}</strong>
              </div>
              <div class="claim-box claim-box--stamp">
                <span class="claim-box__label">Training stamp area</span>
                <strong>PracticeRx</strong>
              </div>
            </aside>
            <div class="pbs-script-sheet__main">
              <section class="pbs-script-sheet__prescriber">
                <p class="small-label">Prescriber</p>
                <strong>${escapeHtml(prescriber.name)} ${escapeHtml(prescriber.qualifications)}</strong>
                <p>${escapeHtml(prescriber.clinic)}</p>
                <p>${escapeHtml(prescriber.practiceAddress)}</p>
                <p>${escapeHtml(prescriber.practicePhone)}</p>
                <p>Provider / prescriber no. <span class="mono-cell">${escapeHtml(prescriber.providerNumber)}</span></p>
              </section>

              <section class="pbs-script-sheet__patient">
                <p class="small-label">Patient</p>
                <strong>${escapeHtml(patient.name)}</strong>
                <p>${escapeHtml(patient.address)}</p>
                <p>Medicare <span class="mono-cell">${escapeHtml(patient.medicareNumber)}</span> / ${escapeHtml(patient.medicareReferenceNumber)}</p>
                <p>Concession type ${escapeHtml(patient.concessionType)}</p>
              </section>

              <section class="pbs-script-sheet__items">
                <div class="pbs-script-item">
                  <div class="pbs-script-item__slot">Item 1</div>
                  <div class="pbs-script-item__checkbox ${script.brandSubstitutionNotPermitted ? 'is-checked' : ''}">
                    <span aria-hidden="true">${script.brandSubstitutionNotPermitted ? '☑' : '☐'}</span>
                    <span>Brand substitution not permitted</span>
                  </div>
                  <div class="pbs-script-item__name">${escapeHtml(drug.brandName)} ${escapeHtml(drug.strength)} ${escapeHtml(drug.form)}</div>
                  <div class="pbs-script-item__generic">${escapeHtml(drug.genericName)} • ${escapeHtml(drug.schedule)} • Code ${escapeHtml(drug.itemCode)}</div>
                  <div class="pbs-script-item__directions">
                    <span class="small-label">Directions</span>
                    <p>${escapeHtml(script.directions)}</p>
                  </div>
                  <div class="pbs-script-item__meta-grid">
                    <div><span class="small-label">Quantity</span><strong>${script.quantity}</strong></div>
                    <div><span class="small-label">Repeats</span><strong>${script.repeats}</strong></div>
                    <div><span class="small-label">Script type</span><strong>${escapeHtml(getScriptTypeLabel(script.scriptType))}</strong></div>
                  </div>
                  ${isS8 ? `
                    <div class="pbs-script-item__s8-note">
                      <strong>S8 training note:</strong> Quantity in words — ${escapeHtml(quantityWords || 'not entered')}. ${escapeHtml(script.repeatInterval || drug.repeatIntervalText || 'Only one Schedule 8 item may appear on this facsimile.')}
                    </div>
                  ` : ''}
                </div>
                ${blankSlots}
              </section>

              <section class="pbs-script-sheet__authority">
                <div>
                  <span class="small-label">Authority required</span>
                  <strong>${script.isAuthority ? 'Yes' : 'No'}</strong>
                </div>
                <div>
                  <span class="small-label">Authority number</span>
                  <strong class="mono-cell">${escapeHtml(script.authorityNumber || 'Training N/A')}</strong>
                </div>
                <div>
                  <span class="small-label">Owing</span>
                  <strong>${script.isOwing ? 'Yes' : 'No'}</strong>
                </div>
              </section>

              <section class="pbs-script-sheet__signature">
                <div>
                  <span class="small-label">Script date</span>
                  <strong>${escapeHtml(formatDate(script.scriptDate))}</strong>
                </div>
                <div>
                  <span class="small-label">Prescriber signature</span>
                  <div class="pbs-script-sheet__signature-line">Training placeholder line only</div>
                </div>
              </section>
            </div>
          </div>
          <footer class="pbs-script-sheet__footer-note">
            TRAINING FACSIMILE — NOT A VALID PRESCRIPTION • Original PracticeRx training simulation document. Not for clinical or legal use.
          </footer>
        </article>
        <div class="document-actions">
          <button class="ghost-button" type="button" data-close-modal="true">Close</button>
          <button class="button" type="button" data-print-label="true">Print</button>
        </div>
      </div>
    `;
  }

  function renderEmptyState(title, copy, actionsHtml) {
    return `
      <div class="empty-state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(copy)}</p>
        ${actionsHtml ? `<div class="button-row spacer-top">${actionsHtml}</div>` : ''}
      </div>
    `;
  }

  function expandSigText(value) {
    const key = normalise(value);
    return SIG_EXPANSIONS[key] || value;
  }

  function validateNewScriptDraft() {
    const errors = {};
    const selectedDrug = getDraftDrug();
    const quantity = Number(ui.newScript.quantity);
    const repeats = Number(ui.newScript.repeats);
    const price = Number(ui.newScript.price);
    const initials = normalise(ui.newScript.pharmacistInitials).toUpperCase();

    if (!ui.newScript.selectedPatientId) {
      errors.patient = 'Select an existing patient from the list.';
    }
    if (!ui.newScript.scriptDate) {
      errors.scriptDate = 'Enter the script date.';
    }
    if (!ui.newScript.prescriberId) {
      errors.prescriber = 'Choose a prescriber.';
    }
    if (!ui.newScript.selectedDrugId) {
      errors.drug = 'Select a drug from the catalogue suggestions.';
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      errors.quantity = 'Enter a whole number greater than zero.';
    } else if (selectedDrug && quantity > selectedDrug.stockQuantity) {
      errors.quantity = `Requested quantity exceeds virtual stock (${selectedDrug.stockQuantity} available).`;
    }
    if (!Number.isInteger(repeats) || repeats < 0) {
      errors.repeats = 'Repeats must be zero or more.';
    }
    if (!ui.newScript.directions.trim()) {
      errors.directions = 'Directions are required for the label preview.';
    }
    if (!Number.isFinite(price) || price < 0) {
      errors.price = 'Enter a valid price amount.';
    }
    if (!initials || initials.length < 2) {
      errors.pharmacistInitials = 'Enter at least two pharmacist initials.';
    }
    if (ui.newScript.isAuthority && !ui.newScript.authorityNumber.trim()) {
      errors.authorityNumber = 'Enter a training authority number or uncheck Authority.';
    }

    return errors;
  }

  function createScriptPayloadFromDraft(existingScript) {
    const selectedDrug = getDraftDrug();
    const scriptType = ui.newScript.scriptType;
    const quantity = Number(ui.newScript.quantity);
    return {
      ...(existingScript || {}),
      id: existingScript ? existingScript.id : generateId('scr'),
      patientId: ui.newScript.selectedPatientId,
      prescriberId: ui.newScript.prescriberId,
      drugId: ui.newScript.selectedDrugId,
      quantity,
      repeats: Number(ui.newScript.repeats),
      directions: ui.newScript.directions.trim(),
      createdAt: existingScript ? existingScript.createdAt : new Date().toISOString(),
      dispenseNumber: existingScript ? existingScript.dispenseNumber : createDispenseNumber(state.queue.length + state.history.length),
      scriptDate: ui.newScript.scriptDate,
      scriptType,
      isOwing: Boolean(ui.newScript.isOwing),
      isAuthority: Boolean(ui.newScript.isAuthority),
      authorityNumber: ui.newScript.isAuthority ? ui.newScript.authorityNumber.trim().toUpperCase() : '',
      price: toCurrencyNumber(ui.newScript.price),
      brandSubstitutionNotPermitted: Boolean(ui.newScript.brandSubstitutionNotPermitted),
      scriptStatus: scriptType === 'D' ? 'deferred' : existingScript ? existingScript.scriptStatus || 'pending' : 'pending',
      pharmacistInitialsEnteredAtQueue: ui.newScript.pharmacistInitials.trim().toUpperCase(),
      originalScriptSerial: existingScript ? existingScript.originalScriptSerial : `TRG-${String(Date.now()).slice(-8)}`,
      repeatInterval: selectedDrug ? selectedDrug.repeatIntervalText || '' : '',
      s8QuantityWords: selectedDrug && selectedDrug.schedule === 'S8' ? numberToWords(quantity) : '',
    };
  }

  function handleNewScriptSubmit() {
    ui.newScript.directions = expandSigText(ui.newScript.directions.trim());
    if (!ui.newScript.price) {
      refreshDraftPrice(true);
    }

    const errors = validateNewScriptDraft();
    ui.newScript.errors = errors;

    if (Object.keys(errors).length) {
      render();
      return;
    }

    const patient = getDraftPatient();
    const drug = getDraftDrug();
    const existingScript = ui.newScript.editingScriptId ? getQueueScript(ui.newScript.editingScriptId) : null;
    const payload = createScriptPayloadFromDraft(existingScript);

    if (existingScript) {
      state.queue = state.queue.map((script) => (script.id === existingScript.id ? payload : script));
      state.auditTrail.unshift(
        createAuditEntry(
          'Edited queued script',
          `${patient ? patient.name : 'Unknown patient'} updated ${drug ? `${drug.brandName} ${drug.strength}` : 'selected drug'} before final check.`,
          payload.id
        )
      );
    } else {
      state.queue.unshift(payload);
      state.auditTrail.unshift(
        createAuditEntry(
          'Queued script',
          `${patient ? patient.name : 'Unknown patient'} added for ${drug ? `${drug.brandName} ${drug.strength}` : 'selected drug'}.`,
          payload.id
        )
      );
    }

    persistState();
    ui.dispenseFlow.mode = 'wait';
    ui.dispenseFlow.lastQueuedScriptId = payload.id;
    ui.dispenseFlow.samePatientId = payload.patientId;
    ui.dispenseFlow.lookupPopover = '';
    ui.dispenseFlow.historyOpen = false;
    ui.dispenseFlow.allHistory = false;
    setFinalCheckSelection(payload.id);
    ui.newScript = createDraftFromScript(payload, { preserveIdentity: false });
    render();
    showToast(existingScript ? 'Queued item updated.' : 'Script added to the pending queue.', 'success');
  }

  function handleFinalCheckSubmit() {
    const script = getQueueScript(ui.finalCheck.selectedScriptId);
    if (!script) {
      ui.finalCheck.error = 'Select a queued script before confirming supply.';
      render();
      return;
    }

    const drug = getDrug(script.drugId);
    if (!drug) {
      ui.finalCheck.error = 'The selected drug record could not be found.';
      render();
      return;
    }

    if (!Object.values(ui.finalCheck.checklist).every(Boolean) || !ui.finalCheck.initials.trim()) {
      ui.finalCheck.error = 'Tick every checklist item and enter pharmacist initials.';
      render();
      return;
    }

    if (drug.stockQuantity < script.quantity) {
      ui.finalCheck.error = `Not enough virtual stock to dispense this item. ${drug.stockQuantity} unit(s) remain.`;
      render();
      return;
    }

    const dispensedAt = new Date().toISOString();
    const dispensedRecord = {
      ...script,
      pharmacistInitials: ui.finalCheck.initials.trim().toUpperCase(),
      pharmacistInitialsEnteredAtQueue: script.pharmacistInitialsEnteredAtQueue || ui.finalCheck.initials.trim().toUpperCase(),
      dispensedAt,
      finalCheck: { ...ui.finalCheck.checklist },
      scriptStatus: 'dispensed',
    };

    state.queue = state.queue.filter((queuedScript) => queuedScript.id !== script.id);
    state.history.unshift(dispensedRecord);
    state.drugs = state.drugs.map((catalogueDrug) => {
      if (catalogueDrug.id !== drug.id) {
        return catalogueDrug;
      }
      return {
        ...catalogueDrug,
        stockQuantity: Math.max(0, catalogueDrug.stockQuantity - script.quantity),
      };
    });
    updatePatientMedicationHistory(script, dispensedAt);

    const patient = getPatient(script.patientId);
    state.auditTrail.unshift(
      createAuditEntry(
        'Dispensed after final check',
        `${patient ? patient.name : 'Unknown patient'} supplied ${drug.brandName} ${drug.strength} with initials ${dispensedRecord.pharmacistInitials}.`,
        script.id
      )
    );
    persistState();

    if (ui.dispenseFlow.lastQueuedScriptId === script.id) {
      ui.dispenseFlow.lastQueuedScriptId = '';
    }
    ensureFinalCheckSelection();
    ui.finalCheck.checklist = createEmptyChecklist();
    ui.finalCheck.initials = '';
    ui.finalCheck.error = '';
    render();
    showToast('Script confirmed and moved to history.', 'success');
  }

  function requestFormSubmit(formId) {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
      return;
    }

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  function toggleDraftOwing() {
    ui.newScript.isOwing = !ui.newScript.isOwing;
    render();
  }

  function handleWaitAction(action) {
    const script = getQueueScript(ui.dispenseFlow.lastQueuedScriptId);
    if (!script) {
      ui.dispenseFlow.mode = 'entry';
      render();
      return;
    }

    const patient = getPatient(script.patientId);
    const drug = getDrug(script.drugId);

    if (action === 'new') {
      openFreshEntry('');
      return;
    }
    if (action === 'same-patient') {
      openFreshEntry(script.patientId);
      return;
    }
    if (action === 'edit') {
      openEditEntry(script.id);
      return;
    }
    if (action === 'hold') {
      state.queue = state.queue.map((item) => (item.id === script.id ? { ...item, scriptStatus: 'hold' } : item));
      state.auditTrail.unshift(createAuditEntry('Held queued script', `${patient ? patient.name : 'Unknown patient'} placed ${drug ? drug.brandName : 'item'} on hold.`, script.id));
      persistState();
      render();
      showToast('Queued item marked as hold.', 'warning');
      return;
    }
    if (action === 'cancel') {
      state.queue = state.queue.filter((item) => item.id !== script.id);
      state.auditTrail.unshift(createAuditEntry('Cancelled queued script', `${patient ? patient.name : 'Unknown patient'} had queued item cancelled from the wait screen.`, script.id));
      persistState();
      ui.dispenseFlow.lastQueuedScriptId = '';
      ui.dispenseFlow.mode = 'entry';
      ui.newScript = createNewScriptDraft();
      ensureFinalCheckSelection();
      render('script-patient-search');
      showToast('Queued item cancelled and removed.', 'danger');
      return;
    }
    if (action === 'defer') {
      state.queue = state.queue.map((item) => (item.id === script.id ? { ...item, scriptType: 'D', scriptStatus: 'deferred' } : item));
      state.auditTrail.unshift(createAuditEntry('Deferred queued script', `${patient ? patient.name : 'Unknown patient'} had queued item marked deferred.`, script.id));
      persistState();
      render();
      showToast('Queued item marked deferred.', 'info');
      return;
    }
    if (action === 'toggle-owing') {
      state.queue = state.queue.map((item) => (item.id === script.id ? { ...item, isOwing: !item.isOwing } : item));
      state.auditTrail.unshift(createAuditEntry('Toggled owing flag', `${patient ? patient.name : 'Unknown patient'} wait-screen owing flag changed.`, script.id));
      persistState();
      render();
      showToast('Owing flag updated.', 'info');
      return;
    }
    if (action === 'preview-label') {
      openDocumentPreview(script.id, 'label');
      return;
    }
    if (action === 'view-original') {
      openDocumentPreview(script.id, 'original-script');
    }
  }

  document.addEventListener('click', (event) => {
    const sortButton = event.target.closest('[data-sort-table]');
    if (sortButton) {
      setSort(sortButton.dataset.sortTable, sortButton.dataset.sortKey);
      return;
    }

    const navButton = event.target.closest('[data-nav-view]');
    if (navButton) {
      navigate(navButton.dataset.navView);
      return;
    }

    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
      navigate(viewButton.dataset.view);
      return;
    }

    if (event.target.closest('#reset-demo-data')) {
      state = resetState();
      state.auditTrail.unshift(createAuditEntry('Reset demo data', 'Training data was cleared and a fresh fictional dataset was loaded.', ''));
      persistState();
      ui.patientSearchQuery = '';
      ui.selectedPatientId = state.patients[0] ? state.patients[0].id : '';
      ui.newScript = createNewScriptDraft();
      ui.dispenseFlow = createDispenseFlowState();
      ui.drugLookupQuery = '';
      ui.expandedDrugId = '';
      ui.documentPreview = { scriptId: '', mode: 'label' };
      ui.finalCheck = {
        selectedScriptId: state.queue[0] ? state.queue[0].id : '',
        checklist: createEmptyChecklist(),
        initials: '',
        error: '',
      };
      ui.historyFilters = { search: '', from: '', to: '' };
      render();
      showToast('Demo data reset and reseeded.', 'warning');
      return;
    }

    const patientButton = event.target.closest('[data-patient-id]');
    if (patientButton) {
      ui.selectedPatientId = patientButton.dataset.patientId;
      render();
      return;
    }

    const loadPatientButton = event.target.closest('[data-load-patient-into-script]');
    if (loadPatientButton) {
      ui.currentView = 'new-script';
      ui.dispenseFlow.mode = 'entry';
      openFreshEntry(loadPatientButton.dataset.loadPatientIntoScript);
      return;
    }

    const selectPatientButton = event.target.closest('[data-select-patient]');
    if (selectPatientButton) {
      const patient = getPatient(selectPatientButton.dataset.selectPatient);
      ui.newScript.selectedPatientId = selectPatientButton.dataset.selectPatient;
      ui.newScript.patientQuery = patient ? `${patient.name} • ${formatDob(patient.dob)}` : '';
      delete ui.newScript.errors.patient;
      refreshDraftPrice(true);
      render('dispense-script-date');
      return;
    }

    if (event.target.closest('[data-clear-patient]')) {
      ui.newScript.selectedPatientId = '';
      ui.newScript.patientQuery = '';
      refreshDraftPrice(true);
      render();
      return;
    }

    const selectDrugButton = event.target.closest('[data-select-drug]');
    if (selectDrugButton) {
      const drug = getDrug(selectDrugButton.dataset.selectDrug);
      ui.newScript.selectedDrugId = selectDrugButton.dataset.selectDrug;
      ui.newScript.drugQuery = drug ? `${drug.brandName} ${drug.strength}` : '';
      delete ui.newScript.errors.drug;
      applyDrugDefaults(selectDrugButton.dataset.selectDrug);
      render('script-directions');
      return;
    }

    if (event.target.closest('[data-clear-drug]')) {
      ui.newScript.selectedDrugId = '';
      ui.newScript.drugQuery = '';
      ui.newScript.quantity = '';
      ui.newScript.repeats = '0';
      render();
      return;
    }

    const shortcutButton = event.target.closest('[data-sig-shortcut]');
    if (shortcutButton) {
      const phrase = shortcutButton.dataset.sigShortcut || '';
      ui.newScript.directions = ui.newScript.directions.trim() ? `${ui.newScript.directions.trim()} ${phrase}` : phrase;
      delete ui.newScript.errors.directions;
      render('script-directions');
      return;
    }

    if (event.target.closest('[data-expand-sig]')) {
      ui.newScript.directions = expandSigText(ui.newScript.directions.trim());
      render('script-directions');
      return;
    }

    const previewButton = event.target.closest('[data-preview-label]');
    if (previewButton) {
      openDocumentPreview(previewButton.dataset.previewLabel, 'label');
      return;
    }

    const originalScriptButton = event.target.closest('[data-view-original-script]');
    if (originalScriptButton) {
      openDocumentPreview(originalScriptButton.dataset.viewOriginalScript, 'original-script');
      return;
    }

    if (event.target.closest('[data-close-modal]')) {
      ui.documentPreview.scriptId = '';
      renderDocumentModal();
      return;
    }

    if (event.target.closest('[data-print-label]')) {
      window.print();
      return;
    }

    const finalScriptButton = event.target.closest('[data-final-script]');
    if (finalScriptButton) {
      setFinalCheckSelection(finalScriptButton.dataset.finalScript);
      render();
      return;
    }

    const openFinalButton = event.target.closest('[data-open-final]');
    if (openFinalButton) {
      ui.currentView = 'final-check';
      setFinalCheckSelection(openFinalButton.dataset.openFinal);
      render();
      return;
    }

    const alternativeButton = event.target.closest('[data-toggle-alt]');
    if (alternativeButton) {
      ui.expandedDrugId = ui.expandedDrugId === alternativeButton.dataset.toggleAlt ? '' : alternativeButton.dataset.toggleAlt;
      render();
      return;
    }

    const waitButton = event.target.closest('[data-wait-action]');
    if (waitButton) {
      handleWaitAction(waitButton.dataset.waitAction);
      return;
    }

    if (event.target.closest('[data-close-history-drawer]')) {
      ui.dispenseFlow.historyOpen = false;
      render();
      return;
    }

    const historyRangeButton = event.target.closest('[data-toggle-history-range]');
    if (historyRangeButton) {
      ui.dispenseFlow.historyOpen = true;
      ui.dispenseFlow.allHistory = historyRangeButton.dataset.toggleHistoryRange === 'all';
      render();
      return;
    }

    if (event.target.closest('[data-close-lookup-popover]')) {
      ui.dispenseFlow.lookupPopover = '';
      render();
      return;
    }

    if (event.target.closest('[data-reset-dispense-entry]')) {
      ui.newScript = createNewScriptDraft();
      ui.dispenseFlow.lookupPopover = '';
      ui.dispenseFlow.historyOpen = false;
      render('script-patient-search');
      return;
    }

    if (event.target.closest('[data-cancel-edit]')) {
      if (ui.dispenseFlow.lastQueuedScriptId) {
        ui.dispenseFlow.mode = 'wait';
        render();
      } else {
        ui.newScript = createNewScriptDraft();
        render('script-patient-search');
      }
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.id === 'patient-search-input') {
      ui.patientSearchQuery = target.value;
      render('patient-search-input');
      return;
    }

    if (target.id === 'script-patient-search') {
      ui.newScript.patientQuery = target.value;
      if (ui.newScript.selectedPatientId) {
        const selectedPatient = getPatient(ui.newScript.selectedPatientId);
        if (!selectedPatient || !normalise(target.value).includes(normalise(selectedPatient.name))) {
          ui.newScript.selectedPatientId = '';
        }
      }
      render('script-patient-search');
      return;
    }

    if (target.id === 'dispense-prescriber-search') {
      ui.newScript.prescriberQuery = target.value;
      render('dispense-prescriber-search');
      return;
    }

    if (target.id === 'script-drug-search') {
      ui.newScript.drugQuery = target.value;
      if (ui.newScript.selectedDrugId) {
        const selectedDrug = getDrug(ui.newScript.selectedDrugId);
        if (!selectedDrug || !normalise(target.value).includes(normalise(selectedDrug.brandName))) {
          ui.newScript.selectedDrugId = '';
        }
      }
      render('script-drug-search');
      return;
    }

    if (target.id === 'script-quantity') {
      ui.newScript.quantity = target.value;
      delete ui.newScript.errors.quantity;
      refreshDraftPrice(true);
      render('script-quantity');
      return;
    }

    if (target.id === 'script-repeats') {
      ui.newScript.repeats = target.value;
      delete ui.newScript.errors.repeats;
      return;
    }

    if (target.id === 'script-directions') {
      ui.newScript.directions = target.value;
      delete ui.newScript.errors.directions;
      return;
    }

    if (target.id === 'dispense-script-date') {
      ui.newScript.scriptDate = target.value;
      delete ui.newScript.errors.scriptDate;
      return;
    }

    if (target.id === 'dispense-authority-number') {
      ui.newScript.authorityNumber = target.value.toUpperCase();
      delete ui.newScript.errors.authorityNumber;
      return;
    }

    if (target.id === 'dispense-price') {
      ui.newScript.price = target.value;
      delete ui.newScript.errors.price;
      return;
    }

    if (target.id === 'dispense-initials') {
      ui.newScript.pharmacistInitials = target.value.toUpperCase();
      target.value = ui.newScript.pharmacistInitials;
      delete ui.newScript.errors.pharmacistInitials;
      return;
    }

    if (target.id === 'final-check-initials') {
      ui.finalCheck.initials = target.value.toUpperCase();
      target.value = ui.finalCheck.initials;
      ui.finalCheck.error = '';
      render('final-check-initials');
      return;
    }

    if (target.id === 'drug-lookup-search') {
      ui.drugLookupQuery = target.value;
      render('drug-lookup-search');
      return;
    }

    if (target.id === 'history-search') {
      ui.historyFilters.search = target.value;
      render('history-search');
      return;
    }

    if (target.id === 'history-from') {
      ui.historyFilters.from = target.value;
      render('history-from');
      return;
    }

    if (target.id === 'history-to') {
      ui.historyFilters.to = target.value;
      render('history-to');
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.id === 'script-prescriber' && target instanceof HTMLSelectElement) {
      ui.newScript.prescriberId = target.value;
      delete ui.newScript.errors.prescriber;
      render();
      return;
    }

    if (target.id === 'dispense-script-type' && target instanceof HTMLSelectElement) {
      ui.newScript.scriptType = target.value;
      refreshDraftPrice(true);
      render();
      return;
    }

    if (target.id === 'dispense-is-owing' && target instanceof HTMLInputElement) {
      ui.newScript.isOwing = target.checked;
      render();
      return;
    }

    if (target.id === 'dispense-is-authority' && target instanceof HTMLInputElement) {
      ui.newScript.isAuthority = target.checked;
      if (!target.checked) {
        ui.newScript.authorityNumber = '';
      }
      render();
      return;
    }

    if (target.id === 'dispense-brand-substitution' && target instanceof HTMLInputElement) {
      ui.newScript.brandSubstitutionNotPermitted = target.checked;
      render();
      return;
    }

    if (target.matches('[data-final-check-item]') && target instanceof HTMLInputElement) {
      const key = target.dataset.finalCheckItem;
      if (key) {
        ui.finalCheck.checklist[key] = target.checked;
        ui.finalCheck.error = '';
        render();
      }
    }
  });

  document.addEventListener('blur', (event) => {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement && target.id === 'script-directions') {
      const expanded = expandSigText(target.value.trim());
      if (expanded !== target.value.trim()) {
        ui.newScript.directions = expanded;
        render('script-directions');
      }
    }
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (form.id === 'new-script-form') {
      event.preventDefault();
      handleNewScriptSubmit();
      return;
    }

    if (form.id === 'final-check-form') {
      event.preventDefault();
      handleFinalCheckSubmit();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && ui.documentPreview.scriptId) {
      ui.documentPreview.scriptId = '';
      renderDocumentModal();
      return;
    }

    if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey && VIEW_SHORTCUTS[event.key]) {
      event.preventDefault();
      navigate(VIEW_SHORTCUTS[event.key]);
      return;
    }

    if (ui.documentPreview.scriptId) {
      return;
    }

    if (ui.currentView === 'new-script' && ui.dispenseFlow.mode === 'wait' && !event.metaKey && !event.ctrlKey) {
      const waitKeyMap = {
        n: 'new',
        s: 'same-patient',
        e: 'edit',
        h: 'hold',
        c: 'cancel',
        d: 'defer',
        o: 'toggle-owing',
        l: 'preview-label',
        v: 'view-original',
      };
      const action = waitKeyMap[normalise(event.key)];
      if (action) {
        event.preventDefault();
        handleWaitAction(action);
        return;
      }
    }

    if (event.ctrlKey && !event.altKey && !event.metaKey && normalise(event.key) === 'q' && ui.currentView === 'new-script' && ui.dispenseFlow.lastQueuedScriptId) {
      event.preventDefault();
      ui.dispenseFlow.mode = 'wait';
      render();
      return;
    }

    if (event.ctrlKey && !event.altKey && !event.metaKey && normalise(event.key) === 'o' && ui.currentView === 'new-script') {
      event.preventDefault();
      if (ui.dispenseFlow.mode === 'wait') {
        handleWaitAction('toggle-owing');
      } else {
        toggleDraftOwing();
      }
      return;
    }

    if (event.ctrlKey && !event.altKey && !event.metaKey && normalise(event.key) === 'a' && ui.currentView === 'new-script') {
      event.preventDefault();
      ui.dispenseFlow.lookupPopover = 'allergy';
      render();
      return;
    }

    if (ui.currentView === 'new-script' && ui.dispenseFlow.mode === 'entry' && event.key === 'Enter' && event.target && event.target.id === 'dispense-initials') {
      event.preventDefault();
      requestFormSubmit('new-script-form');
      return;
    }

    if (event.key === 'F2') {
      event.preventDefault();
      if (ui.currentView === 'patient-search') {
        restoreFocus('patient-search-input');
        return;
      }
      if (ui.currentView === 'new-script') {
        if (!ui.newScript.selectedPatientId) {
          restoreFocus('script-patient-search');
          return;
        }
        if (event.ctrlKey) {
          ui.dispenseFlow.historyOpen = true;
          ui.dispenseFlow.allHistory = true;
        } else {
          ui.dispenseFlow.historyOpen = !ui.dispenseFlow.historyOpen;
          ui.dispenseFlow.allHistory = false;
        }
        render();
        return;
      }
      if (ui.currentView === 'history') {
        restoreFocus('history-search');
      }
      return;
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key === 'F3' && ui.currentView === 'new-script') {
      event.preventDefault();
      ui.dispenseFlow.lookupPopover = 'owing';
      render();
      return;
    }

    if (event.key === 'F3') {
      event.preventDefault();
      if (ui.currentView === 'new-script') {
        if (ui.newScript.selectedPatientId && ui.newScript.selectedDrugId) {
          ui.dispenseFlow.lookupPopover = 'repeats';
          render();
        } else {
          restoreFocus('script-drug-search');
        }
        return;
      }
      if (ui.currentView === 'drug-lookup') {
        restoreFocus('drug-lookup-search');
      }
      return;
    }

    if (event.key === 'F4' && ui.currentView === 'new-script' && ui.dispenseFlow.mode === 'entry') {
      event.preventDefault();
      requestFormSubmit('new-script-form');
      return;
    }

    if (event.key === 'F6' && ui.currentView === 'final-check' && ui.finalCheck.selectedScriptId) {
      event.preventDefault();
      openDocumentPreview(ui.finalCheck.selectedScriptId, 'label');
      return;
    }

    if (event.key === 'F7' && ui.currentView === 'new-script' && ui.dispenseFlow.mode === 'entry') {
      event.preventDefault();
      ui.dispenseFlow.lookupPopover = 'price';
      render();
      return;
    }

    if (event.key === 'F8' && ui.currentView === 'new-script' && ui.dispenseFlow.mode === 'entry') {
      event.preventDefault();
      ui.dispenseFlow.lookupPopover = 'patient';
      render();
      return;
    }

    if (event.key === 'F11' && ui.currentView === 'new-script' && ui.dispenseFlow.mode === 'entry') {
      event.preventDefault();
      ui.dispenseFlow.lookupPopover = 'brand-family';
      render();
      return;
    }

    if (event.key === 'F12' && ui.currentView === 'final-check') {
      event.preventDefault();
      requestFormSubmit('final-check-form');
    }
  });

  updateStatusBar();
  window.setInterval(updateStatusBar, 1000);
  render();
})();
