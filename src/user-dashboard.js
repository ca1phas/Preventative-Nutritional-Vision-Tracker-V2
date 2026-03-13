import './style.css';

// ===== CONFIGURATION =====
// Set to false when integrating with backend API
const USE_MOCK_DATA = true;

// ===== AUTH CHECK =====
function checkUserAuth() {
    if (sessionStorage.getItem('isUserAuthenticated') !== 'true') {
        window.location.href = 'index.html';
    }
}
checkUserAuth();

const currentUser = sessionStorage.getItem('userID');
document.getElementById('currentUserDisplay').textContent = `User: ${currentUser}`;

// ===== MOCK DATA (remove this section when integrating with backend) =====
const MOCK_USER_PROFILE = {
    userID: currentUser,
    name: 'XXX',
    age: 35,
    gender: 'male',
    weight: 75.5,
    height: 175,
    medicalNotes: 'Pre-diabetic. Avoid high sugar intake. Regular monitoring required.'
};

const MOCK_MONTHLY_SUMMARY = {
    month: 'March 2026',
    highestCalorieDay: {
        date: 'March 5, 2026',
        calories: 2450
    },
    lowestCalorieDay: {
        date: 'March 2, 2026',
        calories: 1420
    },
    avgDailyCalories: 1850,
    totalMeals: 87
};

const MOCK_DAILY_SUMMARY = {
    date: '2026-03-09',
    calories: 1650,
    protein: 78,
    carbs: 195,
    fats: 52
};

const MOCK_INSIGHTS = [
    {
        type: 'success',
        icon: 'fa-check-circle',
        title: 'Great Progress!',
        message: 'You\'ve maintained healthy calorie intake for 5 consecutive days.'
    },
    {
        type: 'warning',
        icon: 'fa-exclamation-triangle',
        title: 'High Carbohydrate Intake',
        message: 'Your carb intake averaged 220g/day this week, which is 15% above recommended levels for pre-diabetic patients.'
    },
    {
        type: 'info',
        icon: 'fa-info-circle',
        title: 'Eating Pattern Analysis',
        message: 'You tend to consume 60% of daily calories after 6 PM. Consider earlier meal times for better glucose management.'
    },
    {
        type: 'danger',
        icon: 'fa-heartbeat',
        title: 'Risk Indicator',
        message: 'Blood sugar spike risk detected on March 7. High sugar intake at dinner (estimated 85g).'
    }
];

const MOCK_MEAL_HISTORY = [
    {
        datetime: '2026-03-09 18:30',
        items: ['Grilled Chicken', 'Brown Rice', 'Steamed Broccoli', 'Olive Oil'],
        calories: 650,
        protein: 45,
        carbs: 68,
        fats: 18,
        status: 'healthy'
    },
    {
        datetime: '2026-03-09 12:15',
        items: ['Salmon Fillet', 'Quinoa', 'Mixed Vegetables', 'Avocado'],
        calories: 720,
        protein: 52,
        carbs: 65,
        fats: 28,
        status: 'healthy'
    },
    {
        datetime: '2026-03-09 08:00',
        items: ['Oatmeal', 'Banana', 'Almonds', 'Honey'],
        calories: 380,
        protein: 12,
        carbs: 62,
        fats: 11,
        status: 'healthy'
    },
    {
        datetime: '2026-03-08 19:00',
        items: ['Pasta Carbonara', 'Garlic Bread', 'Caesar Salad'],
        calories: 1150,
        protein: 38,
        carbs: 142,
        fats: 48,
        status: 'warning'
    },
    {
        datetime: '2026-03-08 13:00',
        items: ['Turkey Sandwich', 'Potato Chips', 'Apple'],
        calories: 580,
        protein: 28,
        carbs: 75,
        fats: 18,
        status: 'healthy'
    },
    {
        datetime: '2026-03-08 07:30',
        items: ['Greek Yogurt', 'Granola', 'Blueberries', 'Honey'],
        calories: 420,
        protein: 18,
        carbs: 58,
        fats: 14,
        status: 'healthy'
    },
    {
        datetime: '2026-03-07 20:00',
        items: ['Pizza (4 slices)', 'Soda', 'Ice Cream'],
        calories: 1480,
        protein: 42,
        carbs: 185,
        fats: 62,
        status: 'intervention'
    },
    {
        datetime: '2026-03-07 12:30',
        items: ['Chicken Salad', 'Whole Wheat Bread', 'Orange Juice'],
        calories: 490,
        protein: 32,
        carbs: 58,
        fats: 14,
        status: 'healthy'
    }
];

