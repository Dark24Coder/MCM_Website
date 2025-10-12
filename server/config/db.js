const { Pool } = require('pg');

// Configuration PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mcm_db',
    max: 20, // Nombre maximum de connexions
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Test de connexion au démarrage
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erreur de connexion à PostgreSQL:', err.message);
        console.error('🔍 Vérifiez:');
        console.error('   1. PostgreSQL est démarré');
        console.error('   2. Les identifiants dans .env sont corrects');
        console.error('   3. La base mcm_db existe');
        return;
    }
    console.log('✅ Connecté à PostgreSQL');
    console.log(`📍 Base: ${process.env.DB_NAME || 'mcm_db'}`);
    release();
});

// Gestion des erreurs du pool
pool.on('error', (err, client) => {
    console.error('❌ Erreur inattendue sur le client PostgreSQL:', err.message);
});

// Fonction query compatible avec MySQL (style callback)
const query = (text, params, callback) => {
    const start = Date.now();
    
    // Si params est une fonction, c'est le callback (pas de paramètres)
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }
    
    return pool.query(text, params, (err, result) => {
        const duration = Date.now() - start;
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Query executée en ${duration}ms`);
        }
        
        if (err) {
            console.error('❌ Erreur SQL:', err.message);
            console.error('📝 Query:', text);
            if (callback) {
                return callback(err, null);
            }
            return;
        }
        
        // Retourner les rows comme MySQL
        if (callback) {
            callback(null, result.rows);
        }
    });
};

// Fonction pour fermer le pool proprement
const end = (callback) => {
    console.log('🔄 Fermeture du pool PostgreSQL...');
    pool.end((err) => {
        if (err) {
            console.error('❌ Erreur lors de la fermeture du pool:', err.message);
        } else {
            console.log('✅ Pool PostgreSQL fermé');
        }
        if (callback) callback(err);
    });
};

// Export pour compatibilité
module.exports = {
    query,
    end,
    pool
};