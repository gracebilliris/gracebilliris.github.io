# PracticeRx Dispense Trainer — Scoped Redesign Plan

## 1. Current-state summary

### Existing shell and navigation
- `index.html` is a single-page static shell with:
  - desktop-style title bar (`.title-bar`)
  - persistent training disclaimer banner (`.disclaimer-banner`)
  - six-button quick-launch ribbon nav (`#app-nav`) for `dashboard`, `patient-search`, `new-script`, `drug-lookup`, `final-check`, and `history`
  - main render target (`#app`)
  - persistent status bar footer
  - one reusable modal (`#label-modal`) for dispensing-label preview/print
  - toast region
- `app.js` renders all views into `#app` based on `ui.currentView` and stores all app data in `localStorage` via `PracticeRxData`.

### Existing New Script view
- The current New Script view is rendered by `renderNewScriptView()`.
- It uses a **two-column `form-split` layout**:
  - **left/main column**: one large `<form id="new-script-form">` with three grouped fieldsets:
    1. **Patient selection**
       - free-text patient search input `#script-patient-search`
       - selectable suggestion list buttons `[data-select-patient]`
       - selected-patient summary chip and allergy warning banner
    2. **Prescription details**
       - prescriber `<select id="script-prescriber">`
       - drug search input `#script-drug-search`
       - selectable drug suggestion list buttons `[data-select-drug]`
       - quantity input `#script-quantity`
       - repeats input `#script-repeats`
    3. **Directions / label text**
       - textarea `#script-directions`
       - fixed SIG shortcut buttons `[data-sig-shortcut]`
  - **right column**: summary aside with current patient / prescriber / drug / directions recap.
- Submit action is **Add to Queue** via form submit or `F4`.
- After submit, the app currently:
  - validates the draft
  - creates a queue record
  - prepends it to `state.queue`
  - shows a success banner/toast
  - resets the draft
  - preselects the new script in Final Check state
- There is **no separate post-entry wait screen state** today.

### Existing label modal / print flow
- `#label-modal` is a dedicated modal for the current dispensing-label preview.
- `renderLabelModal()` builds a simple label card using patient, drug, quantity, directions, prescriber, date, dispense number, and repeats.
- Printing relies on the current `@media print` block, which hides the rest of the app and prints the modal content only.
- Current label preview actions appear in:
  - Dashboard queue rows: `[data-preview-label]`
  - Final Check selected item: `[data-preview-label]`
- History currently has **no label/original-script action column**.

### Existing workflow structure outside New Script
- **Dashboard**: queue table + recent activity feed.
- **Patient Search**: left register + right profile/history panel.
- **Drug Lookup**: sortable drug catalogue with alternative suggestions.
- **Final Check**: left queued-script list + right detail/checklist/initials panel; `F6` previews label, `F12` confirms dispense.
- **History**: dispensed history table with search/date filters plus audit trail.

### Existing keyboard shortcuts in `app.js`
- `Alt+1` Dashboard
- `Alt+2` Patient Search
- `Alt+3` New Script
- `Alt+4` Drug Lookup
- `Alt+5` Final Check
- `Alt+6` History
- `F2` focus patient/history search in context
- `F3` focus drug search in context
- `F4` submit New Script form
- `F6` preview label from Final Check
- `F12` confirm & dispense from Final Check
- `Esc` closes the label modal

---

## 2. Layout redesign plan

## Core redesign decision
Replace the current New Script **split-form + summary aside** with a dedicated **single-column dispensing workflow screen** that mirrors Fred-like structural conventions without copying branding or exact visuals.

### Keep vs replace
- **Keep**:
  - overall PracticeRx app shell: title bar, disclaimer banner, quick-launch ribbon, status bar
  - current view routing model (`dashboard`, `patient-search`, `new-script`, etc.)
  - current queue/history/final-check concepts
  - keyboard-first dense enterprise aesthetic already established in `styles.css`
- **Replace inside `new-script`**:
  - retire the persistent right-hand summary aside for the main entry flow
  - replace the grouped form layout with a **numbered, linear “Main Dispense Screen”**
  - introduce a **post-save “Wait Screen”-equivalent substate** inside the New Script module

## Proposed dispensing-flow states
Add a substate object such as:
- `ui.dispenseFlow.mode = 'entry' | 'wait'`
- `ui.dispenseFlow.lastQueuedScriptId = ''`
- `ui.dispenseFlow.samePatientId = ''`
- `ui.dispenseFlow.historyRange = '12mo' | 'all'`

