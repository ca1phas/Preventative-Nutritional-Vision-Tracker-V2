// ==========================================
// SCHEMAS
// ==========================================
export const prelimFoodSchema = {
    "type": "array",
    "description": "List of distinct food items detected in the image",
    "items": {
        "type": "object",
        "properties": {
            "food_name": { "type": "string", "description": "Strictly adhere to USDA FoodData Central nomenclature" },
            "serving_size_g": { "type": "number", "description": "Estimated weight in grams" }
        },
        "required": ["food_name", "serving_size_g"]
    }
};

export const foodNutritionSchema = {
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "description": "Use the exact id from the detected food item"
        },
        "datetime": {
            "type": "string",
            "description": "Use the exact datetime from the detected food item"
        },
        "food_name": {
            "type": "string",
            "description": "Use the exact food_name from the detected food item"
        },
        "serving_size_g": {
            "type": "number",
            "description": "Use the exact serving_size_g from the detected food item"
        },
        "calories_kcal": {
            "type": "number",
            "nullable": true
        },
        "total_water_ml": {
            "type": "number",
            "nullable": true
        },
        "protein_g": {
            "type": "number",
            "nullable": true
        },
        "total_carbs_g": {
            "type": "number",
            "nullable": true
        },
        "total_fat_g": {
            "type": "number",
            "nullable": true
        },
        "total_fiber_g": {
            "type": "number",
            "nullable": true
        },
        "total_sugar_g": {
            "type": "number",
            "nullable": true
        },
        "saturated_fatty_acids_g": {
            "type": "number",
            "nullable": true
        },
        "trans_fatty_acids_g": {
            "type": "number",
            "nullable": true
        },
        "monounsaturated_fat_g": {
            "type": "number",
            "nullable": true
        },
        "polyunsaturated_fat_g": {
            "type": "number",
            "nullable": true
        },
        "linoleic_acid_pufa_18_2_g": {
            "type": "number",
            "nullable": true
        },
        "alpha_linolenic_acid_pufa_18_3_g": {
            "type": "number",
            "nullable": true
        },
        "dietary_cholesterol_mg": {
            "type": "number",
            "nullable": true
        },
        "calcium_mg": {
            "type": "number",
            "nullable": true
        },
        "iron_mg": {
            "type": "number",
            "nullable": true
        },
        "magnesium_mg": {
            "type": "number",
            "nullable": true
        },
        "phosphorus_mg": {
            "type": "number",
            "nullable": true
        },
        "potassium_mg": {
            "type": "number",
            "nullable": true
        },
        "sodium_mg": {
            "type": "number",
            "nullable": true
        },
        "zinc_mg": {
            "type": "number",
            "nullable": true
        },
        "copper_mg": {
            "type": "number",
            "nullable": true
        },
        "manganese_mg": {
            "type": "number",
            "nullable": true
        },
        "iodine_mcg": {
            "type": "number",
            "nullable": true
        },
        "selenium_mcg": {
            "type": "number",
            "nullable": true
        },
        "molybdenum_mcg": {
            "type": "number",
            "nullable": true
        },
        "chromium_mcg": {
            "type": "number",
            "nullable": true
        },
        "fluoride_mg": {
            "type": "number",
            "nullable": true
        },
        "vitamin_c_mg": {
            "type": "number",
            "nullable": true
        },
        "thiamin_mg": {
            "type": "number",
            "nullable": true
        },
        "riboflavin_mg": {
            "type": "number",
            "nullable": true
        },
        "niacin_mg": {
            "type": "number",
            "nullable": true
        },
        "pantothenic_acid_mg": {
            "type": "number",
            "nullable": true
        },
        "vitamin_b6_mg": {
            "type": "number",
            "nullable": true
        },
        "vitamin_b12_mcg": {
            "type": "number",
            "nullable": true
        },
        "biotin_mcg": {
            "type": "number",
            "nullable": true
        },
        "folate_mcg": {
            "type": "number",
            "nullable": true
        },
        "vitamin_a_mcg": {
            "type": "number",
            "nullable": true
        },
        "vitamin_e_mg": {
            "type": "number",
            "nullable": true
        },
        "vitamin_d_mcg": {
            "type": "number",
            "nullable": true
        },
        "vitamin_k_mcg": {
            "type": "number",
            "nullable": true
        },
        "choline_mg": {
            "type": "number",
            "nullable": true
        }
    },
    "required": [
        "id",
        "datetime",
        "food_name",
        "serving_size_g",
        "calories_kcal",
        "total_water_ml",
        "protein_g",
        "total_carbs_g",
        "total_fat_g",
        "total_fiber_g",
        "total_sugar_g",
        "saturated_fatty_acids_g",
        "trans_fatty_acids_g",
        "monounsaturated_fat_g",
        "polyunsaturated_fat_g",
        "linoleic_acid_pufa_18_2_g",
        "alpha_linolenic_acid_pufa_18_3_g",
        "dietary_cholesterol_mg",
        "calcium_mg",
        "iron_mg",
        "magnesium_mg",
        "phosphorus_mg",
        "potassium_mg",
        "sodium_mg",
        "zinc_mg",
        "copper_mg",
        "manganese_mg",
        "iodine_mcg",
        "selenium_mcg",
        "molybdenum_mcg",
        "chromium_mcg",
        "fluoride_mg",
        "vitamin_c_mg",
        "thiamin_mg",
        "riboflavin_mg",
        "niacin_mg",
        "pantothenic_acid_mg",
        "vitamin_b6_mg",
        "vitamin_b12_mcg",
        "biotin_mcg",
        "folate_mcg",
        "vitamin_a_mcg",
        "vitamin_e_mg",
        "vitamin_d_mcg",
        "vitamin_k_mcg",
        "choline_mg"
    ]
}

