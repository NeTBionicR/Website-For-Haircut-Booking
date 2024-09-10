document.addEventListener("DOMContentLoaded", function() {
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

    const video = document.getElementById('video1');
    video.addEventListener('loadedmetadata', setRandomTime);

    function setRandomTime() {
        const duration = video.duration;
        const randomTime = Math.random() * duration;
        video.currentTime = randomTime;
    }

    fetch('/reviews')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }
            return response.json();
        })
        .then(data => {
            const reviewsContainer = document.getElementById('reviews');
            data.forEach(review => {
                const reviewElement = document.createElement('div');
                reviewElement.classList.add('review');

                const ratingContainer = document.createElement('div');
                ratingContainer.classList.add('stars');
                for (let i = 0; i < review.userRating; i++) {
                    const star = document.createElement('i');
                    star.classList.add('bx', 'bxs-star');
                    ratingContainer.appendChild(star);
                }
                reviewElement.appendChild(ratingContainer);

                const userName = document.createElement('h3');
                userName.textContent = review.UserName;
                reviewElement.appendChild(userName);

                const userMail = document.createElement('p');
                userMail.textContent = review.UserMail;
                reviewElement.appendChild(userMail);

                const description = document.createElement('p');
                description.textContent = review.description;
                reviewElement.appendChild(description);

                reviewsContainer.appendChild(reviewElement);
            });

            // Clone the reviews for infinite scroll
            var copy = reviewsContainer.cloneNode(true);
            document.getElementById('reviews-wrapper').appendChild(copy);
        })
        .catch(error => {
            console.error('Error fetching reviews:', error);
        });

    const form = document.querySelector('form');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const reviewData = {
            UserName: formData.get('UserName'),
            UserMail: formData.get('UserMail'),
            description: formData.get('description'),
            userRating: formData.get('rating')
        };

        fetch('/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        })
        .then(response => {
            if (response.ok) {
                console.log('Review submitted successfully');
                location.reload(); // Refresh the page after successful submission
            } else {
                throw new Error('Failed to submit review');
            }
        })
        .catch(error => {
            console.error('Error submitting review:', error);
        });
    });
});