The `new-script` view becomes a mini workflow with two internal screens:
1. **Entry screen** = linear Main Dispense Screen
2. **Wait screen** = post-entry summary/action hub for the just-queued script

## Main Dispense Screen structure
Use a new wrapper such as `.dispense-screen` with one vertical stack of numbered rows.

### New field order (must be rendered top-to-bottom)
1. **Patient**
   - primary input: `#dispense-patient-search`
   - inline selected patient block showing name, DOB, address, Medicare
   - compact picker list below only when searching
2. **Script Date**
   - new input: `#dispense-script-date`
   - default to today
3. **Script Type**
   - new control: `#dispense-script-type`
   - base options: `N (PBS)`, `P (Private)`, `R (RPBS/Repat)`, `D (Defer)`, `T (Schedule 3)`
   - suffix toggles rendered beside it:
     - `Owing` checkbox / hotkey toggle
     - `Authority` checkbox / hotkey toggle
4. **Prescribing Doctor**
   - searchable select or typeahead: `#dispense-prescriber-search` or upgraded `#script-prescriber`
5. **Drug**
   - searchable input: `#dispense-drug-search`
   - selected drug summary line with generic/form/strength/item code
   - optional brand-family picker trigger
6. **Directions / SIG**
   - textarea/input: `#dispense-directions`
   - Smart SIG helper row beneath it
7. **Repeats**
   - numeric input: `#dispense-repeats`
8. **Quantity**
   - numeric input: `#dispense-quantity`
   - default from drug-level standard/PBS quantity when available
9. **Price**
   - currency/text input: `#dispense-price`
   - auto-default from script type + mock PBS/private pricing rules
10. **Pharmacist Initials**
   - text input: `#dispense-initials`
   - pressing `Enter` here queues/saves the script and transitions to Wait Screen

### Supporting regions on the entry screen
Do **not** create a permanent second pane. Instead add small Fred-like supporting regions that do not break the single-column feel:
- `.dispense-screen__headerbar`
  - title, current patient name, script count, shortcut hints
- `.dispense-screen__alerts`
  - allergy banner
  - low-stock banner
  - deferred/owing/authority badges
- `.dispense-screen__history-drawer`
  - collapsible patient history panel opened by `F2` / `Ctrl+F2`
- `.dispense-screen__lookup-popover`
  - reused for repeats, owing, price lookup, brand family, patient edit
- `.dispense-screen__footerbar`
  - queue/save prompt and current step help

## Wait Screen-equivalent plan
After successful queue/save, do **not** immediately clear back to the same entry form. Show a dense post-entry screen inspired by the documented wait-screen workflow.

### Wait Screen content
Render a dedicated `.dispense-wait-screen` containing:
- clear header: `Queued Successfully — Training Workflow`
- selected patient and drug recap
- queued script metadata:
  - dispense number
  - script type
  - quantity
  - repeats
  - price
  - initials
  - queued timestamp
- quick action grid with buttons and visible shortcut chips

### Wait Screen actions
Implement as original PracticeRx actions with Fred-like semantics:
- `N` — **New patient / new script**
  - clear draft entirely and open fresh entry screen
- `S` — **Same patient**
  - reopen entry screen with patient preserved, other fields cleared/defaulted
- `E` — **Edit queued item**
  - reopen entry screen populated from the just-queued script
- `H` — **Hold**
  - mark queue item status as `hold`
- `C` — **Cancel queued item**
  - remove from queue with audit entry
- `D` — **Defer**
  - set script status/type as deferred and return to dashboard/history as appropriate
- `O` — **Toggle owing**
  - toggle `isOwing` on the queued item
- `L` — **Preview label**
  - open existing label preview for that item
- `V` — **View original script**
  - open the new PBS facsimile view (PracticeRx-specific addition)

### Explicit Wait Screen exclusions for this scope
Do **not** implement Fred-specific repeat-print actions as first-class workflow outputs yet:
- `R` reprint repeat
- `B` reprint label + repeat
These may be shown as reserved/disabled future actions or omitted from v1 of the redesign to avoid inventing a repeat-token subsystem not present in the current app.

## Concrete keyboard-shortcut reconciliation
Keep current navigation shortcuts intact and layer Fred-like semantics contextually.

### App-wide shortcuts to keep unchanged
- `Alt+1` Dashboard
- `Alt+2` Patient Search
- `Alt+3` New Script / Dispense Screen
- `Alt+4` Drug Lookup
- `Alt+5` Final Check
- `Alt+6` History
- `Esc` close whichever modal/document preview is open

