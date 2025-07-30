-- 🛠 Création de la base de données
CREATE DATABASE IF NOT EXISTS mcm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mcm_db;

-- 📁 Table des commissions
CREATE TABLE IF NOT EXISTS commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 📁 Table des services
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    commission_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE CASCADE
);

-- 👥 Table des utilisateurs (Admins, AdminCom, Superadmin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('admin', 'adminCom', 'superadmin') NOT NULL,
    commission_id INT DEFAULT NULL,
    service_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- 👤 Table des membres
CREATE TABLE IF NOT EXISTS membres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    sexe ENUM('Homme', 'Femme'),
    date_naissance DATE,
    email VARCHAR(150),
    telephone VARCHAR(20),
    service_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ✅ Insertion des commissions
INSERT INTO commissions (id, nom, description) VALUES
(1, 'Évangélisation', 'Commission chargée de l\'évangélisation'),
(2, 'Multimédia et audiovisuel', 'Commission en charge de la technique audio et visuelle'),
(3, 'Presse et documentation', 'Commission de communication et d\'archives'),
(4, 'Chœur', 'Commission musicale et louange'),
(5, 'Accueil', 'Commission d\'accueil et d\'hospitalité'),
(6, 'Comptabilité', 'Commission financière et budgétaire'),
(7, 'Organisation et logistique', 'Commission organisationnelle'),
(8, 'Liturgie MCM bénin service délégué', 'Commission liturgique')
ON DUPLICATE KEY UPDATE nom = VALUES(nom), description = VALUES(description);

-- ✅ Insertion des services (uniquement ceux que tu as listés)
INSERT INTO services (nom, commission_id) VALUES
-- Évangélisation
('Intercession', 1),
('Social et humanitaire', 1),

-- Chœur
('Louange et adoration', 4),
('Logistique musicale', 4),
('Liturgie', 4),

-- Accueil
('Protocole /Accueil', 5),
('Ordre et sécurité', 5),
('Enregistrements', 5),
('Intégrations et sacrements', 5),

-- Comptabilité
('Suivi budgétaire', 6),
('Collecte et offrande', 6),

-- Organisation et logistique
('Installation et matériel', 7),
('Transport et mobilité', 7),
('Approvisionnement', 7),
('Préparation des événements', 7);

-- 👑 Insertion d’un superadmin par défaut (mot de passe hashé: admin123)
INSERT INTO users (nom, prenom, email, mot_de_passe, role) VALUES
('Admin', 'Super', 'admin@mcm.com', '$2a$10$X1vH.J3qfK4R2N7xJ3QXa.1gOJZh3bFGXL3yJ9H3QXa1gOJZh3bFGX', 'superadmin')
ON DUPLICATE KEY UPDATE nom = VALUES(nom), prenom = VALUES(prenom), role = VALUES(role);
