(function () {
  const dataApi = window.PracticeRxData;

  if (!dataApi) {
    return;
  }

  const { loadState, saveState, resetState, createAuditEntry, createDispenseNumber, generateId } = dataApi;
  const appRoot = document.getElementById('app');
  const navRoot = document.getElementById('app-nav');
  const labelModal = document.getElementById('label-modal');
  const labelModalContent = document.getElementById('label-modal-content');
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

  let state = loadState();
  let toastTimer = null;

  const ui = {
    currentView: 'dashboard',
    patientSearchQuery: '',
    selectedPatientId: state.patients[0] ? state.patients[0].id : '',
    newScript: createNewScriptDraft(),
    drugLookupQuery: '',
    expandedDrugId: '',
    labelScriptId: '',
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

  function createEmptyChecklist() {
    return {
      patient: false,
      drug: false,
      dose: false,
      directions: false,
    };
  }

  function createNewScriptDraft() {
    return {
      patientQuery: '',
      selectedPatientId: '',
      prescriberId: '',
      drugQuery: '',
      selectedDrugId: '',
      quantity: '',
      repeats: '0',
      directions: '',
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

    const stillExists = state.queue.some((script) => script.id === ui.finalCheck.selectedScriptId);
    if (!stillExists) {
      ui.finalCheck.selectedScriptId = state.queue[0].id;
      ui.finalCheck.checklist = createEmptyChecklist();
      ui.finalCheck.initials = '';
      ui.finalCheck.error = '';
    }
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
    const sorted = items.slice().sort((left, right) => {
      const result = compareValues(meta.value(left), meta.value(right), meta.type);
      return sortState.dir === 'asc' ? result : result * -1;
    });
    return sorted;
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
      appRoot.innerHTML = renderNewScriptView();
    } else if (ui.currentView === 'drug-lookup') {
      appRoot.innerHTML = renderDrugLookupView();
    } else if (ui.currentView === 'final-check') {
      appRoot.innerHTML = renderFinalCheckView();
    } else {
      appRoot.innerHTML = renderHistoryView();
    }

    renderLabelModal();
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
            <td class="is-numeric">${script.quantity}</td>
            <td class="is-numeric">${script.repeats}</td>
            <td class="mono-cell">${escapeHtml(script.dispenseNumber)}</td>
            <td class="date-cell">${escapeHtml(formatDateTime(script.createdAt))}</td>
            <td>
              <div class="inline-actions">
                <button class="table-action" type="button" data-preview-label="${script.id}">Preview Label</button>
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
                  <th class="is-numeric">${renderSortHeader('dashboardQueue', 'quantity', 'Qty', { numeric: true })}</th>
                  <th class="is-numeric">${renderSortHeader('dashboardQueue', 'repeats', 'Rpt', { numeric: true })}</th>
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
                          <span class="selection-item__meta">DOB ${formatDob(patient.dob)} • ${escapeHtml(patient.phone)}</span>
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
                    <button class="secondary-button" type="button" data-view="new-script">New Script ${renderShortcutBadge('Alt+3')}</button>
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

  function renderNewScriptView() {
    const selectedPatient = getPatient(ui.newScript.selectedPatientId);
    const selectedDrug = getDrug(ui.newScript.selectedDrugId);
    const patientQuery = normalise(ui.newScript.patientQuery);
    const drugQuery = normalise(ui.newScript.drugQuery);

    const patientMatches = state.patients
      .filter((patient) => {
        if (!patientQuery) {
          return true;
        }
        return normalise(patient.name).includes(patientQuery) || normalise(formatDob(patient.dob)).includes(patientQuery) || normalise(patient.dob).includes(patientQuery);
      })
      .slice(0, 6);

    const drugMatches = state.drugs
      .filter((drug) => {
        if (!drugQuery) {
          return true;
        }
        return normalise(drug.brandName).includes(drugQuery) || normalise(drug.genericName).includes(drugQuery) || normalise(drug.itemCode).includes(drugQuery);
      })
      .slice(0, 8);

    const selectedPrescriber = getPrescriber(ui.newScript.prescriberId);
    const lowStockNotice = selectedDrug && selectedDrug.stockQuantity < 10
      ? `<div class="warning-banner spacer-top">Low virtual stock: only ${selectedDrug.stockQuantity} unit(s) currently available for ${escapeHtml(selectedDrug.brandName)}.</div>`
      : '';
    const patientAlert = selectedPatient && selectedPatient.allergies.length
      ? `<div class="warning-banner spacer-top">Allergy alert: ${escapeHtml(selectedPatient.allergies.join(', '))}</div>`
      : '';

    return `
      <section class="view-stack">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">New Script</p>
            <h2>Enter a new training script</h2>
            <p>Use grouped data-entry panels to select the patient, prescriber, drug, quantity, repeats, and label directions.</p>
          </div>
          <div class="toolbar-help">Shortcuts: ${renderShortcutBadge('F2')} patient search, ${renderShortcutBadge('F3')} drug search, ${renderShortcutBadge('F4')} add to queue</div>
        </div>

        <div class="form-split">
          <form id="new-script-form" class="form-shell" novalidate>
            ${ui.newScript.success ? `<div class="success-banner">${escapeHtml(ui.newScript.success)}</div>` : ''}

            <fieldset class="group-panel ${ui.newScript.success ? 'spacer-top' : ''}">
              <legend class="group-panel__title">Patient selection</legend>
              <div class="form-field form-field--full">
                <label for="script-patient-search">Patient</label>
                <div class="search-strip">
                  <input id="script-patient-search" class="input" type="text" placeholder="Search by patient name or DOB" value="${escapeHtml(ui.newScript.patientQuery)}" autocomplete="off" />
                  <span class="shortcut-chip">F2</span>
                </div>
                ${ui.newScript.errors.patient ? `<div class="error-text">${escapeHtml(ui.newScript.errors.patient)}</div>` : ''}
                ${selectedPatient
                  ? `
                    <div class="selected-chip spacer-top">
                      <div class="stack-between">
                        <div>
                          <strong>${escapeHtml(selectedPatient.name)}</strong>
                          <p>DOB ${formatDob(selectedPatient.dob)} • ${escapeHtml(selectedPatient.phone)}</p>
                        </div>
                        <button class="ghost-button" type="button" data-clear-patient="true">Change</button>
                      </div>
                    </div>
                    ${patientAlert}
                  `
                  : `
                    <div class="selection-list spacer-top">
                      ${patientMatches.length
                        ? patientMatches
                            .map(
                              (patient) => `
                                <button class="selection-item" type="button" data-select-patient="${patient.id}">
                                  <span class="selection-item__title">${escapeHtml(patient.name)}</span>
                                  <span class="selection-item__meta">DOB ${formatDob(patient.dob)} • ${escapeHtml(patient.address)}</span>
                                </button>
                              `
                            )
                            .join('')
                        : '<div class="info-banner">No patient matches that search yet.</div>'}
                    </div>
                  `}
              </div>
            </fieldset>

            <fieldset class="group-panel spacer-top">
              <legend class="group-panel__title">Prescription details</legend>
              <div class="form-grid">
                <div class="form-field form-field--full">
                  <label for="script-prescriber">Prescriber</label>
                  <select id="script-prescriber" class="select">
                    <option value="">Select prescriber</option>
                    ${state.prescribers
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
                </div>

                <div class="form-field form-field--full">
                  <label for="script-drug-search">Drug</label>
                  <div class="search-strip">
                    <input id="script-drug-search" class="input" type="text" placeholder="Search brand, generic, or code" value="${escapeHtml(ui.newScript.drugQuery)}" autocomplete="off" />
                    <span class="shortcut-chip">F3</span>
                  </div>
                  ${ui.newScript.errors.drug ? `<div class="error-text">${escapeHtml(ui.newScript.errors.drug)}</div>` : ''}
                  ${selectedDrug
                    ? `
                      <div class="selected-chip spacer-top">
                        <div class="stack-between">
                          <div>
                            <strong>${escapeHtml(selectedDrug.brandName)} ${escapeHtml(selectedDrug.strength)}</strong>
                            <p>${escapeHtml(selectedDrug.genericName)} • ${escapeHtml(selectedDrug.form)} • Code <span class="mono-cell">${escapeHtml(selectedDrug.itemCode)}</span> • Stock ${selectedDrug.stockQuantity}</p>
                          </div>
                          <button class="ghost-button" type="button" data-clear-drug="true">Change</button>
                        </div>
                      </div>
                      ${lowStockNotice}
                    `
                    : `
                      <div class="selection-list spacer-top">
                        ${drugMatches.length
                          ? drugMatches
                              .map(
                                (drug) => `
                                  <button class="selection-item" type="button" data-select-drug="${drug.id}">
                                    <span class="selection-item__title">${escapeHtml(drug.brandName)} ${escapeHtml(drug.strength)}</span>
                                    <span class="selection-item__meta">${escapeHtml(drug.genericName)} • ${escapeHtml(drug.form)} • Code ${escapeHtml(drug.itemCode)}</span>
                                  </button>
                                `
                              )
                              .join('')
                          : '<div class="info-banner">No drug matches that search yet.</div>'}
                      </div>
                    `}
                </div>

                <div class="form-field">
                  <label for="script-quantity">Quantity</label>
                  <input id="script-quantity" class="input" type="number" min="1" step="1" inputmode="numeric" value="${escapeHtml(ui.newScript.quantity)}" />
                  ${ui.newScript.errors.quantity ? `<div class="error-text">${escapeHtml(ui.newScript.errors.quantity)}</div>` : ''}
                </div>

                <div class="form-field">
                  <label for="script-repeats">Repeats</label>
                  <input id="script-repeats" class="input" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(ui.newScript.repeats)}" />
                  ${ui.newScript.errors.repeats ? `<div class="error-text">${escapeHtml(ui.newScript.errors.repeats)}</div>` : ''}
                </div>
              </div>
            </fieldset>

            <fieldset class="group-panel spacer-top">
              <legend class="group-panel__title">Directions / label text</legend>
              <div class="form-field form-field--full">
                <label for="script-directions">Directions / SIG</label>
                <textarea id="script-directions" class="textarea" placeholder="Enter directions exactly as you want the mock label to display.">${escapeHtml(ui.newScript.directions)}</textarea>
                <div class="sig-shortcuts">
                  <button class="ghost-button" type="button" data-sig-shortcut="Take 1 tablet once daily.">1 tablet daily</button>
                  <button class="ghost-button" type="button" data-sig-shortcut="Take 1 tablet twice daily with food.">1 tablet twice daily</button>
                  <button class="ghost-button" type="button" data-sig-shortcut="Take 1 capsule at night.">1 capsule at night</button>
                  <button class="ghost-button" type="button" data-sig-shortcut="Inhale 2 puffs every 4 hours as needed.">2 puffs PRN</button>
                  <button class="ghost-button" type="button" data-sig-shortcut="Apply a thin layer to the affected area twice daily.">Apply twice daily</button>
                </div>
                ${ui.newScript.errors.directions ? `<div class="error-text">${escapeHtml(ui.newScript.errors.directions)}</div>` : ''}
              </div>
            </fieldset>

            <div class="button-row spacer-top">
              <button class="button" type="submit">Add to Queue ${renderShortcutBadge('F4')}</button>
              <button class="secondary-button" type="button" data-view="dashboard">Return to Dashboard</button>
            </div>
          </form>

          <aside class="summary-panel">
            <div class="panel-stack">
              <div>
                <p class="section-heading__eyebrow">Selection summary</p>
                <h2>Ready-for-queue check</h2>
                <p class="panel-copy">Review the grouped details before submitting the item into the script queue.</p>
              </div>

              <div class="summary-box">
                <strong>Patient</strong>
                <p>${selectedPatient ? escapeHtml(`${selectedPatient.name} • ${formatDob(selectedPatient.dob)}`) : 'No patient selected yet.'}</p>
              </div>
              <div class="summary-box">
                <strong>Prescriber</strong>
                <p>${selectedPrescriber ? escapeHtml(`${selectedPrescriber.name} • ${selectedPrescriber.clinic}`) : 'Choose a prescriber from the dropdown.'}</p>
              </div>
              <div class="summary-box">
                <strong>Drug</strong>
                <p>${selectedDrug ? escapeHtml(`${selectedDrug.brandName} ${selectedDrug.strength} (${selectedDrug.genericName})`) : 'No drug selected yet.'}</p>
              </div>
              <div class="summary-box">
                <strong>Directions</strong>
                <p>${ui.newScript.directions ? escapeHtml(ui.newScript.directions) : 'Add directions or use a SIG shortcut.'}</p>
              </div>
              <div class="info-banner">This trainer uses entirely fictional data and is designed for workflow rehearsal only.</div>
            </div>
          </aside>
        </div>
      </section>
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
            <td class="code-cell">${escapeHtml(drug.itemCode)}</td>
            <td class="is-numeric"><span class="status-pill status-pill--${stockTone}">${stockText}: ${drug.stockQuantity}</span></td>
            <td>
              <button class="toggle-button" type="button" data-toggle-alt="${drug.id}">${isExpanded ? 'Hide alternatives' : 'Suggest alternatives'}</button>
            </td>
          </tr>
          ${isExpanded ? `
            <tr class="alternatives-row">
              <td colspan="7">
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
            <p>Review brand and generic names, stock levels, item codes, and substitution examples before queuing or checking a script.</p>
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
                      <span class="queue-item__meta">${escapeHtml(drug ? `${drug.brandName} ${drug.strength}` : 'Unknown drug')} • Qty ${script.quantity} • Added ${formatDateTime(script.createdAt)}</span>
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
                    <button class="ghost-button" type="button" data-preview-label="${selectedScript.id}">Preview Label ${renderShortcutBadge('F6')}</button>
                  </div>

                  <fieldset class="group-panel">
                    <legend class="group-panel__title">Script details</legend>
                    <div class="summary-grid">
                      <span class="badge">DOB ${formatDob(selectedPatient.dob)}</span>
                      <span class="badge">Quantity ${selectedScript.quantity}</span>
                      <span class="badge">Repeats ${selectedScript.repeats}</span>
                      <span class="badge mono-cell">${escapeHtml(selectedScript.dispenseNumber)}</span>
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
    const filteredHistory = state.history
      .filter((record) => {
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
              <p class="table-panel__subtitle">Completed supplies retain initials, timestamp, and fictional dispense numbers.</p>
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
                      <th class="is-numeric">${renderSortHeader('history', 'quantity', 'Qty', { numeric: true })}</th>
                      <th>${renderSortHeader('history', 'pharmacistInitials', 'Initials')}</th>
                      <th>${renderSortHeader('history', 'dispenseNumber', 'Dispense No.')}</th>
                      <th>${renderSortHeader('history', 'dispensedAt', 'Timestamp')}</th>
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
                            <td class="is-numeric">${record.quantity}</td>
                            <td class="mono-cell">${escapeHtml(record.pharmacistInitials)}</td>
                            <td class="mono-cell">${escapeHtml(record.dispenseNumber)}</td>
                            <td class="date-cell">${escapeHtml(formatDateTime(record.dispensedAt))}</td>
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
            <p class="table-panel__subtitle">Locally stored queueing, dispensing, and reset actions.</p>
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

  function renderLabelModal() {
    if (!ui.labelScriptId) {
      labelModal.classList.remove('is-open');
      labelModal.setAttribute('aria-hidden', 'true');
      labelModalContent.innerHTML = '';
      return;
    }

    const script = getAnyScript(ui.labelScriptId);
    const patient = script ? getPatient(script.patientId) : null;
    const drug = script ? getDrug(script.drugId) : null;
    const prescriber = script ? getPrescriber(script.prescriberId) : null;

    if (!script || !patient || !drug || !prescriber) {
      ui.labelScriptId = '';
      renderLabelModal();
      return;
    }

    const supplyDate = script.dispensedAt || script.createdAt;
    labelModalContent.innerHTML = `
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
        </div>
      </div>
      <div class="label-actions">
        <button class="ghost-button" type="button" data-close-modal="true">Close</button>
        <button class="button" type="button" data-print-label="true">Print</button>
      </div>
    `;
    labelModal.classList.add('is-open');
    labelModal.setAttribute('aria-hidden', 'false');
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

  function validateNewScriptDraft() {
    const errors = {};
    const selectedDrug = getDrug(ui.newScript.selectedDrugId);
    const quantity = Number(ui.newScript.quantity);
    const repeats = Number(ui.newScript.repeats);

    if (!ui.newScript.selectedPatientId) {
      errors.patient = 'Select an existing patient from the list.';
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

    return errors;
  }

  function handleNewScriptSubmit() {
    const errors = validateNewScriptDraft();
    ui.newScript.errors = errors;

    if (Object.keys(errors).length) {
      render();
      return;
    }

    const patient = getPatient(ui.newScript.selectedPatientId);
    const drug = getDrug(ui.newScript.selectedDrugId);
    const totalRecords = state.queue.length + state.history.length;
    const newScript = {
      id: generateId('scr'),
      patientId: ui.newScript.selectedPatientId,
      prescriberId: ui.newScript.prescriberId,
      drugId: ui.newScript.selectedDrugId,
      quantity: Number(ui.newScript.quantity),
      repeats: Number(ui.newScript.repeats),
      directions: ui.newScript.directions.trim(),
      createdAt: new Date().toISOString(),
      dispenseNumber: createDispenseNumber(totalRecords),
    };

    state.queue.unshift(newScript);
    state.auditTrail.unshift(
      createAuditEntry(
        'Queued script',
        `${patient ? patient.name : 'Unknown patient'} added for ${drug ? `${drug.brandName} ${drug.strength}` : 'selected drug'}.`,
        newScript.id
      )
    );
    persistState();

    ui.newScript = createNewScriptDraft();
    ui.newScript.success = `${patient ? patient.name : 'Patient'} queued successfully for ${drug ? drug.brandName : 'the selected item'}.`;
    setFinalCheckSelection(newScript.id);
    render();
    showToast('Script added to the pending queue.', 'success');
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

    const dispensedRecord = {
      ...script,
      pharmacistInitials: ui.finalCheck.initials.trim().toUpperCase(),
      dispensedAt: new Date().toISOString(),
      finalCheck: { ...ui.finalCheck.checklist },
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

    const patient = getPatient(script.patientId);
    state.auditTrail.unshift(
      createAuditEntry(
        'Dispensed after final check',
        `${patient ? patient.name : 'Unknown patient'} supplied ${drug.brandName} ${drug.strength} with initials ${dispensedRecord.pharmacistInitials}.`,
        script.id
      )
    );
    persistState();

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
      ui.drugLookupQuery = '';
      ui.expandedDrugId = '';
      ui.labelScriptId = '';
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

    const selectPatientButton = event.target.closest('[data-select-patient]');
    if (selectPatientButton) {
      const patient = getPatient(selectPatientButton.dataset.selectPatient);
      ui.newScript.selectedPatientId = selectPatientButton.dataset.selectPatient;
      ui.newScript.patientQuery = patient ? `${patient.name} • ${formatDob(patient.dob)}` : '';
      delete ui.newScript.errors.patient;
      ui.newScript.success = '';
      render();
      return;
    }

    if (event.target.closest('[data-clear-patient]')) {
      ui.newScript.selectedPatientId = '';
      ui.newScript.patientQuery = '';
      ui.newScript.success = '';
      render();
      return;
    }

    const selectDrugButton = event.target.closest('[data-select-drug]');
    if (selectDrugButton) {
      const drug = getDrug(selectDrugButton.dataset.selectDrug);
      ui.newScript.selectedDrugId = selectDrugButton.dataset.selectDrug;
      ui.newScript.drugQuery = drug ? `${drug.brandName} ${drug.strength}` : '';
      delete ui.newScript.errors.drug;
      ui.newScript.success = '';
      render();
      return;
    }

    if (event.target.closest('[data-clear-drug]')) {
      ui.newScript.selectedDrugId = '';
      ui.newScript.drugQuery = '';
      ui.newScript.success = '';
      render();
      return;
    }

    const shortcutButton = event.target.closest('[data-sig-shortcut]');
    if (shortcutButton) {
      const phrase = shortcutButton.dataset.sigShortcut || '';
      ui.newScript.directions = ui.newScript.directions.trim() ? `${ui.newScript.directions.trim()} ${phrase}` : phrase;
      delete ui.newScript.errors.directions;
      ui.newScript.success = '';
      render('script-directions');
      return;
    }

    const previewButton = event.target.closest('[data-preview-label]');
    if (previewButton) {
      ui.labelScriptId = previewButton.dataset.previewLabel;
      renderLabelModal();
      return;
    }

    if (event.target.closest('[data-close-modal]')) {
      ui.labelScriptId = '';
      renderLabelModal();
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
      ui.newScript.success = '';
      render('script-patient-search');
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
      ui.newScript.success = '';
      render('script-drug-search');
      return;
    }

    if (target.id === 'script-quantity') {
      ui.newScript.quantity = target.value;
      delete ui.newScript.errors.quantity;
      ui.newScript.success = '';
      return;
    }

    if (target.id === 'script-repeats') {
      ui.newScript.repeats = target.value;
      delete ui.newScript.errors.repeats;
      ui.newScript.success = '';
      return;
    }

    if (target.id === 'script-directions') {
      ui.newScript.directions = target.value;
      delete ui.newScript.errors.directions;
      ui.newScript.success = '';
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
      return;
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
      ui.newScript.success = '';
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
    if (event.key === 'Escape' && ui.labelScriptId) {
      ui.labelScriptId = '';
      renderLabelModal();
      return;
    }

    if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey && VIEW_SHORTCUTS[event.key]) {
      event.preventDefault();
      navigate(VIEW_SHORTCUTS[event.key]);
      return;
    }

    if (ui.labelScriptId) {
      return;
    }

    if (event.key === 'F2') {
      event.preventDefault();
      if (ui.currentView === 'patient-search') {
        restoreFocus('patient-search-input');
        return;
      }
      if (ui.currentView === 'new-script') {
        restoreFocus('script-patient-search');
        return;
      }
      if (ui.currentView === 'history') {
        restoreFocus('history-search');
      }
      return;
    }

    if (event.key === 'F3') {
      event.preventDefault();
      if (ui.currentView === 'new-script') {
        restoreFocus('script-drug-search');
        return;
      }
      if (ui.currentView === 'drug-lookup') {
        restoreFocus('drug-lookup-search');
      }
      return;
    }

    if (event.key === 'F4' && ui.currentView === 'new-script') {
      event.preventDefault();
      requestFormSubmit('new-script-form');
      return;
    }

    if (event.key === 'F6' && ui.currentView === 'final-check' && ui.finalCheck.selectedScriptId) {
      event.preventDefault();
      ui.labelScriptId = ui.finalCheck.selectedScriptId;
      renderLabelModal();
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