### Contextual dispensing-flow shortcuts
- `Enter` / `Tab`
  - advance through numbered fields 1→10 in sequence
  - on field 10 (Pharmacist Initials), `Enter` queues the script
- `F2`
  - **dispense screen**: open/toggle 12-month patient history drawer for the selected patient (Fred-aligned)
  - **patient-search/history views**: keep current “focus search” behaviour
  - **new-script with no patient selected yet**: focus patient field first, then subsequent `F2` toggles history once patient exists
- `Ctrl+F2`
  - show **all** recorded history for the selected patient in the same drawer/modal
- `F3`
  - **dispense screen**: open repeats-remaining summary for the selected patient + drug (Fred-aligned)
  - **drug-lookup view / no selected script context**: keep current drug-search focus behaviour
- `Alt+F3`
  - open owing-scripts summary for the selected patient
- `F4`
  - preserve current save/queue semantics: submit the dispensing-entry form
  - effectively duplicates “complete on field 10” for keyboard users already trained on current app
- `F6`
  - keep existing **Final Check → Preview Label** behaviour unchanged
- `F7`
  - open mock price lookup/calculation popover from field 9
- `F8`
  - open patient-edit/info popover from field 1 (read-only or lightweight-edit scope depending implementation appetite)
- `F11`
  - open brand-family/substitution chooser from field 5
- `F12`
  - keep existing **Final Check → Confirm & Dispense** behaviour unchanged; do not overload it in entry mode
- `Ctrl+Q`
  - return from entry/edit mode to Wait Screen for the last queued item
- `Ctrl+O`
  - toggle `isOwing`
- `Ctrl+A`
  - open allergy summary for selected patient
- `Ctrl+E`
  - reserve for batch/expiry popover in Final Check or queued-item detail; do not force full batch logic into this redesign if not otherwise implemented

## Smart SIG plan
Replace current fixed shortcut row with a more Fred-like expansion approach:
- keep 3–5 clickable helpers for discoverability
- add a tiny “Smart SIG examples” strip and phrase expansion map, e.g.:
  - `1d` → `Take ONE tablet daily.`
  - `1bd` → `Take ONE tablet twice daily.`
  - `1tds` → `Take ONE tablet THREE times a day.`
  - `2p q4h prn` → `Inhale TWO puffs every 4 hours as needed.`
- expansion can occur on blur, on dedicated button, or on `Tab` from the directions field
- keep output clearly editable plain text

## Final Check interaction with redesign
- Keep Final Check as a separate module rather than collapsing everything into the new entry screen.
- Update Final Check detail panel so it surfaces new script metadata:
  - script date
  - script type
  - price
  - authority / owing flags
  - “View Original Script” action beside Preview Label

---

## 3. NSW/PBS “green script” feature plan

## Where the new feature appears
Add a **View Original Script** action anywhere a queued or dispensed script is currently reviewed.

### Placement
1. **Dashboard queue table**
   - add a new row action beside `Preview Label`
   - selector suggestion: `[data-view-original-script]`
2. **Final Check detail panel**
   - add button beside `Preview Label`
3. **History table**
   - add an `Actions` column with at least:
     - `View Original Script`
     - optional `Preview Label`
4. **Wait Screen**
   - include `View Original Script` as a primary action

## UI architecture for the feature
Use a **dedicated printable document view**, separate from the dispensing label.

### Recommended modal strategy
Option A (preferred): replace the label-specific modal with a generic document modal:
- rename conceptual responsibility from “label modal” to “document preview modal”
- retain current modal shell structure but allow two document renderers:
  - label renderer
  - PBS script facsimile renderer

Suggested IDs/classes:
- keep existing shell if minimizing HTML churn:
  - `#label-modal` can be generalized internally, or
- better long-term structure:
  - `#document-modal`
  - `#document-modal-title`
  - `#document-modal-content`
  - document mode classes:
    - `.document-preview--label`
    - `.document-preview--pbs-script`

## Data fields required for the PBS facsimile

### Already available in `data.js`
**Patient**
- `name`
- `address`
- `medicareNumber`
- `dob` (useful side data, though not specifically required on the facsimile)

**Prescriber**
- `name`
- `providerNumber` (can stand in for prescriber number)
- `clinic`

**Drug**
- `brandName`
- `genericName`
- `strength`
- `form`

