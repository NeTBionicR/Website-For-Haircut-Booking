const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './mydatabase.db'
    },
    useNullAsDefault: true
});

const app = express();
const PORT = process.env.PORT || 3000;
const PORTFOLIOS_DIR = path.join(__dirname, 'Portfolios');
fs.ensureDirSync(PORTFOLIOS_DIR);

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'PageHTML')));
app.use('/Portfolios', express.static(path.join(__dirname, 'Portfolios')));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
}));

// Home page route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'PageHTML', 'acceuil.html'));
});

// Route pour récupérer les heures réservées
app.get('/reservations/:salonId/:date', (req, res) => {
    const salonId = req.params.salonId;
    const date = req.params.date;

    knex('Reservation')
        .select('heure')
        .where('salonId', salonId)
        .andWhere('date', date)
        .then(heuresReservees => {
            console.log('Heures réservées récupérées:', heuresReservees); // Pour déboguer
            
            // Filtrer les valeurs nulles de la propriété 'heure'
            const heuresNonNulles = heuresReservees.filter(reservation => reservation.heure !== null);
            
            // Mapper les plages horaires à partir des valeurs non nulles
            const heures = heuresNonNulles.map(reservation => reservation.heure);
            
            res.json(heures); // Renvoie uniquement les plages horaires
        })
        .catch(err => {
            console.error('Erreur lors de la récupération des heures réservées depuis la base de données :', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des heures réservées depuis la base de données.' });
        });
    })

// Salon information route
app.get('/salons', (req, res) => {
    knex.select().from('UtilisateurEntreprise')
        .then(salons => res.json(salons))
        .catch(err => res.status(500).json({ error: 'Error retrieving salons: ' + err }));
});

// Static page for salons
app.get('/salons-html', (req, res) => {
    res.sendFile(path.join(__dirname, 'PageHTML', 'Salons.html'));
});

// Route pour ajouter une nouvelle réservation
app.post('/reservation', (req, res) => {
    const { salonId, token, service, date, heure, nomSalon } = req.body;

    // Enregistrez la réservation dans la base de données avec l'ID utilisateur
    knex('Reservation').insert({
        salonId: salonId,
        token: token,
        service: service,
        date: date,
        heure: heure,
        nomSalon: nomSalon
    })
    .then(() => {
        res.status(200).json({ success: true, message: 'Réservation enregistrée avec succès' });
    })
    .catch(error => {
        console.error('Erreur lors de l\'enregistrement de la réservation :', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'enregistrement de la réservation' });
    });
});

// Affichage de info Reservation
app.get('/reservation', (req, res) => {
    knex.select().from('Reservation')
    .then(reservations => res.json(reservations))
    .catch(err => res.status(500).json({ error: 'Error retrieving reservations: ' + err }));
});

// Route d'inscription
app.post('/register', (req, res) => {
    const { firstName, lastName, email, password, type, nomEntreprise } = req.body;

    if (!validatePassword(password)) {
        return res.status(400).json({ success: false, message: "Le mot de passe ne respecte pas les critères requis." });
    }

    const uniqueToken = require('crypto').randomBytes(50).toString('hex');

    let insertData = {
        Courriel: email,
        MotDePasse: password,
        UniqueToken: uniqueToken,
        type
    };

    if (type === 'entreprise') {
        insertData.NomEntreprise = nomEntreprise;
        knex('UtilisateurEntreprise').insert(insertData)
        .then(() => {
            res.json({ success: true, message: "Inscription de l'entreprise initiée.", token: uniqueToken });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ success: false, message: "Une erreur s'est produite lors de l'inscription de l'entreprise." });
        });
    } else {
        insertData.Nom = lastName;
        insertData.Prenom = firstName;
        knex('UtilisateurClient').insert(insertData)
        .then(() => {
            res.json({ success: true, message: "Inscription du client initiée.", token: uniqueToken });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ success: false, message: "Une erreur s'est produite lors de l'inscription du client." });
        });
    }
});

// Password validation
function validatePassword(password) {
    const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}/;
    return regex.test(password);
}

