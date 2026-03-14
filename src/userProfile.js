import './style.css';

// ===== CONFIGURATION =====
// Set to false when integrating with backend API
const USE_MOCK_DATA = true;

// ===== AUTH CHECK =====
// TODO

// ===== MOCK DATA (remove this section when integrating with backend) =====
const MOCK_USER_PROFILE = {
    userID: currentUser,
    name: 'XXX',
    age: 35,
    gender: 'male',
    weight: 75.5,
    height: 175,
    medicalNotes: 'Pre-diabetic. Avoid high sugar intake. Regular monitoring required.'
};

// ===== END OF MOCK DATA =====

// ===== PROFILE SECTION =====
function loadUserProfile() {
    if (USE_MOCK_DATA) {
        // Load mock data
        document.getElementById('userName').value = MOCK_USER_PROFILE.name;
        document.getElementById('userAge').value = MOCK_USER_PROFILE.age;
        document.getElementById('userGender').value = MOCK_USER_PROFILE.gender;
        document.getElementById('userWeight').value = MOCK_USER_PROFILE.weight;
        document.getElementById('userHeight').value = MOCK_USER_PROFILE.height;
        document.getElementById('medicalNotes').value = MOCK_USER_PROFILE.medicalNotes;
        calculateBMI();
    } else {
        // TODO: Replace with actual API call
        // fetch(`/api/users/${currentUser}/profile`)
        //     .then(response => response.json())
        //     .then(data => {
        //         document.getElementById('userName').value = data.name;
        //         document.getElementById('userAge').value = data.age;
        //         document.getElementById('userGender').value = data.gender;
        //         document.getElementById('userWeight').value = data.weight;
        //         document.getElementById('userHeight').value = data.height;
        //         document.getElementById('medicalNotes').value = data.medicalNotes;
        //         calculateBMI();
        //     });
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

document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const profileData = {
        userID: currentUser,
        name: document.getElementById('userName').value,
        age: parseInt(document.getElementById('userAge').value),
        gender: document.getElementById('userGender').value,
        weight: parseFloat(document.getElementById('userWeight').value),
        height: parseFloat(document.getElementById('userHeight').value),
        medicalNotes: document.getElementById('medicalNotes').value
    };

    if (USE_MOCK_DATA) {
        // Simulate save
        sessionStorage.setItem('mockUserProfile', JSON.stringify(profileData));
        sessionStorage.setItem('profileComplete', 'true');

        alert('Profile saved successfully! (Mock mode - data not persisted)');
        console.log('Profile data:', profileData);
    } else {
        // TODO: Replace with actual API call
        // fetch(`/api/users/${currentUser}/profile`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(profileData)
        // })
        // .then(response => response.json())
        // .then(data => {
        //     alert('Profile saved successfully!');
        // });
    }
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
    // TODO: logout
    window.location.href = 'index.html';
});

// ===== INITIALIZE =====
loadUserProfile();
