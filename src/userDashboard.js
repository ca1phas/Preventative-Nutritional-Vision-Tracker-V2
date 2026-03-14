import { supabase, logoutUser } from './supabase.js';
import './auth-guard.js';


// ===== CONFIGURATION =====
// Set to false when integrating with backend API
const USE_MOCK_DATA = false;

// ===== AUTH CHECK =====


// ===== MOCK DATA (remove this section when integrating with backend) =====
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

// ===== END OF MOCK DATA =====

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

        updateOverallStatus(MOCK_DAILY_SUMMARY.carbs);
        renderNutritionChart();

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

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
});
// use logout

// ===== INITIALIZE =====
loadDashboardData();

// overall status
function updateOverallStatus(avgCarbs) {
    const statusContainer = document.getElementById('overallUserStatus');
    if (!statusContainer) return;

    if (avgCarbs > 150) {
        statusContainer.className = 'status-banner intervention';
        statusContainer.innerHTML = '<i class="fas fa-exclamation-triangle"></i> OVERALL STATUS: Intervention Needed (High Risk)';
    } else if (avgCarbs > 80) {
        statusContainer.className = 'status-banner warning';
        statusContainer.innerHTML = '<i class="fas fa-exclamation-circle"></i> OVERALL STATUS: Warning (Moderate Risk)';
    } else {
        statusContainer.className = 'status-banner healthy';
        statusContainer.innerHTML = '<i class="fas fa-check-circle"></i> OVERALL STATUS: Healthy (Good Management)';
    }
}

//
function renderNutritionChart() {
    const ctx = document.getElementById('nutritionTrendChart');
    if (!ctx) return;

    if (window.myNutritionChart) {
        window.myNutritionChart.destroy();
    }

    window.myNutritionChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Calories (kcal)',
                    data: [1600, 1850, 1480, 2100, 1650, 2450, 1750], // Mock Data
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Carbs (g)',
                    data: [140, 190, 120, 210, 195, 260, 130], // Mock Data
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}