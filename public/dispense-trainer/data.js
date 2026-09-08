(function () {
  const STORAGE_KEY = 'practicerx_state_v1';
  const VERSION = 2;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function randomPart(length) {
    return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${randomPart(4)}`;
  }

  function createDispenseNumber(totalRecords) {
    const numericSeed = String(totalRecords + 1).padStart(4, '0');
    const now = new Date();
    const year = String(now.getFullYear()).slice(2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateSeed = `${year}${month}${day}`;
    return `PRX-${dateSeed}-${numericSeed}`;
  }

  function createAuditEntry(action, detail, relatedId) {
    return {
      id: generateId('audit'),
      action,
      detail,
      relatedId: relatedId || '',
      timestamp: new Date().toISOString(),
    };
  }

  function toDateStamp(dateLike) {
    const date = new Date(dateLike || new Date());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function toCurrencyNumber(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.round(numeric * 100) / 100;
  }

  function numberToWords(value) {
    const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      return '';
    }
    if (number < 10) {
      return ones[number];
    }
    if (number < 20) {
      return teens[number - 10];
    }
    if (number < 100) {
      const wholeTens = Math.floor(number / 10);
      const remainder = number % 10;
      return remainder ? `${tens[wholeTens]}-${ones[remainder]}` : tens[wholeTens];
    }
    if (number < 1000) {
      const hundreds = Math.floor(number / 100);
      const remainder = number % 100;
      return remainder ? `${ones[hundreds]} hundred ${numberToWords(remainder)}` : `${ones[hundreds]} hundred`;
    }
    const thousands = Math.floor(number / 1000);
    const remainder = number % 1000;
    return remainder ? `${numberToWords(thousands)} thousand ${numberToWords(remainder)}` : `${numberToWords(thousands)} thousand`;
  }

  function calculateMockPrice(scriptType, concessionType, quantity) {
    const qty = Math.max(1, Number(quantity) || 1);
    const type = scriptType || 'N';
    const concession = (concessionType || 'General').toLowerCase();

    if (type === 'P') {
      return toCurrencyNumber(16.95 + qty * 0.22);
    }
    if (type === 'T') {
      return toCurrencyNumber(10.5 + qty * 0.12);
    }
    if (type === 'R') {
      return concession === 'dva' ? 0 : 7.7;
    }
    if (type === 'D') {
      return toCurrencyNumber(concession === 'general' ? 31.6 : 7.7);
    }
    return toCurrencyNumber(concession === 'general' ? 31.6 : 7.7);
  }

  function enrichPatient(patient, index) {
    const concessionMap = {
      'pat-001': 'General',
      'pat-002': 'Concession',
      'pat-003': 'General',
      'pat-004': 'Pensioner',
      'pat-005': 'General',
      'pat-006': 'Pensioner',
      'pat-007': 'General',
      'pat-008': 'General',
      'pat-009': 'Concession',
      'pat-010': 'General',
      'pat-011': 'Pensioner',
      'pat-012': 'General',
      'pat-013': 'General',
      'pat-014': 'DVA',
      'pat-015': 'General',
    };

    return {
      ...patient,
      concessionType: patient.concessionType || concessionMap[patient.id] || 'General',
      medicareReferenceNumber: patient.medicareReferenceNumber || String((index % 5) + 1),
      allergies: Array.isArray(patient.allergies) ? patient.allergies : [],
      medicationHistory: Array.isArray(patient.medicationHistory) ? patient.medicationHistory : [],
    };
  }

  function enrichPrescriber(prescriber) {
    const details = {
      'pre-001': { qualifications: 'MBBS, FRACGP', practiceAddress: '14 Wharf Street, Newcastle NSW 2300', practicePhone: '(02) 4920 1180' },
      'pre-002': { qualifications: 'MBBS', practiceAddress: '42 River Road, Orange NSW 2800', practicePhone: '(02) 6362 4410' },
      'pre-003': { qualifications: 'MBBS, Dip Child Health', practiceAddress: '8 Lakeside Drive, Parramatta NSW 2150', practicePhone: '(02) 9631 7720' },
      'pre-004': { qualifications: 'MBBS, FRANZCOG', practiceAddress: '120 King Street, Sydney NSW 2000', practicePhone: '(02) 8210 4550' },
      'pre-005': { qualifications: 'MBBS, FRACP', practiceAddress: '77 Summit Crescent, Wollongong NSW 2500', practicePhone: '(02) 4236 1188' },
      'pre-006': { qualifications: 'MBBS', practiceAddress: '3 Civic Plaza, Adelaide SA 5000', practicePhone: '(08) 7134 9900' },
      'pre-007': { qualifications: 'MBBS, FACRRM', practiceAddress: '11 Northside Parade, Lismore NSW 2480', practicePhone: '(02) 6621 8044' },
      'pre-008': { qualifications: 'MBBS', practiceAddress: '6 Greenway Avenue, Bendigo VIC 3550', practicePhone: '(03) 5442 3381' },
      'pre-009': { qualifications: 'MBBS, FRACGP', practiceAddress: '24 Ocean View Road, Fremantle WA 6160', practicePhone: '(08) 9336 4112' },
      'pre-010': { qualifications: 'MBBS', practiceAddress: '51 Elm Street, Cairns QLD 4870', practicePhone: '(07) 4052 7001' },
    };
    const detail = details[prescriber.id] || {};
    return {
      ...prescriber,
      qualifications: prescriber.qualifications || detail.qualifications || 'MBBS',
      practiceAddress: prescriber.practiceAddress || detail.practiceAddress || prescriber.clinic,
      practicePhone: prescriber.practicePhone || detail.practicePhone || '(02) 0000 0000',
      prescriberNumber: prescriber.prescriberNumber || prescriber.providerNumber || '',
    };
  }

  function enrichDrug(drug) {
    const defaults = {
      'drug-001': { schedule: 'Unscheduled', defaultQuantity: 20, defaultRepeats: 0, pbsMaxQuantity: 20 },
      'drug-002': { schedule: 'Unscheduled', defaultQuantity: 24, defaultRepeats: 0, pbsMaxQuantity: 24 },
      'drug-003': { schedule: 'Unscheduled', defaultQuantity: 96, defaultRepeats: 0, pbsMaxQuantity: 96 },
      'drug-004': { schedule: 'S3', defaultQuantity: 24, defaultRepeats: 0, pbsMaxQuantity: 24 },
      'drug-005': { schedule: 'S3', defaultQuantity: 24, defaultRepeats: 0, pbsMaxQuantity: 24 },
      'drug-006': { schedule: 'S4', defaultQuantity: 21, defaultRepeats: 0, pbsMaxQuantity: 21 },
      'drug-007': { schedule: 'S4', defaultQuantity: 20, defaultRepeats: 0, pbsMaxQuantity: 20 },
      'drug-008': { schedule: 'S4', defaultQuantity: 60, defaultRepeats: 5, pbsMaxQuantity: 100 },
      'drug-009': { schedule: 'S4', defaultQuantity: 60, defaultRepeats: 5, pbsMaxQuantity: 60 },
      'drug-010': { schedule: 'S4', defaultQuantity: 30, defaultRepeats: 5, pbsMaxQuantity: 30 },
      'drug-011': { schedule: 'S4', defaultQuantity: 30, defaultRepeats: 5, pbsMaxQuantity: 30 },
      'drug-012': { schedule: 'S4', defaultQuantity: 30, defaultRepeats: 5, pbsMaxQuantity: 30 },
      'drug-013': { schedule: 'S4', defaultQuantity: 30, defaultRepeats: 5, pbsMaxQuantity: 30 },
      'drug-014': { schedule: 'S4', defaultQuantity: 30, defaultRepeats: 5, pbsMaxQuantity: 30 },
      'drug-015': { schedule: 'S4', defaultQuantity: 30, defaultRepeats: 5, pbsMaxQuantity: 30 },
      'drug-016': { schedule: 'S4', defaultQuantity: 28, defaultRepeats: 5, pbsMaxQuantity: 28 },
      'drug-017': { schedule: 'S3', defaultQuantity: 1, defaultRepeats: 1, pbsMaxQuantity: 1 },
      'drug-018': { schedule: 'S4', defaultQuantity: 1, defaultRepeats: 5, pbsMaxQuantity: 1 },
      'drug-019': { schedule: 'S4', defaultQuantity: 30, defaultRepeats: 5, pbsMaxQuantity: 30 },
      'drug-020': { schedule: 'S4', defaultQuantity: 28, defaultRepeats: 5, pbsMaxQuantity: 28 },
      'drug-021': { schedule: 'S4', defaultQuantity: 28, defaultRepeats: 5, pbsMaxQuantity: 28 },
      'drug-022': { schedule: 'S4', defaultQuantity: 14, defaultRepeats: 0, pbsMaxQuantity: 14 },
      'drug-023': { schedule: 'S4', defaultQuantity: 14, defaultRepeats: 0, pbsMaxQuantity: 14 },
      'drug-024': { schedule: 'S2', defaultQuantity: 30, defaultRepeats: 0, pbsMaxQuantity: 30 },
      'drug-025': { schedule: 'S3', defaultQuantity: 1, defaultRepeats: 1, pbsMaxQuantity: 1 },
      'drug-026': { schedule: 'S4', defaultQuantity: 1, defaultRepeats: 2, pbsMaxQuantity: 1 },
      'drug-027': { schedule: 'S3', defaultQuantity: 1, defaultRepeats: 1, pbsMaxQuantity: 1 },
      'drug-028': { schedule: 'S2', defaultQuantity: 1, defaultRepeats: 0, pbsMaxQuantity: 1 },
      'drug-029': { schedule: 'S4', defaultQuantity: 6, defaultRepeats: 0, pbsMaxQuantity: 6 },
      'drug-030': { schedule: 'S4', defaultQuantity: 60, defaultRepeats: 5, pbsMaxQuantity: 60 },
      'drug-031': {
        schedule: 'S8',
        defaultQuantity: 20,
        defaultRepeats: 0,
        pbsMaxQuantity: 20,
        brandSubstitutionAllowed: false,
        requiresAuthority: true,
        repeatIntervalText: 'Repeat not valid before 20 days from issue date.',
      },
    };

    const detail = defaults[drug.id] || { schedule: 'S4', defaultQuantity: 30, defaultRepeats: 0, pbsMaxQuantity: 30 };
    return {
      ...drug,
      schedule: drug.schedule || detail.schedule,
      defaultQuantity: Number.isFinite(Number(drug.defaultQuantity)) ? Number(drug.defaultQuantity) : detail.defaultQuantity,
      pbsMaxQuantity: Number.isFinite(Number(drug.pbsMaxQuantity)) ? Number(drug.pbsMaxQuantity) : detail.pbsMaxQuantity,
      defaultRepeats: Number.isFinite(Number(drug.defaultRepeats)) ? Number(drug.defaultRepeats) : detail.defaultRepeats,
      brandSubstitutionAllowed: typeof drug.brandSubstitutionAllowed === 'boolean' ? drug.brandSubstitutionAllowed : detail.brandSubstitutionAllowed !== false,
      requiresAuthority: typeof drug.requiresAuthority === 'boolean' ? drug.requiresAuthority : Boolean(detail.requiresAuthority),
      repeatIntervalText: drug.repeatIntervalText || detail.repeatIntervalText || '',
    };
  }

  function enrichScriptRecord(script, context) {
    const scriptDate = script.scriptDate || toDateStamp(script.createdAt || new Date());
    const concessionType = script.concessionType || 'General';
    const quantity = Number.isFinite(Number(script.quantity)) ? Number(script.quantity) : 1;
    const repeats = Number.isFinite(Number(script.repeats)) ? Number(script.repeats) : 0;
    const scriptType = script.scriptType || 'N';
    const isAuthority = typeof script.isAuthority === 'boolean' ? script.isAuthority : Boolean(script.authorityNumber);
    const isOwing = typeof script.isOwing === 'boolean' ? script.isOwing : false;
    const statusDefault = context === 'history' ? 'dispensed' : 'pending';
    const originalScriptSerial = script.originalScriptSerial || `TRG-${String((script.dispenseNumber || script.id || '').replace(/[^A-Z0-9]/gi, '')).slice(-10) || randomPart(6)}`;
    const price = script.price !== undefined && script.price !== null && script.price !== ''
      ? toCurrencyNumber(script.price)
      : calculateMockPrice(scriptType, concessionType, quantity);

    return {
      ...script,
      quantity,
      repeats,
      scriptDate,
      scriptType,
      isOwing,
      isAuthority,
      authorityNumber: script.authorityNumber || '',
      price,
      brandSubstitutionNotPermitted: typeof script.brandSubstitutionNotPermitted === 'boolean' ? script.brandSubstitutionNotPermitted : false,
      scriptStatus: script.scriptStatus || statusDefault,
      pharmacistInitialsEnteredAtQueue: script.pharmacistInitialsEnteredAtQueue || script.pharmacistInitials || '',
      originalScriptSerial,
      repeatInterval: script.repeatInterval || '',
      s8QuantityWords: script.s8QuantityWords || '',
      concessionType,
    };
  }

  function enrichState(candidate) {
    const patients = (candidate.patients || []).map(enrichPatient);
    const patientById = new Map(patients.map((patient) => [patient.id, patient]));
    const prescribers = (candidate.prescribers || []).map(enrichPrescriber);
    const drugs = (candidate.drugs || []).map(enrichDrug);
    const drugById = new Map(drugs.map((drug) => [drug.id, drug]));

    const queue = (candidate.queue || []).map((script) => {
      const patient = patientById.get(script.patientId);
      const drug = drugById.get(script.drugId);
      const enriched = enrichScriptRecord(
        {
          ...script,
          concessionType: script.concessionType || (patient ? patient.concessionType : 'General'),
          brandSubstitutionNotPermitted:
            typeof script.brandSubstitutionNotPermitted === 'boolean'
              ? script.brandSubstitutionNotPermitted
              : drug
                ? !drug.brandSubstitutionAllowed
                : false,
          isAuthority:
            typeof script.isAuthority === 'boolean'
              ? script.isAuthority
              : drug
                ? Boolean(drug.requiresAuthority)
                : false,
          repeatInterval: script.repeatInterval || (drug ? drug.repeatIntervalText : ''),
          s8QuantityWords:
            script.s8QuantityWords || (drug && drug.schedule === 'S8' ? numberToWords(script.quantity) : ''),
        },
        'queue'
      );
      return enriched;
    });

    const history = (candidate.history || []).map((script) => {
      const patient = patientById.get(script.patientId);
      const drug = drugById.get(script.drugId);
      const enriched = enrichScriptRecord(
        {
          ...script,
          concessionType: script.concessionType || (patient ? patient.concessionType : 'General'),
          brandSubstitutionNotPermitted:
            typeof script.brandSubstitutionNotPermitted === 'boolean'
              ? script.brandSubstitutionNotPermitted
              : drug
                ? !drug.brandSubstitutionAllowed
                : false,
          isAuthority:
            typeof script.isAuthority === 'boolean'
              ? script.isAuthority
              : drug
                ? Boolean(drug.requiresAuthority)
                : false,
          repeatInterval: script.repeatInterval || (drug ? drug.repeatIntervalText : ''),
          s8QuantityWords:
            script.s8QuantityWords || (drug && drug.schedule === 'S8' ? numberToWords(script.quantity) : ''),
        },
        'history'
      );
      return {
        ...enriched,
        pharmacistInitials: script.pharmacistInitials || enriched.pharmacistInitialsEnteredAtQueue || '',
      };
    });

    return {
      version: VERSION,
      generatedAt: candidate.generatedAt || new Date().toISOString(),
      patients,
      prescribers,
      drugs,
      queue,
      history,
      auditTrail: Array.isArray(candidate.auditTrail) ? candidate.auditTrail : [],
    };
  }

  function createSeedState() {
    const patients = [
      {
        id: 'pat-001',
        name: 'Amelia Hart',
        dob: '1992-03-14',
        address: '14 Coral Avenue, Newcastle NSW 2300',
        phone: '0412 774 230',
        medicareNumber: '2418 59031 7',
        allergies: ['Penicillin'],
        medicationHistory: [
          { date: '2026-08-20', drug: 'Omecure 20 mg capsules', quantity: 30, directions: 'Take 1 capsule daily before breakfast.' },
          { date: '2026-07-03', drug: 'Calmofen 500 mg tablets', quantity: 20, directions: 'Take 1 tablet every 6 hours as needed for pain.' },
        ],
      },
      {
        id: 'pat-002',
        name: 'Noah Bennett',
        dob: '1985-11-02',
        address: '28 Wilga Street, Orange NSW 2800',
        phone: '0408 339 114',
        medicareNumber: '2874 63195 2',
        allergies: ['Nuts'],
        medicationHistory: [
          { date: '2026-08-11', drug: 'Airvia inhaler', quantity: 1, directions: 'Inhale 2 puffs every 4 hours as needed.' },
          { date: '2026-05-29', drug: 'Respiraid inhaler', quantity: 1, directions: 'Inhale 2 actuations twice daily.' },
        ],
      },
      {
        id: 'pat-003',
        name: 'Priya Desai',
        dob: '1979-06-18',
        address: '7 Lantern Close, Parramatta NSW 2150',
        phone: '0423 611 470',
        medicareNumber: '3196 44022 5',
        allergies: [],
        medicationHistory: [
          { date: '2026-08-23', drug: 'Glycomet 500 mg tablets', quantity: 60, directions: 'Take 1 tablet twice daily with meals.' },
          { date: '2026-08-23', drug: 'Lipicure 20 mg tablets', quantity: 30, directions: 'Take 1 tablet at night.' },
        ],
      },
      {
        id: 'pat-004',
        name: 'Lucas Romero',
        dob: '1968-01-09',
        address: '101 Riverbank Road, Mildura VIC 3500',
        phone: '0416 250 845',
        medicareNumber: '4067 88241 8',
        allergies: ['Sulfonamides'],
        medicationHistory: [
          { date: '2026-07-30', drug: 'Perinol 5 mg tablets', quantity: 30, directions: 'Take 1 tablet each morning.' },
          { date: '2026-07-30', drug: 'Rosuvera 10 mg tablets', quantity: 30, directions: 'Take 1 tablet at night.' },
        ],
      },
      {
        id: 'pat-005',
        name: 'Zoe Marshall',
        dob: '2001-09-26',
        address: '32 Parkview Terrace, Hobart TAS 7000',
        phone: '0431 290 551',
        medicareNumber: '5541 12039 9',
        allergies: ['Latex'],
        medicationHistory: [
          { date: '2026-08-01', drug: 'AllerEase 10 mg tablets', quantity: 30, directions: 'Take 1 tablet daily as needed.' },
          { date: '2026-06-14', drug: 'Dermicin cream', quantity: 1, directions: 'Apply twice daily to affected area.' },
        ],
      },
      {
        id: 'pat-006',
        name: 'Henry Collins',
        dob: '1956-12-30',
        address: '5 Brolga Crescent, Toowoomba QLD 4350',
        phone: '0419 710 264',
        medicareNumber: '6814 44017 3',
        allergies: [],
        medicationHistory: [
          { date: '2026-08-19', drug: 'Thyrel 100 mcg tablets', quantity: 30, directions: 'Take 1 tablet in the morning on an empty stomach.' },
          { date: '2026-07-12', drug: 'Amlorin 5 mg tablets', quantity: 30, directions: 'Take 1 tablet daily.' },
        ],
      },
      {
        id: 'pat-007',
        name: 'Mia Thompson',
        dob: '1998-04-08',
        address: '87 Bayleaf Drive, Wollongong NSW 2500',
        phone: '0405 882 619',
        medicareNumber: '7720 88415 1',
        allergies: ['Shellfish'],
        medicationHistory: [
          { date: '2026-08-22', drug: 'Serenaid 50 mg tablets', quantity: 28, directions: 'Take 1 tablet daily.' },
          { date: '2026-07-01', drug: 'Calmofen 500 mg tablets', quantity: 20, directions: 'Take 1 tablet every 6 hours as needed.' },
        ],
      },
      {
        id: 'pat-008',
        name: 'Oliver Hughes',
        dob: '1972-02-25',
        address: '210 Paperbark Lane, Bendigo VIC 3550',
        phone: '0447 690 223',
        medicareNumber: '8369 51028 6',
        allergies: [],
        medicationHistory: [
          { date: '2026-08-18', drug: 'Cardeva 5 mg tablets', quantity: 60, directions: 'Take 1 tablet twice daily.' },
          { date: '2026-08-18', drug: 'Perinol 5 mg tablets', quantity: 30, directions: 'Take 1 tablet daily.' },
        ],
      },
      {
        id: 'pat-009',
        name: 'Isla Nguyen',
        dob: '1990-10-11',
        address: '19 North Wharf, Fremantle WA 6160',
        phone: '0438 107 499',
        medicareNumber: '9027 73146 0',
        allergies: ['Trimethoprim'],
        medicationHistory: [
          { date: '2026-08-09', drug: 'Uroguard 100 mg capsules', quantity: 14, directions: 'Take 1 capsule twice daily with food.' },
          { date: '2026-04-27', drug: 'Painova liquid', quantity: 1, directions: 'Take 10 mL every 6 hours as needed.' },
        ],
      },
      {
        id: 'pat-010',
        name: 'Ethan Patel',
        dob: '1988-07-07',
        address: '61 Acacia Street, Geelong VIC 3220',
        phone: '0414 555 982',
        medicareNumber: '1183 56074 4',
        allergies: [],
        medicationHistory: [
          { date: '2026-08-24', drug: 'Omecure 20 mg capsules', quantity: 30, directions: 'Take 1 capsule daily.' },
          { date: '2026-08-24', drug: 'Amlorin 5 mg tablets', quantity: 30, directions: 'Take 1 tablet daily.' },
        ],
      },
      {
        id: 'pat-011',
        name: 'Charlotte Evans',
        dob: '1949-05-03',
        address: '9 Jacaranda Rise, Ballarat VIC 3350',
        phone: '0400 231 845',
        medicareNumber: '4456 21099 5',
        allergies: ['Codeine'],
        medicationHistory: [
          { date: '2026-08-02', drug: 'Glaucalm eye drops', quantity: 1, directions: 'Instil 1 drop in each eye at night.' },
          { date: '2026-06-18', drug: 'Thyrel 100 mcg tablets', quantity: 30, directions: 'Take 1 tablet each morning.' },
        ],
      },
      {
        id: 'pat-012',
        name: 'Jack Wilson',
        dob: '2004-01-20',
        address: '44 Seagrass Parade, Cairns QLD 4870',
        phone: '0449 003 761',
        medicareNumber: '6620 40418 7',
        allergies: [],
        medicationHistory: [
          { date: '2026-08-12', drug: 'Azmira 250 mg tablets', quantity: 6, directions: 'Take 2 tablets on day 1, then 1 tablet daily.' },
          { date: '2026-03-05', drug: 'IbuCore 200 mg tablets', quantity: 24, directions: 'Take 2 tablets with food as needed.' },
        ],
      },
      {
        id: 'pat-013',
        name: 'Grace Kim',
        dob: '1995-08-15',
        address: '73 High Street, Adelaide SA 5000',
        phone: '0418 927 604',
        medicareNumber: '5038 33927 1',
        allergies: ['Macrolides'],
        medicationHistory: [
          { date: '2026-08-14', drug: 'Escaline 10 mg tablets', quantity: 28, directions: 'Take 1 tablet daily.' },
          { date: '2026-08-14', drug: 'AllerEase 10 mg tablets', quantity: 30, directions: 'Take 1 tablet daily as needed.' },
        ],
      },
      {
        id: 'pat-014',
        name: 'Samuel O\'Connor',
        dob: '1962-09-01',
        address: '3 Lomandra Court, Albury NSW 2640',
        phone: '0427 142 330',
        medicareNumber: '7211 33048 8',
        allergies: [],
        medicationHistory: [
          { date: '2026-08-07', drug: 'Candeset 16 mg tablets', quantity: 30, directions: 'Take 1 tablet daily.' },
          { date: '2026-08-07', drug: 'Lipicure 20 mg tablets', quantity: 30, directions: 'Take 1 tablet at night.' },
        ],
      },
      {
        id: 'pat-015',
        name: 'Lily Anderson',
        dob: '2010-02-17',
        address: '12 Rainforest Way, Lismore NSW 2480',
        phone: '0430 887 291',
        medicareNumber: '6042 11755 6',
        allergies: ['Amoxicillin'],
        medicationHistory: [
          { date: '2026-07-28', drug: 'Painova oral liquid', quantity: 1, directions: 'Take 10 mL every 6 hours as needed.' },
          { date: '2026-04-12', drug: 'AllerEase 10 mg tablets', quantity: 20, directions: 'Take 1 tablet daily as needed.' },
        ],
      },
    ].map(enrichPatient);

    const prescribers = [
      { id: 'pre-001', name: 'Dr Sofia Nguyen', providerNumber: 'PRX8011A', clinic: 'Harbour Family Clinic' },
      { id: 'pre-002', name: 'Dr Marcus Allen', providerNumber: 'PRX8012C', clinic: 'Riverbend Medical Centre' },
      { id: 'pre-003', name: 'Dr Kavita Rao', providerNumber: 'PRX8013F', clinic: 'Lakeside General Practice' },
      { id: 'pre-004', name: 'Dr Helen Morris', providerNumber: 'PRX8014H', clinic: 'Central Women\'s Health' },
      { id: 'pre-005', name: 'Dr Thomas Reid', providerNumber: 'PRX8015J', clinic: 'Summit Respiratory Clinic' },
      { id: 'pre-006', name: 'Dr Aisha Farouk', providerNumber: 'PRX8016M', clinic: 'Civic Health Hub' },
      { id: 'pre-007', name: 'Dr Daniel Chen', providerNumber: 'PRX8017P', clinic: 'Northside Urgent Care' },
      { id: 'pre-008', name: 'Dr Emily Porter', providerNumber: 'PRX8018R', clinic: 'Greenway Family Practice' },
      { id: 'pre-009', name: 'Dr Julian Costa', providerNumber: 'PRX8019T', clinic: 'Seabreeze Medical Rooms' },
      { id: 'pre-010', name: 'Dr Mia Gallagher', providerNumber: 'PRX8020W', clinic: 'Elm Street Clinic' },
    ].map(enrichPrescriber);

    const drugs = [
      { id: 'drug-001', brandName: 'Calmofen', genericName: 'Paracetamol', strength: '500 mg', form: 'Tablets', itemCode: 'PX1001', stockQuantity: 120, alternatives: ['drug-002', 'drug-028'] },
      { id: 'drug-002', brandName: 'Acetava', genericName: 'Paracetamol', strength: '500 mg', form: 'Caplets', itemCode: 'PX1002', stockQuantity: 42, alternatives: ['drug-001', 'drug-028'] },
      { id: 'drug-003', brandName: 'Thermalex', genericName: 'Paracetamol', strength: '665 mg', form: 'Modified-release tablets', itemCode: 'PX1003', stockQuantity: 18, alternatives: ['drug-001', 'drug-002'] },
      { id: 'drug-004', brandName: 'IbuCore', genericName: 'Ibuprofen', strength: '200 mg', form: 'Tablets', itemCode: 'PX1004', stockQuantity: 51, alternatives: ['drug-005', 'drug-001'] },
      { id: 'drug-005', brandName: 'IbuRelief', genericName: 'Ibuprofen', strength: '400 mg', form: 'Tablets', itemCode: 'PX1005', stockQuantity: 16, alternatives: ['drug-004', 'drug-001'] },
      { id: 'drug-006', brandName: 'Amoxera', genericName: 'Amoxicillin', strength: '500 mg', form: 'Capsules', itemCode: 'PX1006', stockQuantity: 28, alternatives: ['drug-007', 'drug-029'] },
      { id: 'drug-007', brandName: 'Ceforix', genericName: 'Cefalexin', strength: '500 mg', form: 'Capsules', itemCode: 'PX1007', stockQuantity: 14, alternatives: ['drug-006', 'drug-029'] },
      { id: 'drug-008', brandName: 'Glycomet', genericName: 'Metformin', strength: '500 mg', form: 'Tablets', itemCode: 'PX1008', stockQuantity: 85, alternatives: ['drug-009'] },
      { id: 'drug-009', brandName: 'Glycomet XR', genericName: 'Metformin', strength: '1 g', form: 'Modified-release tablets', itemCode: 'PX1009', stockQuantity: 34, alternatives: ['drug-008'] },
      { id: 'drug-010', brandName: 'Lipicure', genericName: 'Atorvastatin', strength: '20 mg', form: 'Tablets', itemCode: 'PX1010', stockQuantity: 63, alternatives: ['drug-011'] },
      { id: 'drug-011', brandName: 'Rosuvera', genericName: 'Rosuvastatin', strength: '10 mg', form: 'Tablets', itemCode: 'PX1011', stockQuantity: 22, alternatives: ['drug-010'] },
      { id: 'drug-012', brandName: 'Amlorin', genericName: 'Amlodipine', strength: '5 mg', form: 'Tablets', itemCode: 'PX1012', stockQuantity: 40, alternatives: ['drug-013', 'drug-014'] },
      { id: 'drug-013', brandName: 'Perinol', genericName: 'Perindopril', strength: '5 mg', form: 'Tablets', itemCode: 'PX1013', stockQuantity: 37, alternatives: ['drug-012', 'drug-014'] },
      { id: 'drug-014', brandName: 'Candeset', genericName: 'Candesartan', strength: '16 mg', form: 'Tablets', itemCode: 'PX1014', stockQuantity: 9, alternatives: ['drug-013', 'drug-012'] },
      { id: 'drug-015', brandName: 'Omecure', genericName: 'Omeprazole', strength: '20 mg', form: 'Capsules', itemCode: 'PX1015', stockQuantity: 55, alternatives: ['drug-016'] },
      { id: 'drug-016', brandName: 'Gastrovia', genericName: 'Pantoprazole', strength: '40 mg', form: 'Tablets', itemCode: 'PX1016', stockQuantity: 31, alternatives: ['drug-015'] },
      { id: 'drug-017', brandName: 'Airvia', genericName: 'Salbutamol', strength: '100 mcg', form: 'Metered-dose inhaler', itemCode: 'PX1017', stockQuantity: 12, alternatives: ['drug-018'] },
      { id: 'drug-018', brandName: 'Respiraid', genericName: 'Budesonide/Formoterol', strength: '200/6 mcg', form: 'Dry powder inhaler', itemCode: 'PX1018', stockQuantity: 11, alternatives: ['drug-017'] },
      { id: 'drug-019', brandName: 'Thyrel', genericName: 'Levothyroxine', strength: '100 mcg', form: 'Tablets', itemCode: 'PX1019', stockQuantity: 44, alternatives: [] },
      { id: 'drug-020', brandName: 'Serenaid', genericName: 'Sertraline', strength: '50 mg', form: 'Tablets', itemCode: 'PX1020', stockQuantity: 26, alternatives: ['drug-021'] },
      { id: 'drug-021', brandName: 'Escaline', genericName: 'Escitalopram', strength: '10 mg', form: 'Tablets', itemCode: 'PX1021', stockQuantity: 19, alternatives: ['drug-020'] },
      { id: 'drug-022', brandName: 'Doxira', genericName: 'Doxycycline', strength: '100 mg', form: 'Capsules', itemCode: 'PX1022', stockQuantity: 13, alternatives: ['drug-029'] },
      { id: 'drug-023', brandName: 'Uroguard', genericName: 'Nitrofurantoin', strength: '100 mg', form: 'Capsules', itemCode: 'PX1023', stockQuantity: 8, alternatives: ['drug-022', 'drug-029'] },
      { id: 'drug-024', brandName: 'AllerEase', genericName: 'Cetirizine', strength: '10 mg', form: 'Tablets', itemCode: 'PX1024', stockQuantity: 74, alternatives: ['drug-028'] },
      { id: 'drug-025', brandName: 'Dermasol', genericName: 'Hydrocortisone', strength: '1%', form: 'Cream', itemCode: 'PX1025', stockQuantity: 17, alternatives: ['drug-027'] },
      { id: 'drug-026', brandName: 'Glaucalm', genericName: 'Latanoprost', strength: '50 mcg/mL', form: 'Eye drops', itemCode: 'PX1026', stockQuantity: 7, alternatives: [] },
      { id: 'drug-027', brandName: 'Dermicin', genericName: 'Clotrimazole', strength: '1%', form: 'Cream', itemCode: 'PX1027', stockQuantity: 23, alternatives: ['drug-025'] },
      { id: 'drug-028', brandName: 'Painova', genericName: 'Paracetamol', strength: '250 mg/5 mL', form: 'Oral liquid', itemCode: 'PX1028', stockQuantity: 20, alternatives: ['drug-001', 'drug-002'] },
      { id: 'drug-029', brandName: 'Azmira', genericName: 'Azithromycin', strength: '250 mg', form: 'Tablets', itemCode: 'PX1029', stockQuantity: 10, alternatives: ['drug-006', 'drug-007', 'drug-022'] },
      { id: 'drug-030', brandName: 'Cardeva', genericName: 'Apixaban', strength: '5 mg', form: 'Tablets', itemCode: 'PX1030', stockQuantity: 15, alternatives: [] },
      { id: 'drug-031', brandName: 'Oxyrel', genericName: 'Oxycodone', strength: '5 mg', form: 'Capsules', itemCode: 'PX1031', stockQuantity: 6, alternatives: [] },
    ].map(enrichDrug);

    const queue = [
      { id: 'scr-001', patientId: 'pat-001', prescriberId: 'pre-001', drugId: 'drug-015', quantity: 30, repeats: 1, directions: 'Take 1 capsule each morning 30 minutes before food.', createdAt: '2026-09-08T08:30:00.000Z', dispenseNumber: 'PRX-260908-0001', scriptType: 'N', price: 31.6 },
      { id: 'scr-002', patientId: 'pat-002', prescriberId: 'pre-005', drugId: 'drug-017', quantity: 1, repeats: 2, directions: 'Inhale 2 puffs every 4 hours as needed for wheeze.', createdAt: '2026-09-08T08:55:00.000Z', dispenseNumber: 'PRX-260908-0002', scriptType: 'P', price: 17.17 },
      { id: 'scr-003', patientId: 'pat-003', prescriberId: 'pre-003', drugId: 'drug-008', quantity: 60, repeats: 1, directions: 'Take 1 tablet with breakfast and 1 tablet with the evening meal.', createdAt: '2026-09-08T09:12:00.000Z', dispenseNumber: 'PRX-260908-0003', scriptType: 'N', price: 31.6 },
      { id: 'scr-004', patientId: 'pat-015', prescriberId: 'pre-007', drugId: 'drug-006', quantity: 21, repeats: 0, directions: 'Take 1 capsule three times daily until finished.', createdAt: '2026-09-08T09:24:00.000Z', dispenseNumber: 'PRX-260908-0004', scriptType: 'N', price: 31.6 },
      { id: 'scr-005', patientId: 'pat-006', prescriberId: 'pre-002', drugId: 'drug-014', quantity: 30, repeats: 5, directions: 'Take 1 tablet each morning.', createdAt: '2026-09-08T09:41:00.000Z', dispenseNumber: 'PRX-260908-0005', scriptType: 'R', price: 7.7 },
      { id: 'scr-006', patientId: 'pat-009', prescriberId: 'pre-006', drugId: 'drug-023', quantity: 14, repeats: 0, directions: 'Take 1 capsule four times daily with food and water.', createdAt: '2026-09-08T10:03:00.000Z', dispenseNumber: 'PRX-260908-0006', scriptType: 'N', isOwing: true, price: 7.7 },
      { id: 'scr-007', patientId: 'pat-011', prescriberId: 'pre-009', drugId: 'drug-030', quantity: 60, repeats: 3, directions: 'Take 1 tablet twice daily with food.', createdAt: '2026-09-08T10:17:00.000Z', dispenseNumber: 'PRX-260908-0007', scriptType: 'N', price: 7.7 },
      { id: 'scr-008', patientId: 'pat-004', prescriberId: 'pre-004', drugId: 'drug-020', quantity: 28, repeats: 2, directions: 'Take 1 tablet each morning with food.', createdAt: '2026-09-08T10:35:00.000Z', dispenseNumber: 'PRX-260908-0008', scriptType: 'N', price: 7.7 },
      { id: 'scr-009', patientId: 'pat-012', prescriberId: 'pre-010', drugId: 'drug-026', quantity: 1, repeats: 2, directions: 'Instil 1 drop into the affected eye each night.', createdAt: '2026-09-08T10:52:00.000Z', dispenseNumber: 'PRX-260908-0009', scriptType: 'P', price: 17.17 },
      { id: 'scr-010', patientId: 'pat-008', prescriberId: 'pre-008', drugId: 'drug-018', quantity: 1, repeats: 1, directions: 'Inhale 1 actuation twice daily.', createdAt: '2026-09-08T11:08:00.000Z', dispenseNumber: 'PRX-260908-0010', scriptType: 'N', price: 31.6 },
      { id: 'scr-011', patientId: 'pat-014', prescriberId: 'pre-002', drugId: 'drug-031', quantity: 20, repeats: 0, directions: 'Take 1 capsule every 6 hours as needed for severe pain.', createdAt: '2026-09-08T11:24:00.000Z', dispenseNumber: 'PRX-260908-0011', scriptType: 'N', isAuthority: true, authorityNumber: 'A7654321', brandSubstitutionNotPermitted: true, price: 0 },
    ];

    const history = [
      { id: 'hist-001', patientId: 'pat-002', prescriberId: 'pre-005', drugId: 'drug-017', quantity: 1, repeats: 2, directions: 'Inhale 2 puffs every 4 hours as needed for wheeze.', createdAt: '2026-09-01T08:10:00.000Z', dispenseNumber: 'PRX-260901-0001', pharmacistInitials: 'JB', dispensedAt: '2026-09-01T08:22:00.000Z', scriptType: 'P', price: 17.17 },
      { id: 'hist-002', patientId: 'pat-005', prescriberId: 'pre-002', drugId: 'drug-010', quantity: 90, repeats: 5, directions: 'Take 1 tablet each evening.', createdAt: '2026-09-02T09:45:00.000Z', dispenseNumber: 'PRX-260902-0002', pharmacistInitials: 'MK', dispensedAt: '2026-09-02T09:58:00.000Z', scriptType: 'N', price: 31.6 },
      { id: 'hist-003', patientId: 'pat-007', prescriberId: 'pre-003', drugId: 'drug-004', quantity: 24, repeats: 0, directions: 'Take 1 tablet every 6 hours as needed for pain.', createdAt: '2026-09-03T13:05:00.000Z', dispenseNumber: 'PRX-260903-0003', pharmacistInitials: 'JB', dispensedAt: '2026-09-03T13:16:00.000Z', scriptType: 'T', price: 13.38 },
      { id: 'hist-004', patientId: 'pat-010', prescriberId: 'pre-006', drugId: 'drug-024', quantity: 30, repeats: 1, directions: 'Take 1 tablet daily as needed for allergy symptoms.', createdAt: '2026-09-04T10:30:00.000Z', dispenseNumber: 'PRX-260904-0004', pharmacistInitials: 'SR', dispensedAt: '2026-09-04T10:41:00.000Z', scriptType: 'P', price: 23.55 },
      { id: 'hist-005', patientId: 'pat-013', prescriberId: 'pre-001', drugId: 'drug-016', quantity: 28, repeats: 2, directions: 'Take 1 tablet each morning before food.', createdAt: '2026-09-05T09:12:00.000Z', dispenseNumber: 'PRX-260905-0005', pharmacistInitials: 'MK', dispensedAt: '2026-09-05T09:24:00.000Z', scriptType: 'N', price: 31.6 },
      { id: 'hist-006', patientId: 'pat-014', prescriberId: 'pre-004', drugId: 'drug-025', quantity: 1, repeats: 1, directions: 'Apply a thin layer to the affected area twice daily.', createdAt: '2026-09-06T14:47:00.000Z', dispenseNumber: 'PRX-260906-0006', pharmacistInitials: 'JB', dispensedAt: '2026-09-06T14:59:00.000Z', scriptType: 'T', price: 10.62 },
      { id: 'hist-007', patientId: 'pat-001', prescriberId: 'pre-001', drugId: 'drug-015', quantity: 30, repeats: 1, directions: 'Take 1 capsule each morning before food.', createdAt: '2026-09-06T21:05:00.000Z', dispenseNumber: 'PRX-260907-0007', pharmacistInitials: 'SR', dispensedAt: '2026-09-06T21:19:00.000Z', scriptType: 'N', price: 31.6 },
      { id: 'hist-008', patientId: 'pat-003', prescriberId: 'pre-003', drugId: 'drug-011', quantity: 30, repeats: 3, directions: 'Take 1 tablet each evening.', createdAt: '2026-09-06T22:22:00.000Z', dispenseNumber: 'PRX-260907-0008', pharmacistInitials: 'MK', dispensedAt: '2026-09-06T22:33:00.000Z', scriptType: 'N', price: 31.6 },
    ];

    const auditTrail = [
      {
        id: 'audit-seed-1',
        action: 'Seeded training data',
        detail: 'PracticeRx loaded fictional patients, prescribers, catalogue items, pending queue records, and dispense history records.',
        relatedId: '',
        timestamp: new Date().toISOString(),
      },
    ];

    return enrichState({
      version: VERSION,
      generatedAt: new Date().toISOString(),
      patients,
      prescribers,
      drugs,
      queue,
      history,
      auditTrail,
    });
  }

  function isValidStateShape(candidate) {
    return Boolean(
      candidate &&
        Array.isArray(candidate.patients) &&
        Array.isArray(candidate.prescribers) &&
        Array.isArray(candidate.drugs) &&
        Array.isArray(candidate.queue) &&
        Array.isArray(candidate.history) &&
        Array.isArray(candidate.auditTrail)
    );
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function migrateState(candidate) {
    if (!isValidStateShape(candidate)) {
      return createSeedState();
    }

    return enrichState(candidate);
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedState();
      saveState(seeded);
      return seeded;
    }

    try {
      const parsed = JSON.parse(raw);
      const migrated = migrateState(parsed);
      if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
        saveState(migrated);
      }
      return migrated;
    } catch (error) {
      const seeded = createSeedState();
      saveState(seeded);
      return seeded;
    }
  }

  function resetState() {
    const seeded = createSeedState();
    saveState(seeded);
    return seeded;
  }

  window.PracticeRxData = {
    STORAGE_KEY,
    VERSION,
    clone,
    loadState,
    saveState,
    resetState,
    createSeedState,
    createAuditEntry,
    createDispenseNumber,
    generateId,
    calculateMockPrice,
    numberToWords,
    toDateStamp,
    toCurrencyNumber,
  };
})();
