import localforage from 'localforage';
import { getUserProfile, getUserMeals, updateMeal, updateUserProfile } from './supabase.js';
import { generateAIAssessment } from './ai-service.js';
import './auth-guard.js'; 

// Nutrient display mappings
const nutrientLabels = {
  calories_kcal: "Calories (kcal)",
  total_water_ml: "Total Water (ml)",
  protein_g: "Protein (g)",
  total_carbs_g: "Carbohydrates (g)",
  total_fat_g: "Fat (g)",
  total_fiber_g: "Fiber (g)",
  total_sugar_g: "Sugar (g)",
  saturated_fatty_acids_g: "Saturated Fat (g)",
  trans_fatty_acids_g: "Trans Fat (g)",
  monounsaturated_fat_g: "Monounsaturated Fat (g)",
  polyunsaturated_fat_g: "Polyunsaturated Fat (g)",
  dietary_cholesterol_mg: "Cholesterol (mg)",
  sodium_mg: "Sodium (mg)",
  potassium_mg: "Potassium (mg)",
  calcium_mg: "Calcium (mg)",
  iron_mg: "Iron (mg)",
  vitamin_c_mg: "Vitamin C (mg)",
  vitamin_a_mcg: "Vitamin A (mcg)",
  vitamin_d_mcg: "Vitamin D (mcg)",
  vitamin_b12_mcg: "Vitamin B12 (mcg)"
};

async function initOutput() {
  try {
    // 1. Fetch the data saved during the confirm step
    const record = await localforage.getItem("lastSubmittedRecord");

    if (!record) {
      document.getElementById("basicInfo").innerHTML = "<p>No recent meal data found. Please upload a meal first.</p>";
      return;
    }

    // 2. Render Image
    const imgUrl = record.image_url || record.image?.dataUrl;
    if (imgUrl) {
      document.getElementById("mealImageContainer").innerHTML = `
                <img src="${imgUrl}" alt="Uploaded Meal" style="max-width:100%; max-height: 300px; border-radius:10px; margin-bottom:20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            `;
    }

    // 3. Aggregate data for the whole meal
    const aggregatedData = {};
    record.nutrition_data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (typeof item[key] === 'number') {
          aggregatedData[key] = (aggregatedData[key] || 0) + item[key];
        }
      });
    });

    const foodNames = record.food_items.map(f => f.item).join(', ');
    const totalWeight = record.food_items.reduce((sum, f) => sum + (f.serving_size_g * f.portion), 0);
    const formattedDate = new Date(record.datetime).toLocaleString();

    // 4. Render Basic Info
    document.getElementById("basicInfo").innerHTML = `
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Detected Foods:</strong> ${foodNames}</p>
            <p><strong>Total Estimated Weight:</strong> ${totalWeight} g</p>
        `;

    // 5. Render Nutrition Table
    const tbody = document.querySelector("#nutritionTable tbody");
    tbody.innerHTML = ''; // Clear table

    Object.keys(nutrientLabels).forEach(key => {
      let value = aggregatedData[key];
      if (value === null || value === undefined || value === 0) return;

      // Round to 2 decimal places for neatness
      value = Math.round(value * 100) / 100;

      const row = `
                <tr>
                    <td>${nutrientLabels[key]}</td>
                    <td><strong>${value}</strong></td>
                </tr>
            `;
      tbody.innerHTML += row;
    });

    // 6. Run Clinical AI Assessment Pipeline
    await runClinicalAssessment(record.userID);

  } catch (err) {
    console.error("Failed to load output data:", err);
    document.getElementById("basicInfo").innerHTML = "<p style='color:red;'>Error loading meal data.</p>";
  }
}

async function runClinicalAssessment(userId) {
  const summaryContainer = document.getElementById("aiSummary");
  summaryContainer.innerHTML = "<p><em>Analyzing meal against your clinical profile and 14-day history...</em></p>";

  try {
    // Fetch all user meals (ordered by created_at descending from our Supabase setup)
    const allUserMeals = await getUserMeals(userId);

    if (!allUserMeals || allUserMeals.length === 0) {
      summaryContainer.innerHTML = "<p>Assessment unavailable. No database records found.</p>";
      return;
    }

    // The most recent meal is the one we just submitted
    const currentMealData = allUserMeals[0];
    const mealId = currentMealData.id;

    // Fetch user profile for biometrics and medical notes
    const userProfile = await getUserProfile(userId);

    // Filter the remaining meals for the past 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const pastTwoWeeksMeals = allUserMeals.slice(1).filter(meal =>
      new Date(meal.created_at) >= twoWeeksAgo
    );

    // Generate the AI Assessment
    const aiEvaluation = await generateAIAssessment(userProfile, currentMealData, pastTwoWeeksMeals);

    // Update database statuses asynchronously
    await Promise.all([
      updateMeal(mealId, { status: aiEvaluation.meal_status }),
      updateUserProfile(userId, { status: aiEvaluation.user_status })
    ]);

    // Render the results
    summaryContainer.innerHTML = `
            <h3 style="margin-top:0; color:#1f2937;">Clinical AI Assessment</h3>
            <p style="margin-bottom:10px; line-height:1.5;">${aiEvaluation.meal_assessment_text}</p>
            <div style="font-size: 0.9em; padding: 10px; background-color: #f3f4f6; border-radius: 6px;">
                <strong>Meal Risk Level:</strong> ${aiEvaluation.meal_status} | 
                <strong>Overall Patient Risk Level:</strong> ${aiEvaluation.user_status}
            </div>
        `;

  } catch (err) {
    console.error("AI Assessment Error:", err);
    summaryContainer.innerHTML = "<p style='color:red;'>Failed to generate clinical assessment.</p>";
  }
}

// Run immediately
initOutput();