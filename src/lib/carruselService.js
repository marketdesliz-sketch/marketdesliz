// src/lib/carruselService.js
import pb from './pocketbase';

function getImageUrl(record, fileName) {
  if (!fileName) return null;
  try {
    return pb.files.getURL(record, fileName);
  } catch (error) {
    console.error('Error obteniendo URL de imagen:', error);
    return null;
  }
}

/**
 * Obtener slides activos del carrusel (público)
 */
export async function getCarrusel() {
  try {
    const records = await pb.collection('carrusel').getFullList({
      filter: 'activo = true',
      sort: 'orden',
      requestKey: null
    });
    
    return records.map(record => ({
      id: record.id,
      imagen: record.imagen ? getImageUrl(record, record.imagen) : null,
      botonEnlace: record.botonEnlace || null,
      botonPosicion: typeof record.botonPosicion === 'string' 
        ? JSON.parse(record.botonPosicion) 
        : record.botonPosicion || null,
      orden: record.orden || 0,
      activo: record.activo
    }));
  } catch (error) {
    console.error('Error cargando carrusel:', error);
    return [];
  }
}

/**
 * Obtener un slide por ID
 */
export async function getCarruselSlideById(id) {
  try {
    const record = await pb.collection('carrusel').getOne(id);
    
    return {
      id: record.id,
      imagen: record.imagen ? getImageUrl(record, record.imagen) : null,
      botonEnlace: record.botonEnlace || null,
      botonPosicion: typeof record.botonPosicion === 'string' 
        ? JSON.parse(record.botonPosicion) 
        : record.botonPosicion || null,
      orden: record.orden || 0,
      activo: record.activo
    };
  } catch (error) {
    console.error('Error obteniendo slide:', error);
    return null;
  }
}

/**
 * Obtener todos los slides (admin)
 */
export async function getAllCarruselSlides() {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      console.warn('No autorizado para obtener todos los slides');
      return [];
    }

    const records = await pb.collection('carrusel').getFullList({
      sort: 'orden',
      requestKey: null
    });
    
    return records.map(record => ({
      id: record.id,
      imagen: record.imagen ? getImageUrl(record, record.imagen) : null,
      botonEnlace: record.botonEnlace || null,
      botonPosicion: record.botonPosicion,
      orden: record.orden || 0,
      activo: record.activo,
      created: record.created,
      updated: record.updated
    }));
  } catch (error) {
    console.error('Error cargando todos los slides:', error);
    return [];
  }
}

/**
 * Crear slide (admin)
 */
export async function createCarruselSlide(data) {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      throw new Error('No autorizado');
    }

    const formData = new FormData();
    
    if (data.imagen) {
      formData.append('imagen', data.imagen);
    }
    if (data.botonEnlace !== undefined) {
      formData.append('botonEnlace', data.botonEnlace);
    }
    if (data.botonPosicion !== undefined) {
      formData.append('botonPosicion', typeof data.botonPosicion === 'string' 
        ? data.botonPosicion 
        : JSON.stringify(data.botonPosicion));
    }
    formData.append('orden', data.orden || 0);
    formData.append('activo', data.activo !== undefined ? data.activo : true);

    const record = await pb.collection('carrusel').create(formData);
    return record;
  } catch (error) {
    console.error('Error creando slide:', error);
    throw error;
  }
}

/**
 * Actualizar slide (admin)
 */
export async function updateCarruselSlide(id, data) {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      throw new Error('No autorizado');
    }

    const formData = new FormData();
    
    if (data.botonEnlace !== undefined) {
      formData.append('botonEnlace', data.botonEnlace);
    }
    if (data.botonPosicion !== undefined) {
      formData.append('botonPosicion', typeof data.botonPosicion === 'string' 
        ? data.botonPosicion 
        : JSON.stringify(data.botonPosicion));
    }
    if (data.orden !== undefined) {
      formData.append('orden', data.orden);
    }
    if (data.activo !== undefined) {
      formData.append('activo', data.activo);
    }
    if (data.imagen) {
      formData.append('imagen', data.imagen);
    }

    const record = await pb.collection('carrusel').update(id, formData);
    return record;
  } catch (error) {
    console.error('Error actualizando slide:', error);
    throw error;
  }
}

/**
 * Eliminar slide (admin)
 */
export async function deleteCarruselSlide(id) {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      throw new Error('No autorizado');
    }

    await pb.collection('carrusel').delete(id);
    return true;
  } catch (error) {
    console.error('Error eliminando slide:', error);
    throw error;
  }
}