**Script / queue / history record**
- `patientId`
- `prescriberId`
- `drugId`
- `quantity`
- `repeats`
- `directions`
- `createdAt`
- `dispenseNumber`
- `pharmacistInitials` (history only)
- `dispensedAt` (history only)

### Missing data that should be added

#### Patient model additions
Add to each patient seed object:
- `concessionType` — e.g. `General`, `Pensioner`, `Concession`, `DVA`
- optional `medicareReferenceNumber` if wanting slightly more realistic formatting

#### Prescriber model additions
Add to each prescriber seed object:
- `qualifications` — e.g. `MBBS`, `Dr`
- `practiceAddress`
- `practicePhone`
- optionally rename/alias `providerNumber` to `prescriberNumber` in render logic for clarity

#### Drug model additions
Add to each drug seed object:
- `schedule` — e.g. `Unscheduled`, `S3`, `S4`, `S8`
- `defaultQuantity` or `pbsMaxQuantity`
- `defaultRepeats`
- `brandSubstitutionAllowed` default boolean (or inverse `brandSubstitutionNotPermittedDefault`)
- optional `requiresAuthority` default boolean
- optional `repeatIntervalText` for S8 realism

#### Script record additions
Add to new queue/history records:
- `scriptDate`
- `scriptType` (base code `N|P|R|D|T`)
- `isOwing`
- `isAuthority`
- `authorityNumber`
- `price`
- `brandSubstitutionNotPermitted`
- `scriptStatus` (`pending`, `hold`, `deferred`, `cancelled`, etc.)
- `pharmacistInitialsEnteredAtQueue` if field 10 is captured before final check
- `originalScriptSerial` (training serial for claim strip / facsimile display)
- optional `repeatInterval`
- optional `s8QuantityWords`

### Important current data gaps to call out explicitly in the plan
- **Patient concession type is missing today**.
- **Prescriber practice address/phone/qualifications are missing today**.
- **Drug schedule/S8 flag is missing today**.
- **Script date is missing as a discrete field**; only `createdAt` exists.
- **Script type / authority / owing / price fields are missing today**.
- **Brand substitution checkbox state is missing today**.
- **Authority number is missing today**.
- **The current model only stores one item per script record**; that is acceptable for v1 facsimile rendering, but the HTML should be structured to support up to 3 item slots later.

## PBS facsimile rendering structure
Create a dedicated renderer, e.g. `renderOriginalScriptFacsimile(script)`.

### Required document treatment
- Must be prominently labeled as training material, not a live prescription.
- Add fixed disclaimer text in the rendered document header and print footer:
  - `TRAINING FACSIMILE — NOT A VALID PRESCRIPTION`
  - `Original PracticeRx training simulation document. Not for clinical or legal use.`

### HTML structure recommendation
Use a layout like:
- `.pbs-script-sheet`
  - `.pbs-script-sheet__training-banner`
  - `.pbs-script-sheet__paper`
    - `.pbs-script-sheet__claim-strip`
    - `.pbs-script-sheet__main`
      - `.pbs-script-sheet__prescriber`
      - `.pbs-script-sheet__patient`
      - `.pbs-script-sheet__items`
        - one to three `.pbs-script-item`
      - `.pbs-script-sheet__authority`
      - `.pbs-script-sheet__signature`
    - `.pbs-script-sheet__footer-note`
  - `.document-actions`

### Required content blocks
1. **Top prescriber block**
   - prescriber name
   - qualifications
   - clinic/practice name
   - practice address
   - practice phone
   - prescriber/provider number
2. **Patient block**
   - patient name
   - patient address
   - Medicare number
   - concession type
3. **Item body**
   - support 3 visual item slots even if only slot 1 is populated in v1
   - for populated slot include:
     - brand substitution not permitted checkbox
     - drug name + strength + form
     - directions
     - quantity
     - repeats
     - script type badge or notation
4. **Authority block**
   - authority required yes/no
   - authority number when present
5. **Signature/date block**
   - script date
   - prescriber signature line (rendered as blank line or stylised placeholder, not forged signature)
6. **Claim-sticker left margin**
   - clearly boxed strip with fields such as `Serial`, `Amount`, `No.`
   - optional `PracticeRx pharmacy training stamp area`

## CSS approach for the green-paper look
Add a dedicated visual system separate from the label card.

