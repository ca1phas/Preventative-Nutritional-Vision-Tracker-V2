import './style.css';
import { supabase } from './supabaseConnect.js';

checkUserAuth();

const DEFAULT_MEAL_IMAGE = '/images/hero-background.jpg';

const currentUser = sessionStorage.getItem('userID') || 'DEMO_USER';
const historyUserDisplay = document.getElementById('historyUserDisplay');
const historyDateFilter  = document.getElementById('historyDateFilter');  
const historyDateClear   = document.getElementById('historyDateClear');
const historyCards       = document.getElementById('historyCards');
const historyEmptyState  = document.getElementById('historyEmptyState');
const logoutBtn          = document.getElementById('logoutBtn');

historyUserDisplay.textContent = `User: ${currentUser}`;

// Load all meals on startup
loadMeals(null);

async function loadMeals(date) {
  let query = supabase
    .from("meals")
    .select("id, image_url, status, created_at")  
    .order("created_at", { ascending: false });

  // Filter by date range if a date is selected
  if (date) {
    const start = `${date}T00:00:00`;
    const end   = `${date}T23:59:59`;
    query = query.gte("created_at", start).lte("created_at", end);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading meals:", error);
    return;
  }

  renderMeals(data);
}

// ✅ Correct variable name: historyDateFilter (not dateInput)
historyDateFilter.addEventListener("change", function () {
  loadMeals(this.value);
});

historyDateClear.addEventListener("click", () => {
  historyDateFilter.value = "";
  loadMeals(null);  // reload all
});

function renderMeals(meals) {
  historyCards.innerHTML = "";

  if (!meals || meals.length === 0) {
    historyEmptyState.classList.remove("hidden");
    return;
  }

  historyEmptyState.classList.add("hidden");

  meals.forEach(meal => {
    const card = document.createElement("div");
    card.className = "meal-card";

    const dateStr = meal.created_at
      ? new Date(meal.created_at).toLocaleString()
      : "Unknown date";

    card.innerHTML = `
      <img src="${meal.image_url || DEFAULT_MEAL_IMAGE}" alt="Meal image" />
      <h4>${meal.food_name ?? "Unnamed meal"}</h4>
      <p>Calories: ${meal.calories ?? "N/A"}</p>
      <p>Date: ${dateStr}</p>
      <p>Status: ${meal.status ?? ""}</p>
    `;

    // inside renderMeals(), after card.innerHTML = ...
    card.addEventListener("click", () => openMealModal(meal.id));
    card.style.cursor = "pointer";

    historyCards.appendChild(card);
  });

  document.getElementById("mealModalClose").addEventListener("click", () => {
    document.getElementById("mealModal").classList.add("hidden");
  });

  // Close on backdrop click
  document.getElementById("mealModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.add("hidden");
    }
  });
}

 async function openMealModal(mealId) {
    const { data: meal, error } = await supabase
      .from("meals")
      .select("*")           // fetch all columns for the detail view
      .eq("id", mealId)
      .single();             // returns one object instead of an array

    if (error || !meal) {
      console.error("Failed to fetch meal detail:", error);
      return;
    }

    // Populate modal fields
    const date = meal.created_at
      ? new Date(meal.created_at).toLocaleDateString()
      : "Unknown date";
    const time = meal.created_at
      ? new Date(meal.created_at).toLocaleTimeString()
      : "";

    document.getElementById("mealModalDate").textContent   = date;
    document.getElementById("mealModalTime").textContent   = time;
    document.getElementById("mealModalImage").src          = meal.image_url || DEFAULT_MEAL_IMAGE;
    document.getElementById("mealModalStatus").textContent = meal.status ?? "";

    // Fill in the detail body — adjust fields to match your schema
    document.getElementById("mealModalDetails").innerHTML = `
      <p><strong>Food:</strong> ${meal.food_name ?? "N/A"}</p>
      <p><strong>Calories:</strong> ${meal.calories ?? "N/A"}</p>
      <p><strong>Protein:</strong> ${meal.protein ?? "N/A"}g</p>
      <p><strong>Carbs:</strong> ${meal.carbs ?? "N/A"}g</p>
      <p><strong>Fat:</strong> ${meal.fat ?? "N/A"}g</p>
    `;

    // Show modal
    document.getElementById("mealModal").classList.remove("hidden");
  }

  console.log(data);

