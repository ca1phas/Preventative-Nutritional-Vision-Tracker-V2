import './style.css';
import { searchUSDA, mapToNutritionSchema } from './ai-service.js';

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

// 1. Load data from previous step
const uploadedImage = JSON.parse(sessionStorage.getItem('uploadedImage') || 'null');
let rawIngredients = JSON.parse(sessionStorage.getItem('ingredients') || '[]');

if (!uploadedImage) {
    window.location.href = 'upload.html';
}

// 2. Map Gemini's Step 1 output schema to the UI's expected format
let ingredients = rawIngredients.map(item => ({
    item: item.food_name || item.item || '',
    portion: item.portion || 1,
    serving_size_g: item.serving_size_g || 100
}));

if (ingredients.length === 0) {
    ingredients = [{ item: 'Unknown food', portion: 1, serving_size_g: 100 }];
}

if (uploadedImage && uploadedImage.dataUrl) {
    confirmPreviewImg.src = uploadedImage.dataUrl;
    uploadedImagePreview.classList.remove('hidden');
}

// Render initial UI
renderIngredientRows();
updateJsonPreview();

// ==========================================
// EVENT LISTENERS
// ==========================================

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

    if (ingredients.length === 0) {
        ingredients.push({ item: '', portion: 1, serving_size_g: 100 });
    }

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

// ==========================================
// CORE AI LOGIC
// ==========================================

confirmBtn.addEventListener('click', async () => {
    error.classList.add('hidden');
    success.classList.add('hidden');

    ingredients = collectFoodItemsFromInputs();
    const validationError = validateFoodItems(ingredients);
    if (validationError) {
        showError(validationError);
        return;
    }

    // Lock UI and show loading
    loading.classList.remove('hidden');
    actions.classList.add('hidden');

    try {
        const finalNutritionData = [];

        // Loop through each confirmed item and run Step 2 (USDA) & Step 3 (Gemini Mapping)
        for (const food of ingredients) {

            // Format for Gemini Mapping Prompt
            const aiFoodItem = {
                id: crypto.randomUUID(),
                datetime: new Date().toISOString(),
                food_name: food.item,
                serving_size_g: food.serving_size_g * food.portion // Total grams
            };

            // Hit the USDA API
            const usdaResults = await searchUSDA(aiFoodItem.food_name);

            // Hit Gemini 3.1 Flash for Schema Mapping
            const nutritionRecord = await mapToNutritionSchema(aiFoodItem, usdaResults);

            finalNutritionData.push(nutritionRecord);
        }

        // Build the final payload
        const payload = {
            userID: sessionStorage.getItem('userID') || 'DEMO_USER',
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

        success.textContent = 'AI Analysis complete!';
        success.classList.remove('hidden');

        // Redirect to result/dashboard page
        window.location.href = 'dashboard.html?tab=daily';

    } catch (err) {
        console.error("Analysis Error:", err);
        showError('Unable to analyze nutrition data. Check the console.');
        actions.classList.remove('hidden');
        loading.classList.add('hidden');
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

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
    const rows = ingredientList.querySelectorAll('.ingredient-row');
    return Array.from(rows).map((row) => {
        return {
            item: row.querySelector('.item-name').value.trim(),
            portion: Number(row.querySelector('.item-portion').value || 1),
            serving_size_g: Number(row.querySelector('.item-serving').value || 100)
        };
    });
}

function validateFoodItems(foodItems) {
    if (!Array.isArray(foodItems) || foodItems.length === 0) return 'Add at least one food item.';
    const invalidItem = foodItems.find((item) => !item.item || item.portion <= 0 || item.serving_size_g <= 0);
    if (invalidItem) return 'Every row must have food name, portion > 0, and serving size > 0.';
    return '';
}

function updateJsonPreview() {
    const items = collectFoodItemsFromInputs();
    jsonPreview.textContent = JSON.stringify({ food_items: items }, null, 2);
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
}

function escapeHtml(value) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}