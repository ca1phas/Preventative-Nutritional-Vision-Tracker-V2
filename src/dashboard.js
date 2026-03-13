import './style.css';
import { supabase } from './supabase.js';

// Admin auth check — uses is_admin flag from users table
async function checkAdminAuth() {
    const userID = sessionStorage.getItem('userID');
    if (!userID) { redirectToHome(); return; }

    const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userID)
        .single();

    if (error || !data?.is_admin) { redirectToHome(); }
}

function redirectToHome() {
    alert('Admin access required.');
    window.location.href = 'index.html';
}

await checkAdminAuth();

const currentTab = new URLSearchParams(window.location.search).get('tab') || 'patients';

const loading = document.getElementById('loading');
const error = document.getElementById('error');
const tableBody = document.getElementById('userTableBody');
const dailyTabLink = document.getElementById('dailyTabLink');
const patientsTabLink = document.getElementById('patientsTabLink');
const dailyPanel = document.getElementById('dailyPanel');
const patientsPanel = document.getElementById('patientsPanel');
const dailyMeta = document.getElementById('dailyMeta');
const dailyJsonPreview = document.getElementById('dailyJsonPreview');

// status: 0=healthy, 1=warning, 2=intervention
function getStatusBadge(status) {
    if (status === 0) return '<span class="badge badge-healthy">🟢 Healthy</span>';
    if (status === 1) return '<span class="badge badge-warning">🟡 Warning</span>';
    if (status === 2) return '<span class="badge badge-intervention">🔴 Intervention</span>';
    return '<span class="badge">Unknown</span>';
}

function initTabs() {
    if (currentTab === 'daily') {
        dailyTabLink.classList.add('active');
        patientsTabLink.classList.remove('active');
        dailyPanel.classList.remove('hidden');
        patientsPanel.classList.add('hidden');
        renderDailyPanel();
    } else {
        patientsTabLink.classList.add('active');
        dailyTabLink.classList.remove('active');
        patientsPanel.classList.remove('hidden');
        dailyPanel.classList.add('hidden');
        loadDashboard();
    }
}

function renderDailyPanel() {
    const lastRecord = JSON.parse(sessionStorage.getItem('lastSubmittedRecord') || 'null');
    if (!lastRecord) {
        dailyMeta.textContent = 'No meal submitted yet in this session.';
        dailyJsonPreview.textContent = JSON.stringify({ message: 'Submit a meal via Upload → Confirm to see data here.' }, null, 2);
        return;
    }
    dailyMeta.textContent = `User: ${lastRecord.userID} | Submitted: ${new Date(lastRecord.datetime).toLocaleString()}`;
    dailyJsonPreview.textContent = JSON.stringify(lastRecord, null, 2);
}

async function loadDashboard() {
    loading.classList.remove('hidden');
    error.classList.add('hidden');

    try {
        // Get most recent meal per user
        const { data: meals, error: mealsError } = await supabase
            .from('meals')
            .select(`
                id,
                user_id,
                status,
                created_at,
                nutritions (
                    calories_kcal,
                    total_carbs_g
                )
            `)
            .order('created_at', { ascending: false });

        if (mealsError) throw mealsError;

        // Keep only latest meal per user
        const userMap = {};
        meals.forEach(meal => {
            if (!userMap[meal.user_id]) userMap[meal.user_id] = meal;
        });

        const latestMeals = Object.values(userMap);

        if (latestMeals.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6b7280;">No patients found.</td></tr>';
            return;
        }

        tableBody.innerHTML = latestMeals.map(meal => {
            const n = meal.nutritions || {};
            const calories = Math.round(n.calories_kcal || 0);
            const carbs = Math.round(n.total_carbs_g || 0);
            const lastMeal = new Date(meal.created_at).toLocaleString();

            return `
                <tr>
                    <td>${meal.user_id}</td>
                    <td>${lastMeal}</td>
                    <td>${calories}</td>
                    <td>${carbs}g</td>
                    <td>${getStatusBadge(meal.status)}</td>
                    <td><a href="result.html?userID=${encodeURIComponent(meal.user_id)}" class="btn-view">View</a></td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        error.textContent = 'Unable to load data: ' + err.message;
        error.classList.remove('hidden');
        console.error(err);
    } finally {
        loading.classList.add('hidden');
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
});

initTabs();