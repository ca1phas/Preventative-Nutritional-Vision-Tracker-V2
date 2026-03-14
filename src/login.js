import { authenticateUser, logoutUser } from './supabase.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // TODO: login
  // After successfully login
  // window.location.href = 'userProfile.html';
  // else
  // alert('Invalid user ID or password. Please try again.');
});