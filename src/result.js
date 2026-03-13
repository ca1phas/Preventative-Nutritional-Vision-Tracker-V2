import './style.css';

// Check if viewing from dashboard (has userID parameter)
const urlParams = new URLSearchParams(window.location.search);
const viewingUserID = urlParams.get('userID');

const statusAlert = document.getElementById('statusAlert');
const ingredientList = document.getElementById('ingredientList');
const caloriesEl = document.getElementById('calories');
const proteinEl = document.getElementById('protein');
const carbsEl = document.getElementById('carbs');
const fatsEl = document.getElementById('fats');

if (viewingUserID) {
    // Viewing user details from dashboard (Keeping the mock for your table demo)
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
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;

    record.nutrition_data.forEach(item => {
        totalCalories += item.calories_kcal || 0;
        totalProtein += item.protein_g || 0;
        totalCarbs += item.total_carbs_g || 0;
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
// MOCK DATA FOR ADMIN DASHBOARD "VIEW" CLICKS
// ==========================================
function displayUserDetails(userID) {
    const mockUserData = {
        'U001': { status: 'healthy', ingredients: [{ item: 'grilled chicken', portion: 1 }, { item: 'mixed salad', portion: 1 }], calories: 650, protein: 45, carbs: 75, fats: 15 },
        'U002': { status: 'warning', ingredients: [{ item: 'white rice', portion: 2 }, { item: 'fried chicken', portion: 1 }], calories: 890, protein: 35, carbs: 120, fats: 28 },
        'U003': { status: 'intervention', ingredients: [{ item: 'pasta', portion: 2 }, { item: 'garlic bread', portion: 2 }], calories: 1200, protein: 30, carbs: 180, fats: 35 },
        'DOC001': { status: 'healthy', ingredients: [{ item: 'salmon', portion: 1 }, { item: 'brown rice', portion: 1 }], calories: 520, protein: 40, carbs: 45, fats: 18 },
        'PATIENT123': { status: 'warning', ingredients: [{ item: 'burger', portion: 1 }, { item: 'fries', portion: 1 }], calories: 750, protein: 25, carbs: 95, fats: 30 }
    };

    const userData = mockUserData[userID] || mockUserData['U001'];

    document.querySelector('.page-header h2').textContent = `User Details: ${userID}`;
    displayStatus(userData.status);

    ingredientList.innerHTML = userData.ingredients.map(item =>
        `<li><span style="text-transform: capitalize;">${item.item} ×${item.portion}</span></li>`
    ).join('');

    caloriesEl.textContent = `${userData.calories} kcal`;
    proteinEl.textContent = `${userData.protein} g`;
    carbsEl.textContent = `${userData.carbs} g`;
    fatsEl.textContent = `${userData.fats} g`;
}

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