const MOCK_ALERTS = [
    {
        type: 'warning',
        date: '2026-03-07',
        message: 'High calorie intake detected (1480 cal at dinner). Recommendation: Reduce portion sizes and avoid high-calorie beverages.'
    },
    {
        type: 'info',
        date: '2026-03-06',
        message: 'Excellent protein intake! You met your daily protein goal of 70g.'
    },
    {
        type: 'danger',
        date: '2026-03-05',
        message: 'Alert: Carbohydrate intake exceeded safe levels for pre-diabetic patients. Please consult your dietitian.'
    }
];

// ===== END OF MOCK DATA =====

// ===== TAB NAVIGATION =====
const profileTab = document.getElementById('profileTab');
const dashboardTab = document.getElementById('dashboardTab');
const historyTab = document.getElementById('historyTab');

const profilePanel = document.getElementById('profilePanel');
const dashboardPanel = document.getElementById('dashboardPanel');
const historyPanel = document.getElementById('historyPanel');

function showPanel(panelToShow) {
    // Hide all panels
    profilePanel.classList.add('hidden');
    dashboardPanel.classList.add('hidden');
    historyPanel.classList.add('hidden');

    // Remove active class from all tabs
    profileTab.classList.remove('active');
    dashboardTab.classList.remove('active');
    historyTab.classList.remove('active');

    // Show selected panel and activate tab
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

// ===== PROFILE SECTION =====
function loadUserProfile() {
    if (USE_MOCK_DATA) {
        // Load mock data
        document.getElementById('userName').value = MOCK_USER_PROFILE.name;
        document.getElementById('userAge').value = MOCK_USER_PROFILE.age;
        document.getElementById('userGender').value = MOCK_USER_PROFILE.gender;
        document.getElementById('userWeight').value = MOCK_USER_PROFILE.weight;
        document.getElementById('userHeight').value = MOCK_USER_PROFILE.height;
        document.getElementById('medicalNotes').value = MOCK_USER_PROFILE.medicalNotes;
        calculateBMI();
    } else {
        // TODO: Replace with actual API call
        // fetch(`/api/users/${currentUser}/profile`)
        //     .then(response => response.json())
        //     .then(data => {
        //         document.getElementById('userName').value = data.name;
        //         document.getElementById('userAge').value = data.age;
        //         document.getElementById('userGender').value = data.gender;
        //         document.getElementById('userWeight').value = data.weight;
        //         document.getElementById('userHeight').value = data.height;
        //         document.getElementById('medicalNotes').value = data.medicalNotes;
        //         calculateBMI();
        //     });
    }
}

function calculateBMI() {
    const weight = parseFloat(document.getElementById('userWeight').value);
    const height = parseFloat(document.getElementById('userHeight').value);

    if (weight && height) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
        document.getElementById('userBMI').value = bmi;
    }
}

document.getElementById('userWeight').addEventListener('input', calculateBMI);
document.getElementById('userHeight').addEventListener('input', calculateBMI);

document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const profileData = {
        userID: currentUser,
        name: document.getElementById('userName').value,
        age: parseInt(document.getElementById('userAge').value),
        gender: document.getElementById('userGender').value,
        weight: parseFloat(document.getElementById('userWeight').value),
        height: parseFloat(document.getElementById('userHeight').value),
        medicalNotes: document.getElementById('medicalNotes').value
    };

    if (USE_MOCK_DATA) {
        // Simulate save
        alert('Profile saved successfully! (Mock mode - data not persisted)');
        console.log('Profile data:', profileData);
    } else {
        // TODO: Replace with actual API call
        // fetch(`/api/users/${currentUser}/profile`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(profileData)
        // })
        // .then(response => response.json())
        // .then(data => {
        //     alert('Profile saved successfully!');
        // });
    }
});

