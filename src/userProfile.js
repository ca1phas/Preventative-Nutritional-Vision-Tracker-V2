import './style.css';
import { supabase } from './supabaseConnect.js';

// Auth check
function checkUserAuth() {
    if (sessionStorage.getItem('isUserAuthenticated') !== 'true') {
        window.location.href = 'index.html';
    }
}
checkUserAuth();

const currentUser = sessionStorage.getItem('userID');
if (!currentUser) {
    window.location.href = 'login.html';
}

let resolvedDbUserId = sessionStorage.getItem('supabaseUserId') || null;

document.getElementById('currentUserDisplay').textContent = `User: ${currentUser}`;

const profileForm = document.getElementById('profileForm');
const resetProfileBtn = document.getElementById('resetProfileBtn');
const profileStatus = document.getElementById('profileStatus');
const userNameInput = document.getElementById('userName');
const userAgeInput = document.getElementById('userAge');
const userGenderInput = document.getElementById('userGender');
const userWeightInput = document.getElementById('userWeight');
const userHeightInput = document.getElementById('userHeight');
const medicalNotesInput = document.getElementById('medicalNotes');
const userBMIInput = document.getElementById('userBMI');

function setStatus(message, type = 'info') {
    if (!message) {
        profileStatus.style.display = 'none';
        profileStatus.textContent = '';
        return;
    }

    profileStatus.style.display = 'block';
    profileStatus.textContent = message;
    if (type === 'error') {
        profileStatus.style.color = '#dc2626';
    } else if (type === 'success') {
        profileStatus.style.color = '#059669';
    } else {
        profileStatus.style.color = '#374151';
    }
}

function setProfileFormValues(profile = {}) {
    userNameInput.value = profile.name || '';
    userAgeInput.value = Number.isFinite(Number(profile.age)) ? profile.age : '';
    userGenderInput.value = (profile.gender || '').toLowerCase();
    userWeightInput.value = Number.isFinite(Number(profile.weight)) ? profile.weight : '';
    userHeightInput.value = Number.isFinite(Number(profile.height)) ? profile.height : '';
    medicalNotesInput.value = profile.medical_notes || '';
    calculateBMI();
}

function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
}

async function fetchUserById(userId) {
    if (!isUuid(userId)) return null;

    const { data, error } = await supabase
        .from('users')
        .select('id, name, age, gender, medical_notes, weight, height, status')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function fetchUserByName(name) {
    if (!name) return null;

    const { data, error } = await supabase
        .from('users')
        .select('id, name, age, gender, medical_notes, weight, height, status')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function fetchLatestUserRecord() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, age, gender, medical_notes, weight, height, status')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function resolveUserProfile() {
    // db UUID already known from previous load/save.
    const byResolvedId = await fetchUserById(resolvedDbUserId);
    if (byResolvedId) return { data: byResolvedId, source: 'id' };

    // if session userID is itself a UUID, use it directly.
    const byCurrentId = await fetchUserById(currentUser);
    if (byCurrentId) return { data: byCurrentId, source: 'id' };

    // try match current login identifier as name.
    const byName = await fetchUserByName(currentUser);
    if (byName) return { data: byName, source: 'name' };

    // if login is mock ID (for example U001), show latest row.
    const latest = await fetchLatestUserRecord();
    if (latest) return { data: latest, source: 'latest' };

    return { data: null, source: 'none' };
}

// Profile section
async function loadUserProfile() {
    setStatus('Loading profile...');

    let data;
    let source = 'none';

    try {
        const resolved = await resolveUserProfile();
        data = resolved.data;
        source = resolved.source;
    } catch (error) {
        setStatus(`Unable to load profile: ${error.message}`, 'error');
        return;
    }

    if (!data) {
        setProfileFormValues();
        setStatus('No profile found yet. Fill in your details and click Save Profile.');
        return;
    }

    resolvedDbUserId = data.id;
    sessionStorage.setItem('supabaseUserId', data.id);
    sessionStorage.setItem('supabaseUserStatus', String(data.status ?? 0));
    sessionStorage.setItem('profileComplete', 'true');

    setProfileFormValues(data);
    if (source === 'latest' && !isUuid(currentUser)) {
        setStatus('Profile loaded from Supabase using latest user record because current login ID is not a UUID.', 'success');
        return;
    }

    setStatus('Profile loaded from Supabase.', 'success');
}

function calculateBMI() {
    const weight = parseFloat(userWeightInput.value);
    const height = parseFloat(userHeightInput.value);

    if (weight && height) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
        userBMIInput.value = bmi;
    } else {
        userBMIInput.value = '';
    }
}

userWeightInput.addEventListener('input', calculateBMI);
userHeightInput.addEventListener('input', calculateBMI);

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const profileData = {
        name: userNameInput.value.trim(),
        age: parseInt(userAgeInput.value, 10),
        gender: userGenderInput.value,
        weight: parseFloat(userWeightInput.value),
        height: parseFloat(userHeightInput.value),
        medical_notes: medicalNotesInput.value.trim(),
        status: parseInt(sessionStorage.getItem('supabaseUserStatus') ?? '0', 10)
    };

    const recordIdToSave = isUuid(resolvedDbUserId)
        ? resolvedDbUserId
        : (isUuid(currentUser) ? currentUser : null);

    if (recordIdToSave) {
        profileData.id = recordIdToSave;
    }

    if (!profileData.name || !profileData.gender || !profileData.medical_notes) {
        setStatus('Please complete all required fields before saving.', 'error');
        return;
    }

    setStatus('Saving profile...');

    const { error } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' });

    if (error) {
        setStatus(`Unable to save profile: ${error.message}`, 'error');
        return;
    }

    sessionStorage.setItem('profileComplete', 'true');
    await loadUserProfile();

    setStatus('Profile saved successfully.', 'success');
});

resetProfileBtn.addEventListener('click', () => {
    loadUserProfile();
});

// logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('isUserAuthenticated');
    sessionStorage.removeItem('userID');
    localStorage.removeItem('userID');
    window.location.href = 'index.html';
});

// initialize
loadUserProfile();
