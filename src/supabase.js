import { createClient } from '@supabase/supabase-js';

// Initialize with Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// AUTHENTICATION
// ==========================================

export async function authenticateUser(email, password) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single();

    if (profileError) console.error("Could not fetch user profile details:", profileError);

    return {
        user: authData.user,
        isAdmin: profile?.is_admin || false
    };
}

export async function logoutUser() {
    await supabase.auth.signOut();
}

// ==========================================
// USERS CRUD
// ==========================================

export async function createUserProfile(id, profileData) {
    // Note: To type-check here, you would use Ajv against userSchema
    const { data, error } = await supabase.from('users').insert([{ id, ...profileData }]).select().single();
    if (error) throw error;
    return data;
}

export async function getUserProfile(id) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
}

export async function updateUserProfile(id, updates) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

// ==========================================
// NUTRITIONS CRUD
// ==========================================

export async function createNutrition(nutritionData) {
    const { data, error } = await supabase.from('nutritions').insert([nutritionData]).select().single();
    if (error) throw error;
    return data;
}

export async function updateNutrition(id, updates) {
    const { data, error } = await supabase.from('nutritions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

// ==========================================
// MEALS CRUD
// ==========================================

export async function createMeal(mealData) {
    const { data, error } = await supabase.from('meals').insert([mealData]).select().single();
    if (error) throw error;
    return data;
}

export async function getMeal(id) {
    // Fetches the meal, its total nutrition, and all related food items with their specific nutrition
    const { data, error } = await supabase
        .from('meals')
        .select('*, nutritions(*), food_items(*, nutritions(*))')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function getUserMeals(userId) {
    const { data, error } = await supabase
        .from('meals')
        .select('*, nutritions(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function updateMeal(id, updates) {
    const { data, error } = await supabase.from('meals').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteMeal(id) {
    const { error } = await supabase.from('meals').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ==========================================
// FOOD ITEMS CRUD
// ==========================================

export async function createFoodItem(foodItemData) {
    const { data, error } = await supabase.from('food_items').insert([foodItemData]).select().single();
    if (error) throw error;
    return data;
}

export async function getFoodItemsByMeal(mealId) {
    const { data, error } = await supabase
        .from('food_items')
        .select('*, nutritions(*)')
        .eq('meal_id', mealId);
    if (error) throw error;
    return data;
}

export async function deleteFoodItem(id) {
    const { error } = await supabase.from('food_items').delete().eq('id', id);
    if (error) throw error;
    return true;
}