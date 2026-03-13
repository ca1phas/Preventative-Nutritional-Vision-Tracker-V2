import './style.css';
import { analyzeFoodImage } from './ai-service.js';

// checkAuth();
// setupLogout();

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('isUserAuthenticated');
  sessionStorage.removeItem('userID');
  window.location.href = 'index.html';
});

const uploadForm = document.getElementById('uploadForm');
const mealImage = document.getElementById('mealImage');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const submitBtn = document.getElementById('submitBtn');

const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif'
];
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'];
const MIN_WIDTH = 1920;
const MIN_HEIGHT = 1080;

// Handle image selection and preview
mealImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    error.classList.add('hidden');

    if (file) {
        if (!isValidFormat(file)) {
            showError('Invalid file type. Please use PNG, JPEG, WEBP, HEIC, or HEIF.');
            mealImage.value = '';
            imagePreview.classList.add('hidden');
            return;
        }

        if (isHeicLike(file)) {
            // Most browsers cannot decode HEIC/HEIF for preview/resolution checks.
            imagePreview.classList.add('hidden');
            showError('HEIC/HEIF selected. Browser preview/resolution check is unavailable; ensure image is at least 1080p.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            validateImageResolution(e.target.result)
                .then(() => {
                    imagePreview.classList.remove('hidden');
                })
                .catch(() => {
                    showError('Image must be at least 1920x1080 (1080p). Please choose a higher resolution image.');
                    mealImage.value = '';
                    imagePreview.classList.add('hidden');
                });
        };
        reader.readAsDataURL(file);
    }
});

// Handle form submission and AI API Call
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = mealImage.files[0];
    if (!file || !isValidFormat(file)) {
        showError('Invalid file type. Please use PNG, JPEG, WEBP, HEIC, or HEIF.');
        return;
    }

    // Update UI to show loading state
    loading.classList.remove('hidden');
    uploadForm.classList.add('hidden');
    error.classList.add('hidden');

    try {
        let imageDataUrl = await readFileAsDataUrl(file);
        let width = null, height = null, resolutionUnchecked = isHeicLike(file);

        if (!resolutionUnchecked) {
            const dimensions = await validateImageResolution(imageDataUrl);
            width = dimensions.width;
            height = dimensions.height;
        }

        // 1. Run the REAL AI Analysis (Step 1)
        const mimeType = file.type || `image/${getExtensionFromName(file.name)}`;
        const detectedIngredients = await analyzeFoodImage(imageDataUrl, mimeType);

        // 2. Save state to session storage
        sessionStorage.setItem('uploadedImage', JSON.stringify({
            name: file.name,
            type: mimeType,
            size: file.size,
            width,
            height,
            resolutionUnchecked,
            dataUrl: imageDataUrl,
            capturedAt: new Date().toISOString()
        }));

        // Pass the live Gemini data to the confirm page
        sessionStorage.setItem('ingredients', JSON.stringify(detectedIngredients));

        // 3. Redirect to the confirmation page
        window.location.href = 'confirm.html';

    } catch (err) {
        console.error("Analysis Error:", err);
        showError('Unable to process image with AI. Please try again.');
        uploadForm.classList.remove('hidden');
        loading.classList.add('hidden');
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function isValidFormat(file) {
    const extension = getExtensionFromName(file.name);
    const mimeValid = file.type && ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    const extensionValid = ALLOWED_EXTENSIONS.includes(extension);
    return mimeValid || extensionValid;
}

function getExtensionFromName(fileName) {
    const parts = fileName.toLowerCase().split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
}

function isHeicLike(file) {
    const extension = getExtensionFromName(file.name);
    const mime = (file.type || '').toLowerCase();
    return extension === 'heic' || extension === 'heif' || mime === 'image/heic' || mime === 'image/heif';
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function validateImageResolution(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            if (img.width >= MIN_WIDTH && img.height >= MIN_HEIGHT) {
                resolve({ width: img.width, height: img.height });
            } else {
                reject(new Error('Image resolution is below 1080p.'));
            }
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
}