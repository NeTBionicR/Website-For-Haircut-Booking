-- SQLite
-- Création de la table Favorites
CREATE TABLE Favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    SalonId INT,
    userToken VARCHAR(255) NOT NULL,
    NomEntreprise VARCHAR(255) NOT NULL,
    NumeroTelephone VARCHAR(50),
    Courriel VARCHAR(255),
    Adresse TEXT,
    ServiceOffert TEXT,
    Lundi VARCHAR(50),
    Mardi VARCHAR(50),
    Mercredi VARCHAR(50),
    Jeudi VARCHAR(50),
    Vendredi VARCHAR(50),
    Samedi VARCHAR(50),
    Dimanche VARCHAR(50),
    SiteWeb VARCHAR(255),
    FOREIGN KEY (SalonId) REFERENCES UtilisateurEntreprise(IdEntreprise)
);

drop table Favorites
