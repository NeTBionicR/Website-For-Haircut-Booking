document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('personnelBtn').classList.add('selected');
    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('input', validateInput);
    });
});

const video = document.getElementById('video1');
function setRandomTime() {
    const duration = video.duration;
    const randomTime = Math.random() * duration;
    video.currentTime = randomTime;
}
window.onload = setRandomTime;

function myMenuFunction() {
    var i = document.getElementById("navMenu");
    if (i.className === "nav-menu") {
        i.className += " responsive";
    } else {
        i.className = "nav-menu";
    }
}

function login() {
    var x = document.getElementById("login");
    var y = document.getElementById("register");
    var a = document.getElementById("loginBtn");
    var b = document.getElementById("registerBtn");

    x.style.left = "4px";
    y.style.right = "-520px";
    a.className += " white-btn";
    b.className = "btn";
    x.style.opacity = 1;
    y.style.opacity = 0;
}

function register() {
    var x = document.getElementById("login");
    var y = document.getElementById("register");
    var a = document.getElementById("loginBtn");
    var b = document.getElementById("registerBtn");

    x.style.left = "-510px";
    y.style.right = "5px";
    a.className = "btn";
    b.className += " white-btn";
    x.style.opacity = 0;
    y.style.opacity = 1;
}

function selectAccount(type) {
    console.log("Selected account type: " + type);
    document.getElementById('personnelBtn').classList.remove('selected');
    document.getElementById('entrepriseBtn').classList.remove('selected');
    document.getElementById(type + 'Btn').classList.add('selected');

    var companyNameWrapper = document.getElementById('companyNameWrapper');
    var firstNameWrapper = document.getElementById('firstNameWrapper');
    var lastNameWrapper = document.getElementById('lastNameWrapper');

    if (type === 'personnel') {
        companyNameWrapper.style.display = 'none';
        firstNameWrapper.style.display = 'block';
        lastNameWrapper.style.display = 'block';
    } else if (type === 'entreprise') {
        companyNameWrapper.style.display = 'block';
        firstNameWrapper.style.display = 'none';
        lastNameWrapper.style.display = 'none';
    }
}

function submitRegistration(event) {
    event.preventDefault();
    const accountType = document.querySelector('.account-btn.selected').getAttribute('data-type');
    let formData = {
        email: document.getElementById('emailInput').value,
        password: document.getElementById('passwordInput').value,
        type: accountType
    };

    // Collect data based on account type
    if (accountType === 'entreprise') {
        formData.nomEntreprise = document.getElementById('companyNameInput').value;
    } else {
        formData.firstName = document.getElementById('firstNameInput').value,
        formData.lastName = document.getElementById('lastNameInput').value
    }

    if (!validateForm(formData)) {
        console.log('Validation failed');
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Registration successful, received token:', data.token);
            // Store the token and account type only after successful registration
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('accountType', accountType);

            // Conditional redirection based on account type
            if (accountType === 'entreprise') {
                window.location.href = 'inscriptionEntreprise.html';
            } else {
                window.location.reload();
            }
        } else {
            updateWarningMessage('emailWrapper', data.message);
        }
    })
    .catch(error => {
        console.error('Error during registration:', error);
    });
}

function submitLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email) {
        updateWarningMessage('loginEmailWrapper', 'Veuillez entrer un courriel.');
        return;
    }
    if (!password) {
        updateWarningMessage('loginPasswordWrapper', 'Veuillez entrer un mot de passe.');
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Connexion réussie!');
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('accountType', data.type);  // Store account type in session storage
            function submitLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email) {
        updateWarningMessage('loginEmailWrapper', 'Veuillez entrer un courriel.');
        return;
    }
    if (!password) {
        updateWarningMessage('loginPasswordWrapper', 'Veuillez entrer un mot de passe.');
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Connexion réussie!');
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('accountType', data.type);  // Store account type in session storage
            sessionStorage.setItem('userId', data.userId)
            window.location.href = '/acceuil.html';
        } else {
            updateWarningMessage('loginPasswordWrapper', data.message);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la connexion:', error);
        updateWarningMessage('loginPasswordWrapper', 'Une erreur est survenue lors de la connexion.');
    });
}
            window.location.href = '/acceuil.html';
        } else {
            updateWarningMessage('loginPasswordWrapper', data.message);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la connexion:', error);
        updateWarningMessage('loginPasswordWrapper', 'Une erreur est survenue lors de la connexion.');
    });
}

function validateInput(event) {
    const input = event.target;
    const inputWrapper = input.closest('.input-wrapper');
    const warningMessage = inputWrapper.querySelector('.warning-message');
    const pattern = input.getAttribute('pattern');

    if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(input.value)) {
            warningMessage.textContent = getWarningMessage(input.id, input.value);
            warningMessage.style.display = 'block';
        } else {
            warningMessage.style.display = 'none';
        }
    } else {
        warningMessage.style.display = 'none';
    }
}

function validateForm(formData) {
    let isValid = true;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}/;

    if (formData.type === 'entreprise') {
        if (!formData.nomEntreprise || formData.nomEntreprise.trim() === '') {
            updateWarningMessage('companyNameWrapper', 'Veuillez entrer le nom de l\'entreprise.');
            isValid = false;
        }
    } else {
        if (!formData.firstName || formData.firstName.trim() === '') {
            updateWarningMessage('firstNameWrapper', 'Veuillez entrer un prénom valide.');
            isValid = false;
        }
        if (!formData.lastName || formData.lastName.trim() === '') {
            updateWarningMessage('lastNameWrapper', 'Veuillez entrer un nom de famille valide.');
            isValid = false;
        }
    }

    if (!formData.email || !emailRegex.test(formData.email)) {
        updateWarningMessage('emailWrapper', 'Veuillez entrer une adresse courriel valide et unique.');
        isValid = false;
    }

    if (!formData.password || !passwordRegex.test(formData.password)) {
        updateWarningMessage('passwordWrapper', 'Le mot de passe doit comporter au moins 8 caractères et inclure un chiffre, une lettre majuscule et un caractère spécial.');
        isValid = false;
    }

    return isValid;
}

function updateWarningMessage(wrapperId, message) {
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) {
        const warningMessage = wrapper.querySelector('.warning-message');
        if (warningMessage) {
            warningMessage.textContent = message;
            warningMessage.style.display = 'block';
        } else {
            console.error('Warning message element not found in wrapper:', wrapperId);
        }
    } else {
        console.error('Wrapper not found for ID:', wrapperId);
    }
}

function getWarningMessage(inputId, value) {
    switch(inputId) {
        case 'firstNameInput':
            return 'Veuillez entrer un prénom valide.';
        case 'lastNameInput':
            return 'Veuillez entrer un nom de famille valide.';
        case 'emailInput':
            return 'Veuillez entrer une adresse courriel valide et unique.';
        case 'passwordInput':
            return 'Le mot de passe doit comporter au moins 8 caractères et inclure un chiffre, une lettre majuscule et un caractère spécial.';
    }
    return 'Invalid input.';
}
