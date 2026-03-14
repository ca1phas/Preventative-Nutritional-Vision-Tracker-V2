import './style.css';
import { supabase } from './supabaseConnect.js';

// Admin Dashboard access requires admin authentication
if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    // Uncomment to enforce admin login:
    // alert('Admin login required.');
    // window.location.href = 'index.html';
}

const loading = document.getElementById('loading');
const error = document.getElementById('error');
const tableBody = document.getElementById('userTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const sortSelect = document.getElementById('sortSelect');

let allPatients = [];
let statusPieChart = null;

// Status mapping: DB stores 0, 1, 2; labels are Healthy, Alert, Intervention
const STATUS_TO_LABEL = { 0: 'Healthy', 1: 'Alert', 2: 'Intervention' };
const LABEL_TO_STATUS = { Healthy: 0, Alert: 1, Intervention: 2 };

// Pie chart colors for each status
const STATUS_COLORS = {
    Healthy: 'rgba(16, 185, 129, 0.85)',
    Alert: 'rgba(245, 158, 11, 0.85)',
    Intervention: 'rgba(239, 68, 68, 0.85)'
};

// Map the integer status column (0=healthy, 1=alert/warning, 2=intervention) to a badge
function getStatusBadge(statusInt) {
    const s = Number(statusInt);
    if (s === 0) return '<span class="badge badge-healthy">🟢 Healthy</span>';
    if (s === 1) return '<span class="badge badge-warning">🟡 Alert</span>';
    if (s === 2) return '<span class="badge badge-intervention">🔴 Intervention</span>';
    return '<span class="badge">Unknown</span>';
}

// Format a UTC ISO timestamp as a human-readable relative time
function relativeTime(isoString) {
    if (!isoString) return 'N/A';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

// Get status label from integer
function getStatusLabel(statusInt) {
    return STATUS_TO_LABEL[Number(statusInt)] ?? null;
}

// Fetch patients from database
async function fetchPatients() {
    const { data: users, error: dbError } = await supabase
        .from('users')
        .select('id, name, age, gender, weight, height, status, updated_at')
        .eq('is_admin', false)
        .order('updated_at', { ascending: false });

    if (dbError) throw dbError;
    return users || [];
}

// Apply search, filter, and sort to get displayed list
function getFilteredAndSortedPatients() {
    let list = [...allPatients];

    // Search by name
    const search = (searchInput?.value || '').trim().toLowerCase();
    if (search) {
        list = list.filter(p => (p.name || '').toLowerCase().includes(search));
    }

    // Filter by status label (Healthy, Alert, Intervention)
    const filterLabel = statusFilter?.value ?? '';
    if (filterLabel) {
        const statusInt = LABEL_TO_STATUS[filterLabel];
        if (statusInt !== undefined) {
            list = list.filter(p => Number(p.status) === statusInt);
        }
    }

    // Sort alphabetically by name
    const sortDir = sortSelect?.value ?? 'az';
    list.sort((a, b) => {
        const na = (a.name || '').toLowerCase();
        const nb = (b.name || '').toLowerCase();
        return sortDir === 'za' ? nb.localeCompare(na) : na.localeCompare(nb);
    });

    return list;
}

// Build status distribution for pie chart from filtered patients
function getStatusDistribution(patients) {
    const dist = { Healthy: 0, Alert: 0, Intervention: 0 };
    for (const p of patients) {
        const label = getStatusLabel(p.status);
        if (label && dist[label] !== undefined) dist[label]++;
    }
    return dist;
}

// Render the table
function renderTable(patients) {
    if (!patients || patients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:2rem;">No patients match your search or filter.</td></tr>';
        return;
    }

    tableBody.innerHTML = patients.map(user => {
        const bmi = (user.weight && user.height)
            ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
            : '-';
        return `
            <tr>
                <td>${escapeHtml(user.name || user.id)}</td>
                <td>${relativeTime(user.updated_at)}</td>
                <td>${user.age ?? '-'}</td>
                <td>BMI: ${bmi}</td>
                <td>${getStatusBadge(user.status)}</td>
                <td>
                    <a href="result.html?userID=${encodeURIComponent(user.id)}" class="btn-view">View</a>
                </td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(val) {
    if (val == null) return '';
    return String(val)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// Update pie chart with filtered data
function updatePieChart(patients) {
    const dist = getStatusDistribution(patients);
    const labels = [];
    const data = [];
    const colors = [];
    const statusOrder = ['Healthy', 'Alert', 'Intervention'];

    for (const label of statusOrder) {
        const count = dist[label] || 0;
        if (count > 0) {
            labels.push(`${label} (${count})`);
            data.push(count);
            colors.push(STATUS_COLORS[label]);
        }
    }

    const ctx = document.getElementById('statusPieChart');
    if (!ctx) return;

    if (statusPieChart) statusPieChart.destroy();

    if (data.length === 0) {
        statusPieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No data'],
                datasets: [{ data: [1], backgroundColor: ['#e5e7eb'], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
        const legendEl = document.getElementById('pieChartLegend');
        if (legendEl) legendEl.innerHTML = '';
        return;
    }

    statusPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                            return ` ${ctx.raw} patients (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // Update custom legend labels: "Healthy (1) 100%"
    const legendEl = document.getElementById('pieChartLegend');
    if (legendEl) {
        const total = data.reduce((a, b) => a + b, 0);
        legendEl.innerHTML = statusOrder
            .filter(label => (dist[label] || 0) > 0)
            .map(label => {
                const count = dist[label];
                const pctVal = total ? (count / total) * 100 : 0;
                const pctStr = pctVal % 1 === 0 ? String(Math.round(pctVal)) : pctVal.toFixed(1);
                const color = STATUS_COLORS[label];
                return `<span class="pie-chart-legend-item"><span class="legend-dot" style="background:${color}"></span>${label} ${pctStr}%</span>`;
            })
            .join('');
    }
}

// Refresh table and pie chart from current filters
function refresh() {
    const filtered = getFilteredAndSortedPatients();
    renderTable(filtered);
    updatePieChart(filtered);
}

async function loadDashboard() {
    loading.classList.remove('hidden');
    error.classList.add('hidden');

    try {
        allPatients = await fetchPatients();
        refresh();
    } catch (err) {
        error.textContent = `Unable to load dashboard data: ${err.message}`;
        error.classList.remove('hidden');
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:2rem;">Failed to load data.</td></tr>';
    } finally {
        loading.classList.add('hidden');
    }
}

// Event listeners
searchInput?.addEventListener('input', () => refresh());
statusFilter?.addEventListener('change', () => refresh());
sortSelect?.addEventListener('change', () => refresh());

// Handle Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
});
loadDashboard();