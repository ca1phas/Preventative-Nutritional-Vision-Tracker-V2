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
    const { isAdmin } = await authenticateUser(email, password);

    const pendingRole = sessionStorage.getItem('pendingRole');
    sessionStorage.removeItem('pendingRole');

    // Route based on actual database role
    if (isAdmin) {
      // Admin user — redirect to admin dashboard
      window.location.href = 'dashboard.html?tab=patients';
    } else if (pendingRole === 'admin') {
      // Tried to access admin portal but they do not have the is_admin flag
      errorMsg.textContent = 'You do not have admin access.';
      errorMsg.style.display = 'block';
      loginBtn.textContent = 'Login';
      loginBtn.disabled = false;
      await logoutUser();
    } else {
      // Regular user — redirect to the homepage
      window.location.href = 'index.html';
    }

  } catch (error) {
    errorMsg.textContent = error.message;
    errorMsg.style.display = 'block';
    loginBtn.textContent = 'Login';
    loginBtn.disabled = false;
  }
});