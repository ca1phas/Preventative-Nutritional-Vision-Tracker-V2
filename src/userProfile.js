import './style.css';
import { initAuthGuard } from './auth-guard.js';
import { supabase, logoutUser, createUserProfile } from './supabase.js';
import { getCurrentUser } from './auth-guard.js';

initAuthGuard();

const currentUser = await getCurrentUser();
console.log(currentUser);

let isNewUser = false;

// ===== SETUP BANNER =====
function showSetupBanner() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    const existing = document.getElementById('setupBanner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'setupBanner';
    banner.style.cssText = `
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 16px;
        color: #856404;
        font-weight: 500;
    `;
    banner.textContent = '👋 Welcome! Please complete all fields below to set up your profile before continuing.';
    form.prepend(banner);

    ['userName', 'userAge', 'userGender', 'userWeight', 'userHeight'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.required = true;
    });
}

function hideSetupBanner() {
    document.getElementById('setupBanner')?.remove();
}

// ===== PROFILE SECTION =====
async function loadUserProfile() {
    try {
        console.log('Current user ID:', currentUser.id);

        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error) {
            console.error('Unexpected error fetching profile:', error);
            alert('Failed to load your profile. Please refresh the page.');
            return;
        }

        if (!profile) {
            console.log('No profile found. Prompting user to complete setup.');
            isNewUser = true;
            showSetupBanner();
            return;
        }

        isNewUser = false;
        hideSetupBanner();
        console.log('User found:', profile);

        const fields = {
            userName: profile.name,
            userAge: profile.age,
            userGender: profile.gender,
            userWeight: profile.weight,
            userHeight: profile.height,
            medicalNotes: profile.medical_notes,
        };

        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = value ?? '';
            else console.error(`Element #${id} missing from HTML`);
        }

        calculateBMI();

    } catch (err) {
        console.error('Unexpected error in loadUserProfile:', err);
        alert('Error loading profile: ' + err.message);
    }
}

// ===== BMI =====
function calculateBMI() {
    const weight = parseFloat(document.getElementById('userWeight').value);
    const height = parseFloat(document.getElementById('userHeight').value);

    if (weight && height) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
        document.getElementById('userBMI').value = bmi;
    }
}

document.getElementById('userWeight').addEventListener('input', calculateBMI);
document.getElementById('userHeight').addEventListener('input', calculateBMI);

// ===== FORM SUBMIT =====
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userName = document.getElementById('userName');
    const userAge = document.getElementById('userAge');
    const userGender = document.getElementById('userGender');
    const userWeight = document.getElementById('userWeight');
    const userHeight = document.getElementById('userHeight');
    const medicalNotes = document.getElementById('medicalNotes');

    if (!userName || !userAge || !userGender || !userWeight || !userHeight || !medicalNotes) {
        alert('Error: One or more form fields are missing from the HTML.');
        return;
    }

    const missingValues = [];
    if (!userName.value.trim()) missingValues.push('Name');
    if (!userAge.value) missingValues.push('Age');
    if (!userGender.value) missingValues.push('Gender');
    if (!userWeight.value) missingValues.push('Weight');
    if (!userHeight.value) missingValues.push('Height');

    if (missingValues.length > 0) {
        alert(`Please fill in all required fields: ${missingValues.join(', ')}`);
        return;
    }

    const profileData = {
        name: userName.value.trim(),
        age: parseInt(userAge.value),
        gender: userGender.value,
        weight: parseFloat(userWeight.value),
        height: parseFloat(userHeight.value),
        medical_notes: medicalNotes.value.trim() || null,
        status: 0,
    };

    try {
        if (isNewUser) {
            await createUserProfile(currentUser.id, profileData);
            isNewUser = false;
            hideSetupBanner();
            alert('Profile created successfully! Welcome aboard 🎉');
            window.location.replace("userDashboard.html")
        } else {
            const { error } = await supabase
                .from('users')
                .update(profileData)
                .eq('id', currentUser.id);

            if (error) throw error;
            alert('Profile saved successfully!');
        }

        console.log('Profile saved:', profileData);
        calculateBMI();

    } catch (err) {
        console.error('Error saving profile:', err);
        alert('Failed to save profile: ' + err.message);
    }
});

// ===== LOGOUT =====
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const button = e.target;
    button.disabled = true;
    button.textContent = 'Logging out...';

    try {
        await logoutUser();
        window.location.replace('index.html');
    } catch (err) {
        console.error('Logout error:', err);
        button.disabled = false;
        button.textContent = 'Logout';
    }
});

// ===== INITIALIZE =====
loadUserProfile();