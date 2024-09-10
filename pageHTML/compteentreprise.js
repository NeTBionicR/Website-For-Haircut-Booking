document.addEventListener('DOMContentLoaded', function() {
    var token = sessionStorage.getItem("token");

    if (token) {
        adjustNavigationForLoggedInUser();
        fetchEntrepriseData(token);
    } else {
        window.location.href = 'login.html';
    }

    attachEventListeners();

    $('#account-portfolio-tab').on('shown.bs.tab', function (e) {
        fetchImages();
    });

    $('#account-reservation-tab').on('shown.bs.tab', function (e) {
        fetchReservations();
    });

    const deconnecterBtn = document.getElementById('deconnecter');
    if (deconnecterBtn) {
        deconnecterBtn.addEventListener('click', () => {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('accountType');
            window.location.href = 'acceuil.html';
        });
    }
});

function adjustNavigationForLoggedInUser() {
    var button = document.querySelector(".nav-menu .link[href='inscription.html']");
    if (button) {
        button.textContent = "Mon Salon";
        button.href = "compteentreprise.html";
        button.classList.add("active");
    }
}

function attachEventListeners() {
    document.getElementById('currentPasswordInput').addEventListener('input', validatePasswordChangeForm);
    document.getElementById('newPasswordInput').addEventListener('input', validatePasswordChangeForm);
    document.getElementById('repeatNewPasswordInput').addEventListener('input', validatePasswordChangeForm);

    console.log('Attaching event listeners...');
    document.querySelector('#account-portfolio').addEventListener('shown.bs.tab', function() {
        console.log('Portfolio tab activated');
        fetchImages();
    });

    document.getElementById('saveButton').addEventListener('click', function(event) {
        event.preventDefault();
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab.id === 'account-portfolio') {
            saveImages();
            fetchImages();
        } else if (activeTab.id === 'account-salon' && validateSalonForm()) {
            updateSalonDetails();
        } else if (activeTab.id === 'account-mdp' && validatePasswordChangeForm()) {
            updatePassword();
        }
    });
}

function validateSalonForm() {
    let isValid = true;
    document.querySelectorAll('#account-salon .input-field').forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    return isValid;
}

function displayWarning(element, message) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
}

function clearWarning(element) {
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

function displayMessage(message, type, containerId) {
    const messageContainer = document.getElementById(containerId);
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = type === 'success' ? 'alert alert-success' : 'alert alert-danger';
        messageContainer.style.display = 'block';
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

function handleResponse(response) {
    if (!response.ok) throw new Error('HTTP status ' + response.status);
    return response.json();
}

function fetchEntrepriseData(token) {
    fetch('/api/entreprise/data', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success) {
            fillFormWithData(data.entreprise);
        } else {
            console.error('Failed to fetch entreprise data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching entreprise data:', error);
    });
}

function addService(service = '') {
    const serviceList = document.getElementById('serviceList');
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control input-field';
    input.name = 'serviceOffered';
    input.value = service;
    input.required = true;

    serviceList.appendChild(inputWrapper);
    inputWrapper.appendChild(input);
}

function removeService() {
    const serviceList = document.getElementById('serviceList');
    if (serviceList.children.length > 1) {
        serviceList.removeChild(serviceList.lastChild);
    }
}

function fillFormWithData(data) {
    console.log(data);
    document.getElementById('inputCompanyName').value = data.NomEntreprise || '';
    document.getElementById('inputEmail').value = data.Courriel || '';
    document.getElementById('addressInput').value = data.Adresse || '';
    document.getElementById('postalCodeInput').value = data.CodePostal || '';
    document.getElementById('phoneInput').value = data.NumeroTelephone || '';
    document.getElementById('priceRangeInput').value = data.Échelledeprix || '';
    document.getElementById('websiteInput').value = data.SiteWeb || '';
    document.getElementById('descriptionInput').value = data.Description || '';
    document.getElementById('mondayInput').value = data.Lundi || '';
    document.getElementById('tuesdayInput').value = data.Mardi || '';
    document.getElementById('wednesdayInput').value = data.Mercredi || '';
    document.getElementById('thursdayInput').value = data.Jeudi || '';
    document.getElementById('fridayInput').value = data.Vendredi || '';
    document.getElementById('saturdayInput').value = data.Samedi || '';
    document.getElementById('sundayInput').value = data.Dimanche || '';
    setServices(data.ServiceOffert || []);
}

function setServices(servicesArray) {
    const serviceList = document.getElementById('serviceList');
    serviceList.innerHTML = '';
    servicesArray.forEach(service => {
        addService(service);
    });
}

function updateSalonDetails() {
    const form = document.getElementById('salonForm');
    const formData = new FormData(form);
    const object = {};

    formData.forEach((value, key) => {
        if (object[key]) {
            if (key === 'serviceOffered') {
                object[key] = `${object[key]};${value}`;
            } else {
                object[key] += `, ${value}`;
            }
        } else {
            object[key] = value;
        }
    });

    console.log("Final payload: ", JSON.stringify(object));

    const json = JSON.stringify(object);
    const token = sessionStorage.getItem('token');

    fetch('/api/entreprise/updateDetails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: json
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayMessage('Mise à jour réussie.', 'success');
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la mise à jour du compte:', error);
        displayMessage(`Échec de la mise à jour du compte: ${error}`, 'error');
    });
}

