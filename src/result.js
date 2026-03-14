import './style.css';
import { supabase } from './supabaseConnect.js';

// Check if viewing from dashboard (has userID parameter)
const urlParams = new URLSearchParams(window.location.search);
const viewingUserID = urlParams.get('userID');

const statusAlert = document.getElementById('statusAlert');
const ingredientList = document.getElementById('ingredientList');
const caloriesEl = document.getElementById('calories');
const proteinEl = document.getElementById('protein');
const carbsEl = document.getElementById('carbs');
const fiberEl = document.getElementById('fiber');
const waterEl = document.getElementById('water');
const fatsEl = document.getElementById('fats');

if (viewingUserID) {
    // Viewing user details from admin dashboard using Supabase data
    displayUserDetails(viewingUserID);
} else {
    // Viewing LIVE meal analysis result from the AI pipeline
    displayMealAnalysis();
}

function displayMealAnalysis() {
    // Grab the live data saved from confirm.js
    const record = JSON.parse(sessionStorage.getItem('lastSubmittedRecord') || 'null');

    if (!record || !record.nutrition_data) {
        window.location.href = 'upload.html';
        return;
    }

    // 1. Calculate Totals from the Gemini/USDA schema
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFiber = 0, totalWater = 0, totalFats = 0;

    record.nutrition_data.forEach(item => {
        totalCalories += item.calories_kcal || 0;
        totalProtein += item.protein_g || 0;
        totalCarbs += item.total_carbs_g || 0;
        totalFiber += item.total_fiber_g || 0;
        totalWater += item.total_water_ml || 0;
        totalFats += item.total_fat_g || 0;
    });

    // 2. Determine Health Status dynamically (Example: based on carbs)
    let status = 'healthy';
    if (totalCarbs > 150) status = 'intervention';
    else if (totalCarbs > 80) status = 'warning';

    // Display status
    displayStatus(status);

    // Display ingredients (from the user-confirmed list)
    ingredientList.innerHTML = record.food_items.map(item =>
        `<li><span style="text-transform: capitalize;">${item.item} ×${item.portion} (${item.serving_size_g}g)</span></li>`
    ).join('');

    // Display nutrition info (rounded to 1 decimal)
    caloriesEl.textContent = `${totalCalories.toFixed(0)} kcal`;
    proteinEl.textContent = `${totalProtein.toFixed(1)} g`;
    carbsEl.textContent = `${totalCarbs.toFixed(1)} g`;
    fiberEl.textContent = `${totalFiber.toFixed(1)} g`;
    waterEl.textContent = `${totalWater.toFixed(1)} ml`;
    fatsEl.textContent = `${totalFats.toFixed(1)} g`;
}

function displayStatus(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'healthy') {
        statusAlert.className = 'status-banner healthy';
        statusAlert.textContent = '🟢 Healthy Meal';
    } else if (statusLower === 'warning') {
        statusAlert.className = 'status-banner warning';
        statusAlert.textContent = '🟡 Warning: Moderate Carbohydrate Intake';
    } else if (statusLower === 'intervention') {
        statusAlert.className = 'status-banner intervention';
        statusAlert.textContent = '🔴 Intervention Needed: Meal exceeds safe carbohydrate threshold';
    }
}

