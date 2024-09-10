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
});


// Function to set the video to a random time
const video = document.getElementById('video1');
function setRandomTime() {
    const duration = video.duration;
    const randomTime = Math.random() * duration;
    video.currentTime = randomTime;
}
window.onload = setRandomTime;