// Check le token
app.post('/check-auth', (req, res) => {
    const { token } = req.headers;

    // Vérifier si le token est présent dans les en-têtes de la requête
    if (!token) {
        return res.status(403).json({ loggedIn: false, message: 'No token provided' });
    }

    // Vérifier l'authenticité du token dans la base de données des utilisateurs entreprise
    knex('UtilisateurEntreprise')
        .where({ UniqueToken: token })
        .first()
        .then(user => {
            if (user) {
                return res.json({ loggedIn: true, userId: user.id });
            } else {
                // Si le token n'est pas trouvé dans la base de données des utilisateurs entreprise,
                // vérifier dans la base de données des utilisateurs client
                knex('UtilisateurClient')
                    .where({ UniqueToken: token })
                    .first()
                    .then(user => {
                        if (user) {
                            return res.json({ loggedIn: true, userId: user.id });
                        } else {
                            // Si le token n'est pas valide pour les utilisateurs entreprise ni client
                            return res.status(403).json({ loggedIn: false, message: 'Invalid token' });
                        }
                    })
                    .catch(err => {
                        console.error('Error checking client token:', err);
                        res.status(500).json({ loggedIn: false, message: 'Error checking token' });
                    });
            }
        })
        .catch(err => {
            console.error('Error checking enterprise token:', err);
            res.status(500).json({ loggedIn: false, message: 'Error checking token' });
        });
});

// Middleware pour vérifier le token
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
        return res.status(403).json({ success: false, message: 'No token provided' });
    }
    const bearerToken = bearerHeader.split(' ')[1];
    if (!bearerToken) {
        return res.status(403).json({ success: false, message: 'Invalid token format' });
    }
    req.token = bearerToken;

    // Vérifier si le token correspond à un utilisateur d'entreprise
    knex('UtilisateurEntreprise')
        .where({ UniqueToken: bearerToken })
        .first()
        .then(user => {
            if (user) {
                req.userType = 'entreprise';
                next();
            } else {
                // Vérifier si le token correspond à un utilisateur client
                knex('UtilisateurClient')
                    .where({ UniqueToken: bearerToken })
                    .first()
                    .then(user => {
                        if (user) {
                            req.userType = 'client';
                            next();
                        } else {
                            res.status(403).json({ success: false, message: 'Unauthorized: Invalid token' });
                        }
                    })
                    .catch(err => res.status(500).json({ success: false, message: 'Error checking token' }));
            }
        })
        .catch(err => res.status(500).json({ success: false, message: 'Error checking token' }));
}

// Route de connexion
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    function handleLogin(tableName) {
        return knex.select('*').from(tableName)
            .where({ Courriel: email })
            .first()
            .then(user => {
                if (!user) {
                    return null;
                }
                if (user.MotDePasse !== password) {
                    throw new Error('Mot de passe incorrect.');
                }
                return user;
            });
    }

    handleLogin('UtilisateurClient')
        .then(user => {
            if (user) {
                res.json({ success: true, message: 'Connexion réussie.', token: user.UniqueToken, type: user.type });
            } else {
                return handleLogin('UtilisateurEntreprise').then(user => {
                    if (user) {
                        res.json({ success: true, message: 'Connexion réussie.', token: user.UniqueToken, type: user.type });
                    } else {
                        res.status(401).json({ success: false, message: 'Email non enregistré.' });
                    }
                });
            }
        })
        .catch(err => {
            if (err.message === 'Mot de passe incorrect.') {
                res.status(401).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: 'Erreur lors de la connexion : ' + err });
            }
        });
});

// Fetch user account data
app.get('/api/account', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).send('No token provided');
    }

    knex('UtilisateurClient')
        .where({ UniqueToken: token })
        .first()
        .then(user => {
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.json({
                firstName: user.Prenom,
                lastName: user.Nom,
                email: user.Courriel
            });
        })
        .catch(error => res.status(500).send('Internal server error: ' + error));
});

