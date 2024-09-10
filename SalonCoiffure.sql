create database SalonCoiffure;
go
use SalonCoiffure

CREATE TABLE UtilisateurClient (
IdClient INT NOT NULL PRIMARY KEY,
Nom VARCHAR(25) NOT NULL,
Prenom VARCHAR(25) NOT NULL,
Courriel VARCHAR(25) NOT NULL,
MotDePasse VARCHAR(25) NOT NULL
);

CREATE TABLE UtilisateurEntreprise (
IdEntreprise INT NOT NULL PRIMARY KEY,
NomEntreprise VARCHAR(50) NOT NULL,
Location VARCHAR(50) NOT NULL,
locationPostal varchar(50) NOT NULL,
ServiceOffert VARCHAR(100) NOT NULL,
NumeroTelephone VARCHAR(20) NOT NULL,
Horaire VARCHAR(100) NOT NULL,
SiteWeb VARCHAR(100),
Description VARCHAR(100),
Courriel VARCHAR(50) NOT NULL,
MotDePasse Varchar(25) NOT NULL,
Porfolio VARCHAR(100)
);

CREATE TABLE Employe(
IdEmploye INT NOT NULL PRIMARY KEY,
IdEntreprise INT NOT NULL FOREIGN KEY REFERENCES UtilisateurClient,
Nom VARCHAR(25) NOT NULL,
Prenom VARCHAR(25) NOT NULL,
Service VARCHAR(100) NOT NULL,
Disponibilite VARCHAR(100) NOT NULL
);

CREATE TABLE Reservation(
IdReservation INT NOT NULL PRIMARY KEY,
IdEmploye INT NOT NULL FOREIGN KEY REFERENCES Employe,
IdEntreprise INT NOT NULL FOREIGN KEY REFERENCES UtilisateurEntreprise,
IdClient Int NOT NULL FOREIGN KEY REFERENCES UtilisateurClient,
Date DATE not null,
Heure VARCHAR(10),
Service int not null
);

CREATE TABLE Historique (
IdHistorique INT NOT NULL PRIMARY KEY,
IdEntreprise INT NOT NULL FOREIGN KEY REFERENCES UtilisateurEntreprise,
IdEmploye INT NOT NULL FOREIGN KEY REFERENCES Employe,
IdClient INT NOT NULL FOREIGN KEY REFERENCES UtilisateurClient,
Date DATE NOT NULL,
Heure VARCHAR(10),
Service int not null
);

CREATE TABLE Favoris (
IdFavori INT NOT NULL PRIMARY KEY,
IdEntreprise INT NOT NULL FOREIGN KEY REFERENCES UtilisateurEntreprise,
IdClient INT NOT NULL FOREIGN KEY REFERENCES UtilisateurClient
);