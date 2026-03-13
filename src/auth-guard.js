// src/auth-guard.js
import { supabase, logoutUser } from './supabase.js';

const publicPages = ['/login.html', '/index.html', '/'];

// Self-executing function to protect the page immediately
async function initAuthGuard() {
    const currentPath = window.location.pathname;
    const isPublicPage = publicPages.some(page => currentPath.endsWith(page));

    // 1. Check the current Supabase session
    const { data: { session } } = await supabase.auth.getSession();

    // 2. Redirect logic
    if (!session && !isPublicPage) {
        // Not logged in, trying to access a protected page
        window.location.replace('login.html');
        return;
    }

    if (session && currentPath.endsWith('login.html')) {
        // Already logged in, trying to access the login page
        window.location.replace('index.html'); // Or dashboard.html depending on role
        return;
    }

    // 3. Attach Logout functionality to your specific HTML buttons
    if (session) {
        // Targets the specific button in your confirm.html and future dashboards
        const logoutButtons = document.querySelectorAll('#logoutBtn, .btn-logout');

        logoutButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                button.textContent = 'Logging out...';
                button.disabled = true;

                // Use the logout function from your supabase.js file
                await logoutUser();
            });
        });
    }
}

// 4. Global listener to boot the user out if they log out from another tab
supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
        window.location.replace('login.html');
    }
});

// Execute immediately
initAuthGuard();

// 5. Export a helper function so your specific page scripts can get the user ID
export async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
}