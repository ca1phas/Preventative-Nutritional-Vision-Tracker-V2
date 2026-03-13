import './style.css';

const HISTORY_STORAGE_KEY = 'userMealHistory';
const DEFAULT_MEAL_IMAGE = '/images/hero-background.jpg';

// Central config for backend integration.
// Update API_BASE_URL / endpoints / transformBackendRecord when backend is ready.
const HISTORY_CONFIG = {
  API_BASE_URL: '',
  ENDPOINTS: {
    listByUser: (userID) => `/api/history?userId=${encodeURIComponent(userID)}`,
    listByUserAndDate: (userID, dateKey) =>
      `/api/history?userId=${encodeURIComponent(userID)}&date=${encodeURIComponent(dateKey)}`,
  },
  REQUEST_TIMEOUT_MS: 12000,
};

checkUserAuth();

const currentUser = sessionStorage.getItem('userID') || 'DEMO_USER';
const historyUserDisplay = document.getElementById('historyUserDisplay');
const historyDateFilter = document.getElementById('historyDateFilter');
const historyDateClear  = document.getElementById('historyDateClear');
const historyCards = document.getElementById('historyCards');
const historyEmptyState = document.getElementById('historyEmptyState');
const logoutBtn = document.getElementById('logoutBtn');

historyUserDisplay.textContent = `User: ${currentUser}`;

const demoHistoryData = [
  {
    userID: currentUser,
    datetime: '2026-03-07T20:00:00',
    image: { dataUrl: DEFAULT_MEAL_IMAGE },
    status: 'intervention',
  },
  {
    userID: currentUser,
    datetime: '2026-03-08T13:00:00',
    image: { dataUrl: DEFAULT_MEAL_IMAGE },
    status: 'healthy',
  },
  {
    userID: currentUser,
    datetime: '2026-03-08T19:15:00',
    image: { dataUrl: DEFAULT_MEAL_IMAGE },
    status: 'warning',
  },
  
];

initializeHistoryPage();

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('isUserAuthenticated');
  sessionStorage.removeItem('userID');
  window.location.href = 'index.html';
});

// ── Modal wiring ──────────────────────────────────────────
const mealModal       = document.getElementById('mealModal');
const mealModalClose  = document.getElementById('mealModalClose');
const mealModalImage  = document.getElementById('mealModalImage');
const mealModalDate   = document.getElementById('mealModalDate');
const mealModalTime   = document.getElementById('mealModalTime');
const mealModalStatus = document.getElementById('mealModalStatus');

function openMealModal(record) {
  const imageSrc = record.image?.dataUrl || record.image?.url || DEFAULT_MEAL_IMAGE;
  const dateKey  = toDateKey(record.datetime);

  mealModalImage.src           = imageSrc;
  mealModalDate.textContent    = formatDateLabel(dateKey);
  mealModalTime.textContent    = formatTime24(record.datetime);
  mealModalStatus.textContent  = statusLabel(record.status);
  mealModalStatus.className    = `history-status-btn status-${record.status}`;

  mealModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeMealModal() {
  mealModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  mealModalImage.src = '';
}

mealModalClose.addEventListener('click', closeMealModal);

// Close when clicking the backdrop
mealModal.addEventListener('click', (e) => {
  if (e.target === mealModal) closeMealModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !mealModal.classList.contains('hidden')) closeMealModal();
});

async function initializeHistoryPage() {
  const historyRecords = await getUserHistory(currentUser);
  const sortedRecords = sortByDateAscending(historyRecords);

  renderHistoryCards(sortedRecords, '');

  historyDateFilter.addEventListener('change', () => {
    renderHistoryCards(sortedRecords, historyDateFilter.value);
  });

  historyDateClear.addEventListener('click', () => {
    historyDateFilter.value = '';
    renderHistoryCards(sortedRecords, '');
  });
}

async function getUserHistory(userID) {
  const backendRecords = await fetchHistoryFromBackend(userID);
  if (backendRecords.length > 0) {
    return backendRecords;
  }

  // Fallback mode keeps page usable before backend integration completes.
  const merged = [];

  const storedList = readStoredHistoryList();
  merged.push(...storedList.filter((record) => record.userID === userID));

  const sessionRecord = JSON.parse(
    sessionStorage.getItem('lastSubmittedRecord') || 'null',
  );

  if (sessionRecord && (sessionRecord.userID || userID) === userID) {
    merged.push({
      userID,
      datetime: sessionRecord.datetime || new Date().toISOString(),
      image: sessionRecord.image || { dataUrl: '/images/hero-background.jpg' },
      status: deriveStatus(sessionRecord),
    });
  }

  if (merged.length === 0) {
    return demoHistoryData;
  }

  return merged.map(normalizeRecord).filter((record) => !!record.datetime);
}

