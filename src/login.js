import './style.css';

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();

  // Demo user credentials (replace with backend auth in production)
  const VALID_USERS = {
    U001: 'user123',
    U002: 'user123',
    U003: 'user123',
    DOC001: 'doc123',
    PATIENT123: 'patient123',
  };

  const userID = document.getElementById('userID').value.trim();
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
