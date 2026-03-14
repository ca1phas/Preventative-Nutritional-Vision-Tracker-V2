import './style.css';
import { supabase } from './supabaseConnect.js';

function checkUserAuth() {
  if (sessionStorage.getItem('isUserAuthenticated') !== 'true') {
    window.location.href = 'index.html';
  }
}

checkUserAuth();

const DEFAULT_MEAL_IMAGE = '/images/hero-background.jpg';

const currentUser = sessionStorage.getItem('userID') || 'DEMO_USER';
const historyUserDisplay = document.getElementById('historyUserDisplay');
const historyDateFilter = document.getElementById('historyDateFilter');
const historyDateClear = document.getElementById('historyDateClear');
const historyCards = document.getElementById('historyCards');
const historyEmptyState = document.getElementById('historyEmptyState');
const logoutBtn = document.getElementById('logoutBtn');

let resolvedDbUserId = sessionStorage.getItem('supabaseUserId') || null;

historyUserDisplay.textContent = `User: ${currentUser}`;

initializeHistoryPage();

async function initializeHistoryPage() {
  try {
    resolvedDbUserId = await resolveCurrentUserId();
  } catch (error) {
    console.error('Unable to resolve history user id:', error);
  }

  await loadMeals('');

  historyDateFilter.addEventListener('change', () => {
    loadMeals(historyDateFilter.value);
  });

  historyDateClear.addEventListener('click', () => {
    historyDateFilter.value = '';
    loadMeals('');
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });
}

async function resolveCurrentUserId() {
  if (isUuid(resolvedDbUserId)) {
    sessionStorage.setItem('supabaseUserId', resolvedDbUserId);
    return resolvedDbUserId;
  }

  if (isUuid(currentUser)) {
    sessionStorage.setItem('supabaseUserId', currentUser);
    return currentUser;
  }

  const { data: namedUser, error: nameError } = await supabase
    .from('users')
    .select('id, name')
    .ilike('name', currentUser)
    .limit(1)
    .maybeSingle();

  if (nameError) {
    throw nameError;
  }

  if (namedUser?.id) {
    sessionStorage.setItem('supabaseUserId', namedUser.id);
    return namedUser.id;
  }

  const { data: latestUser, error: latestError } = await supabase
    .from('users')
    .select('id')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    throw latestError;
  }

  if (latestUser?.id) {
    sessionStorage.setItem('supabaseUserId', latestUser.id);
    return latestUser.id;
  }

  return null;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
}

async function loadMeals(selectedDate) {
  historyCards.innerHTML = '';
  historyEmptyState.classList.add('hidden');

  let query = supabase
    .from('meals')
    .select('id, user_id, nutrition_id, image_url, status, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (resolvedDbUserId) {
    query = query.eq('user_id', resolvedDbUserId);
  }

  if (selectedDate) {
    const start = `${selectedDate}T00:00:00`;
    const end = `${selectedDate}T23:59:59.999`;
    query = query.gte('created_at', start).lte('created_at', end);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading meals:', error);
    historyEmptyState.classList.remove('hidden');
    return;
  }

  const meals = Array.isArray(data) ? data : [];
  const mealIds = meals.map((meal) => meal.id).filter(Boolean);

  let foodItemsByMealId = {};
  if (mealIds.length > 0) {
    const { data: foodItems, error: foodItemsError } = await supabase
      .from('food_items')
      .select('id, meal_id, nutrition_id, food_name, created_at, updated_at')
      .in('meal_id', mealIds)
      .order('created_at', { ascending: true });

    if (foodItemsError) {
      console.error('Error loading food items for history:', foodItemsError);
    } else {
      foodItemsByMealId = (foodItems || []).reduce((groups, item) => {
        if (!groups[item.meal_id]) {
          groups[item.meal_id] = [];
        }
        groups[item.meal_id].push(item);
        return groups;
      }, {});
    }
  }

  const enrichedMeals = meals.map((meal) => ({
    ...meal,
    foodItems: foodItemsByMealId[meal.id] || [],
  }));

  renderMeals(enrichedMeals, selectedDate);
}

