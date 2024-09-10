async function getSalonNameById(salonId) {
    try {
        const response = await fetch(`/salons/${salonId}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des informations du salon.');
        }
        const salon = await response.json();
        if (salon && typeof salon === 'object') {
            return salon.NomEntreprise;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    var token = sessionStorage.getItem("token");
    var accountType = sessionStorage.getItem("accountType");

    if (token) {
        var button = document.querySelector(".nav-menu .link[href='inscription.html']");
        if (button) {
            if (accountType === "personnel") {
                button.textContent = "Mon Compte";
                button.href = "comptepersonnel.html";
            } else if (accountType === "entreprise") {
                button.textContent = "Mon Salon";
                button.href = "compteentreprise.html";
            }
        }
    }

    const currentUrl = new URL(window.location.href);
    const salonId = currentUrl.searchParams.get("id");

    if (!salonId) {
        console.error("Aucun ID de salon trouvé dans l'URL.");
        return;
    }

    try {
        const response = await fetch(`/salons/${salonId}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des informations du salon.');
        }
        const salon = await response.json();
        if (salon) {
            updateReservationInfo(salon);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du salon pour la réservation :', error);
    }

    function updateReservationInfo(salon) {
        const reservationContainer = document.getElementById('reservation-section');

        function generateHoursOptions(openHours, reservedHours) {
            console.log("openHours:", openHours);
            console.log("reservedHours inside generateHoursOptions:", reservedHours);

            if (openHours === "Fermé") {
                return '<option value="" disabled>Aucune heure disponible</option>';
            }

            reservedHours = reservedHours || []; // Ensure reservedHours is an array

            const [opening, closing] = openHours.split(' - ');
            const openingHour = parseInt(opening.split('h')[0], 10);
            const openingMinute = parseInt(opening.split('h')[1], 10);
            const closingHour = parseInt(closing.split('h')[0], 10);
            const closingMinute = parseInt(closing.split('h')[1], 10);

            const availableHours = [];
            let currentHour = openingHour;
            let currentMinute = openingMinute;

            while (currentHour < closingHour || (currentHour === closingHour && currentMinute < closingMinute)) {
                const formattedHour = `${currentHour < 10 ? '0' : ''}${currentHour}:${currentMinute < 10 ? '0' : ''}${currentMinute}`;
                console.log("formattedHour:", formattedHour);
                if (reservedHours.includes(formattedHour)) {
                    availableHours.push(`<option value="${formattedHour}" disabled>${formattedHour} (Réservé)</option>`);
                } else {
                    availableHours.push(`<option value="${formattedHour}">${formattedHour}</option>`);
                }
                currentMinute += 30;
                if (currentMinute >= 60) {
                    currentMinute -= 60;
                    currentHour++;
                }
            }

            return availableHours.length > 0 ? availableHours.join('') : '<option value="" disabled>Aucune heure disponible</option>';
        }

        reservationContainer.innerHTML = `
            <h1>Réservation</h1><br/>
            <h2>${salon.NomEntreprise}</h2>
            <p>Téléphone: ${salon.NumeroTelephone}</p>
            <p>Adresse: ${salon.Adresse}</p><br/>
            <form id="reservationForm">
                <label for="services">Choisir des services:</label>
                <div id="services" name="services">
                    ${salon.ServiceOffert.split(';').map(service => `
                        <label>
                            <input type="checkbox" name="service" value="${service.trim()}"> ${service.trim()}
                        </label>
                    `).join('')}
                </div>
                <p id="errorServiceMessage" style="color: red; display: none;">Veuillez sélectionner au moins un service.</p>
                <label for="date">Choisir une date :</label>
                <input type="date" id="date" name="date" required>
                <p id="errorDateMessage" style="color: red; display: none;">Veuillez sélectionner une date.</p>
                <label for="heure">Choisir une heure :</label>
                <select id="heure" name="heure" required>
                    <option value="" disabled selected>Choisir une heure</option>
                </select>
                <p id="errorTimeMessage" style="color: red; display: none;">Veuillez sélectionner une heure.</p>
                <p id="closedMessage" class="closed-message" style="display: none;">Ce salon est fermé ce jour-là.</p>
                <br><br>
                <button type="button" id="confirmer">Confirmer la réservation</button>
                <button type="button" id="annuler">Annuler</button>
            </form>
        `;

        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);

        dateInput.addEventListener('change', async function () {
            const selectedDate = this.value;
            const selectedDayIndex = new Date(selectedDate).getDay();
            const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            const selectedDay = daysOfWeek[selectedDayIndex];
            const openHoursForSelectedDay = salon[selectedDay];

            const heureSelect = document.getElementById('heure');
            const closedMessage = document.getElementById('closedMessage');

            if (openHoursForSelectedDay === "Fermé") {
                heureSelect.innerHTML = '<option value="" disabled selected>Choisir une heure</option>';
                heureSelect.disabled = true;
                closedMessage.style.display = 'block';
            } else {
                try {
                    const reservedHours = await fetchReservedHours(salonId, selectedDate);
                    console.log("reservedHours fetched:", reservedHours);
                    heureSelect.innerHTML = generateHoursOptions(openHoursForSelectedDay, reservedHours);
                    heureSelect.disabled = false;
                    closedMessage.style.display = 'none';
                } catch (error) {
                    console.error('Erreur lors de la récupération des heures réservées :', error);
                }
            }
        });

        const confirmerBtn = document.getElementById('confirmer');
        if (confirmerBtn) {
            confirmerBtn.addEventListener('click', async function () {
                const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked')).map(checkbox => checkbox.value);
                const date = document.getElementById('date').value;
                const heure = document.getElementById('heure').value;
                const errorServiceMessage = document.getElementById('errorServiceMessage');
                const errorDateMessage = document.getElementById('errorDateMessage');
                const errorTimeMessage = document.getElementById('errorTimeMessage');

                let hasError = false;

                if (selectedServices.length === 0) {
                    errorServiceMessage.style.display = 'block';
                    hasError = true;
                } else {
                    errorServiceMessage.style.display = 'none';
                }

                if (!date) {
                    errorDateMessage.style.display = 'block';
                    hasError = true;
                } else {
                    errorDateMessage.style.display = 'none';
                }

                if (!heure) {
                    errorTimeMessage.style.display = 'block';
                    hasError = true;
                } else {
                    errorTimeMessage.style.display = 'none';
                }

                if (hasError) {
                    return;
                }

                try {
                    const nomSalon = await getSalonNameById(salonId);

                    const response = await fetch('/reservation', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            salonId: salonId,
                            service: selectedServices.join(';'),
                            date: date,
                            heure: heure,
                            token: token,
                            nomSalon: nomSalon
                        }),
                    });

                    if (response.ok) {
                        window.location.href = 'comptepersonnel.html?tab=reservation';
                    } else {
                        throw new Error('La réservation a échoué.');
                    }
                } catch (error) {
                    console.error('Erreur lors de la réservation :', error);
                }
            });
        }

        const annulerBtn = document.getElementById('annuler');
        if (annulerBtn) {
            annulerBtn.addEventListener('click', function () {
                window.location.href = 'Salons.html';
            });
        }
    }

    async function fetchReservedHours(salonId, date) {
        try {
            const response = await fetch(`/reservations/${salonId}/${date}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des heures réservées.');
            }
            const reservedHours = await response.json();
            console.log("Reserved hours response:", reservedHours);
            if (!Array.isArray(reservedHours)) {
                console.error("La réponse n'est pas un tableau:", reservedHours);
                return [];
            }
            return reservedHours;
        } catch (error) {
            console.error('Erreur lors de la récupération des heures réservées :', error);
            return [];
        }
    }
});
