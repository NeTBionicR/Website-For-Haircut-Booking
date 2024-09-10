document.addEventListener("DOMContentLoaded", function () {
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

    fetchSalons();
});

async function toggleFavorite(salonId, isFavorite) {
    try {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("Vous devez être connecté pour ajouter ou supprimer un salon des favoris.");
            return;
        }

        const method = isFavorite ? 'DELETE' : 'POST';
        const response = await fetch(`/favorites/${salonId}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userToken: token })
        });

        if (response.ok) {
            const favoriteBtn = document.getElementById('favorite');
            if (favoriteBtn) {
                favoriteBtn.textContent = isFavorite ? "Favoris" : "Défavoris";
                favoriteBtn.classList.toggle('favorite');
                favoriteBtn.classList.toggle('defavorite');
                favoriteBtn.onclick = () => toggleFavorite(salonId, !isFavorite);
            }
        } else {
            const errorMessage = await response.json();
            alert("Erreur lors de la mise à jour des favoris : " + errorMessage.error);
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des favoris :', error);
    }
}

async function fetchSalons() {
    try {
        const response = await fetch('/salons');
        const salons = await response.json();
        displaySalons(salons);
        if (salons.length > 0) {
            updateSalonInfo(salons[0].IdEntreprise, salons[0].UniqueToken);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des salons :', error);
    }
}

function displaySalons(salons) {
    const salonsContainer = document.getElementById('salons-container');
    salons.forEach(salon => {
        const salonDiv = document.createElement('div');
        salonDiv.classList.add('service');
        salonDiv.dataset.id = salon.IdEntreprise;
        salonDiv.dataset.token = salon.UniqueToken;
        salonDiv.innerHTML = `
            <h2>${salon.NomEntreprise}</h2>
            <p>Telephone: ${salon.NumeroTelephone}</p>
            <p>Courriel: ${salon.Courriel}</p>
        `;
        salonsContainer.appendChild(salonDiv);

        salonDiv.addEventListener('click', async function() {
            const salonId = this.dataset.id;
            const token = this.dataset.token;
            updateSalonInfo(salonId, token);
        });
    });
}

function updateSalonInfo(salonId, portfolioToken) {
    fetch(`/salons/${salonId}`)
        .then(response => response.json())
        .then(salon => {
            const accountType = sessionStorage.getItem("accountType");
            const token = sessionStorage.getItem("token");
            const showButtons = token && accountType !== "entreprise"; // Vérifiez le token et le type de compte

            const infoContainer = document.getElementById('info-container');
            infoContainer.innerHTML = `
                <h2>Nos Services</h2>
                <ul id="services-list">
                    ${salon.ServiceOffert.split(';').map(service => `<li>${service}</li>`).join('')}
                </ul>
                <h2>Description</h2>
                <p>${salon.Description}</p> <!-- Ajout de la description -->
                <h2>Nos Horaires</h2>
                <table class="hours-table">
                    <tr>
                        <th>Jour</th>
                        <th>Heures d'ouverture</th>
                    </tr>
                    <tr>
                        <td>Lundi</td>
                        <td>${salon.Lundi}</td>
                    </tr>
                    <tr>
                        <td>Mardi</td>
                        <td>${salon.Mardi}</td>
                    </tr>
                    <tr>
                        <td>Mercredi</td>
                        <td>${salon.Mercredi}</td>
                    </tr>
                    <tr>
                        <td>Jeudi</td>
                        <td>${salon.Jeudi}</td>
                    </tr>
                    <tr>
                        <td>Vendredi</td>
                        <td>${salon.Vendredi}</td>
                    </tr>
                    <tr>
                        <td>Samedi</td>
                        <td>${salon.Samedi}</td>
                    </tr>
                    <tr>
                        <td>Dimanche</td>
                        <td>${salon.Dimanche}</td>
                    </tr>
                </table>
                <h2>Coordonnées</h2>
                <p>Adresse : ${salon.Adresse}</p>
                <p>Téléphone : ${salon.NumeroTelephone}</p>
                <p>Email : ${salon.Courriel}</p>
                <h2>Portfolio</h2>
                <div id="portfolio-container" class="portfolio-container">
                    <span class="arrow left">&lt;</span>
                    <img id="portfolio-image" class="portfolio-image" src="" alt="Portfolio Image">
                    <span class="arrow right">&gt;</span>
                    <div class="indicators" id="indicators"></div>
                </div>
                ${showButtons ? `
                    <button class="reserver" id="reserver"> Réserver </button>
                    <button class="favorite" id="favorite"> Favoris </button>
                ` : ''}
                <a href=${salon.SiteWeb}><button class="visit" id="visit"> Visiter le site </button></a>
            `;

            fetchPortfolioImages(portfolioToken);
            if (showButtons) {
                checkIfFavorite(salonId);
                const reserverBtn = document.getElementById('reserver');
                if (reserverBtn) {
                    reserverBtn.dataset.salonId = salonId;
                    reserverBtn.addEventListener('click', function () {
                        window.location.href = `reservation.html?id=${salonId}`;
                    });
                }
            }
            updateMapIframe(salon.Adresse);
        })
        .catch(error => {
            console.error(`Erreur lors de la récupération du salon ${salonId} :`, error);
        });
}

async function checkIfFavorite(salonId) {
    try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`/favorites/check/${salonId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const isFavorite = data.isFavorite;
            const favoriteBtn = document.getElementById('favorite');
            if (favoriteBtn) {
                favoriteBtn.textContent = isFavorite ? "Défavoris" : "Favoris";
                favoriteBtn.classList.toggle('favorite', !isFavorite);
                favoriteBtn.classList.toggle('defavorite', isFavorite);
                favoriteBtn.onclick = () => toggleFavorite(salonId, isFavorite);
            }
        } else {
            console.error("Erreur lors de la vérification du statut du favori.");
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du statut du favori :', error);
    }
}

async function fetchPortfolioImages(portfolioToken) {
    try {
        const response = await fetch(`/portfolio/${portfolioToken}`);
        const images = await response.json();
        const portfolioContainer = document.getElementById('portfolio-container');

        if (images.length > 0) {
            let currentIndex = 0;
            const portfolioImage = document.getElementById('portfolio-image');
            const indicatorsContainer = document.getElementById('indicators');
            
            portfolioImage.src = images[currentIndex];

            images.forEach((_, index) => {
                const indicator = document.createElement('div');
                indicator.classList.add('indicator');
                if (index === currentIndex) {
                    indicator.classList.add('active');
                }
                indicator.addEventListener('click', () => {
                    currentIndex = index;
                    updatePortfolioImage();
                });
                indicatorsContainer.appendChild(indicator);
            });

            const indicators = document.querySelectorAll('.indicator');

            function updatePortfolioImage() {
                portfolioImage.src = images[currentIndex];
                indicators.forEach((indicator, index) => {
                    indicator.classList.toggle('active', index === currentIndex);
                });
            }

            document.querySelector('.arrow.left').addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                updatePortfolioImage();
            });

            document.querySelector('.arrow.right').addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % images.length;
                updatePortfolioImage();
            });

        } else {
            portfolioContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des images du portfolio :', error);
    }
}

function updateMapIframe(address) {
    const mapIframe = document.getElementById('map');
    const encodedAddress = encodeURIComponent(address);
    mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyDj_W2zsuZFvsB5ukirWyR21baPELeVEMI&q=${encodedAddress}`;
}