### Suggested new class set
- `.pbs-script-sheet`
- `.pbs-script-sheet__paper`
- `.pbs-script-sheet__training-banner`
- `.pbs-script-sheet__claim-strip`
- `.pbs-script-sheet__main`
- `.pbs-script-sheet__prescriber`
- `.pbs-script-sheet__patient`
- `.pbs-script-sheet__items`
- `.pbs-script-item`
- `.pbs-script-item__checkbox`
- `.pbs-script-sheet__authority`
- `.pbs-script-sheet__signature`
- `.pbs-script-sheet__footer-note`
- `.pbs-script-sheet--s8`

### Visual treatment
- Use a muted PBS-style green paper tone, e.g. a soft grey-green, not a vendor-branded colour.
- Add light form-rule borders and box outlines to suggest government stationery.
- Use dense typography with clear label/value groupings.
- Keep it obviously document-like, not app-panel-like.
- Avoid handwriting mimicry, logo mimicry, or photorealistic security-paper imitation.

## S8 rendering nuance plan
If a drug has `schedule: 'S8'`, render extra detail in the facsimile:
- quantity in numerals **and words**
- repeat interval text
- explicit note that only one S8 drug is shown on the form

### Scope decision on S8 data
- If implementation time is tight, add `schedule` now but seed only 1–2 demo S8 medicines for realistic rendering coverage.
- If the implementation agent avoids adding new S8 seed items, document this as a known data gap and keep the S8 renderer conditional but dormant until data exists.

## Print styling plan
Keep label printing and original-script printing as separate document modes.

### Printing strategy
- Preserve the current modal-print approach, but extend it so the active document renderer determines printed output.
- When printing the PBS facsimile:
  - hide desktop shell/nav/status/toasts/disclaimer as current print CSS already does
  - print only the PBS document content
  - set the green paper background and borders in print-safe CSS as much as browsers allow
  - add `print-color-adjust: exact` / `-webkit-print-color-adjust: exact` on the facsimile paper block
- Ensure the label print styles remain intact and unaffected.

### Dedicated print classes
Add print-specific hooks such as:
- `.document-preview--pbs-script`
- `.document-preview--label`
- `.pbs-script-sheet { page-break-after: always; }` only if future multi-document print becomes possible

---

## 4. Explicit scope boundaries / non-goals

The redesign must **not** do any of the following:
- Do **not** use Fred’s name anywhere in the UI copy, source comments, or visible product text.
- Do **not** use Fred’s logo, trademarks, exact brand colours, exact toolbar naming, or any vendor asset.
- Do **not** copy a Fred screen pixel-for-pixel.
- Do **not** reproduce a proprietary modern multi-pane commercial UI; only borrow general structural/workflow conventions.
- Do **not** remove or weaken the existing PracticeRx training disclaimer banner.
- Do **not** remove PracticeRx branding; the app remains `PracticeRx Dispense Trainer`.
- Do **not** present the green script as a real legal prescription.
- Do **not** render a fake prescriber signature; keep signature area clearly placeholder/training-only.
- Do **not** add uploading/scanning/OCR of real prescriptions.
- Do **not** turn the app into a commercial workflow clone or real dispensing system.
- Do **not** introduce a build step, framework migration, or backend; keep vanilla HTML/CSS/JS with localStorage.
- Do **not** broaden scope into full repeat-form printing, real claims processing, eRx, barcode logic, or regulatory compliance simulation beyond lightweight visual/training cues.

---

## 5. File-by-file change list

## `index.html`
- Keep overall desktop shell intact.
- Update modal structure so it can host **two document types** instead of only the label preview.
- If minimizing churn, keep current modal IDs but add a more generic title/content treatment.
- Add any hidden template containers only if necessary; otherwise continue rendering modal content from JS.
- No nav restructure required beyond possible copy change from “New Script” to “New Script / Dispense” if desired.

## `styles.css`
Add/modify styles for:
- new single-column dispense screen:
  - `.dispense-screen`
  - `.dispense-screen__row`
  - `.dispense-screen__step-number`
  - `.dispense-screen__field`
  - `.dispense-screen__alerts`
  - `.dispense-screen__history-drawer`
  - `.dispense-screen__footerbar`
- new wait screen:
  - `.dispense-wait-screen`
  - `.dispense-wait-screen__summary`
  - `.dispense-wait-screen__actions`
- new document preview mode:
  - `.document-preview--pbs-script`
  - `.pbs-script-sheet*` class family
- updated print CSS:
  - preserve current label-print behaviour
  - add facsimile-specific print handling
  - ensure existing status-bar responsive fix is not regressed
- likely reduce or retire reliance on `.form-split` and `.summary-panel` within the New Script view only