// Update user account
app.post('/api/account/update', (req, res) => {
    const { firstName, lastName, email, token } = req.body;
    knex('UtilisateurClient')
        .where({ UniqueToken: token })
        .first()
        .then(user => {
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            knex('UtilisateurClient')
                .where({ IdClient: user.IdClient })
                .update({
                    Prenom: firstName || user.Prenom,
                    Nom: lastName || user.Nom,
                    Courriel: email || user.Courriel
                })
                .then(() => res.json({ success: true }))
                .catch(err => res.status(500).json({ success: false, message: 'Failed to update user: ' + err }));
        })
        .catch(err => res.status(500).json({ success: false, message: 'User retrieval failed: ' + err }));
});

// Route pour avoir les infos de reservation
app.get('/reservation/:salonId', (req, res) => {
    const salonId = req.params.salonId;

    // Utiliser Knex pour récupérer les détails du salon
    knex('UtilisateurEntreprise')
        .where('IdEntreprise', salonId)
        .first() // Récupérer seulement le premier résultat
        .then(salon => {
            if (salon) {
                res.json(salon);
            } else {
                res.status(404).json({ error: 'Salon not found' });
            }
        })
        .catch(err => {
            console.error('Error retrieving salon details:', err);
            res.status(500).json({ error: 'Error retrieving salon details' });
        });
});

// Route pour changer le mot de passe
app.post('/api/account/updatepass', (req, res) => {
    const { token, currentPassword, newPassword } = req.body;

    // Check if all required fields are present
    if (!token || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Missing fields in request." });
    }

    // Verify the token and find the user
    knex('UtilisateurClient')
        .where({ UniqueToken: token })
        .first()
        .then(user => {
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found." });
            }

            // Check if the currentPassword matches the stored password
            if (user.MotDePasse !== currentPassword) {
                return res.status(401).json({ success: false, message: "Current password is incorrect." });
            }

            // Update the password in the database
            knex('UtilisateurClient')
                .where({ UniqueToken: token })
                .update({ MotDePasse: newPassword })
                .then(() => {
                    res.json({ success: true, message: "Password updated successfully." });
                })
                .catch(err => {
                    console.error('Failed to update password:', err);
                    res.status(500).json({ success: false, message: "Failed to update password." });
                });
        })
        .catch(err => {
            console.error('Error retrieving user from token:', err);
            res.status(500).json({ success: false, message: "Internal server error." });
        });
});

// Route pour la mise à jour des détails de l'utilisateur
app.post('/api/entreprise/update', (req, res) => {
    console.log(req.body);
    const { address, postalCode, phone, services, hours, priceRange, website, description, token } = req.body;

    if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
    }

    let servicesString = Array.isArray(services) ? services.join(';') : '';
    if (!servicesString) {
        return res.status(400).json({ error: "Invalid services format" });
    }

    console.log("Updating with token:", token);
    knex('UtilisateurEntreprise')
        .where({ UniqueToken: token })
        .update({
            Adresse: address,
            CodePostal: postalCode,
            NumeroTelephone: phone,
            ServiceOffert: servicesString,
            Lundi: hours.monday || '',
            Mardi: hours.tuesday || '',
            Mercredi: hours.wednesday || '',
            Jeudi: hours.thursday || '',
            Vendredi: hours.friday || '',
            Samedi: hours.saturday || '',
            Dimanche: hours.sunday || '',
            Échelledeprix: priceRange,
            SiteWeb: website,
            Description: description
        })
        .then(() => {
            console.log("Update successful");
            res.json({ success: true, message: "Entreprise updated successfully." });
        })
        .catch(err => {
            console.error("Failed to update entreprise:", err);
            res.status(500).json({ error: "Failed to update entreprise: " + err.message });
        });
});

// Fetch user account data
app.get('/api/entreprise/data', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    knex('UtilisateurEntreprise')
        .where({ UniqueToken: token })
        .first()
        .then(entreprise => {
            if (!entreprise) {
                return res.status(404).json({ success: false, message: 'Entreprise not found' });
            }
            const responseData = {
                NomEntreprise: entreprise.NomEntreprise,
                Courriel: entreprise.Courriel,
                Adresse: entreprise.Adresse,
                CodePostal: entreprise.CodePostal,
                NumeroTelephone: entreprise.NumeroTelephone,
                ServiceOffert: entreprise.ServiceOffert ? entreprise.ServiceOffert.split(';') : [],
                Lundi: entreprise.Lundi,
                Mardi: entreprise.Mardi,
                Mercredi: entreprise.Mercredi,
                Jeudi: entreprise.Jeudi,
                Vendredi: entreprise.Vendredi,
                Samedi: entreprise.Samedi,
                Dimanche: entreprise.Dimanche,
                Échelledeprix: entreprise.Échelledeprix,
                SiteWeb: entreprise.SiteWeb,
                Description: entreprise.Description
            };
            res.json({ success: true, entreprise: responseData });
        })
        .catch(err => {
            res.status(500).json({ success: false, message: 'Error retrieving entreprise data: ' + err.message });
        });
});

