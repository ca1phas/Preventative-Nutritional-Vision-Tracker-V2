import './style.css';

// Admin Dashboard access requires admin authentication
// For Hackathon MVP, we can bypass strict auth or leave the mock in place.
if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    // Uncomment this to enforce admin login during the demo
    // alert('Admin login required to access the Admin Portal.');
    // window.location.href = 'index.html';
}

const USE_MOCK_DATA = true;

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
    const statusLower = status.toLowerCase();
    if (statusLower === 'healthy') return '<span class="badge badge-healthy">🟢 Healthy</span>';
    if (statusLower === 'warning') return '<span class="badge badge-warning">🟡 Warning</span>';
    if (statusLower === 'intervention') return '<span class="badge badge-intervention">🔴 Intervention</span>';
    return '<span class="badge">Unknown</span>';
}

async function loadDashboard() {
    loading.classList.remove('hidden');
    error.classList.add('hidden');

    try {
        let users;
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            users = MOCK_USERS;
        }

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.userID}</td>
                <td>${user.lastMeal || 'N/A'}</td>
                <td>${user.calories || '-'}</td>
                <td>${user.carbs ? user.carbs + 'g' : '-'}</td>
                <td>${getStatusBadge(user.status)}</td>
                <td>
                    <a href="result.html?userID=${encodeURIComponent(user.userID)}" class="btn-view" data-user-id="${user.userID}">View</a>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        error.textContent = 'Unable to load dashboard data. Please try again.';
        error.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
}

// Handle Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
});

loadDashboard();