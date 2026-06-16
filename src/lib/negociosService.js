// src/lib/negociosService.js
import pb from './pocketbase';

// ============================================================
// CONSTANTES
// ============================================================
const COLLECTION = 'negocios';
const COMENTARIOS_COLLECTION = 'comentarios_negocios';
const FAVORITOS_COLLECTION = 'favoritos_negocios';

// ============================================================
// OBTENER TODOS LOS NEGOCIOS
// ============================================================
export async function getNegocios(filters = {}) {
  try {
    let filter = 'activo = true && estadoActivacion = "activo"';

    if (filters.categoria && filters.categoria !== 'todos') {
      filter += ` && categoria = "${filters.categoria}"`;
    }

    if (filters.search) {
      filter += ` && (nombre ~ "${filters.search}" || descripcion ~ "${filters.search}" || direccion ~ "${filters.search}")`;
    }

    let sort = filters.sort || 'orden, nombre';
    if (filters.ordenarPor === '-nombre') sort = '-nombre';
    if (filters.ordenarPor === 'visitas') sort = '-visitas';
    if (filters.ordenarPor === '-created') sort = '-created';

    const negocios = await pb.collection(COLLECTION).getFullList({
      filter,
      sort
    });

    return negocios;
  } catch (error) {
    console.error('Error obteniendo negocios:', error);
    return [];
  }
}

// ============================================================
// OBTENER NEGOCIO POR ID
// ============================================================
export async function getNegocioById(id) {
  try {
    const negocio = await pb.collection(COLLECTION).getOne(id);
    return negocio;
  } catch (error) {
    if (error.status === 404) return null;
    console.error('Error obteniendo negocio:', error);
    return null;
  }
}

// ============================================================
// OBTENER NEGOCIOS POR CATEGORÍA
// ============================================================
export async function getNegociosByCategoria(categoria, limit = 12) {
  try {
    const negocios = await pb.collection(COLLECTION).getFullList({
      filter: `activo = true && estadoActivacion = "activo" && categoria = "${categoria}"`,
      sort: 'orden, nombre',
      limit
    });
    return negocios;
  } catch (error) {
    console.error('Error obteniendo negocios por categoría:', error);
    return [];
  }
}

// ============================================================
// OBTENER NEGOCIOS DESTACADOS
// ============================================================
export async function getNegociosDestacados(limit = 6) {
  try {
    const negocios = await pb.collection(COLLECTION).getFullList({
      filter: 'activo = true && estadoActivacion = "activo"',
      sort: '-visitas, orden',
      limit
    });
    return negocios;
  } catch (error) {
    console.error('Error obteniendo negocios destacados:', error);
    return [];
  }
}

// ============================================================
// OBTENER NEGOCIOS RECIENTES
// ============================================================
export async function getNegociosRecientes(limit = 6) {
  try {
    const negocios = await pb.collection(COLLECTION).getFullList({
      filter: 'activo = true && estadoActivacion = "activo"',
      sort: '-created',
      limit
    });
    return negocios;
  } catch (error) {
    console.error('Error obteniendo negocios recientes:', error);
    return [];
  }
}

// ============================================================
// OBTENER CATEGORÍAS CON CONTEO
// ============================================================
export async function getCategoriasConConteo() {
  try {
    const negocios = await pb.collection(COLLECTION).getFullList({
      filter: 'activo = true && estadoActivacion = "activo"'
    });

    const categoriasMap = new Map();

    negocios.forEach(negocio => {
      if (negocio.categoria) {
        const count = categoriasMap.get(negocio.categoria) || 0;
        categoriasMap.set(negocio.categoria, count + 1);
      }
    });

    const categorias = Array.from(categoriasMap.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);

    return categorias;
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return [];
  }
}

// ============================================================
// CREAR NEGOCIO (ADMIN/OWNER)
// ============================================================
export async function createNegocio(data, userId) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const negocio = await pb.collection(COLLECTION).create({
  ...data,
  usuarioId: userId,
  visitas: 0,
  activo: true,
  orden: 0,
  estadoActivacion: 'pendiente_activacion'  // ✅ NUEVO
});

    return negocio;
  } catch (error) {
    console.error('Error creando negocio:', error);
    throw error;
  }
}

// ============================================================
// ACTUALIZAR NEGOCIO (ADMIN/OWNER)
// ============================================================
export async function updateNegocio(id, data) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const negocio = await pb.collection(COLLECTION).update(id, data);
    return negocio;
  } catch (error) {
    console.error('Error actualizando negocio:', error);
    throw error;
  }
}

// ============================================================
// ELIMINAR NEGOCIO (ADMIN)
// ============================================================
export async function deleteNegocio(id) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    // Primero eliminar comentarios asociados
    const comentarios = await pb.collection(COMENTARIOS_COLLECTION).getFullList({
      filter: `negocioId = "${id}"`
    });

    for (const comentario of comentarios) {
      await pb.collection(COMENTARIOS_COLLECTION).delete(comentario.id);
    }

    await pb.collection(COLLECTION).delete(id);
    return true;
  } catch (error) {
    console.error('Error eliminando negocio:', error);
    throw error;
  }
}

// ============================================================
// REGISTRAR VISITA A NEGOCIO
// ============================================================
export async function registrarVisita(id) {
  try {
    const negocio = await getNegocioById(id);
    if (!negocio) return null;

    const nuevasVisitas = (negocio.visitas || 0) + 1;
    const updated = await pb.collection(COLLECTION).update(id, {
      visitas: nuevasVisitas
    });

    return updated;
  } catch (error) {
    console.error('Error registrando visita:', error);
    return null;
  }
}

