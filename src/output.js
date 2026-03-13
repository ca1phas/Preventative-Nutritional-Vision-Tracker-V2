// ======================================
// LOAD NUTRITION RESULT
// ======================================

let data = JSON.parse(localStorage.getItem("nutritionResult"));

if (!data) {
    console.log("Using fake data");

    data = {
        id: "demo001",
        datetime: "2026-03-13 12:30 PM",
        food_name: "Chicken, grilled",
        serving_size_g: 180,
        calories_kcal: 297,
        total_water_ml: 110,
        protein_g: 35,
        total_carbs_g: 0,
        total_fat_g: 16,
        total_fiber_g: null,
        total_sugar_g: null,
        sodium_mg: 85,
        potassium_mg: 300,
        calcium_mg: 18,
        iron_mg: 1.5,
        vitamin_c_mg: null,
        vitamin_a_mcg: 20,
        vitamin_d_mcg: 0.2,
        vitamin_e_mg: 0.5,
        vitamin_k_mcg: 3.2
    };
}

const uploadedImage = JSON.parse(sessionStorage.getItem("uploadedImage"));

if (uploadedImage && uploadedImage.dataUrl) {

    const imgHTML = `
        <img
        src="${uploadedImage.dataUrl}"
        alt="Uploaded Meal"
        style="max-width:400px;border-radius:10px;margin-bottom:20px;"
        >
    `;

    document.getElementById("mealImageContainer").innerHTML = imgHTML;
}

document.getElementById("basicInfo").innerHTML = `
    <p><strong>Date Time:</strong> ${data.datetime}</p>
    <p><strong>Food Name:</strong> ${data.food_name}</p>
    <p><strong>Quantity:</strong> ${data.serving_size_g}</p>
    <p><strong>Unit:</strong> g</p>
`;

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
    linoleic_acid_pufa_18_2_g: "Linoleic Acid (g)",
    alpha_linolenic_acid_pufa_18_3_g: "Alpha Linolenic Acid (g)",

    dietary_cholesterol_mg: "Cholesterol (mg)",

    calcium_mg: "Calcium (mg)",
    iron_mg: "Iron (mg)",
    magnesium_mg: "Magnesium (mg)",
    phosphorus_mg: "Phosphorus (mg)",
    potassium_mg: "Potassium (mg)",
    sodium_mg: "Sodium (mg)",
    zinc_mg: "Zinc (mg)",
    copper_mg: "Copper (mg)",
    manganese_mg: "Manganese (mg)",

    iodine_mcg: "Iodine (mcg)",
    selenium_mcg: "Selenium (mcg)",
    molybdenum_mcg: "Molybdenum (mcg)",
    chromium_mcg: "Chromium (mcg)",

    fluoride_mg: "Fluoride (mg)",

    vitamin_c_mg: "Vitamin C (mg)",
    thiamin_mg: "Thiamin (mg)",
    riboflavin_mg: "Riboflavin (mg)",
    niacin_mg: "Niacin (mg)",
    pantothenic_acid_mg: "Pantothenic Acid (mg)",
    vitamin_b6_mg: "Vitamin B6 (mg)",
    vitamin_b12_mcg: "Vitamin B12 (mcg)",
    biotin_mcg: "Biotin (mcg)",
    folate_mcg: "Folate (mcg)",

    vitamin_a_mcg: "Vitamin A (mcg)",
    vitamin_e_mg: "Vitamin E (mg)",
    vitamin_d_mcg: "Vitamin D (mcg)",
    vitamin_k_mcg: "Vitamin K (mcg)",

    choline_mg: "Choline (mg)"
};


// ======================================
// GENERATE NUTRITION TABLE
// ======================================

const tbody = document.querySelector("#nutritionTable tbody");

Object.keys(nutrientLabels).forEach(key => {

    const value = data[key];

    // Skip null / undefined
    if (value === null || value === undefined || value === "") return;

    const label = nutrientLabels[key];

    const row = `
        <tr>
        <td>${label}</td>
        <td>${value}</td>
        </tr>
    `;

    tbody.innerHTML += row;
});



// ai text summary
let text = "";

if (data.calories_kcal > 700)
    text += "This meal is high in calories. ";
else if (data.calories_kcal > 400)
    text += "This meal has a moderate calorie level. ";
else text += "This meal is relatively low in calories. ";

if (data.protein_g > 25)
    text += "It provides a good amount of protein. ";

if (data.total_fat_g > 20)
    text += "Fat content is relatively high. ";

if (data.sodium_mg > 600)
    text += "Sodium intake is high and should be monitored. ";

    text +=
    "Overall, this meal can be part of a balanced diet depending on individual needs.";

    document.getElementById("aiSummary").innerHTML = "<strong>AI Nutrition Assessment:</strong><br>" + text;