function validatePasswordChangeForm() {
    let isValid = true;
    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const repeatNewPasswordInput = document.getElementById('repeatNewPasswordInput');

    clearWarning(currentPasswordInput.nextElementSibling);
    clearWarning(newPasswordInput.nextElementSibling);
    clearWarning(repeatNewPasswordInput.nextElementSibling);

    // Validation du mot de passe actuel
    if (!currentPasswordInput.value.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/)) {
        displayWarning(currentPasswordInput.nextElementSibling, 'Le mot de passe actuel est invalide.');
        isValid = false;
    }

    // Validation du nouveau mot de passe
    if (!newPasswordInput.value.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/)) {
        displayWarning(newPasswordInput.nextElementSibling, 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
        isValid = false;
    } else if (newPasswordInput.value === currentPasswordInput.value) {
        displayWarning(newPasswordInput.nextElementSibling, 'Le nouveau mot de passe ne peut pas être le même que l\'actuel.');
        isValid = false;
    }

    // Vérification si les nouveaux mots de passe correspondent
    if (newPasswordInput.value !== repeatNewPasswordInput.value) {
        displayWarning(repeatNewPasswordInput.nextElementSibling, 'Les mots de passe ne correspondent pas.');
        isValid = false;
    }

    return isValid;
}

function updatePassword() {
    if (!validatePasswordChangeForm()) {
        return;
    }

    const token = sessionStorage.getItem('token');
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;

    fetch('/api/entreprise/updatepass', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token, currentPassword, newPassword })
    })
    .then(handleResponse)
    .then(data => {
        if (data.success) {
            displayMessage('Mot de passe changé avec succès.', 'success', 'messageContainerMdp');
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Erreur lors du changement de mot de passe:', error);
        displayMessage('Échec du changement de mot de passe: ' + error.message, 'error', 'messageContainerMdp');
    });
}

function validateInput(input) {
    const pattern = input.getAttribute('pattern');
    const value = input.value.trim();
    let warningMessage = input.nextElementSibling;

    if (!warningMessage) {
        warningMessage = document.createElement('span');
        warningMessage.className = 'warning-message';
        input.parentNode.appendChild(warningMessage);
    }

    warningMessage.style.display = 'none';

    if (!value && input.required) {
        warningMessage.textContent = 'Ce champ est obligatoire.';
        warningMessage.style.display = 'block';
        return false;
    }

    if (pattern && !new RegExp(pattern).test(value)) {
        warningMessage.textContent = getWarningMessage(input.id);
        warningMessage.style.display = 'block';
        return false;
    }

    return true;
}

