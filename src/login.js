import './style.css';
import { authenticateUser, logoutUser } from './supabase.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');
  const loginBtn = document.getElementById('loginBtn');

  // Reset UI state during load
  loginBtn.textContent = 'Logging in...';
  loginBtn.disabled = true;
  errorMsg.style.display = 'none';

  try {
    // Call the Supabase helper function
    const { user, isAdmin } = await authenticateUser(email, password);

    // Set basic user session
    sessionStorage.setItem('userID', user.id);
    sessionStorage.setItem('isUserAuthenticated', 'true');

    const pendingRole = sessionStorage.getItem('pendingRole');
    sessionStorage.removeItem('pendingRole');

    // Route based on role
    if (isAdmin) {
      // Admin user — redirect to admin dashboard
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      window.location.href = 'dashboard.html?tab=patients';
    } else if (pendingRole === 'admin') {
      // Tried to access admin portal but not an admin
      errorMsg.textContent = 'You do not have admin access.';
      errorMsg.style.display = 'block';
      loginBtn.textContent = 'Login';
      loginBtn.disabled = false;

      // Clear their session to be safe
      await logoutUser();
      sessionStorage.clear();
    } else {
      // Regular user — redirect to user dashboard
      window.location.href = 'user-dashboard.html';
    }

  } catch (error) {
    // Handle Invalid Credentials or Network Errors
    errorMsg.textContent = error.message;
    errorMsg.style.display = 'block';
    loginBtn.textContent = 'Login';
    loginBtn.disabled = false;
  }
});
