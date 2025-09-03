import { getArtistPackagesModel } from '../models/packageModel.js';

// Obtener paquetes de un artista específico
export const getArtistPackagesController = async (req, res) => {
  try {
    const { artistId } = req.params;
    const packages = await getArtistPackagesModel(artistId);
    res.status(200).json(packages);
  } catch (error) {
    console.error('Error al obtener paquetes del artista:', error);
    res.status(500).json({ message: 'Error al obtener paquetes del artista.' });
  }
};