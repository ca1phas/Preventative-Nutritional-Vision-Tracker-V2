import './style.css';
import { supabase } from './supabaseConnect.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const DEFAULT_PASSWORD = 'user123';

  if (!username || password !== DEFAULT_PASSWORD) {
    alert('Invalid username or password. Please try again.');
    return;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name')
    .ilike('name', username)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Login lookup failed:', error);
    alert('Unable to login right now. Please try again.');
    return;
  }

  if (!user) {
    alert('Invalid username or password. Please try again.');
    return;
  }

  sessionStorage.setItem('userID', user.name);
  sessionStorage.setItem('supabaseUserId', user.id);
  sessionStorage.setItem('isUserAuthenticated', 'true');
  window.location.href = 'userProfile.html';
});
