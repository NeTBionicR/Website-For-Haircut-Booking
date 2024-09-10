document.addEventListener("DOMContentLoaded", function() {
    var token = sessionStorage.getItem("token");

    // Gestion des changements de navigation
    if (token) {
        var button = document.querySelector(".nav-menu .link[href='inscription.html']");
        if (button) {
            button.textContent = "Mon Compte";
            button.href = "comptepersonnel.html";
            button.classList.add("active");
        }
    }

    // Récupération et affichage des données utilisateur
    fetchUserData();

    // Récupération et affichage des favoris
    fetchFavorites();

    // Récupération et affichage des réservations
    fetchReservations();

    // Définition d'un moment aléatoire pour la vidéo
    setRandomVideoTime();

    // Validation des champs de saisie lors de la saisie
    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('input', validateInput);
    });

    // Écouteur d'événement pour le bouton de sauvegarde
    document.getElementById('saveButton').addEventListener('click', function(event) {
        event.preventDefault();
        if (document.getElementById('account-mdp').classList.contains('active')) {
            if (validatePasswordChangeForm()) {
                submitPasswordChange();
            }
        } else {
            if (validateForm()) {
                updateAccount();
            }
        }
    });

    // Fonctionnalité de déconnexion
    const deconnecterBtn = document.getElementById('deconnecter');
    if (deconnecterBtn) {
        deconnecterBtn.addEventListener('click', () => {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('accountType');
            window.location.href = 'acceuil.html';
        });
    }
});

function setRandomVideoTime() {
    const video = document.getElementById('video1');
    if (video && video.duration) {
        video.currentTime = Math.random() * video.duration;
    }
}

function fetchUserData() {
    const token = sessionStorage.getItem('token');
    fetch('/api/account', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('La réponse du réseau n\'était pas correcte: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        document.querySelector('#inputFirstName').value = data.firstName;
        document.querySelector('#inputLastName').value = data.lastName;
        document.querySelector('#inputEmail').value = data.email;
    })
    .catch(error => {
        console.error('Erreur lors de la récupération des données du compte:', error);
    });
}

function fetchReservations() {
    const token = sessionStorage.getItem('token');
    fetch('/api/reservations', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(reservations => {
        const reservationsContainer = document.getElementById('reservations-container');
        reservationsContainer.innerHTML = '';

        reservations.forEach(reservation => {
            const reservationDiv = document.createElement('div');
            reservationDiv.classList.add('reservation');
            reservationDiv.dataset.id = reservation.ReservationId;
            reservationDiv.innerHTML = `
                <h2>${reservation.nomSalon}</h2>
                <p>Date: ${reservation.date}</p>
                <p>Heure: ${reservation.heure}</p>
                <button class="btn btn-danger" onclick="deleteReservation(${reservation.ReservationId})">Supprimer</button>
            `;
            reservationsContainer.appendChild(reservationDiv);
        });
    })
    .catch(error => {
        console.error('Erreur lors de la récupération des réservations:', error);
    });
}

function deleteReservation(reservationId) {
    const token = sessionStorage.getItem('token');
    fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression de la réservation');
        }
        return response.json();
    })
    .then(data => {
        displayMessage('Réservation supprimée avec succès', 'success');
        fetchReservations(); // Rafraîchir la liste des réservations
    })
    .catch(error => {
        console.error('Erreur lors de la suppression de la réservation:', error);
        displayMessage('Erreur lors de la suppression de la réservation', 'error');
    });
}

function updateAccount() {
    const userData = {
        firstName: document.querySelector('#inputFirstName').value,
        lastName: document.querySelector('#inputLastName').value,
        email: document.querySelector('#inputEmail').value,
        token: sessionStorage.getItem('token')
    };

    fetch('/api/account/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            displayMessage('Compte mis à jour avec succès', 'success');
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la mise à jour du compte:', error);
        displayMessage('Échec de la mise à jour du compte', 'error');
    });
}

