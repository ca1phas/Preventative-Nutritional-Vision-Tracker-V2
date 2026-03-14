document.getElementById('learnMoreBtn')?.addEventListener('click', () => {
  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('contactTeamBtn')?.addEventListener('click', () => {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
});

// need login before click "Start Tracking" and "Get Started Now" button
// Need user to login first


document.getElementById('getStartedBtn')?.addEventListener('click', requireLogin);
document.getElementById('startTrackingBtn')?.addEventListener('click', requireLogin);

// Dropdown
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');
if (userMenuBtn && userDropdown) {
  userMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('show'); });
  document.addEventListener('click', () => userDropdown.classList.remove('show'));
}

// Admin — login via login.html, admin check happens in dashboard.js via is_admin flag
document.getElementById('adminRole')?.addEventListener('click', (e) => {
  e.preventDefault();
  // Refirect user to dashboard.html if auth
  // window.location.href = 'dashboard.html';

  // Refirect them to login.html if not
  // window.location.href = 'login.html';
});

// User — login via login.html
document.getElementById('userRole')?.addEventListener('click', (e) => {
  e.preventDefault();

  // Refirect user to userProfile.html if auth
  // window.location.href = 'userProfile.html';

  // Refirect them to login.html if not
  // window.location.href = 'login.html';
});

document.getElementById('loginBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'login.html';
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Active nav on scroll
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a');
  let current = '';
  sections.forEach(section => { if (pageYOffset >= section.offsetTop - 200) current = section.getAttribute('id'); });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
  });
});

// Mobile menu
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');
if (mobileMenuToggle && navMenu) {
  mobileMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu.classList.toggle('mobile-open');
    const icon = mobileMenuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
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

// let homepage show same header as other pages when user logged in
document.addEventListener('DOMContentLoaded', () => {
  const isAuth = sessionStorage.getItem('isUserAuthenticated') === 'true';
  if (isAuth) {
    const navMenu = document.getElementById('navMenu');
    const userControls = document.querySelector('.user-controls');

    if (navMenu) {
      navMenu.innerHTML = `
                <li><a href="userProfile.html">Profile</a></li>
                <li><a href="userDashboard.html">Dashboard</a></li>
                <li><a href="history.html">History</a></li>
                <li><a href="upload.html">Upload Meal</a></li>
                <li class="user-dropdown" style="position: relative;">
                  <a href="#" style="cursor: pointer;" onclick="this.nextElementSibling.classList.toggle('show'); return false;">
                    Homepage <i class="fas fa-chevron-down"></i>
                  </a>
                  <div class="dropdown-menu" style="position: absolute; top: 100%; left: 0;">
                    <a href="index.html#about" class="dropdown-item">About</a>
                    <a href="index.html#solution" class="dropdown-item">Solution</a>
                    <a href="index.html#features" class="dropdown-item">Features</a>
                    <a href="index.html#contact" class="dropdown-item">Contact</a>
                  </div>
                </li>
            `;
    }

    if (userControls) {
      userControls.innerHTML = '<button id="logoutBtnNav" class="btn-logout">Logout</button>';
      document.getElementById('logoutBtnNav').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
      });
    }
  }
});

// click blank blank place to close dropdown menu
document.addEventListener('click', function (event) {
  const dropdowns = document.querySelectorAll('.user-dropdown');
  dropdowns.forEach(dropdown => {
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu && menu.classList.contains('show') && !dropdown.contains(event.target)) {
      menu.classList.remove('show');
    }
  });
});