// ============================================================
// OBTENER COMENTARIOS DE NEGOCIO
// ============================================================
export async function getComentarios(negocioId, limit = 20) {
  try {
    const comentarios = await pb.collection(COMENTARIOS_COLLECTION).getFullList({
      filter: `negocioId = "${negocioId}"`,
      sort: '-created',
      expand: 'usuarioId',
      limit
    });

    return comentarios.map(com => ({
      ...com,
      usuarioNombre: com.usuarioNombre || com.expand?.usuarioId?.nombre || 'Usuario'
    }));
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    return [];
  }
}

// ============================================================
// AGREGAR COMENTARIO A NEGOCIO
// ============================================================
export async function addComentario(negocioId, usuarioId, calificacion, comentario, usuarioNombre = null) {
  try {
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    const nuevoComentario = await pb.collection(COMENTARIOS_COLLECTION).create({
      negocioId: negocioId,
      usuarioId: usuarioId,
      usuarioNombre: usuarioNombre || 'Usuario',
      calificacion: calificacion,
      comentario: comentario
    });

    return nuevoComentario;
  } catch (error) {
    console.error('Error agregando comentario:', error);
    throw error;
  }
}

// ============================================================
// ELIMINAR COMENTARIO (ADMIN/OWNER)
// ============================================================
export async function deleteComentario(comentarioId) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    await pb.collection(COMENTARIOS_COLLECTION).delete(comentarioId);
    return true;
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    throw error;
  }
}

// ============================================================
// OBTENER FAVORITOS DE USUARIO
// ============================================================
export async function getFavoritosUsuario(usuarioId) {
  try {
    const favoritos = await pb.collection(FAVORITOS_COLLECTION).getFullList({
      filter: `usuarioId = "${usuarioId}"`,
      expand: 'negocioId'
    });

    return favoritos.map(fav => fav.expand?.negocioId).filter(Boolean);
  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    return [];
  }
}

// ============================================================
// AGREGAR A FAVORITOS
// ============================================================
export async function addFavorito(usuarioId, negocioId) {
  try {
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    // Verificar si ya existe
    const exists = await pb.collection(FAVORITOS_COLLECTION).getFirstListItem(
      `usuarioId = "${usuarioId}" && negocioId = "${negocioId}"`
    ).catch(() => null);

    if (exists) return exists;

    const favorito = await pb.collection(FAVORITOS_COLLECTION).create({
      usuarioId: usuarioId,
      negocioId: negocioId
    });

    return favorito;
  } catch (error) {
    console.error('Error agregando favorito:', error);
    throw error;
  }
}

// ============================================================
// ELIMINAR DE FAVORITOS
// ============================================================
export async function removeFavorito(usuarioId, negocioId) {
  try {
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    const favorito = await pb.collection(FAVORITOS_COLLECTION).getFirstListItem(
      `usuarioId = "${usuarioId}" && negocioId = "${negocioId}"`
    );

    await pb.collection(FAVORITOS_COLLECTION).delete(favorito.id);
    return true;
  } catch (error) {
    console.error('Error eliminando favorito:', error);
    throw error;
  }
}

// ============================================================
// VERIFICAR SI NEGOCIO ES FAVORITO
// ============================================================
export async function isFavorito(usuarioId, negocioId) {
  try {
    const favorito = await pb.collection(FAVORITOS_COLLECTION).getFirstListItem(
      `usuarioId = "${usuarioId}" && negocioId = "${negocioId}"`
    );
    return !!favorito;
  } catch (error) {
    return false;
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS DEL NEGOCIO (PARA DUEÑO/ADMIN)
// ============================================================
export async function getEstadisticasNegocio(negocioId) {
  try {
    const negocio = await getNegocioById(negocioId);
    if (!negocio) return null;

    const comentarios = await getComentarios(negocioId, 1000);
    const calificacionPromedio = comentarios.length > 0
      ? comentarios.reduce((sum, c) => sum + (c.calificacion || 5), 0) / comentarios.length
      : 0;

    return {
      visitas: negocio.visitas || 0,
      totalComentarios: comentarios.length,
      calificacionPromedio: Math.round(calificacionPromedio * 10) / 10,
      fechaRegistro: negocio.created,
      ultimaActualizacion: negocio.updated,
      estaActivo: negocio.activo
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}

// ============================================================
// ACTIVAR NEGOCIO DESPUÉS DE PRIMERA COMPRA
// ============================================================
export async function activarNegocio(negocioId) {
  try {
    const negocio = await getNegocioById(negocioId);
    if (!negocio) return null;
    
    // Solo activar si está pendiente
    if (negocio.estadoActivacion === 'pendiente_activacion') {
      const updated = await pb.collection(COLLECTION).update(negocioId, {
        estadoActivacion: 'activo',
        fechaActivacion: new Date().toISOString()
      });
      console.log(`✅ Negocio ${negocioId} activado correctamente`);
      return updated;
    }
    
    return negocio;
  } catch (error) {
    console.error('Error activando negocio:', error);
    return null;
  }
}

// ============================================================
// VERIFICAR SI NEGOCIO ESTÁ ACTIVO
// ============================================================
export async function isNegocioActivo(negocioId) {
  try {
    const negocio = await getNegocioById(negocioId);
    return negocio?.estadoActivacion === 'activo' && negocio?.activo === true;
  } catch (error) {
    console.error('Error verificando estado del negocio:', error);
    return false;
  }
}