## `app.js`
Changes needed in several areas:
- expand UI state:
  - add dispense-flow substate (`entry` / `wait`)
  - add last-queued-script tracking
  - add patient-history drawer state
  - add document-preview mode (`label` vs `original-script`)
- replace `renderNewScriptView()` with:
  - `renderDispenseEntryView()`
  - `renderDispenseWaitView()`
  - wrapper dispatcher inside New Script route
- update draft model and validation to include:
  - script date
  - script type
  - owing flag
  - authority flag/number
  - price
  - pharmacist initials
  - brand substitution checkbox
- update submit flow so successful queueing enters Wait Screen instead of only showing a success banner/reset draft
- add edit/reopen logic for queued scripts from Wait Screen
- add original-script renderer and modal/document-preview switching
- add actions/selectors:
  - `[data-view-original-script]`
  - wait-screen action selectors
  - possible history drawer toggle selectors
- extend keyboard handler with the reconciled shortcut map above while preserving existing `Alt+1..6`, `F6`, and `F12` behaviour
- update Final Check and History renderers to surface the new action and metadata

## `data.js`
- bump the seed/state version or add a migration path for localStorage compatibility
- enrich seed data with:
  - patient `concessionType`
  - prescriber `qualifications`, `practiceAddress`, `practicePhone`
  - drug `schedule`, `defaultQuantity`/`pbsMaxQuantity`, optional authority/substitution defaults
- extend queue/history seed record shape with new script metadata where appropriate
- optionally add 1–2 S8 demo drug records or mark an existing one as S8 so the facsimile has at least one realistic edge-case example

---

## 6. Risk / regression list for implementation and review

The implementation and review agents must explicitly re-verify the following:

### Existing layout / styling regressions
- **status bar flex behaviour** in desktop and responsive layouts
  - `@media (max-width: 1024px)` wrapping must still work
- title bar metrics and quick-launch ribbon alignment
- disclaimer banner remains visible in normal app mode
- dense table/grid styling still works in Dashboard, Drug Lookup, Final Check, History

### Existing New Script selectors / test hooks at risk
If automated/manual tests already depend on these selectors, preserve them or update tests deliberately:
- `#new-script-form`
- `[data-select-patient]`
- `[data-select-drug]`
- `[data-sig-shortcut]`
- `#script-patient-search`
- `#script-drug-search`
- `#script-prescriber`
- `#script-quantity`
- `#script-repeats`
- `#script-directions`

### Existing modal / preview hooks at risk
- `#label-modal`
- `#label-modal-content`
- `[data-preview-label]`
- `[data-print-label]`
- `Esc` modal-close behaviour
- current `@media print` flow for label printing

### Existing keyboard shortcuts at risk
Must explicitly test that these still behave correctly after contextual remapping:
- `Alt+1`…`Alt+6`
- `F2`
- `F3`
- `F4`
- `F6`
- `F12`
- `Esc`

### Existing clinical/training banners at risk
- New Script **allergy alert** banner when selected patient has allergies
- Final Check allergy reminder banner
- low-stock warning banner on drug selection / supply checks

### Existing data / workflow regressions
- queue counts in:
  - `#header-pending-count`
  - `#status-pending-count`
- today dispensed count in `#header-dispensed-count`
- dispense-number generation still unique and correctly displayed
- queue → final check → history transition still works
- stock deduction on final dispense still works
- audit trail entries still write to localStorage and render in Dashboard/History
- reset-demo-data flow still reseeds valid expanded data

### Existing render-function regressions
- Dashboard queue sorting and actions
- Patient Search register and history sorting
- Drug Lookup search and alternative toggle
- Final Check checklist, initials, and disabled-button logic
- History filters (`#history-search`, `#history-from`, `#history-to`)

### New feature-specific regressions to verify
- original-script view opens correctly from Dashboard, Final Check, History, and Wait Screen
- label preview still opens independently from original-script preview
- print output prints the correct document type only
- training-facsimile disclaimers remain visible onscreen and in print
- document preview works for both queued and historical scripts
- data migration does not silently discard old localStorage state

---

## Recommended implementation order
1. Expand `data.js` seed/model shape and localStorage migration.
2. Refactor `app.js` New Script route into dispense entry + wait substates.
3. Implement linear numbered field layout and contextual keyboard handling.
4. Add original-script renderer and document-preview mode.
5. Add original-script actions to Dashboard, Final Check, History, and Wait Screen.
6. Extend print CSS for facsimile mode.
7. Re-verify all existing selectors, shortcuts, label printing, queue/history transitions, and responsive shell behaviour.
