import './style.css';

// ==========================================
// UI & Navigation Logic
// ==========================================

// Smooth scrolling for specific buttons
document.getElementById('learnMoreBtn')?.addEventListener('click', () => {
  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('contactTeamBtn')?.addEventListener('click', () => {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('getStartedBtn')?.addEventListener('click', () => {
  window.location.href = 'upload.html';
});

// User dropdown functionality
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');

if (userMenuBtn && userDropdown) {
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    userDropdown.classList.remove('show');
  });
}

// Role selection handlers (Mock Auth)
document.getElementById('adminRole')?.addEventListener('click', (e) => {
  e.preventDefault();

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin123';

  const inputUsername = prompt('Enter Admin Username:');
  if (inputUsername === null) return;

  const inputPassword = prompt('Enter Admin Password:');
  if (inputPassword === null) return;

  if (inputUsername.trim() === ADMIN_USERNAME && inputPassword === ADMIN_PASSWORD) {
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    window.location.href = 'dashboard.html?role=admin';
  } else {
    sessionStorage.removeItem('isAdminAuthenticated');
    alert('Invalid admin credentials. Access denied.');
  }
});

document.getElementById('userRole')?.addEventListener('click', (e) => {
  e.preventDefault();

  const VALID_USERS = {
    'U001': 'user123',
    'U002': 'user123',
    'U003': 'user123',
    'DOC001': 'doc123',
    'PATIENT123': 'patient123'
  };

  const inputUsername = prompt('Enter User ID:');
  if (inputUsername === null) return;

  const inputPassword = prompt('Enter Password:');
  if (inputPassword === null) return;

  const username = inputUsername.trim();
  if (VALID_USERS.hasOwnProperty(username) && VALID_USERS[username] === inputPassword) {
    sessionStorage.setItem('userID', username);
    sessionStorage.setItem('isUserAuthenticated', 'true');
    window.location.href = 'user-dashboard.html';
  } else {
    sessionStorage.removeItem('userID');
    sessionStorage.removeItem('isUserAuthenticated');
    alert('Invalid user credentials. Access denied.');
  }
});

document.getElementById('loginBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'login.html';
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Active navigation highlighting
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a');

  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// Mobile menu toggle functionality
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle && navMenu) {
  mobileMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu.classList.toggle('mobile-open');

    const icon = mobileMenuToggle.querySelector('i');
    if (navMenu.classList.contains('mobile-open')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    } else {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('mobile-open');
      const icon = mobileMenuToggle.querySelector('i');
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      navMenu.classList.remove('mobile-open');
      const icon = mobileMenuToggle.querySelector('i');
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });
}