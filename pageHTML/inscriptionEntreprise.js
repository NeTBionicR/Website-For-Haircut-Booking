document.addEventListener("DOMContentLoaded", function() {
    const video = document.getElementById('video1');
    setRandomTime(video);
    attachEventListeners();
});

function attachEventListeners() {
    const form = document.getElementById('entrepriseForm');
    form.addEventListener('submit', handleSubmit);
    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('input', () => validateInput(input));
    });
}

function addService() {
    const serviceList = document.getElementById('serviceList');
    const lastRow = serviceList.querySelector('.row:last-child');
    const inputsInRow = lastRow.querySelectorAll('.input-box').length;
    const newService = document.createElement('div');
    newService.className = 'input-box';
    newService.innerHTML = `
        <input type="text" class="input-field" placeholder="Service Offert" name="serviceOffered" required>
        <i class="bx bx-briefcase"></i>
        <span class="warning-message"></span>`;

    if (inputsInRow >= 3) {
        const newRow = document.createElement('div');
        newRow.className = 'row full-width';
        newRow.appendChild(newService);
        serviceList.appendChild(newRow);
    } else {
        lastRow.appendChild(newService);
    }
    newService.querySelector('.input-field').addEventListener('input', function() { validateInput(this); });
}

function removeService() {
    const serviceList = document.getElementById('serviceList');
    const lastRow = serviceList.querySelector('.row:last-child');
    if (lastRow && lastRow.children.length > 0) {
        lastRow.removeChild(lastRow.lastChild);
        if (lastRow.children.length === 0 && serviceList.children.length > 1) {
            serviceList.removeChild(lastRow);
        }
    }
}

function setRandomTime() {
    const video = document.getElementById('video1');
    video.onloadedmetadata = () => {
        video.currentTime = Math.random() * video.duration;
    };
}

function handleSubmit(event) {
    event.preventDefault();
    if (validateAllInputs()) {
        const formData = gatherFormData();
        submitFormData(formData);
    }
}

function validateAllInputs() {
    let isValid = true;
    document.querySelectorAll('.input-field').forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    return isValid;
}

function validateInput(input) {
    const pattern = input.getAttribute('pattern');
    const warningSpan = input.parentNode.querySelector('.warning-message');
    const value = input.value.trim();

    warningSpan.style.display = 'none';

    if (input.required && !value) {
        warningSpan.textContent = 'Ce champ est obligatoire.';
        warningSpan.style.display = 'block';
        return false;
    }

    if (pattern && !new RegExp(pattern).test(value)) {
        warningSpan.textContent = getWarningMessage(input.id);
        warningSpan.style.display = 'block';
        return false;
    }

    return true;
}

function getWarningMessage(inputId) {
    switch(inputId) {
        case 'postalCodeInput':
            return 'Le code postal doit être sous la forme H1H 1H1, en alternant lettres et chiffres.';
        case 'phoneInput':
            return 'Le numéro de téléphone doit contenir exactement 10 chiffres et commencer par 514, 438 ou 263.';
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


function gatherFormData() {
    const formData = {
        address: document.getElementById('addressInput').value,
        postalCode: document.getElementById('postalCodeInput').value,
        phone: document.getElementById('phoneInput').value,
        services: Array.from(document.querySelectorAll('[name="serviceOffered"]')).map(input => input.value),
        hours: {
            monday: document.getElementById('mondayInput').value,
            tuesday: document.getElementById('tuesdayInput').value,
            wednesday: document.getElementById('wednesdayInput').value,
            thursday: document.getElementById('thursdayInput').value,
            friday: document.getElementById('fridayInput').value,
            saturday: document.getElementById('saturdayInput').value,
            sunday: document.getElementById('sundayInput').value
        },
        priceRange: document.getElementById('priceRangeInput').value,
        website: document.getElementById('websiteInput').value,
        description: document.getElementById('descriptionInput').value,
        token: sessionStorage.getItem('token')
    };
    return formData;
}

function submitFormData(formData) {
    fetch('/api/entreprise/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify(formData)
    }).then(response => {
        if (response.ok) {
            window.location.href = '/acceuil.html'; // Redirect on success
        } else {
            return response.json(); // Handle errors and show messages if needed
        }
    })
    .then(data => {
        if (data && !data.success) {
            console.error('Failed to update entreprise: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Update Failed:', error);
    });
}