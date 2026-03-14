import { logoutUser } from './supabase.js';
import { getCurrentUser, initAuthGuard } from './auth-guard.js';

initAuthGuard();

document.getElementById('learnMoreBtn')?.addEventListener('click', () => {
  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('contactTeamBtn')?.addEventListener('click', () => {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
});

// need login before click "Start Tracking" and "Get Started Now" button ( DONE )
// Need user to login first
// If user clicks User Dashboard or AdminPortal Button it also redirects them to login if they are not logged in 

// Admin Portal
document.getElementById('adminRole')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'dashboard.html';
});

// User Dashboard
document.getElementById('userRole')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'userDashboard.html';
});

async function requireLogin(e) {
  e.preventDefault();
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = 'login.html';
  } else {
    // User is logged in, proceed
    const destination = e.target.id === 'getStartedBtn' ? 'userProfile.html' : 'userDashboard.html';
    window.location.href = destination;
  }
}


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
    const href = this.getAttribute('href');

    // Skip if href is just '#' with nothing after it
    if (href === '#') return;

    const target = document.querySelector(href);
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
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const user = await getCurrentUser();
    console.log('User in DOMContentLoaded:', user);

    if (user) {
      const navMenu = document.getElementById('navMenu');
      const userControls = document.querySelector('.user-controls');

      console.log('navMenu exists:', !!navMenu);
      console.log('userControls exists:', !!userControls);

      if (navMenu) {
        navMenu.innerHTML = `
          <li><a href="userProfile.html">Profile</a></li>
          <li><a href="userDashboard.html">Dashboard</a></li>
          <li><a href="history.html">History</a></li>
          <li><a href="upload.html">Upload Meal</a></li>
          <li class="user-dropdown" id="homepageDropdown" style="position: relative;">
            <a href="#" class="dropdown-toggle" style="cursor: pointer;">
              Homepage <i class="fas fa-chevron-down"></i>
            </a>
            <div class="dropdown-menu" style="position: absolute; top: 100%; left: 0; display: none; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 150px;">
              <a href="index.html#about" class="dropdown-item" style="display: block; padding: 10px 15px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">About</a>
              <a href="index.html#solution" class="dropdown-item" style="display: block; padding: 10px 15px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">Solution</a>
              <a href="index.html#features" class="dropdown-item" style="display: block; padding: 10px 15px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">Features</a>
              <a href="index.html#contact" class="dropdown-item" style="display: block; padding: 10px 15px; text-decoration: none; color: #333;">Contact</a>
            </div>
          </li>
        `;

        // Setup dropdown - delay to ensure DOM is ready
        setTimeout(() => {
          const dropdownToggle = navMenu.querySelector('.dropdown-toggle');
          const dropdownMenu = navMenu.querySelector('.dropdown-menu');

          console.log('dropdownToggle exists:', !!dropdownToggle);
          console.log('dropdownMenu exists:', !!dropdownMenu);

          if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Dropdown clicked');
              const isVisible = dropdownMenu.style.display === 'block';
              dropdownMenu.style.display = isVisible ? 'none' : 'block';
              console.log('Dropdown now:', dropdownMenu.style.display);
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
              if (!document.getElementById('homepageDropdown')?.contains(e.target)) {
                dropdownMenu.style.display = 'none';
              }
            });
          }
        }, 100);
      }

      if (userControls) {
        userControls.innerHTML = '<button id="logoutBtnNav" class="btn-logout">Logout</button>';

        setTimeout(() => {
          const logoutBtn = document.getElementById('logoutBtnNav');
          if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              logoutBtn.disabled = true;
              logoutBtn.textContent = 'Logging out...';

              try {
                await logoutUser();
                window.location.replace('index.html');
              } catch (err) {
                console.error('Logout error:', err);
                logoutBtn.disabled = false;
                logoutBtn.textContent = 'Logout';
              }
            });
          }
        }, 100);
      }
    } else {
      console.log('User not logged in');
    }
  } catch (err) {
    console.error('Error in DOMContentLoaded:', err);
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