// ==========================================
// PROMPTS
// ==========================================
export const analyzeSystemInstruction = `
You are an expert nutritionist and advanced computer vision system.
Your task is to analyze the provided image of food and extract specific dietary information.
Follow these steps precisely:

1. Identify all distinct food items visible in the image.
Break complex meals down into their core individual components where possible.
2. Estimate the portion size of each identified food item in grams.
Base this estimation on standard food densities and relative visual proportions.
3. Classify each food item using the official USDA FoodData Central Naming Convention (e.g., instead of "grilled chicken", use "Chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, grilled").

IMPORTANT VISUAL RULES:
- Only identify foods that are clearly visible in the image.
- Do not infer hidden ingredients or seasonings unless clearly visible.
- If uncertain whether an item exists, do not include it.

MEAL DECOMPOSITION RULES:
Break composite meals into individual components.
Example:
"Chicken rice plate" becomes:
- Chicken, cooked
- White rice, cooked
- Cucumber slices
- Chili sauce

Never return combined meals as a single item.
`;

export const mapSystemInstruction = `You are an expert nutritionist AI and a precise data-processing engine.`;

export function getMapPrompt(foodItem, usdaResults) {
    return `
INPUT DATA:
--- Detected Food Item ---
${JSON.stringify(foodItem, null, 2)}

--- USDA Search Results ---
${JSON.stringify(usdaResults, null, 2)}

TASKS:
1. Match: Select the single most accurate matching food from the USDA results.
Prioritize matches that align with the food's likely preparation state (e.g., raw, cooked, baked, skin-on/skinless) as implied by the Detected Food Item.
2. Estimate (Fallback): If no accurate or reasonable match exists in the USDA Search Results, estimate the nutritional values based on your internal knowledge of the Detected Food Item.
If you do not have enough data in your training set to confidently estimate a specific nutrient, you must output null for that value rather than hallucinating or guessing.
3. Calculate: Scale the nutritional values from the selected USDA item (or your estimations) to match the serving_size_g provided in the Detected Food Item.
- Calculation Formula: (Nutrient_Value / Base_Serving_Size_g) * Detected_serving_size_g
- Round all calculated nutrient values to two decimal places.
4. Map: Transfer the exact id, datetime, food_name, and serving_size_g from the Detected Food Item directly into the output.
5. Handle Missing Data: If a nutrient value is missing or unlisted in the USDA data (and cannot be estimated), output null.
Only output 0 if the USDA database explicitly lists the value as 0 or you are certain the estimated value is zero.
`;
}