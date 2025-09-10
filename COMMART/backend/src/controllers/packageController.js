import {
  getPackagesByArtist,
  createPackage,
  updatePackage,
  deletePackage,
  getExtrasByArtist,
  getExtrasByArtistPublic, // NUEVA FUNCIÓN
  createExtra,
  updateExtra,
  deleteExtra,
  updatePackageImageField // NUEVA FUNCIÓN
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
    
    // Convertir precio a número decimal
    if (data.price) {
      data.price = parseFloat(data.price);
    }
    
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
    
    // Convertir precio a número decimal
    if (data.price) {
      data.price = parseFloat(data.price);
    }
    
    // REMOVER cualquier campo 'delete' que pueda venir
    delete data.delete;
    
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

// NUEVA FUNCIÓN: Eliminar imagen específica de un paquete
export const deletePackageImage = async (req, res) => {
  try {
    const { id, imageNum } = req.params;
    const artistId = req.user.id;
    
    // Validar que el paquete pertenece al artista
    const packages = await getPackagesByArtist(artistId);
    const packageExists = packages.find(pkg => pkg.id == id);
    
    if (!packageExists) {
      return res.status(404).json({ message: 'Paquete no encontrado.' });
    }
    
    // Determinar qué campo actualizar
    const field = imageNum === '1' ? 'reference_image1' : 'reference_image2';
    
    // Actualizar el campo a NULL
    await updatePackageImageField(id, field, null);
    
    res.json({ message: 'Imagen eliminada exitosamente.' });
  } catch (err) {
    console.error('Error al eliminar imagen:', err);
    res.status(500).json({ message: 'Error al eliminar imagen.' });
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
    const artistId = req.user.id; // Obtener artist_id del usuario autenticado
    const data = { ...req.body, artist_id: artistId }; // Agregar artist_id
    
    // Convertir precio a número decimal
    if (data.price) {
      data.price = parseFloat(data.price);
    }
    
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
    const data = { ...req.body };
    
    // Convertir precio a número decimal
    if (data.price) {
      data.price = parseFloat(data.price);
    }
    
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

// Nuevo controlador para obtener extras públicos de un artista
export const getArtistExtrasPublic = async (req, res) => {
  try {
    const { artistId } = req.params;
    const extras = await getExtrasByArtistPublic(artistId);
    res.json(extras);
  } catch (err) {
    console.error('Error al obtener extras públicos:', err);
    res.status(500).json({ message: 'Error al obtener extras.' });
  }
};

export const getArtistPackagesPublic = async (req, res) => {
  try {
    const { artistId } = req.params;
    const packages = await getPackagesByArtist(artistId);
    res.json(packages);
  } catch (err) {
    console.error('Error al obtener paquetes públicos:', err);
    res.status(500).json({ message: 'Error al obtener paquetes.' });
  }
};