// ===== DASHBOARD SECTION =====
function loadDashboardData() {
    if (USE_MOCK_DATA) {
        // Load monthly summary
        document.getElementById('currentMonth').textContent = MOCK_MONTHLY_SUMMARY.month;
        document.getElementById('highestCalorieDay').textContent = MOCK_MONTHLY_SUMMARY.highestCalorieDay.date;
        document.getElementById('highestCalorieValue').textContent = `${MOCK_MONTHLY_SUMMARY.highestCalorieDay.calories} calories`;
        document.getElementById('lowestCalorieDay').textContent = MOCK_MONTHLY_SUMMARY.lowestCalorieDay.date;
        document.getElementById('lowestCalorieValue').textContent = `${MOCK_MONTHLY_SUMMARY.lowestCalorieDay.calories} calories`;
        document.getElementById('avgDailyCalories').textContent = MOCK_MONTHLY_SUMMARY.avgDailyCalories;
        document.getElementById('totalMealsMonth').textContent = MOCK_MONTHLY_SUMMARY.totalMeals;

        // Load daily summary
        const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('currentDate').textContent = today;
        document.getElementById('dailyCalories').textContent = MOCK_DAILY_SUMMARY.calories;
        document.getElementById('dailyProtein').textContent = MOCK_DAILY_SUMMARY.protein;
        document.getElementById('dailyCarbs').textContent = MOCK_DAILY_SUMMARY.carbs;
        document.getElementById('dailyFats').textContent = MOCK_DAILY_SUMMARY.fats;

        // Load insights
        loadInsights();
    } else {
        // TODO: Replace with actual API calls
        // fetch(`/api/users/${currentUser}/dashboard/monthly`)
        //     .then(response => response.json())
        //     .then(data => {
        //         // Load monthly data
        //     });

        // fetch(`/api/users/${currentUser}/dashboard/daily`)
        //     .then(response => response.json())
        //     .then(data => {
        //         // Load daily data
        //     });

        // fetch(`/api/users/${currentUser}/insights`)
        //     .then(response => response.json())
        //     .then(data => {
        //         // Load insights
        //     });
    }
}

function loadInsights() {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = '';

    MOCK_INSIGHTS.forEach(insight => {
        const insightCard = document.createElement('div');
        insightCard.className = `insight-card insight-${insight.type}`;
        insightCard.innerHTML = `
            <div class="insight-icon">
                <i class="fas ${insight.icon}"></i>
            </div>
            <div class="insight-content">
                <h4>${insight.title}</h4>
                <p>${insight.message}</p>
            </div>
        `;
        container.appendChild(insightCard);
    });
}

// ===== HISTORY SECTION =====
function loadHistoryData() {
    if (USE_MOCK_DATA) {
        loadMealHistory();
        loadAlerts();
    } else {
        // TODO: Replace with actual API calls
        // fetch(`/api/users/${currentUser}/meals/history`)
        //     .then(response => response.json())
        //     .then(data => {
        //         // Load meal history
        //     });

        // fetch(`/api/users/${currentUser}/alerts`)
        //     .then(response => response.json())
        //     .then(data => {
        //         // Load alerts
        //     });
    }
}

function loadMealHistory() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    MOCK_MEAL_HISTORY.forEach(meal => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 600;">${meal.datetime}</td>
            <td>${meal.items.join(', ')}</td>
            <td>${meal.calories}</td>
            <td>${meal.protein}</td>
            <td>${meal.carbs}</td>
            <td>${meal.fats}</td>
            <td>${getStatusBadge(meal.status)}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadAlerts() {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';

    MOCK_ALERTS.forEach(alert => {
        const alertCard = document.createElement('div');
        alertCard.className = `alert-card alert-${alert.type}`;
        alertCard.innerHTML = `
            <div class="alert-icon">
                <i class="fas ${alert.type === 'warning' ? 'fa-exclamation-triangle' : alert.type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            </div>
            <div class="alert-content">
                <p class="alert-date">${alert.date}</p>
                <p class="alert-message">${alert.message}</p>
            </div>
        `;
        container.appendChild(alertCard);
    });
}

function getStatusBadge(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'healthy') {
        return '<span class="badge badge-healthy">🟢 Healthy</span>';
    } else if (statusLower === 'warning') {
        return '<span class="badge badge-warning">🟡 Warning</span>';
    } else if (statusLower === 'intervention') {
        return '<span class="badge badge-intervention">🔴 Intervention</span>';
    }
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