async function fetchHistoryFromBackend(userID) {
  const url = `${HISTORY_CONFIG.API_BASE_URL}${HISTORY_CONFIG.ENDPOINTS.listByUser(userID)}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('History API returned non-OK response:', response.status);
      return [];
    }

    const payload = await response.json();
    const records = extractBackendList(payload);

    return records.map(transformBackendRecord).map(normalizeRecord);
  } catch (error) {
    console.warn('History API is unavailable, using fallback data:', error);
    return [];
  }
}

function extractBackendList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  return [];
}

function transformBackendRecord(record) {
  // Map backend fields to UI model here.
  // Expected normalized output: { userID, datetime, image: { dataUrl|url }, status }
  return {
    userID: record?.userID || record?.user_id || currentUser,
    datetime:
      record?.datetime || record?.createdAt || record?.created_at || record?.date,
    image: {
      dataUrl: record?.imageDataUrl || record?.image_data_url,
      url: record?.imageUrl || record?.image_url,
    },
    status: (record?.status || '').toLowerCase() || deriveStatus(record),
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, HISTORY_CONFIG.REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function readStoredHistoryList() {
  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecord);
  } catch (error) {
    console.error('Unable to parse stored history list:', error);
    return [];
  }
}

function normalizeRecord(record) {
  const safeDate = record?.datetime || record?.date || null;
  return {
    userID: record?.userID || currentUser,
    datetime: safeDate,
    image: record?.image || { dataUrl: DEFAULT_MEAL_IMAGE },
    status: (record?.status || 'healthy').toLowerCase(),
  };
}

function sortByDateAscending(records) {
  return [...records].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );
}

function deriveStatus(record) {
  if (typeof record?.status === 'string') {
    return record.status.toLowerCase();
  }

  const nutrition = Array.isArray(record?.nutrition_data)
    ? record.nutrition_data
    : [];
  const totalCarbs = nutrition.reduce(
    (sum, item) => sum + Number(item?.total_carbs_g || 0),
    0,
  );

  if (totalCarbs > 150) return 'intervention';
  if (totalCarbs > 80) return 'warning';
  return 'healthy';
}

function renderHistoryCards(records, selectedDateKey) {
  historyCards.innerHTML = '';
  historyEmptyState.classList.add('hidden');

  const filtered = selectedDateKey
    ? records.filter((record) => toDateKey(record.datetime) === selectedDateKey)
    : records;

  if (filtered.length === 0) {
    historyEmptyState.classList.remove('hidden');
    return;
  }

  if (selectedDateKey) {
    // Single date: flat card grid, no grouping header needed
    const grid = document.createElement('div');
    grid.className = 'history-cards-grid';
    filtered.forEach((record) => grid.appendChild(buildCard(record)));
    historyCards.appendChild(grid);
  } else {
    // All dates: group by date, sorted oldest → newest
    const groups = groupByDate(filtered);
    const dateKeys = Object.keys(groups);

    dateKeys.forEach((dateKey, index) => {
      const section = document.createElement('div');
      section.className = 'history-date-group';

      const heading = document.createElement('h3');
      heading.className = 'history-date-heading';
      heading.innerHTML = `<i class="fas fa-calendar-day"></i> ${formatDateLabel(dateKey)}`;
      section.appendChild(heading);

      const grid = document.createElement('div');
      grid.className = 'history-cards-grid';
      groups[dateKey].forEach((record) => grid.appendChild(buildCard(record)));
      section.appendChild(grid);

      historyCards.appendChild(section);

      // Light-grey separator between groups (not after the last one)
      if (index < dateKeys.length - 1) {
        const sep = document.createElement('hr');
        sep.className = 'history-date-separator';
        historyCards.appendChild(sep);
      }
    });
  }
}

function groupByDate(records) {
  const groups = {};
  records.forEach((record) => {
    const key = toDateKey(record.datetime);
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  });
  return groups;
}

function buildCard(record) {
  const card = document.createElement('article');
  card.className = 'history-meal-card';

  const imageSrc = record.image?.dataUrl || record.image?.url || DEFAULT_MEAL_IMAGE;
  const dateKey = toDateKey(record.datetime);

  card.innerHTML = `
    <div class="history-card-image-wrap">
      <img src="${imageSrc}" alt="Meal image on ${formatDateDDMMYY(dateKey)}" class="history-card-image" />
      <div class="history-card-overlay"><i class="fas fa-expand-alt"></i></div>
    </div>
    <div class="history-card-content">
      <div class="history-meta-row">
        <p class="history-meta-item"><i class="fas fa-calendar"></i> ${formatDateDDMMYY(dateKey)}</p>
        <p class="history-meta-item"><i class="fas fa-clock"></i> ${formatTime24(record.datetime)}</p>
      </div>
      <button class="history-status-btn status-${record.status}" type="button">
        ${statusLabel(record.status)}
      </button>
    </div>
  `;

  card.addEventListener('click', () => openMealModal(record));

  return card;
}

function formatDateLabel(dateKey) {
  if (!dateKey) return '-';
  const date = new Date(dateKey + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toDateKey(datetimeString) {
  const date = new Date(datetimeString);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDDMMYY(dateKey) {
  if (!dateKey) return '-';
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year.slice(-2)}`;
}

function formatTime24(datetimeString) {
  const date = new Date(datetimeString);
  if (Number.isNaN(date.getTime())) return '-';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function statusLabel(status) {
  if (status === 'healthy') return 'Healthy';
  if (status === 'warning') return 'Warning';
  if (status === 'intervention') return 'Intervention';
  return 'Unknown';
}

function checkUserAuth() {
  const isAuthenticated = sessionStorage.getItem('isUserAuthenticated') === 'true';
  if (!isAuthenticated) {
    window.location.href = 'index.html';
  }
}
