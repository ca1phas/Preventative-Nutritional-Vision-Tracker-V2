import './style.css';
import { supabase } from './supabase.js';

// ===== AUTH CHECK =====
function checkUserAuth() {
    if (sessionStorage.getItem('isUserAuthenticated') !== 'true') {
        window.location.href = 'index.html';
    }
}
checkUserAuth();

const currentUser = sessionStorage.getItem('userID');
document.getElementById('currentUserDisplay').textContent = `User: ${currentUser}`;

// ===== TAB NAVIGATION =====
const profileTab = document.getElementById('profileTab');
const dashboardTab = document.getElementById('dashboardTab');
const historyTab = document.getElementById('historyTab');
const profilePanel = document.getElementById('profilePanel');
const dashboardPanel = document.getElementById('dashboardPanel');
const historyPanel = document.getElementById('historyPanel');

function showPanel(panelToShow) {
    profilePanel.classList.add('hidden');
    dashboardPanel.classList.add('hidden');
    historyPanel.classList.add('hidden');
    profileTab.classList.remove('active');
    dashboardTab.classList.remove('active');
    historyTab.classList.remove('active');

    if (panelToShow === 'profile') {
        profilePanel.classList.remove('hidden');
        profileTab.classList.add('active');
    } else if (panelToShow === 'dashboard') {
        dashboardPanel.classList.remove('hidden');
        dashboardTab.classList.add('active');
        loadDashboardData();
    } else if (panelToShow === 'history') {
        historyPanel.classList.remove('hidden');
        historyTab.classList.add('active');
        loadHistoryData();
    }
}

profileTab.addEventListener('click', (e) => {
    if (profileTab.getAttribute('href') === '#') {
        e.preventDefault();
        showPanel('profile');
    }
});

dashboardTab.addEventListener('click', (e) => {
    if ((dashboardTab.getAttribute('href') || '').startsWith('#')) {
        e.preventDefault();
        showPanel('dashboard');
    }
});

historyTab.addEventListener('click', (e) => {
    if ((historyTab.getAttribute('href') || '').startsWith('#')) {
        e.preventDefault();
        showPanel('history');
    }
});

// Optional hash routing for quick navigation from the header.
const panelFromHash = window.location.hash.replace('#', '').toLowerCase();
if (panelFromHash === 'dashboard') {
    showPanel('dashboard');
} else if (panelFromHash === 'history') {
    showPanel('history');
}

// ===== PROFILE =====
async function loadUserProfile() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser)
        .single();

    if (error) { console.error('Profile load error:', error.message); return; }

    if (data) {
        document.getElementById('userName').value = data.name || '';
        document.getElementById('userAge').value = data.age || '';
        document.getElementById('userGender').value = data.gender || '';
        document.getElementById('userWeight').value = data.weight || '';
        document.getElementById('userHeight').value = data.height || '';
        // medical_notes is an ARRAY type — join for display
        document.getElementById('medicalNotes').value =
            Array.isArray(data.medical_notes) ? data.medical_notes.join(', ') : (data.medical_notes || '');
        calculateBMI();
    }
}

function calculateBMI() {
    const weight = parseFloat(document.getElementById('userWeight').value);
    const height = parseFloat(document.getElementById('userHeight').value);
    if (weight && height) {
        document.getElementById('userBMI').value = (weight / ((height / 100) ** 2)).toFixed(1);
    }
}

document.getElementById('userWeight').addEventListener('input', calculateBMI);
document.getElementById('userHeight').addEventListener('input', calculateBMI);

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // medical_notes is ARRAY in Supabase — split by comma
    const medicalNotesRaw = document.getElementById('medicalNotes').value;
    const medicalNotesArray = medicalNotesRaw
        ? medicalNotesRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const profileData = {
        id: currentUser,
        name: document.getElementById('userName').value,
        age: parseInt(document.getElementById('userAge').value),
        gender: document.getElementById('userGender').value,
        weight: parseFloat(document.getElementById('userWeight').value),
        height: parseFloat(document.getElementById('userHeight').value),
        medical_notes: medicalNotesArray
    };

    const { error } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' });

    if (error) {
        alert('Error saving profile: ' + error.message);
        console.error(error);
    } else {
        alert('Profile saved successfully!');
    }
});

