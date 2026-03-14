import './style.css';
import { supabase, getUserProfile, getUserMeals } from './supabase.js';
import { generateDashboardInsights } from './ai-service.js';
import { initAuthGuard } from './auth-guard.js';

// Initialize Authentication Guard
initAuthGuard();

const state = {
    viewMode: 'week',
    offset: 0,
    chartInstance: null,
    budget: 2000,
    userDB: {}
};

function toggleLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

// ===== DATA FETCHING =====

async function fetchUserProfileAndBudget() {
    // Assuming auth-guard sets this, or you get it from the session
    const userId = sessionStorage.getItem('supabaseUserId');
    if (!userId) return;

    try {
        const profile = await getUserProfile(userId);

        if (profile && profile.weight && profile.height && profile.age && profile.gender) {
            // Calculate BMR and TDEE budget
            let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
            if (profile.gender.toLowerCase() === 'male') bmr += 5;
            else bmr -= 161;

            const tdee = Math.round(bmr * 1.2);
            state.budget = tdee > 0 ? tdee : 2000;
        }
    } catch (error) {
        console.error('Error fetching user profile for budget:', error);
    }
}

async function fetchUserNutritionData() {
    const userId = sessionStorage.getItem('supabaseUserId');
    if (!userId) return {};

    try {
        // Direct query to aggregate data nicely for the charts
        const { data, error } = await supabase
            .from('meals')
            .select(`
                created_at,
                nutritions (*) 
            `)
            .eq('user_id', userId);

        if (error) throw error;

        const processedData = {};

        const mainKeys = ['calories_kcal', 'protein_g', 'total_carbs_g', 'total_fat_g', 'total_sugar_g'];
        const ignoreKeys = ['id', 'serving_size_g'];

        if (data && data.length > 0) {
            data.forEach(entry => {
                if (!entry.nutritions) return;

                const date = new Date(entry.created_at);
                const dateStr = date.getFullYear() + '-' +
                    String(date.getMonth() + 1).padStart(2, '0') + '-' +
                    String(date.getDate()).padStart(2, '0');

                if (!processedData[dateStr]) {
                    processedData[dateStr] = { main: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }, extra: {} };
                }

                // Main 5 nutrients
                processedData[dateStr].main.calories += entry.nutritions.calories_kcal || 0;
                processedData[dateStr].main.protein += entry.nutritions.protein_g || 0;
                processedData[dateStr].main.carbs += entry.nutritions.total_carbs_g || 0;
                processedData[dateStr].main.fat += entry.nutritions.total_fat_g || 0;
                processedData[dateStr].main.sugar += entry.nutritions.total_sugar_g || 0;

                // Extra nutrients (View More)
                Object.keys(entry.nutritions).forEach(key => {
                    if (!mainKeys.includes(key) && !ignoreKeys.includes(key) && entry.nutritions[key] !== null) {
                        if (!processedData[dateStr].extra[key]) processedData[dateStr].extra[key] = 0;
                        processedData[dateStr].extra[key] += entry.nutritions[key];
                    }
                });
            });
        }
        return processedData;
    } catch (error) {
        console.error('Error fetching nutrition data:', error);
        return {};
    }
}

// ===== INITIALIZATION & EVENTS =====

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    toggleLoading(true);

    try {
        const [userDB] = await Promise.all([
            fetchUserNutritionData(),
            fetchUserProfileAndBudget()
        ]);
        state.userDB = userDB;
    } catch (err) {
        console.error("Initialization error:", err);
    } finally {
        toggleLoading(false);
    }

    updateDashboard();

    // Load AI insights asynchronously after UI renders
    loadAIInsights();
});

