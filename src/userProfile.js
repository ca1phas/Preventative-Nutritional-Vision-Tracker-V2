import './style.css';
import './auth-guard.js';
import { supabase, logoutUser } from './supabase.js';
//DONE
const currentUser = await getCurrentUser();
console.log(currentUser);

// ===== CONFIGURATION =====
const USE_MOCK_DATA = false;

// ===== PROFILE SECTION =====
async function loadUserProfile() {
    try {
        console.log('Current user ID:', currentUser.id);

        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) {
            console.error('Full error object:', error);
            throw error;
        }

        console.log('Profile loaded:', profile);

        // ADD ERROR CHECKING HERE
        if (profile) {
            const userName = document.getElementById('userName');
            const userAge = document.getElementById('userAge');
            const userGender = document.getElementById('userGender');
            const userWeight = document.getElementById('userWeight');
            const userHeight = document.getElementById('userHeight');
            const medicalNotes = document.getElementById('medicalNotes');

            if (!userName) console.error('userName element missing');
            if (!userAge) console.error('userAge element missing');
            if (!userGender) console.error('userGender element missing');
            if (!userWeight) console.error('userWeight element missing');
            if (!userHeight) console.error('userHeight element missing');
            if (!medicalNotes) console.error('medicalNotes element missing');

            if (userName) userName.value = profile.name || '';
            if (userAge) userAge.value = profile.age || '';
            if (userGender) userGender.value = profile.gender || '';
            if (userWeight) userWeight.value = profile.weight || '';
            if (userHeight) userHeight.value = profile.height || '';
            if (medicalNotes) medicalNotes.value = profile.medical_notes || '';
            
            calculateBMI();
        }
    } catch (err) {
        console.error('Catch error:', err);
        alert('Error: ' + err.message);
    }
}

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

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if all elements exist
    const userName = document.getElementById('userName');
    const userAge = document.getElementById('userAge');
    const userGender = document.getElementById('userGender');
    const userWeight = document.getElementById('userWeight');
    const userHeight = document.getElementById('userHeight');
    const medicalNotes = document.getElementById('medicalNotes');

    // Log which ones are missing
    if (!userName) console.error('userName missing');
    if (!userAge) console.error('userAge missing');
    if (!userGender) console.error('userGender missing');
    if (!userWeight) console.error('userWeight missing');
    if (!userHeight) console.error('userHeight missing');
    if (!medicalNotes) console.error('medicalNotes missing');

    // Only continue if all exist
    if (!userName || !userAge || !userGender || !userWeight || !userHeight || !medicalNotes) {
        alert('Error: One or more form fields are missing from HTML');
        return;
    }

    const profileData = {
        name: userName.value,
        age: parseInt(userAge.value),
        gender: userGender.value,
        weight: parseFloat(userWeight.value),
        height: parseFloat(userHeight.value),
        medical_notes: medicalNotes.value
    };

    if (USE_MOCK_DATA) {
        sessionStorage.setItem('mockUserProfile', JSON.stringify(profileData));
        alert('Profile saved successfully! (Mock mode)');
        console.log('Profile data:', profileData);
    } else {
        try {
            const { error } = await supabase
                .from('users')
                .update(profileData)
                .eq('id', currentUser.id);

            if (error) throw error;

            alert('Profile saved successfully!');
            console.log('Profile saved:', profileData);
        } catch (err) {
            console.error('Error saving profile:', err);
            alert('Failed to save profile: ' + err.message);
        }
    }
});

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

// Initialize
setTimeout(loadUserProfile(), 2000)
