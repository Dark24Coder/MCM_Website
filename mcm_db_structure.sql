
-- Création de la base de données
CREATE DATABASE IF NOT EXISTS mcm_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mcm_db;

-- Table commissions
CREATE TABLE commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL
);

-- Table services
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    commission_id INT,
    FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE CASCADE
);

-- Table users (admins, superadmins, adminCom)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('admin', 'adminCom', 'superadmin') NOT NULL,
    commission_id INT DEFAULT NULL,
    service_id INT DEFAULT NULL,
    FOREIGN KEY (commission_id) REFERENCES commissions(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Table membres
CREATE TABLE membres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    sexe ENUM('Homme', 'Femme'),
    date_naissance DATE,
    email VARCHAR(150),
    telephone VARCHAR(20),
    service_id INT,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Insertion des commissions
INSERT INTO commissions (nom) VALUES
('Évangélisation'),
('Multimédia et audiovisuel'),
('Presse et documentation'),
('Chœur'),
('Accueil'),
('Comptabilité'),
('Organisation et logistique'),
('Liturgie MCM bénin service délégué');

-- Insertion des services
INSERT INTO services (nom, commission_id) VALUES
('Intercession', 1),
('Social et humanitaire', 1),
-- Multimédia et audiovisuel : RAS (aucun service pour l’instant)
-- Presse et documentation : RAS
('Louange et adoration', 4),
('Logistique musicale', 4),
('Liturgie', 4),
('Protocole /Accueil', 5),
('Ordre et sécurité', 5),
('Enregistrements', 5),
('Intégrations et sacrements', 5),
('Suivi budgétaire', 6),
('Collecte et offrande', 6),
('Installation et matériel', 7),
('Transport et mobilité', 7),
('Approvisionnement', 7),
('Préparation des événements', 7);
-- Liturgie MCM bénin service délégué : RAS