// Fix Reset button — onclick attr doesn't work in ES modules
const resetBtn = document.querySelector('button[onclick="loadUserProfile()"]');
if (resetBtn) {
    resetBtn.removeAttribute('onclick');
    resetBtn.addEventListener('click', loadUserProfile);
}

// ===== DASHBOARD =====
async function loadDashboardData() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: meals, error } = await supabase
        .from('meals')
        .select(`
            id,
            status,
            created_at,
            nutritions (
                calories_kcal,
                protein_g,
                total_carbs_g,
                total_fat_g,
                total_sugar_g
            )
        `)
        .eq('user_id', currentUser)
        .gte('created_at', startOfMonth);

    if (error) { console.error('Dashboard error:', error.message); return; }

    // Monthly summary
    const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = monthLabel;

    const byDay = {};
    meals.forEach(meal => {
        const day = meal.created_at.slice(0, 10);
        const cal = meal.nutritions?.calories_kcal || 0;
        byDay[day] = (byDay[day] || 0) + cal;
    });

    const days = Object.entries(byDay);
    if (days.length > 0) {
        const highest = days.reduce((a, b) => a[1] > b[1] ? a : b);
        const lowest = days.reduce((a, b) => a[1] < b[1] ? a : b);
        const avg = Math.round(days.reduce((sum, d) => sum + d[1], 0) / days.length);
        document.getElementById('highestCalorieDay').textContent = highest[0];
        document.getElementById('highestCalorieValue').textContent = `${Math.round(highest[1])} calories`;
        document.getElementById('lowestCalorieDay').textContent = lowest[0];
        document.getElementById('lowestCalorieValue').textContent = `${Math.round(lowest[1])} calories`;
        document.getElementById('avgDailyCalories').textContent = avg;
    } else {
        document.getElementById('highestCalorieDay').textContent = 'No data yet';
        document.getElementById('lowestCalorieDay').textContent = 'No data yet';
        document.getElementById('avgDailyCalories').textContent = '0';
    }
    document.getElementById('totalMealsMonth').textContent = meals.length;

    // Daily summary
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const todayMeals = meals.filter(m => m.created_at >= startOfDay);
    const dailyTotals = todayMeals.reduce((acc, meal) => {
        const n = meal.nutritions || {};
        acc.calories += n.calories_kcal || 0;
        acc.protein += n.protein_g || 0;
        acc.carbs += n.total_carbs_g || 0;
        acc.fats += n.total_fat_g || 0;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    document.getElementById('dailyCalories').textContent = Math.round(dailyTotals.calories);
    document.getElementById('dailyProtein').textContent = Math.round(dailyTotals.protein);
    document.getElementById('dailyCarbs').textContent = Math.round(dailyTotals.carbs);
    document.getElementById('dailyFats').textContent = Math.round(dailyTotals.fats);

    generateInsights(dailyTotals, days);
}

function generateInsights(dailyTotals, days) {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = '';
    const insights = [];

    if (dailyTotals.calories > 0 && dailyTotals.calories < 2000) {
        insights.push({ type: 'success', icon: 'fa-check-circle', title: 'Healthy Calorie Intake Today', message: `You've consumed ${Math.round(dailyTotals.calories)} kcal today — within a healthy range.` });
    }
    if (dailyTotals.carbs > 200) {
        insights.push({ type: 'warning', icon: 'fa-exclamation-triangle', title: 'High Carbohydrate Intake', message: `Today's carb intake is ${Math.round(dailyTotals.carbs)}g, which may exceed recommended levels.` });
    }
    if (dailyTotals.protein >= 70) {
        insights.push({ type: 'info', icon: 'fa-info-circle', title: 'Good Protein Intake', message: `You've hit your protein goal with ${Math.round(dailyTotals.protein)}g today.` });
    }
    if (days.length > 0) {
        const avg = days.reduce((sum, d) => sum + d[1], 0) / days.length;
        if (avg > 2200) {
            insights.push({ type: 'danger', icon: 'fa-heartbeat', title: 'High Monthly Average', message: `Your monthly average is ${Math.round(avg)} kcal/day. Consider reducing portion sizes.` });
        }
    }
    if (insights.length === 0) {
        insights.push({ type: 'info', icon: 'fa-info-circle', title: 'No Meals Logged Yet', message: 'Upload a meal to start seeing insights here.' });
    }

    insights.forEach(insight => {
        const card = document.createElement('div');
        card.className = `insight-card insight-${insight.type}`;
        card.innerHTML = `
            <div class="insight-icon"><i class="fas ${insight.icon}"></i></div>
            <div class="insight-content"><h4>${insight.title}</h4><p>${insight.message}</p></div>
        `;
        container.appendChild(card);
    });
}

// ===== HISTORY =====
async function loadHistoryData() {
    const { data: meals, error } = await supabase
        .from('meals')
        .select(`
            id,
            status,
            created_at,
            nutritions (
                calories_kcal,
                protein_g,
                total_carbs_g,
                total_fat_g
            ),
            food_items (
                food_name
            )
        `)
        .eq('user_id', currentUser)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) { console.error('History error:', error.message); return; }

    loadMealHistory(meals);
    loadAlerts(meals);
}

