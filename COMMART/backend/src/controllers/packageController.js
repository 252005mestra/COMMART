import {
  getPackagesByArtist,
  createPackage,
  updatePackage,
  deletePackage,
  getExtrasByArtist,
  createExtra,
  updateExtra,
  deleteExtra
} from '../models/packageModel.js';

// ========== PAQUETES ==========

export const getArtistPackages = async (req, res) => {
  try {
    const artistId = req.user.id;
    const packages = await getPackagesByArtist(artistId);
    res.json(packages);
  } catch (err) {
    console.error('Error al obtener paquetes:', err);
    res.status(500).json({ message: 'Error al obtener paquetes.' });
  }
};

export const createArtistPackage = async (req, res) => {
  try {
    const artist_id = req.user.id;
    const data = { ...req.body, artist_id };
    
    // Manejar imágenes si se suben
    if (req.files) {
      if (req.files.reference_image1) {
        data.reference_image1 = req.files.reference_image1[0].path.replace(/\\/g, '/');
      }
      if (req.files.reference_image2) {
        data.reference_image2 = req.files.reference_image2[0].path.replace(/\\/g, '/');
      }
    }
    
    const pkg = await createPackage(data);
    res.status(201).json(pkg);
  } catch (err) {
    console.error('Error al crear paquete:', err);
    res.status(500).json({ message: 'Error al crear paquete.' });
  }
};

export const updateArtistPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    
    // Manejar imágenes si se suben
    if (req.files) {
      if (req.files.reference_image1) {
        data.reference_image1 = req.files.reference_image1[0].path.replace(/\\/g, '/');
      }
      if (req.files.reference_image2) {
        data.reference_image2 = req.files.reference_image2[0].path.replace(/\\/g, '/');
      }
    }
    
    await updatePackage(id, data);
    res.json({ message: 'Paquete actualizado.' });
  } catch (err) {
    console.error('Error al actualizar paquete:', err);
    res.status(500).json({ message: 'Error al actualizar paquete.' });
  }
};

export const deleteArtistPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const artistId = req.user.id;
    await deletePackage(id, artistId);
    res.json({ message: 'Paquete eliminado.' });
  } catch (err) {
    console.error('Error al eliminar paquete:', err);
    res.status(500).json({ message: 'Error al eliminar paquete.' });
  }
};

// ========== EXTRAS ==========

export const getArtistExtras = async (req, res) => {
  try {
    const artistId = req.user.id;
    const extras = await getExtrasByArtist(artistId);
    res.json(extras);
  } catch (err) {
    console.error('Error al obtener extras:', err);
    res.status(500).json({ message: 'Error al obtener extras.' });
  }
};

export const createArtistExtra = async (req, res) => {
  try {
    const data = req.body;
    const extra = await createExtra(data);
    res.status(201).json(extra);
  } catch (err) {
    console.error('Error al crear extra:', err);
    res.status(500).json({ message: 'Error al crear extra.' });
  }
};

export const updateArtistExtra = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await updateExtra(id, data);
    res.json({ message: 'Extra actualizado.' });
  } catch (err) {
    console.error('Error al actualizar extra:', err);
    res.status(500).json({ message: 'Error al actualizar extra.' });
  }
};

export const deleteArtistExtra = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteExtra(id);
    res.json({ message: 'Extra eliminado.' });
  } catch (err) {
    console.error('Error al eliminar extra:', err);
    res.status(500).json({ message: 'Error al eliminar extra.' });
  }
};