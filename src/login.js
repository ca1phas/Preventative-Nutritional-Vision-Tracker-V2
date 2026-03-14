import { authenticateUser, logoutUser } from './supabase.js';
import { initAuthGuard } from './auth-guard.js';
initAuthGuard();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      await authenticateUser(email, password)
      window.location.href = 'userProfile.html';
    } catch (err) {
      alert('Invalid user ID or password. Please try again.');
    }
  });

//Login Done 14/3/26