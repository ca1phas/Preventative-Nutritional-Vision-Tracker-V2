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

// Map the integer status column (0=healthy, 1=warning, 2=intervention) to a badge
function getStatusBadge(statusInt) {
    const s = Number(statusInt);
    if (s === 0) return '<span class="badge badge-healthy">🟢 Healthy</span>';
    if (s === 1) return '<span class="badge badge-warning">🟡 Warning</span>';
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

async function loadDashboard() {
    loading.classList.remove('hidden');
    error.classList.add('hidden');

    const { data: users, error: dbError } = await supabase
        .from('users')
        .select('id, name, age, gender, weight, height, status, updated_at')
        .eq('is_admin', false)
        .order('updated_at', { ascending: false });

    loading.classList.add('hidden');

    if (dbError) {
        error.textContent = `Unable to load dashboard data: ${dbError.message}`;
        error.classList.remove('hidden');
        return;
    }

    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:2rem;">No users found.</td></tr>';
        return;
    }

    tableBody.innerHTML = users.map(user => {
        const bmi = (user.weight && user.height)
            ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
            : '-';
        return `
            <tr>
                <td>${user.name || user.id}</td>
                <td>${relativeTime(user.updated_at)}</td>
                <td>${user.age || '-'}</td>
                <td>BMI: ${bmi}</td>
                <td>${getStatusBadge(user.status)}</td>
                <td>
                    <a href="result.html?userID=${encodeURIComponent(user.id)}" class="btn-view">View</a>
                </td>
            </tr>
        `;
    }).join('');
}

// Handle Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
});

loadDashboard();