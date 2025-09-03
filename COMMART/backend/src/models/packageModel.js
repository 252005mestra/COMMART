import dbConnection from '../config/db.js';

// Obtener paquetes de un artista
export const getArtistPackagesModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT 
        id, name, price, description, features, 
        sample_images, delivery_time, revisions 
       FROM packages 
       WHERE artist_id = ? AND is_active = 1 
       ORDER BY price ASC`,
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        
        // Procesar features como array si está guardado como JSON
        const processedResults = results.map(pkg => ({
          ...pkg,
          features: pkg.features ? JSON.parse(pkg.features) : [],
          sample_images: pkg.sample_images ? pkg.sample_images.split(',') : []
        }));
        
        resolve(processedResults);
      }
    );
  });
};