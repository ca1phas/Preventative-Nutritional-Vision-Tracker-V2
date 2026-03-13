import './style.css';
import { searchUSDA, mapToNutritionSchema } from './ai-service.js';
import { supabase } from './supabase.js';

const ingredientList = document.getElementById('ingredientList');
const addItemBtn = document.getElementById('addItemBtn');
const confirmBtn = document.getElementById('confirmBtn');
const rejectBtn = document.getElementById('rejectBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const success = document.getElementById('success');
const actions = document.getElementById('actions');
const jsonPreview = document.getElementById('jsonPreview');
const uploadedImagePreview = document.getElementById('uploadedImagePreview');
const confirmPreviewImg = document.getElementById('confirmPreviewImg');

const uploadedImage = JSON.parse(sessionStorage.getItem('uploadedImage') || 'null');
let rawIngredients = JSON.parse(sessionStorage.getItem('ingredients') || '[]');

if (!uploadedImage) window.location.href = 'upload.html';

let ingredients = rawIngredients.map(item => ({
    item: item.food_name || item.item || '',
    portion: item.portion || 1,
    serving_size_g: item.serving_size_g || 100
}));

if (ingredients.length === 0) {
    ingredients = [{ item: 'Unknown food', portion: 1, serving_size_g: 100 }];
}

if (uploadedImage?.dataUrl) {
    confirmPreviewImg.src = uploadedImage.dataUrl;
    uploadedImagePreview.classList.remove('hidden');
}

renderIngredientRows();
updateJsonPreview();

// ===== EVENT LISTENERS =====
addItemBtn.addEventListener('click', () => {
    ingredients.push({ item: '', portion: 1, serving_size_g: 100 });
    renderIngredientRows();
    updateJsonPreview();
});

ingredientList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-action="remove-item"]');
    if (!removeButton) return;
    const index = Number(removeButton.getAttribute('data-index'));
    ingredients.splice(index, 1);
    if (ingredients.length === 0) ingredients.push({ item: '', portion: 1, serving_size_g: 100 });
    renderIngredientRows();
    updateJsonPreview();
});

ingredientList.addEventListener('input', () => {
    ingredients = collectFoodItemsFromInputs();
    updateJsonPreview();
});

rejectBtn.addEventListener('click', () => {
    sessionStorage.removeItem('uploadedImage');
    sessionStorage.removeItem('ingredients');
    window.location.href = 'upload.html';
});

