import { authenticateUser, logoutUser } from './supabase.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (
    VALID_USERS.hasOwnProperty(userID) &&
    VALID_USERS[userID] === password
  ) {
    sessionStorage.setItem('userID', userID);
    sessionStorage.setItem('isUserAuthenticated', 'true');
    window.location.href = 'userProfile.html';
  } else {
    alert('Invalid user ID or password. Please try again.');
  }
});