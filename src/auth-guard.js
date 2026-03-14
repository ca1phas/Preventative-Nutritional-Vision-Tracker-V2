import { supabase, logoutUser } from "./supabase.js";

const publicPages = ["/login.html", "/index.html", "/"];

async function initAuthGuard() {
  const currentPath = window.location.pathname;
  const isPublicPage = publicPages.some((page) => currentPath.endsWith(page));
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Not logged in, trying to access protected page
  if (!session && !isPublicPage) {
    window.location.replace("login.html");
    return;
  }

  // 2. Already logged in, trying to access login page
  //if (session && currentPath.endsWith("login.html")) {
  //const adminStatus = await isAdmin();
  //const destination = adminStatus ? "dashboard.html" : "userDashboard.html";
  //window.location.replace(destination);
  //return;
  // }

  // 3. Admin-only page check
  //if (session && currentPath.endsWith("dashboard.html")) {
  // const adminStatus = await isAdmin();
  // if (!adminStatus) {
  //alert("Admin access required");
  //window.location.replace("index.html");
  // return;
  // }
  // }

  //3.5  User try to access other pages when user details not filled
  if (session) {
    if (currentPath.endsWith("login.html")) {
      const adminStatus = await isAdmin();
      const destination = adminStatus ? "dashboard.html" : "userDashboard.html";
      window.location.replace(destination);
      return;
    }
    if (currentPath.endsWith("dashboard.html")) {
      const adminStatus = await isAdmin();
      if (!adminStatus) {
        alert("Admin access required");
        window.location.replace("index.html");
        return;
      }
    }
    if (!isAdmin() && !validateUserProfile().valid && !currentPath.endsWith("userProfile.html")) {
      window.location.replace("userProfile.html");
      return;
    }
  }

  // 4. Attach logout buttons
  if (session) {
    const logoutButtons = document.querySelectorAll("#logoutBtn, .btn-logout");
    logoutButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        button.textContent = "Logging out...";
        button.disabled = true;

        try {
          await logoutUser();
          window.location.replace("index.html");
        } catch (err) {
          console.error("Logout error:", err);
          alert("Failed to logout. Please try again.");
          button.textContent = "Logout";
          button.disabled = false;
        }
      });
    });
  }
}

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.replace("login.html");
  }
});

initAuthGuard();

export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user || null;
}

export async function redirectIfNotAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
  }
}

export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin || false;
}

export async function validateUserProfile() {
  const user = await getCurrentUser();
  if (!user) {
    const msg = "User not logged in";
    console.error(msg);
    return { valid: false, message: msg };
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("name, age, gender, weight, height, medical_notes")
    .eq("id", user.id)
    .single();

  if (error) {
    const msg = "Could not fetch profile";
    console.error(msg);
    return { valid: false, message: msg };
  }

  const requiredFields = [
    "name",
    "age",
    "gender",
    "weight",
    "height",
    "medical_notes",
  ];
  const missingFields = [];

  requiredFields.forEach((field) => {
    if (!profile[field]) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    const msg = `Missing required fields: ${missingFields.join(", ")}`;
    console.warn(msg);
    console.warn("Missing fields:", missingFields);
    return {
      valid: false,
      message: msg,
      missingFields,
    };
  }

  console.log("✓ Profile is complete");
  console.log("Profile data:", profile);
  return {
    valid: true,
    message: "Profile complete",
    profile,
  };
}