// ===== CORE: AI ANALYSIS + SUPABASE SAVE =====
confirmBtn.addEventListener('click', async () => {
    error.classList.add('hidden');
    success.classList.add('hidden');

    ingredients = collectFoodItemsFromInputs();
    const validationError = validateFoodItems(ingredients);
    if (validationError) { showError(validationError); return; }

    loading.classList.remove('hidden');
    actions.classList.add('hidden');

    try {
        const finalNutritionData = [];

        // Step 2 & 3: USDA + Gemini mapping per food item
        for (const food of ingredients) {
            const aiFoodItem = {
                id: crypto.randomUUID(),
                datetime: new Date().toISOString(),
                food_name: food.item,
                serving_size_g: food.serving_size_g * food.portion
            };
            const usdaResults = await searchUSDA(aiFoodItem.food_name);
            const nutritionRecord = await mapToNutritionSchema(aiFoodItem, usdaResults);
            finalNutritionData.push(nutritionRecord);
        }

        // Aggregate all food items into one nutrition row
        const aggregated = finalNutritionData.reduce((acc, n) => {
            Object.keys(n).forEach(key => {
                if (typeof n[key] === 'number') acc[key] = (acc[key] || 0) + n[key];
            });
            return acc;
        }, {});

        // Derive status: 0=healthy, 1=warning, 2=intervention
        const totalCalories = aggregated.calories_kcal || 0;
        const totalCarbs = aggregated.total_carbs_g || 0;
        const totalSugar = aggregated.total_sugar_g || 0;
        let mealStatus = 0;
        if (totalCalories > 1200 || totalCarbs > 150 || totalSugar > 80) mealStatus = 2;
        else if (totalCalories > 800 || totalCarbs > 100) mealStatus = 1;

        const currentUser = sessionStorage.getItem('userID');

        // Build nutrition row — only include real schema columns
        const nutritionRow = {
            serving_size_g: aggregated.serving_size_g || null,
            calories_kcal: aggregated.calories_kcal || null,
            total_water_ml: aggregated.total_water_ml || null,
            protein_g: aggregated.protein_g || null,
            total_carbs_g: aggregated.total_carbs_g || null,
            total_fat_g: aggregated.total_fat_g || null,
            total_fiber_g: aggregated.total_fiber_g || null,
            total_sugar_g: aggregated.total_sugar_g || null,
            saturated_fatty_acids_g: aggregated.saturated_fatty_acids_g || null,
            trans_fatty_acids_g: aggregated.trans_fatty_acids_g || null,
            monounsaturated_fat_g: aggregated.monounsaturated_fat_g || null,
            polyunsaturated_fat_g: aggregated.polyunsaturated_fat_g || null,
            linoleic_acid_pufa_18_2_g: aggregated.linoleic_acid_pufa_18_2_g || null,
            alpha_linolenic_acid_pufa_18_3_g: aggregated.alpha_linolenic_acid_pufa_18_3_g || null,
            dietary_cholesterol_mg: aggregated.dietary_cholesterol_mg || null,
            calcium_mg: aggregated.calcium_mg || null,
            iron_mg: aggregated.iron_mg || null,
            magnesium_mg: aggregated.magnesium_mg || null,
            phosphorus_mg: aggregated.phosphorus_mg || null,
            potassium_mg: aggregated.potassium_mg || null,
            sodium_mg: aggregated.sodium_mg || null,
            zinc_mg: aggregated.zinc_mg || null,
            copper_mg: aggregated.copper_mg || null,
            manganese_mg: aggregated.manganese_mg || null,
            iodine_mcg: aggregated.iodine_mcg || null,
            selenium_mcg: aggregated.selenium_mcg || null,
            molybdenum_mcg: aggregated.molybdenum_mcg || null,
            chromium_mcg: aggregated.chromium_mcg || null,
            fluoride_mg: aggregated.fluoride_mg || null,
            vitamin_c_mg: aggregated.vitamin_c_mg || null,
            thiamin_mg: aggregated.thiamin_mg || null,
            riboflavin_mg: aggregated.riboflavin_mg || null,
            niacin_mg: aggregated.niacin_mg || null,
            pantothenic_acid_mg: aggregated.pantothenic_acid_mg || null,
            vitamin_b6_mg: aggregated.vitamin_b6_mg || null,
            vitamin_b12_mcg: aggregated.vitamin_b12_mcg || null,
            biotin_mcg: aggregated.biotin_mcg || null,
            folate_mcg: aggregated.folate_mcg || null,
            vitamin_a_mcg: aggregated.vitamin_a_mcg || null,
            vitamin_e_mg: aggregated.vitamin_e_mg || null,
            vitamin_d_mcg: aggregated.vitamin_d_mcg || null,
            vitamin_k_mcg: aggregated.vitamin_k_mcg || null,
            choline_mg: aggregated.choline_mg || null
        };

        // 1. Insert into nutritions
        const { data: nutritionInsert, error: nutritionError } = await supabase
            .from('nutritions')
            .insert(nutritionRow)
            .select('id')
            .single();
        if (nutritionError) throw new Error('nutritions insert failed: ' + nutritionError.message);

        // 2. Insert into meals
        const { data: mealInsert, error: mealError } = await supabase
            .from('meals')
            .insert({
                user_id: currentUser,
                nutrition_id: nutritionInsert.id,
                image_url: uploadedImage?.name || null,
                status: mealStatus
            })
            .select('id')
            .single();
        if (mealError) throw new Error('meals insert failed: ' + mealError.message);

        // 3. Insert into food_items — one row per food item
        const foodItemRows = finalNutritionData.map(n => ({
            meal_id: mealInsert.id,
            nutrition_id: nutritionInsert.id,
            food_name: n.food_name
        }));

        const { error: foodItemsError } = await supabase
            .from('food_items')
            .insert(foodItemRows);
        if (foodItemsError) console.warn('food_items insert warning:', foodItemsError.message);

        // Save to session for result page
        sessionStorage.setItem('lastSubmittedRecord', JSON.stringify({
            userID: currentUser,
            datetime: new Date().toISOString(),
            image: uploadedImage,
            food_items: ingredients,
            nutrition_data: finalNutritionData
        };

        // Save to session storage for the results page to read
        // sessionStorage.setItem('lastSubmittedRecord', JSON.stringify(payload));

        try {
            await localforage.setItem('lastSubmittedRecord', recordData);
            // Note: localforage automatically handles JSON stringifying/parsing!
        } catch (err) {
            console.error("Error saving data:", err);
        }

        // (Optional: You can add your Supabase insert code here later!)

        success.textContent = 'Meal saved successfully!';
        success.classList.remove('hidden');
        setTimeout(() => { window.location.href = 'dashboard.html?tab=daily'; }, 1000);

    } catch (err) {
        console.error('Error:', err);
        showError('Error: ' + err.message);
        actions.classList.remove('hidden');
        loading.classList.add('hidden');
    }
});

// ===== HELPERS =====
function renderIngredientRows() {
    ingredientList.innerHTML = ingredients.map((item, index) => `
        <div class="ingredient-row">
            <input type="text" class="item-name" placeholder="Food name" value="${escapeHtml(item.item || '')}" />
            <input type="number" class="item-portion" min="1" step="1" value="${Number(item.portion || 1)}" />
            <input type="number" class="item-serving" min="1" step="1" value="${Number(item.serving_size_g || 100)}" />
            <button type="button" class="btn-small-danger" data-action="remove-item" data-index="${index}">Delete</button>
        </div>
    `).join('');
}

function collectFoodItemsFromInputs() {
    return Array.from(ingredientList.querySelectorAll('.ingredient-row')).map(row => ({
        item: row.querySelector('.item-name').value.trim(),
        portion: Number(row.querySelector('.item-portion').value || 1),
        serving_size_g: Number(row.querySelector('.item-serving').value || 100)
    }));
}

function validateFoodItems(foodItems) {
    if (!foodItems.length) return 'Add at least one food item.';
    const invalid = foodItems.find(f => !f.item || f.portion <= 0 || f.serving_size_g <= 0);
    if (invalid) return 'Every row must have a food name, portion > 0, and serving size > 0.';
    return '';
}

function updateJsonPreview() {
    jsonPreview.textContent = JSON.stringify({ food_items: collectFoodItemsFromInputs() }, null, 2);
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
}

function escapeHtml(value) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}