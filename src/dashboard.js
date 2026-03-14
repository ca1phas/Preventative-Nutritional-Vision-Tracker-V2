import { supabase } from './supabase.js';

// Admin auth check — uses is_admin flag from users table
// TODO
function redirectToHome() {
    alert('Admin access required.');
    window.location.href = 'index.html';
}

const USE_MOCK_DATA = true;
await checkAdminAuth();

const currentTab = new URLSearchParams(window.location.search).get('tab') || 'patients';

const loading = document.getElementById('loading');
const error = document.getElementById('error');
const tableBody = document.getElementById('userTableBody');


// Mock data for testing
const MOCK_USERS = [
    { userID: 'U001', lastMeal: '2 hours ago', calories: 650, carbs: 75, status: 'healthy' },
    { userID: 'U002', lastMeal: '4 hours ago', calories: 890, carbs: 120, status: 'warning' },
    { userID: 'U003', lastMeal: '1 hour ago', calories: 1200, carbs: 180, status: 'intervention' },
    { userID: 'DOC001', lastMeal: '6 hours ago', calories: 520, carbs: 45, status: 'healthy' },
    { userID: 'PATIENT123', lastMeal: '3 hours ago', calories: 750, carbs: 95, status: 'warning' }
];

function getStatusBadge(status) {
    if (status === 0) return '<span class="badge badge-healthy">🟢 Healthy</span>';
    if (status === 1) return '<span class="badge badge-warning">🟡 Warning</span>';
    if (status === 2) return '<span class="badge badge-intervention">🔴 Intervention</span>';
    return '<span class="badge">Unknown</span>';
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

loadDashboard();