function loadMealHistory(meals) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    if (meals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;">No meals logged yet.</td></tr>';
        return;
    }

    meals.forEach(meal => {
        const n = meal.nutritions || {};
        const datetime = new Date(meal.created_at).toLocaleString();
        const calories = Math.round(n.calories_kcal || 0);
        const protein = Math.round(n.protein_g || 0);
        const carbs = Math.round(n.total_carbs_g || 0);
        const fats = Math.round(n.total_fat_g || 0);
        const itemNames = Array.isArray(meal.food_items) && meal.food_items.length > 0
            ? meal.food_items.map(f => f.food_name).join(', ')
            : 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight:600;">${datetime}</td>
            <td>${itemNames}</td>
            <td>${calories}</td>
            <td>${protein}</td>
            <td>${carbs}</td>
            <td>${fats}</td>
            <td>${getStatusBadge(meal.status)}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadAlerts(meals) {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';

    // status 2 = intervention, status 1 = warning
    const alertMeals = meals.filter(m => m.status === 1 || m.status === 2);

    if (alertMeals.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;">No alerts at this time.</p>';
        return;
    }

    alertMeals.forEach(meal => {
        const n = meal.nutritions || {};
        const calories = Math.round(n.calories_kcal || 0);
        const date = meal.created_at.slice(0, 10);
        const type = meal.status === 2 ? 'danger' : 'warning';
        const icon = type === 'danger' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle';

        const card = document.createElement('div');
        card.className = `alert-card alert-${type}`;
        card.innerHTML = `
            <div class="alert-icon"><i class="fas ${icon}"></i></div>
            <div class="alert-content">
                <p class="alert-date">${date}</p>
                <p class="alert-message">High intake detected: ${calories} kcal on this meal.</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// status: 0=healthy, 1=warning, 2=intervention
function getStatusBadge(status) {
    if (status === 0) return '<span class="badge badge-healthy">🟢 Healthy</span>';
    if (status === 1) return '<span class="badge badge-warning">🟡 Warning</span>';
    if (status === 2) return '<span class="badge badge-intervention">🔴 Intervention</span>';
    return '<span class="badge">Unknown</span>';
}

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('isUserAuthenticated');
    sessionStorage.removeItem('userID');
    localStorage.removeItem('userID');
    window.location.href = 'index.html';
});

// ===== INITIALIZE =====
loadUserProfile();