// Route pour changer le mot de passe
app.post('/api/entreprise/updatepass', (req, res) => {
    const { token, currentPassword, newPassword } = req.body;

    if (!token || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Champs requis manquants." });
    }

    knex('UtilisateurEntreprise')
        .where({ UniqueToken: token })
        .first()
        .then(user => {
            if (!user) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
            }

            if (user.MotDePasse !== currentPassword) {
                return res.status(401).json({ success: false, message: "Mot de passe actuel incorrect." });
            }

            knex('UtilisateurEntreprise')
                .where({ UniqueToken: token })
                .update({ MotDePasse: newPassword })
                .then(() => res.json({ success: true, message: "Mot de passe mis à jour avec succès." }))
                .catch(err => {
                    console.error("Erreur lors de la mise à jour du mot de passe:", err);
                    res.status(500).json({ success: false, message: "Échec de la mise à jour du mot de passe." });
                });
        })
        .catch(err => {
            console.error("Erreur lors de la récupération de l'utilisateur:", err);
            res.status(500).json({ success: false, message: "Erreur interne du serveur." });
        });
});

// Route pour la mise à jour des détails de l'entreprise
app.post('/api/entreprise/updateDetails', verifyToken, (req, res) => {
    const { NomEntreprise, Courriel, Adresse, CodePostal, NumeroTelephone, serviceOffered, Échelledeprix, Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche, SiteWeb, Description } = req.body;

    const missingFields = [];
    ['NomEntreprise', 'Courriel', 'Adresse', 'CodePostal', 'NumeroTelephone', 'serviceOffered', 'Échelledeprix', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'SiteWeb', 'Description']
        .forEach(field => {
            if (req.body[field] === undefined) {
                missingFields.push(field);
            }
        });

    if (missingFields.length > 0) {
        return res.status(400).json({ error: "Missing required fields", missingFields });
    }

    const servicesString = Array.isArray(serviceOffered) ? serviceOffered.join(';') : serviceOffered;

    knex('UtilisateurEntreprise')
        .where({ UniqueToken: req.token })
        .update({
            NomEntreprise,
            Courriel,
            Adresse,
            CodePostal,
            NumeroTelephone,
            ServiceOffert: servicesString,
            Lundi,
            Mardi,
            Mercredi,
            Jeudi,
            Vendredi,
            Samedi,
            Dimanche,
            Échelledeprix,
            SiteWeb,
            Description
        })
        .then(() => {
            console.log("Update successful");
            res.json({ success: true, message: "Entreprise updated successfully." });
        })
        .catch(err => {
            console.error("Failed to update entreprise:", err);
            res.status(500).json({ error: "Failed to update entreprise: " + err.message });
        });
});

app.post('/api/entreprise/saveImages', verifyToken, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const images = req.files.images;
    const userDir = path.join(PORTFOLIOS_DIR, req.token);
    await fs.ensureDir(userDir);

    const processFile = (file, index) => {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const filename = `${timestamp}-${index + 1}${path.extname(file.name)}`;
            const savePath = path.join(userDir, filename);

            file.mv(savePath, err => {
                if (err) {
                    console.error('File Saving Error:', err);
                    reject(err);
                } else {
                    resolve(savePath);
                }
            });
        });
    };

    try {
        const files = Array.isArray(images) ? images : [images];
        const paths = await Promise.all(files.map(processFile));
        res.json({ message: 'Images saved successfully.', paths });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save images', error: error.toString() });
    }
});