function fetchFavorites() {
    const token = sessionStorage.getItem('token');
    fetch('/favorites', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(favorites => {
        const favoritesContainer = document.getElementById('favorites-container');
        favoritesContainer.innerHTML = '';

        favorites.forEach(favorite => {
            const favoriteDiv = document.createElement('div');
            favoriteDiv.classList.add('favorite');
            favoriteDiv.innerHTML = `
                <div class="card mb-3">
                    <div class="row no-gutters">
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">${favorite.NomEntreprise}</h5>
                                <p class="card-text"><strong>Adresse:</strong> ${favorite.Adresse}</p>
                                <p class="card-text"><strong>Téléphone:</strong> ${favorite.NumeroTelephone}</p>
                                <p class="card-text"><strong>Email:</strong> ${favorite.Courriel}</p>
                                <p class="card-text"><strong>Services Offerts:</strong> ${favorite.ServiceOffert}</p>
                                <div class="btn-group" role="group" aria-label="Salon actions">
                                    <button class="btn btn-primary" onclick="bookSalon(${favorite.SalonId})">Réserver</button>
                                    <button class="btn btn-danger" onclick="removeFavorite(${favorite.SalonId})">Supprimer des favoris</button>
                                    <a href="${favorite.SiteWeb}" target="_blank" class="btn btn-info" ${!favorite.SiteWeb ? 'disabled' : ''}>Visiter le site</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            favoritesContainer.appendChild(favoriteDiv);
        });
    })
    .catch(error => {
        console.error('Erreur lors de la récupération des favoris:', error);
    });
}

function bookSalon(salonId) {
    window.location.href = `/reservation.html?id=${salonId}`;
}

function removeFavorite(salonId) {
    const token = sessionStorage.getItem('token');
    fetch(`/favorites/${salonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du favori');
        }
        return response.json();
    })
    .then(data => {
        displayMessage('Favori supprimé avec succès', 'success');
        fetchFavorites(); // Rafraîchir la liste des favoris
    })
    .catch(error => {
        console.error('Erreur lors de la suppression du favori:', error);
        displayMessage('Erreur lors de la suppression du favori', 'error');
    });
}

function validatePasswordChangeForm() {
    let isValid = true;
    const currentPassword = document.querySelector('#currentPasswordInput').value;
    const newPassword = document.querySelector('#newPasswordInput').value;
    const repeatNewPassword = document.querySelector('#repeatNewPasswordInput').value;

    if (!currentPassword || !currentPassword.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/)) {
        displayWarning('currentPasswordInput', 'Le mot de passe actuel est invalide.');
        isValid = false;
    }
    if (!newPassword || !newPassword.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/)) {
        displayWarning('newPasswordInput', 'Le nouveau mot de passe doit contenir au moins 8 caractères, dont un chiffre, une lettre minuscule et une lettre majuscule.');
        isValid = false;
    }
    if (newPassword !== repeatNewPassword) {
        displayWarning('repeatNewPasswordInput', 'Le nouveau mot de passe ne correspond pas.');
        isValid = false;
    }

    return isValid;
}

function submitPasswordChange() {
    const currentPassword = document.querySelector('#currentPasswordInput').value;
    const newPassword = document.querySelector('#newPasswordInput').value;
    const token = sessionStorage.getItem('token');

    const passwordData = { currentPassword, newPassword, token };

    fetch('/api/account/updatepass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
    })
    .then(handleResponse)
    .then(handleData)
    .catch(handleError);
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`Erreur HTTP! status: ${response.status}`);
    }
    return response.json();
}

function handleData(data) {
    if (data.success) {
        displayMessage('Mot de passe changé avec succès.', 'success');
    } else {
        displayMessage(data.message, 'error');
    }
}

function handleError(error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    displayMessage('Échec du changement de mot de passe', 'error');
}

function validateInput(event) {
    const input = event.target;
    const inputWrapper = input.closest('.input-wrapper');
    const warningMessage = inputWrapper.querySelector('.warning-message');
    const pattern = input.getAttribute('pattern');

    if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(input.value)) {
            warningMessage.textContent = getMessageAvertissement(input.id, input.value);
            warningMessage.style.display = 'block';
        } else {
            warningMessage.style.display = 'none';
        }
    }
}

function validateForm() {
    let isValid = true;
    const firstName = document.querySelector('#inputFirstName').value;
    if (firstName.length < 2) {
        displayWarning('inputFirstName', 'Le prénom doit contenir au moins 2 caractères.');
        isValid = false;
    }

    const lastName = document.querySelector('#inputLastName').value;
    if (lastName.length < 2) {
        displayWarning('inputLastName', 'Le nom doit contenir au moins 2 caractères.');
        isValid = false;
    }

    const email = document.querySelector('#inputEmail').value;
    if (!email.includes('@')) {
        displayWarning('inputEmail', 'L\'adresse email n\'est pas valide.');
        isValid = false;
    }

    return isValid;
}

function displayWarning(inputId, message) {
    const warningElement = document.querySelector('#' + inputId + ' + .warning-message');
    warningElement.textContent = message;
    warningElement.style.display = 'block';
}

function getMessageAvertissement(inputId, inputValue) {
    switch(inputId) {
        case 'inputFirstName':
            return 'Prénom invalide.';
        case 'inputLastName':
            return 'Nom invalide.';
        case 'inputEmail':
            return 'Format de l\'email invalide.';
    }
}

function displayMessage(message, type) {
    const messageContainerId = document.getElementById('account-mdp').classList.contains('active') ? 'messageContainerPassword' : 'messageContainerAccount';
    const messageElement = document.getElementById(messageContainerId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = type === 'success' ? 'alert alert-success' : 'alert alert-danger';
        messageElement.style.display = 'block';

        setTimeout(function() {
            messageElement.style.display = 'none';
        }, 3000);
    } else {
        console.error('Message container not found');
    }
}
