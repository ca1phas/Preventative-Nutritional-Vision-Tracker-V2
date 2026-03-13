import { supabase } from './supabase.js';

const urlParams = new URLSearchParams(window.location.search);
const viewingUserID = urlParams.get('userID');

const statusAlert = document.getElementById('statusAlert');
const ingredientList = document.getElementById('ingredientList');
const caloriesEl = document.getElementById('calories');
const proteinEl = document.getElementById('protein');
const carbsEl = document.getElementById('carbs');
const fatsEl = document.getElementById('fats');

if (viewingUserID) {
    displayUserDetails(viewingUserID);
} else {
    displayMealAnalysis();
}

// ===== USER: own live AI result from sessionStorage =====
function displayMealAnalysis() {
    const record = JSON.parse(sessionStorage.getItem('lastSubmittedRecord') || 'null');
    if (!record?.nutrition_data) { window.location.href = 'upload.html'; return; }

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;
    record.nutrition_data.forEach(item => {
        totalCalories += item.calories_kcal || 0;
        totalProtein += item.protein_g || 0;
        totalCarbs += item.total_carbs_g || 0;
        totalFats += item.total_fat_g || 0;
    });

    // status: 0=healthy, 1=warning, 2=intervention
    let status = 0;
    if (totalCalories > 1200 || totalCarbs > 150) status = 2;
    else if (totalCalories > 800 || totalCarbs > 100) status = 1;

    displayStatus(status);

    ingredientList.innerHTML = record.food_items.map(item =>
        `<li><span style="text-transform:capitalize;">${item.item} ×${item.portion} (${item.serving_size_g}g)</span></li>`
    ).join('');

    caloriesEl.textContent = `${totalCalories.toFixed(0)} kcal`;
    proteinEl.textContent = `${totalProtein.toFixed(1)} g`;
    carbsEl.textContent = `${totalCarbs.toFixed(1)} g`;
    fatsEl.textContent = `${totalFats.toFixed(1)} g`;
}

// ===== ADMIN: view patient's latest meal from Supabase =====
async function displayUserDetails(userID) {
    document.querySelector('.page-header h2').textContent = `Patient: ${userID}`;

    const { data: meal, error } = await supabase
        .from('meals')
        .select(`
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
        .eq('user_id', userID)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !meal) {
        statusAlert.className = 'status-banner warning';
        statusAlert.textContent = 'No meal data found for this patient.';
        caloriesEl.textContent = proteinEl.textContent = carbsEl.textContent = fatsEl.textContent = '-';
        return;
    }

    const n = meal.nutritions || {};
    displayStatus(meal.status);

    ingredientList.innerHTML = Array.isArray(meal.food_items) && meal.food_items.length > 0
        ? meal.food_items.map(f => `<li><span style="text-transform:capitalize;">${f.food_name}</span></li>`).join('')
        : '<li>N/A</li>';

    caloriesEl.textContent = `${Math.round(n.calories_kcal || 0)} kcal`;
    proteinEl.textContent = `${Math.round(n.protein_g || 0)} g`;
    carbsEl.textContent = `${Math.round(n.total_carbs_g || 0)} g`;
    fatsEl.textContent = `${Math.round(n.total_fat_g || 0)} g`;

    // Add timestamp subtitle
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader && !pageHeader.querySelector('p')) {
        const subtitle = document.createElement('p');
        subtitle.style.cssText = 'color:#6b7280;margin-top:0.5rem;font-size:0.95rem;';
        subtitle.textContent = `Last meal: ${new Date(meal.created_at).toLocaleString()}`;
        pageHeader.appendChild(subtitle);
    }
}

// status: 0=healthy, 1=warning, 2=intervention
function displayStatus(status) {
    if (status === 0) {
        statusAlert.className = 'status-banner healthy';
        statusAlert.textContent = '🟢 Healthy Meal';
    } else if (status === 1) {
        statusAlert.className = 'status-banner warning';
        statusAlert.textContent = '🟡 Warning: Moderate intake detected';
    } else if (status === 2) {
        statusAlert.className = 'status-banner intervention';
        statusAlert.textContent = '🔴 Intervention Needed: Meal exceeds safe thresholds';
    }
}

// Admin back button
if (viewingUserID) {
    const backBtn = document.getElementById('backToDashboard');
    if (backBtn) {
        backBtn.href = 'dashboard.html?tab=patients';
        backBtn.innerHTML = '← Back to Admin Dashboard';
    }
    const navbar = document.querySelector('.navbar-brand .navbar-links');
    if (navbar) {
        navbar.innerHTML = `
            <a href="dashboard.html?tab=patients">Admin Dashboard</a>
            <a href="dashboard.html?tab=daily">Daily Reports</a>
            <a href="index.html">Homepage</a>
        `;
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
});