app.get('/api/entreprise/images/:token', (req, res) => {
    const userDir = path.join(PORTFOLIOS_DIR, req.params.token);
    fs.readdir(userDir, (err, files) => {
        if (err) {
            console.error("Error reading directory", err);
            return res.status(500).send('Error reading directory');
        }
        const filePaths = files.map(file => `/Portfolios/${req.params.token}/${file}`);
        res.json(filePaths);
    });
});

app.post('/api/entreprise/deleteImages', verifyToken, (req, res) => {
    const { images } = req.body;
    const userDir = path.join(PORTFOLIOS_DIR, req.token);

    try {
        console.log("Images to delete:", images);

        images.forEach(image => {
            const filePath = path.join(userDir, image);
            fs.unlinkSync(filePath);
        });

        res.json({ message: 'Images deleted successfully.' });
    } catch (error) {
        console.error("Failed to delete images:", error);
        res.status(500).json({ error: "Failed to delete images: " + error.message });
    }
});

app.get('/salons/:id', (req, res) => {
    const salonId = req.params.id;
    console.log('Requête reçue pour le salon ID:', salonId);

    knex('UtilisateurEntreprise')
        .where({ IdEntreprise: salonId }) // Utilisez le nom de la colonne correct
        .first()
        .then(salon => {
            if (!salon) {
                console.log('Salon non trouvé pour ID:', salonId);
                return res.status(404).json({ error: 'Salon not found' });
            }
            console.log('Salon trouvé:', salon);
            res.json(salon);
        })
        .catch(err => {
            console.error('Error retrieving salon:', err);
            res.status(500).json({ error: 'Error retrieving salon: ' + err });
        });
});

app.get('/reviews', (req, res) => {
    knex('reviews')
        .then(reviews => res.json(reviews))
        .catch(err => res.status(500).json({ error: 'Error retrieving reviews: ' + err }));
});

app.post('/reviews', (req, res) => {
    const { UserName, UserMail, description, userRating } = req.body;

    // Insérez votre logique pour enregistrer la critique dans la base de données ici

    // Exemple : Enregistrement de la critique dans la base de données
    knex('reviews').insert({
        UserName: UserName,
        UserMail: UserMail,
        description: description,
        userRating: userRating
    })
    .then(() => {
        res.status(201).json({ message: 'Review submitted successfully' });
    })
    .catch(err => {
        console.error('Error submitting review:', err);
        res.status(500).json({ error: 'Failed to submit review' });
    });
});

// Route pour récupérer les images du portfolio d'une entreprise
app.get('/portfolio/:token', (req, res) => {
    const token = req.params.token;
    const userDir = path.join(PORTFOLIOS_DIR, token);
    
    fs.readdir(userDir, (err, files) => {
        if (err) {
            console.error("Error reading directory", err);
            return res.status(404).json({ error: 'Directory not found' });
        }
        
        const filePaths = files.map(file => `/Portfolios/${token}/${file}`);
        res.json(filePaths);
    });
});

// Route pour récupérer les favoris d'un utilisateur
app.get('/favorites', (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    knex('Favorites')
        .where('userToken', token)
        .then(favorites => res.json(favorites))
        .catch(err => {
            console.error('Erreur lors de la récupération des favoris:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des favoris.' });
        });
});