// ==========================================
// SUPABASE DATA FOR ADMIN DASHBOARD "VIEW" CLICKS
// ==========================================
async function displayUserDetails(userID) {
    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', userID)
            .maybeSingle();

        let nutritionRows = [];
        let nutritionError = null;

        // 1) Preferred: table has user_id for per-user filtering.
        const byUserQuery = await supabase
            .from('nutritions')
            .select('*')
            .eq('user_id', userID)
            .order('created_at', { ascending: false });

        if (!byUserQuery.error) {
            nutritionRows = byUserQuery.data || [];
        } else {
            // 2) Fallback: table exists but no user_id column, or select restriction issue.
            const fallbackQuery = await supabase
                .from('nutritions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!fallbackQuery.error) {
                nutritionRows = fallbackQuery.data || [];
            } else {
                nutritionError = fallbackQuery.error;
            }
        }

        if (userError) throw userError;
        if (nutritionError) throw nutritionError;

        const displayName = user?.name || userID;
        document.querySelector('.page-header h2').textContent = `User Name: ${displayName}`;

        if (!nutritionRows || nutritionRows.length === 0) {
            displayStatus('healthy');
            ingredientList.innerHTML = '<li>No nutrition records found for this user.</li>';
            caloriesEl.textContent = '-';
            proteinEl.textContent = '-';
            carbsEl.textContent = '-';
            fiberEl.textContent = '-';
            waterEl.textContent = '-';
            fatsEl.textContent = '-';
            return;
        }

        const totalCalories = nutritionRows.reduce((sum, row) => sum + Number(row.calories_kcal || 0), 0);
        const totalProtein = nutritionRows.reduce((sum, row) => sum + Number(row.protein_g || 0), 0);
        const totalCarbs = nutritionRows.reduce((sum, row) => sum + Number(row.total_carbs_g || 0), 0);
        const totalFiber = nutritionRows.reduce((sum, row) => sum + Number(row.total_fiber_g || 0), 0);
        const totalWater = nutritionRows.reduce((sum, row) => sum + Number(row.total_water_ml || 0), 0);
        const totalFats = nutritionRows.reduce((sum, row) => sum + Number(row.total_fat_g || 0), 0);

        let status = 'healthy';
        if (totalCarbs > 150) status = 'intervention';
        else if (totalCarbs > 80) status = 'warning';
        displayStatus(status);

        ingredientList.innerHTML = nutritionRows.map((row) => {
            const name = row.food_name || row.item || row.name || 'Meal item';
            return `<li><span style="text-transform: capitalize;">${name}</span></li>`;
        }).join('');

        caloriesEl.textContent = `${totalCalories.toFixed(0)} kcal`;
        proteinEl.textContent = `${totalProtein.toFixed(1)} g`;
        carbsEl.textContent = `${totalCarbs.toFixed(1)} g`;
        fiberEl.textContent = `${totalFiber.toFixed(1)} g`;
        waterEl.textContent = `${totalWater.toFixed(1)} ml`;
        fatsEl.textContent = `${totalFats.toFixed(1)} g`;
    } catch (err) {
        console.error('Unable to load user nutrition details:', err);
        document.querySelector('.page-header h2').textContent = 'User Name';
        ingredientList.innerHTML = '<li>Unable to load data from database.</li>';
        caloriesEl.textContent = '-';
        proteinEl.textContent = '-';
        carbsEl.textContent = '-';
        fiberEl.textContent = '-';
        waterEl.textContent = '-';
        fatsEl.textContent = '-';
        displayStatus('warning');
    }
}

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
});

// Smart navigation - if viewing from admin dashboard, go back to admin dashboard
if (viewingUserID) {
    const backBtn = document.getElementById('backToDashboard');
    if (backBtn) {
        backBtn.href = 'dashboard.html?tab=patients';
        backBtn.innerHTML = 'Back to Admin Dashboard';
    }

    const navbar = document.querySelector('.navbar-brand .navbar-links');
    if (navbar) {
        navbar.innerHTML = `
            <a href="dashboard.html?tab=patients" style="padding: 0.5rem 1rem;">View All Users</a>
        `;
    }

    const pageHeader = document.querySelector('.page-header');
    if (pageHeader && !pageHeader.querySelector('p')) {
        const subtitle = document.createElement('p');
        subtitle.style.cssText = 'color: #6b7280; margin-top: 0.5rem; font-size: 0.95rem;';
        subtitle.textContent = 'Viewing user meal details from Admin Dashboard';
        pageHeader.appendChild(subtitle);
    }
}