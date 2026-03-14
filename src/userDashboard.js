import { getUserProfile, getUserMeals } from './supabase.js';
import { generateDashboardInsights } from './ai-service.js';
import localforage from 'localforage';
import { initAuthGuard } from './auth-guard.js';
initAuthGuard();

// ===== CONFIGURATION =====
// Set to false when integrating with backend API
const USE_MOCK_DATA = false;

// ===== AUTH CHECK =====


// ===== MOCK DATA (remove this section when integrating with backend) =====
const MOCK_MONTHLY_SUMMARY = {
    month: 'March 2026',
    highestCalorieDay: { date: 'March 5, 2026', calories: 2450 },
    lowestCalorieDay: { date: 'March 2, 2026', calories: 1420 },
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

// ===== DASHBOARD SECTION =====
async function loadDashboardData() {
    // Load static mock stats for the top section
    document.getElementById('currentMonth').textContent = MOCK_MONTHLY_SUMMARY.month;
    document.getElementById('highestCalorieDay').textContent = MOCK_MONTHLY_SUMMARY.highestCalorieDay.date;
    document.getElementById('highestCalorieValue').textContent = `${MOCK_MONTHLY_SUMMARY.highestCalorieDay.calories} kcal`;
    document.getElementById('lowestCalorieDay').textContent = MOCK_MONTHLY_SUMMARY.lowestCalorieDay.date;
    document.getElementById('lowestCalorieValue').textContent = `${MOCK_MONTHLY_SUMMARY.lowestCalorieDay.calories} kcal`;
    document.getElementById('avgDailyCalories').textContent = MOCK_MONTHLY_SUMMARY.avgDailyCalories;
    document.getElementById('totalMealsMonth').textContent = MOCK_MONTHLY_SUMMARY.totalMeals;

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('currentDate').textContent = today;
    document.getElementById('dailyCalories').textContent = MOCK_DAILY_SUMMARY.calories;
    document.getElementById('dailyProtein').textContent = MOCK_DAILY_SUMMARY.protein;
    document.getElementById('dailyCarbs').textContent = MOCK_DAILY_SUMMARY.carbs;
    document.getElementById('dailyFats').textContent = MOCK_DAILY_SUMMARY.fats;

    renderNutritionChart();

    // Trigger AI Insights Generation
    await loadAIInsights();
}

async function loadAIInsights() {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = '<p style="padding: 1rem;"><em>Analyzing 14-day history and generating insights...</em></p>';

    try {
        // Fetch current user ID (adjust this based on how you handle auth/sessions)
        const record = await localforage.getItem("lastSubmittedRecord");
        if (!record || !record.userID) {
            container.innerHTML = '<p>Please log in or upload a meal to see AI insights.</p>';
            return;
        }

        const userId = record.userID;

        console.log("Getting user details")
        const userProfile = await getUserProfile(userId);
        const allUserMeals = await getUserMeals(userId);

        // Filter for last 14 days
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const recentMeals = allUserMeals.filter(meal => new Date(meal.created_at) >= twoWeeksAgo);

        // Call our new AI function
        console.log("Generating Dashboard Insights")
        const aiData = await generateDashboardInsights(userProfile, recentMeals);

        // 1. Update the Status Banner
        updateOverallStatus(aiData.user_status);

        // 2. Add the Summary Text
        let summaryEl = document.getElementById('aiSummaryText');
        if (!summaryEl) {
            summaryEl = document.createElement('div');
            summaryEl.id = 'aiSummaryText';
            // Styling the summary text nicely above the insight cards
            summaryEl.style.cssText = "margin-bottom: 1.5rem; padding: 1.2rem; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 6px; color: #0369a1; font-size: 1.05rem; line-height: 1.5;";
            container.parentNode.insertBefore(summaryEl, container);
        }
        summaryEl.innerHTML = `<i class="fas fa-robot"></i> <strong>Clinical Assessment:</strong> ${aiData.user_assessment_text}`;

        // 3. Render the 4 Insight Rows
        container.innerHTML = '';

        // Map the object keys to the specific UI styles/icons requested
        const insightConfig = [
            { data: aiData.insight_good, type: 'success', icon: 'fa-check-circle' },        // Index 0: Good
            { data: aiData.insight_improve, type: 'warning', icon: 'fa-arrow-up' },         // Index 1: Improve
            { data: aiData.insight_pattern, type: 'info', icon: 'fa-chart-pie' },           // Index 2: Pattern Analysis
            { data: aiData.insight_risk, type: 'danger', icon: 'fa-exclamation-triangle' }  // Index 3: Risk
        ];

        let hasInsights = false;

        insightConfig.forEach(item => {
            // If the AI returned null or an empty heading for this category, skip rendering it
            if (!item.data || !item.data.heading || item.data.heading.trim() === '') return;

            hasInsights = true;
            const insightCard = document.createElement('div');
            insightCard.className = `insight-card insight-${item.type}`;
            insightCard.innerHTML = `
                <div class="insight-icon">
                    <i class="fas ${item.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${item.data.heading}</h4>
                    <p>${item.data.description}</p>
                </div>
            `;
            container.appendChild(insightCard);
        });

        if (!hasInsights) {
            container.innerHTML = '<p style="padding: 1rem; color: #6b7280;">No specific insights detected for this period.</p>';
        }

    } catch (error) {
        console.error("Failed to load AI Insights:", error);
        container.innerHTML = '<p style="color:red; padding: 1rem;">Failed to load AI insights. Check console for details.</p>';
    }
}

// ===== STATUS UPDATER =====
// Now accepts 0, 1, or 2 from the AI model
function updateOverallStatus(statusCode) {
    const statusContainer = document.getElementById('overallUserStatus');
    if (!statusContainer) return;

    if (statusCode === 2) {
        statusContainer.className = 'status-banner intervention';
        statusContainer.innerHTML = '<i class="fas fa-exclamation-triangle"></i> OVERALL STATUS: Intervention Needed (High Risk)';
    } else if (statusCode === 1) {
        statusContainer.className = 'status-banner warning';
        statusContainer.innerHTML = '<i class="fas fa-exclamation-circle"></i> OVERALL STATUS: Warning (Moderate Risk)';
    } else {
        statusContainer.className = 'status-banner healthy';
        statusContainer.innerHTML = '<i class="fas fa-check-circle"></i> OVERALL STATUS: Healthy (Good Management)';
    }
}

// ===== CHARTS =====
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
                    data: [1600, 1850, 1480, 2100, 1650, 2450, 1750],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Carbs (g)',
                    data: [140, 190, 120, 210, 195, 260, 130],
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
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
    // Implement logout logic here
});

// ===== INITIALIZE =====
loadDashboardData();