function setupEventListeners() {
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.viewMode = e.target.dataset.view;
            state.offset = 0;
            updateDashboard();
        });
    });

    document.querySelectorAll('.bottom-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.bottom-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const targetId = e.target.dataset.target;
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // View more function for extra macros
    document.getElementById('toggleExtraMacrosBtn')?.addEventListener('click', function () {
        const wrapper = document.getElementById('extraMacrosWrapper');
        const icon = this.querySelector('i');
        const text = this.querySelector('span');

        if (wrapper.style.gridTemplateRows === '0fr' || !wrapper.style.gridTemplateRows) {
            wrapper.style.gridTemplateRows = '1fr';
            text.innerText = 'View Less';
            icon.style.transform = 'rotate(180deg)';
        } else {
            wrapper.style.gridTemplateRows = '0fr';
            text.innerText = 'View More Nutrients';
            icon.style.transform = 'rotate(0deg)';
        }
    });

    document.getElementById('prevDate').addEventListener('click', () => {
        state.offset -= 1;
        updateDashboard();
    });

    document.getElementById('nextDate').addEventListener('click', () => {
        if (state.offset < 0) {
            state.offset += 1;
            updateDashboard();
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });
}

// ===== AI INSIGHTS ENGINE =====

async function loadAIInsights() {
    const container = document.getElementById('insightsContainer');
    if (!container) return;
    container.innerHTML = '<p style="padding: 1rem; color: #6b7280;"><i class="fas fa-spinner fa-spin"></i> <em>Analyzing your 14-day history to generate clinical insights...</em></p>';

    try {
        const userId = sessionStorage.getItem('supabaseUserId');
        if (!userId) {
            container.innerHTML = '<p>Please log in to see AI insights.</p>';
            return;
        }

        const userProfile = await getUserProfile(userId);
        const allUserMeals = await getUserMeals(userId);

        // Filter for last 14 days
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const recentMeals = allUserMeals.filter(meal => new Date(meal.created_at) >= twoWeeksAgo);

        // Generate Insights
        const aiData = await generateDashboardInsights(userProfile, recentMeals);

        // 1. Update the overall status banner with AI status code
        updateOverallStatus(aiData.user_status);

        // 2. Add the Summary Text above the cards
        let summaryEl = document.getElementById('aiSummaryText');
        if (!summaryEl) {
            summaryEl = document.createElement('div');
            summaryEl.id = 'aiSummaryText';
            summaryEl.style.cssText = "margin-bottom: 1.5rem; padding: 1.2rem; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 6px; color: #0369a1; font-size: 1.05rem; line-height: 1.5;";
            container.parentNode.insertBefore(summaryEl, container);
        }
        summaryEl.innerHTML = `<i class="fas fa-stethoscope"></i> <strong>Clinical Assessment:</strong> ${aiData.user_assessment_text}`;

        // 3. Render the dynamic Insight Cards
        container.innerHTML = '';

        const insightConfig = [
            { data: aiData.insight_good, type: 'success', icon: 'fa-check-circle' },
            { data: aiData.insight_improve, type: 'warning', icon: 'fa-arrow-up' },
            { data: aiData.insight_pattern, type: 'info', icon: 'fa-chart-pie' },
            { data: aiData.insight_risk, type: 'danger', icon: 'fa-exclamation-triangle' }
        ];

        let hasInsights = false;

        insightConfig.forEach(item => {
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
            container.innerHTML = '<p style="padding: 1rem; color: #6b7280;">No specific clinical insights detected for this period.</p>';
        }

    } catch (error) {
        console.error("Failed to load AI Insights:", error);
        container.innerHTML = '<p style="color:red; padding: 1rem;">Failed to load AI insights. Check console for details.</p>';
    }
}

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

// ===== DASHBOARD UI RENDERING =====

function updateDashboard() {
    const { startDate, endDate, label } = calculateDateRange(state.viewMode, state.offset);
    document.getElementById('dateLabel').innerText = label;

    const periodData = extractDataForPeriod(startDate, endDate);
    updateStats(periodData);
    renderChart(periodData, startDate, endDate);
    updateTodayStatus();

    document.getElementById('nextDate').style.opacity = state.offset === 0 ? '0.3' : '1';
    document.getElementById('nextDate').style.cursor = state.offset === 0 ? 'not-allowed' : 'pointer';
}

function calculateDateRange(mode, offset) {
    const now = new Date();
    let startDate, endDate, label;

    if (mode === 'week') {
        const dayOfWeek = now.getDay() || 7;
        now.setDate(now.getDate() - dayOfWeek + 1 + (offset * 7));
        startDate = new Date(now.setHours(0, 0, 0, 0));

        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        if (offset === 0) label = "This week";
        else if (offset === -1) label = "Last week";
        else label = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
        now.setMonth(now.getMonth() + offset);
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        if (offset === 0) label = "This month";
        else if (offset === -1) label = "Last month";
        else label = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return { startDate, endDate, label };
}

function extractDataForPeriod(start, end) {
    const result = [];
    let current = new Date(start);

    while (current <= end) {
        const dateStr = current.getFullYear() + '-' +
            String(current.getMonth() + 1).padStart(2, '0') + '-' +
            String(current.getDate()).padStart(2, '0');

        const dayData = state.userDB[dateStr] || { main: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }, extra: {} };
        result.push({
            dateStr: dateStr,
            dateObj: new Date(current),
            ...dayData.main,
            extra: dayData.extra
        });
        current.setDate(current.getDate() + 1);
    }
    return result;
}

function updateStats(periodData) {
    let totalMain = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };
    let totalExtra = {};
    let daysWithData = 0;

    periodData.forEach(day => {
        if (day.calories > 0) {
            totalMain.calories += day.calories;
            totalMain.protein += day.protein;
            totalMain.carbs += day.carbs;
            totalMain.fat += day.fat;
            totalMain.sugar += day.sugar;

            Object.keys(day.extra).forEach(key => {
                if (!totalExtra[key]) totalExtra[key] = 0;
                totalExtra[key] += day.extra[key];
            });
            daysWithData++;
        }
    });

    const divisor = daysWithData || 1;

    document.getElementById('avgCaloriesLabel').innerText = `${Math.round(totalMain.calories).toLocaleString()} cals in - ${Math.round(totalMain.calories / divisor).toLocaleString()} cals/day (Avg)`;

    document.getElementById('valCal').innerText = Math.round(totalMain.calories / divisor);
    document.getElementById('valPro').innerText = Math.round(totalMain.protein / divisor) + 'g';
    document.getElementById('valCarb').innerText = Math.round(totalMain.carbs / divisor) + 'g';
    document.getElementById('valFat').innerText = Math.round(totalMain.fat / divisor) + 'g';
    document.getElementById('valSug').innerText = Math.round(totalMain.sugar / divisor) + 'g';

    const extraContainer = document.getElementById('extraMacrosContainer');
    extraContainer.innerHTML = '';

    let hasExtraMacros = false;

    Object.keys(totalExtra).forEach(key => {
        const avgValue = Math.round(totalExtra[key] / divisor);

        if (avgValue > 0) {
            hasExtraMacros = true;

            let unit = '';
            let name = key;
            if (key.endsWith('_g')) { unit = 'g'; name = key.slice(0, -2); }
            else if (key.endsWith('_ml')) { unit = 'ml'; name = key.slice(0, -3); }
            else if (key.endsWith('_mg')) { unit = 'mg'; name = key.slice(0, -3); }
            else if (key.endsWith('_mcg')) { unit = 'mcg'; name = key.slice(0, -4); }
            else if (key.endsWith('_kcal')) { unit = 'kcal'; name = key.slice(0, -5); }

            name = name.replace('total_', '').replace(/_/g, ' ');
            name = name.replace(/\b\w/g, l => l.toUpperCase());

            const card = document.createElement('div');
            card.className = 'macro-card extra-mini-card';
            card.innerHTML = `
                <div class="macro-label">${name}</div>
                <div class="macro-value">${avgValue}${unit}</div>
            `;
            extraContainer.appendChild(card);
        }
    });

    const toggleBtnContainer = document.querySelector('.toggle-macros-container');
    if (toggleBtnContainer) {
        if (hasExtraMacros) {
            toggleBtnContainer.style.display = 'block';
        } else {
            toggleBtnContainer.style.display = 'none';
            document.getElementById('extraMacrosWrapper').style.gridTemplateRows = '0fr';
            document.getElementById('toggleExtraMacrosBtn').querySelector('span').innerText = 'View More Nutrients';
            document.getElementById('toggleExtraMacrosBtn').querySelector('i').style.transform = 'rotate(0deg)';
        }
    }
}

function updateTodayStatus() {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    const todayData = state.userDB[todayStr] ? state.userDB[todayStr].main : { calories: 0 };

    const titleEl = document.getElementById('todayStatusTitle');
    const calText = document.getElementById('todayCalText');
    const budgetText = document.getElementById('todayBudgetText');
    const gaugeEl = document.getElementById('calorieGauge');

    calText.innerText = `${Math.round(todayData.calories)} calories consumed`;
    const consumed = Math.round(todayData.calories);
    const target = Math.round(state.budget);
    const remaining = target - consumed;
    calText.innerText = `${consumed} / ${target} kcal`;
    budgetText.innerText = `${Math.abs(remaining)} cal ${remaining >= 0 ? 'left in your budget' : 'over budget'}`;

    let progressPercentage = (todayData.calories / state.budget) * 100;
    if (progressPercentage > 100) progressPercentage = 100;

    if (todayData.calories === 0) {
        titleEl.innerText = "TODAY - NO DATA";
        titleEl.style.color = "#6b7280";
        gaugeEl.style.setProperty('--gauge-color', '#9ca3af');
        gaugeEl.style.setProperty('--progress', '0');
    } else if (todayData.calories > state.budget + 200) {
        titleEl.innerText = "TODAY - OVER BUDGET";
        titleEl.style.color = "#ef4444";
        gaugeEl.style.setProperty('--gauge-color', '#ef4444');
        gaugeEl.style.setProperty('--progress', progressPercentage);
    } else if (todayData.calories < state.budget - 500) {
        titleEl.innerText = "TODAY - UNDER TARGET";
        titleEl.style.color = "#ff9966";
        gaugeEl.style.setProperty('--gauge-color', '#ff9966');
        gaugeEl.style.setProperty('--progress', progressPercentage);
    } else {
        titleEl.innerText = "TODAY - HEALTHY";
        titleEl.style.color = "#10b981";
        gaugeEl.style.setProperty('--gauge-color', '#10b981');
        gaugeEl.style.setProperty('--progress', progressPercentage);
    }
}

function renderChart(periodData, start, end) {
    const ctx = document.getElementById('mainChart').getContext('2d');

    const labels = [];
    const dataPoints = [];
    const backgroundColors = [];

    periodData.forEach(day => {
        if (state.viewMode === 'week') {
            labels.push(day.dateObj.toLocaleDateString('en-US', { weekday: 'short' }));
        } else {
            labels.push(day.dateObj.getDate().toString());
        }

        dataPoints.push(Math.round(day.calories));

        if (day.calories === 0) {
            backgroundColors.push('rgba(0,0,0,0.03)');
        } else if (day.calories > state.budget + 200) {
            backgroundColors.push('#ef4444');
        } else if (day.calories < state.budget - 500) {
            backgroundColors.push('#ff9966');
        } else {
            backgroundColors.push('#10b981');
        }
    });

    if (state.chartInstance) state.chartInstance.destroy();

    state.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: dataPoints,
                backgroundColor: backgroundColors,
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: state.viewMode === 'week' ? 0.6 : 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function (context) { return `${context.raw} kcal`; } } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#e5e7eb', drawBorder: false },
                    ticks: { color: '#6b7280', callback: value => value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#6b7280' }
                }
            },
            animation: { duration: 400 }
        }
    });
}