// Route pour ajouter un salon aux favoris d'un utilisateur
app.post('/favorites/:salonId', (req, res) => {
    const userToken = req.body.userToken;
    const salonId = req.params.salonId;

    if (!salonId) {
        return res.status(400).json({ error: 'L\'identifiant du salon est requis.' });
    }

    knex('Favorites')
        .where({ userToken: userToken, salonId: salonId })
        .then(existingFavorite => {
            if (existingFavorite.length > 0) {
                return res.status(409).json({ error: 'Ce salon est déjà dans vos favoris.' });
            }

            knex('UtilisateurEntreprise')
                .where('IdEntreprise', salonId)
                .then(salon => {
                    if (salon.length === 0) {
                        return res.status(404).json({ error: 'Le salon avec cet identifiant n\'existe pas.' });
                    }

                    knex('Favorites').insert({
                        userToken: userToken,
                        salonId: salonId,
                        NomEntreprise: salon[0].NomEntreprise, 
                        NumeroTelephone: salon[0].NumeroTelephone,
                        Courriel: salon[0].Courriel,
                        Adresse: salon[0].Adresse,
                        ServiceOffert: salon[0].ServiceOffert,
                        Lundi: salon[0].Lundi,
                        Mardi: salon[0].Mardi,
                        Mercredi: salon[0].Mercredi,
                        Jeudi: salon[0].Jeudi,
                        Vendredi: salon[0].Vendredi,
                        Samedi: salon[0].Samedi,
                        Dimanche: salon[0].Dimanche,
                        SiteWeb: salon[0].SiteWeb
                    })
                    .then(() => {
                        res.status(201).json({ message: 'Salon ajouté aux favoris avec succès.' });
                    })
                    .catch(err => {
                        console.error('Erreur lors de l\'ajout du salon aux favoris :', err);
                        res.status(500).json({ error: 'Erreur lors de l\'ajout du salon aux favoris.' });
                    });
                })
                .catch(err => {
                    console.error('Erreur lors de la récupération des détails du salon :', err);
                    res.status(500).json({ error: 'Erreur lors de la récupération des détails du salon.' });
                });
        })
        .catch(err => {
            console.error('Erreur lors de la vérification si le salon est déjà dans les favoris :', err);
            res.status(500).json({ error: 'Erreur lors de la vérification des favoris.' });
        });
});

// Route pour supprimer un salon des favoris d'un utilisateur
app.delete('/favorites/:salonId', (req, res) => {
    const userToken = req.headers.authorization.split(' ')[1];
    const salonId = req.params.salonId;

    knex('Favorites')
        .where({ userToken: userToken, salonId: salonId })
        .del()
        .then(() => {
            res.status(200).json({ message: 'Salon supprimé des favoris avec succès.' });
        })
        .catch(err => {
            console.error('Erreur lors de la suppression du salon des favoris :', err);
            res.status(500).json({ error: 'Erreur lors de la suppression du salon des favoris.' });
        });
});

// Route pour vérifier si un salon est dans les favoris d'un utilisateur
app.get('/favorites/check/:salonId', (req, res) => {
    const userToken = req.headers.authorization.split(' ')[1];
    const salonId = req.params.salonId;

    knex('Favorites')
        .where({ userToken: userToken, salonId: salonId })
        .first()
        .then(favorite => {
            res.json({ isFavorite: !!favorite });
        })
        .catch(err => {
            console.error('Erreur lors de la vérification du favori :', err);
            res.status(500).json({ error: 'Erreur lors de la vérification du favori.' });
        });
});

// Route to delete a reservation
app.delete('/api/reservations/:reservationId', (req, res) => {
    const reservationId = req.params.reservationId;

    knex('Reservation')
        .where({ ReservationId: reservationId })
        .del()
        .then(() => {
            res.json({ success: true, message: 'Réservation supprimée avec succès.' });
        })
        .catch(err => {
            console.error('Erreur lors de la suppression de la réservation :', err);
            res.status(500).json({ error: 'Erreur lors de la suppression de la réservation.' });
        });
});


app.get('/api/reservations', (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    knex('Reservation')
        .where('token', token)
        .then(reservations => res.json(reservations))
        .catch(err => {
            console.error('Erreur lors de la récupération des réservations:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des réservations.' });
        });
});

// Route pour récupérer les réservations d'un salon spécifique
app.get('/api/entreprise/reservations', verifyToken, (req, res) => {
    const token = req.token;

    knex('UtilisateurEntreprise')
        .where({ UniqueToken: token })
        .first()
        .then(entreprise => {
            if (!entreprise) {
                return res.status(404).json({ error: 'Salon not found' });
            }

            const salonId = entreprise.IdEntreprise;
            knex('Reservation')
                .where({ SalonId: salonId })
                .then(reservations => res.json({ success: true, reservations }))
                .catch(err => {
                    console.error('Erreur lors de la récupération des réservations:', err);
                    res.status(500).json({ error: 'Erreur lors de la récupération des réservations.' });
                });
        })
        .catch(err => {
            console.error('Error retrieving salon details:', err);
            res.status(500).json({ error: 'Error retrieving salon details' });
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
