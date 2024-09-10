-- SQLite
CREATE TABLE Reservations (
    ReservationId INTEGER PRIMARY KEY AUTOINCREMENT,
    token INT,
    nomSalon TEXT,
    SalonId INT,
    Service Text,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    FOREIGN KEY (token) REFERENCES UtilisateurClient(UniqueToken),
    FOREIGN KEY (SalonId) REFERENCES UtilisateurEntreprise(IdEntreprise)
)