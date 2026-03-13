import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ----------------------------------------------------
// AUTHENTICATION HELPER FUNCTIONS
// ----------------------------------------------------

export async function authenticateUser(email, password) {
    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) throw authError;

    // 2. Check is_admin in users table
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single();

    if (profileError) {
        console.error("Could not fetch user profile details:", profileError);
    }

    return {
        user: authData.user,
        isAdmin: profile?.is_admin || false
    };
}

export async function logoutUser() {
    await supabase.auth.signOut();
}