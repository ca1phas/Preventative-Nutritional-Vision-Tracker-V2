import './style.css';

document.getElementById('learnMoreBtn')?.addEventListener('click', () => {
  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('contactTeamBtn')?.addEventListener('click', () => {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('getStartedBtn')?.addEventListener('click', () => {
  window.location.href = 'upload.html';
});

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
  sessionStorage.setItem('pendingRole', 'admin');
  window.location.href = 'login.html';
});

// User — login via login.html
document.getElementById('userRole')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'login.html';
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