function renderMeals(meals, selectedDate) {
  historyCards.innerHTML = '';

  if (!meals.length) {
    historyEmptyState.classList.remove('hidden');
    return;
  }

  historyEmptyState.classList.add('hidden');

  if (selectedDate) {
    const grid = document.createElement('div');
    grid.className = 'history-cards-grid';
    meals.forEach((meal) => {
      grid.appendChild(buildMealCard(meal));
    });
    historyCards.appendChild(grid);
    return;
  }

  const groupedMeals = groupMealsByDate(meals);
  const orderedDateKeys = Object.keys(groupedMeals).sort((left, right) => {
    return new Date(left).getTime() - new Date(right).getTime();
  });

  orderedDateKeys.forEach((dateKey, index) => {
    const section = document.createElement('section');
    section.className = 'history-date-group';

    const heading = document.createElement('h3');
    heading.className = 'history-date-heading';
    heading.innerHTML = `<i class="fas fa-calendar-day"></i> ${formatDateHeading(dateKey)}`;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'history-cards-grid';
    groupedMeals[dateKey].forEach((meal) => {
      grid.appendChild(buildMealCard(meal));
    });
    section.appendChild(grid);
    historyCards.appendChild(section);

    if (index < orderedDateKeys.length - 1) {
      const separator = document.createElement('hr');
      separator.className = 'history-date-separator';
      historyCards.appendChild(separator);
    }
  });
}

function buildMealCard(meal) {
  const card = document.createElement('article');
  card.className = 'history-meal-card';

  const status = normalizeStatus(meal.status);
  const dateValue = new Date(meal.created_at);
  const foodNames = meal.foodItems.map((item) => item.food_name).filter(Boolean);
  const foodNameText = foodNames.length > 0 ? foodNames.join(', ') : 'Unnamed meal';
  const outputUrl = `output.html?mealId=${encodeURIComponent(meal.id)}`;

  card.innerHTML = `
    <div class="history-card-image-wrap">
      <img src="${escapeAttribute(meal.image_url || DEFAULT_MEAL_IMAGE)}" alt="Meal image" class="history-card-image" />
    </div>
    <div class="history-card-content">
      <h4 class="history-card-title">${escapeHtml(foodNameText)}</h4>
      <div class="history-meta-row">
        <span class="history-meta-item"><i class="fas fa-calendar-alt"></i> ${formatCardDate(dateValue)}</span>
        <span class="history-meta-item"><i class="fas fa-clock"></i> ${formatCardTime(dateValue)}</span>
      </div>
      <div class="history-card-actions">
        <button class="history-status-btn status-${status}" type="button">${statusLabel(status)}</button>
        <a href="${outputUrl}" class="history-view-link">View more</a>
      </div>
    </div>
  `;

  card.addEventListener('click', (event) => {
    if (event.target.closest('.history-view-link')) {
      return;
    }
    window.location.href = outputUrl;
  });

  return card;
}

function groupMealsByDate(meals) {
  return meals.reduce((groups, meal) => {
    const dateKey = toDateKey(meal.created_at);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(meal);
    return groups;
  }, {});
}

function normalizeStatus(statusValue) {
  const numericStatus = Number(statusValue);
  if (numericStatus === 0) return 'healthy';
  if (numericStatus === 1) return 'warning';
  if (numericStatus === 2) return 'intervention';

  const stringStatus = String(statusValue || '').toLowerCase();
  if (stringStatus === 'healthy' || stringStatus === 'warning' || stringStatus === 'intervention') {
    return stringStatus;
  }

  return 'healthy';
}

function statusLabel(status) {
  if (status === 'warning') return 'Warning';
  if (status === 'intervention') return 'Intervention';
  return 'Healthy';
}

function toDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateHeading(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCardDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatCardTime(date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