function getWarningMessage(inputId) {
    switch(inputId) {
        case 'inputEmail':
            return 'Format de l\'email invalide.';
        case 'postalCodeInput':
            return 'Le code postal doit être sous la forme H1H 1H1.';
        case 'phoneInput':
            return 'Le numéro de téléphone doit commencer par 514, 438 ou 263 et suivre de sept chiffres.';
        case 'priceRangeInput':
            return 'L\'échelle de prix doit être au format XX$ - XX$.';
        case 'mondayInput':
        case 'tuesdayInput':
        case 'wednesdayInput':
        case 'thursdayInput':
        case 'fridayInput':
        case 'saturdayInput':
        case 'sundayInput':
            return 'L\'horaire doit être sous la forme "XXhXX - XXhXX" ou "Fermé".';
    }
}

document.getElementById('imageUpload').addEventListener('change', function() {
    displaySelectedImages(this.files);
});

function displaySelectedImages(files) {
    const imageContainer = document.getElementById('imageDisplayArea');
    imageContainer.innerHTML = '';
    Array.from(files).forEach(file => {
        const imgElement = document.createElement('img');
        imgElement.src = URL.createObjectURL(file);
        imgElement.style.maxWidth = '50%';
        imgElement.style.height = 'auto';
        imgElement.style.margin = '5px';
        imageContainer.appendChild(imgElement);
    });
}

function saveImages() {
    const formData = new FormData();
    const files = document.getElementById('imageUpload').files;
    Array.from(files).forEach(file => {
        formData.append('images', file);
    });

    const token = sessionStorage.getItem('token');
    fetch(`/api/entreprise/saveImages`, {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not OK');
        }
        return response.json();
    })
    .then(result => {
        displayMessage('Images saved successfully.', 'success', 'messageContainerPortfolio');
        fetchImages();
    })
    .catch(error => {
        console.error('Error:', error);
        displayMessage('Failed to save images: ' + error.message, 'error', 'messageContainerPortfolio');
    });
}

function deleteSelectedImages() {
    const token = sessionStorage.getItem('token');
    if (!token) {
        console.error('Token not found in session storage');
        return;
    }

    const selectedImages = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedImages.push(checkbox.dataset.image);
    });

    fetch('/api/entreprise/deleteImages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ images: selectedImages })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete images');
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
        fetchImages();
    })
    .catch(error => {
        console.error('Error deleting images:', error);
    });
}

function fetchImages() {
    const token = sessionStorage.getItem('token');
    fetch(`/api/entreprise/images/${token}`, { 
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok.');
        return response.json();
    })
    .then(images => {
        displayImages(images);
    })
    .catch(error => {
        console.error('Error fetching images:', error);
        displayMessage('Error fetching images: ' + error, 'error', 'messageContainerPortfolio');
    });
}

// Function to display images with checkboxes
function displayImages(images) {
    const container = document.getElementById('imageDisplayArea');
    container.innerHTML = '';
    images.forEach((image, index) => {
        const imageWrapper = document.createElement('div');
        const checkbox = document.createElement('input');
        const label = document.createElement('label');
        const img = document.createElement('img');

        checkbox.type = 'checkbox';
        checkbox.className = 'image-checkbox';
        const filename = image.split('/').pop();
        checkbox.dataset.image = filename;

        label.appendChild(img);
        img.src = image;
        img.style.maxWidth = '100px';
        img.style.height = 'auto';
        img.style.margin = '5px';

        imageWrapper.appendChild(checkbox);
        imageWrapper.appendChild(label);
        container.appendChild(imageWrapper);
    });
}

function fetchReservations() {
    const token = sessionStorage.getItem('token');

    fetch('/api/entreprise/reservations', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayReservations(data.reservations);
        } else {
            console.error('Failed to fetch reservations:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching reservations:', error);
    });
}

function displayReservations(reservations) {
    const container = document.getElementById('reservationsContainer');
    container.innerHTML = '';
    reservations.forEach(reservation => {
        const item = document.createElement('div');
        item.className = 'reservation-item';
        item.innerHTML = `
            <p>Date: ${reservation.date}</p>
            <p>Heure: ${reservation.heure}</p>
            <p>Service: ${reservation.Service}</p>
            <p>Statut: Confirmé</p>
        `;
        container.appendChild(item);
    });
}
