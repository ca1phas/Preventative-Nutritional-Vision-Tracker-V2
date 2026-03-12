import { GoogleGenAI } from '@google/genai';
import {
    prelimFoodSchema,
    foodNutritionSchema,
    analyzeSystemInstruction,
    mapSystemInstruction,
    getMapPrompt
} from './ai-config.js';

// Initialize with Vite environment variable
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function analyzeFoodImage(imageBase64, mimeType = "image/jpeg") {
    // Clean the base64 string if it contains the data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { inlineData: { data: cleanBase64, mimeType: mimeType } },
            "Analyze this food image."
        ],
        config: {
            systemInstruction: analyzeSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: prelimFoodSchema,
            temperature: 0.2
        }
    });

    const foodItems = JSON.parse(response.text);
    const currentDatetime = new Date().toISOString();

    // Use native browser crypto for UUID
    return foodItems.map(item => ({
        id: crypto.randomUUID(),
        datetime: currentDatetime,
        ...item
    }));
}

export async function searchUSDA(foodName) {
    const usdaApiKey = import.meta.env.VITE_USDA_API_KEY; // Make sure to add this to your .env!
    let searchTerms = foodName.split(' ');

    while (searchTerms.length > 0) {
        const query = searchTerms.join(' ');
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=3&api_key=${usdaApiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.foods && data.foods.length > 0) return data.foods;
        } catch (error) {
            console.error(`Error fetching from USDA API for query "${query}":`, error);
        }
        searchTerms.pop();
    }
    return [];
}

export async function mapToNutritionSchema(foodItem, usdaResults) {
    const hydratedPrompt = getMapPrompt(foodItem, usdaResults);

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: hydratedPrompt,
        config: {
            systemInstruction: mapSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: foodNutritionSchema,
            temperature: 0.1
        }
    });

    return JSON.parse(response.text);
}