const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'sql.freedb.tech',
    user: 'freedb_mcmBenin',
    password: '*E8DQgaF$2wqJpQ',
    database: 'freedb_mcm_db',
    // port: 3306 
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à MySQL:', err);
        return;
    }
    console.log('✅ Connecté à la base MySQL');
});

module.exports = db;