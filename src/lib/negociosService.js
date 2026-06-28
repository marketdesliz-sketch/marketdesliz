// src/lib/negociosService.js
import pb from './pocketbase';

// ============================================================
// CONSTANTES
// ============================================================
const COLLECTION = 'negocios';
const COMENTARIOS_COLLECTION = 'comentarios_negocios';
const FAVORITOS_COLLECTION = 'favoritos_negocios';

// ============================================================
// OBTENER TODOS LOS NEGOCIOS (con paginación) – MEJORADO
// ============================================================
export async function getNegocios({
  page = 1,
  perPage = 10,
  search = '',
  categoria = 'todos',            // ← campo select antiguo (se mantiene)
  categoriaNegocioId = '',        // ← nueva relación con categorias_negocios
  municipioId = '',               // ← nuevo filtro geográfico
  localidadId = '',               // ← nuevo
  verificado = '',                // ← nuevo: 'true'|'false'|''
  destacado = '',                 // ← nuevo: 'true'|'false'|''
  sort = 'orden, nombre'
} = {}) {
  try {
    let filter = 'activo = true && estadoActivacion = "activo"';

    // Filtro por categoría antigua (select)
    if (categoria && categoria !== 'todos') {
      filter += ` && categoria = "${categoria}"`;
    }

    // Filtro por nueva categoría de negocio (relación)
    if (categoriaNegocioId) {
      filter += ` && categoriaNegocioId = "${categoriaNegocioId}"`;
    }

    // Filtros geográficos
    if (municipioId) {
      filter += ` && municipioId = "${municipioId}"`;
    }
    if (localidadId) {
      filter += ` && localidadId = "${localidadId}"`;
    }

    // Filtros de estado de verificación/destacado
    if (verificado === 'true') {
      filter += ' && verificado = true';
    } else if (verificado === 'false') {
      filter += ' && verificado = false';
    }
    if (destacado === 'true') {
      filter += ' && destacado = true';
    } else if (destacado === 'false') {
      filter += ' && destacado = false';
    }

    // Búsqueda textual
    if (search.trim()) {
      const term = search.trim();
      filter += ` && (nombre ~ "${term}" || descripcion ~ "${term}" || direccion ~ "${term}")`;
    }

    // Mapeo de ordenamiento
    let sortParam = 'orden, nombre';
    if (sort === '-nombre') sortParam = '-nombre';
    else if (sort === 'visitas' || sort === '-visitas') sortParam = '-visitas';
    else if (sort === '-created') sortParam = '-created';
    else if (sort === 'nombre') sortParam = 'nombre';
    else if (sort === '-calificacion') sortParam = '-calificacion';

    const result = await pb.collection(COLLECTION).getList(page, perPage, {
      filter,
      sort: sortParam,
      expand: 'categoriaNegocioId,estadoId,municipioId,localidadId,sectorId,usuarioId'
    });

    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage
    };
  } catch (error) {
    console.error('Error obteniendo negocios:', error);
    return { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 10 };
  }
}

// ============================================================
// OBTENER NEGOCIO POR ID
// ============================================================
export async function getNegocioById(id) {
  try {
    const negocio = await pb.collection(COLLECTION).getOne(id, {
      expand: 'categoriaNegocioId,estadoId,municipioId,localidadId,sectorId,usuarioId'
    });
    return negocio;
  } catch (error) {
    if (error.status === 404) return null;
    console.error('Error obteniendo negocio:', error);
    return null;
  }
}

// ============================================================
// OBTENER NEGOCIOS POR CATEGORÍA (mantenido por compatibilidad)
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
      filter: 'activo = true && estadoActivacion = "activo" && destacado = true',
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
// OBTENER CATEGORÍAS CON CONTEO (basado en campo categoria select)
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
      estadoActivacion: 'pendiente_activacion'
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

    // Recalcular calificación del negocio después de agregar comentario
    await recalcularCalificacion(negocioId).catch(err => console.warn('Error actualizando calificación:', err.message));

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
// NUEVAS FUNCIONES GEOGRÁFICAS Y DE CATEGORÍAS DE NEGOCIO
// ============================================================

/**
 * Obtener todas las categorías de negocios (activas por defecto)
 */
export async function getCategoriasNegocios(activo = true) {
  try {
    const filter = activo ? 'activo = true' : '';
    return await pb.collection('categorias_negocios').getFullList({
      filter,
      sort: 'orden'
    });
  } catch (error) {
    console.error('Error obteniendo categorías de negocios:', error);
    return [];
  }
}

/**
 * Obtener todos los estados (activos por defecto)
 */
export async function getEstados(activo = true) {
  try {
    const filter = activo ? 'activo = true' : '';
    return await pb.collection('estados').getFullList({
      filter,
      sort: 'nombre'
    });
  } catch (error) {
    console.error('Error obteniendo estados:', error);
    return [];
  }
}

/**
 * Obtener municipios de un estado (activos por defecto)
 */
export async function getMunicipios(estadoId, activo = true) {
  try {
    const filter = activo
      ? `estadoId = "${estadoId}" && activo = true`
      : `estadoId = "${estadoId}"`;
    return await pb.collection('municipios').getFullList({
      filter,
      sort: 'nombre'
    });
  } catch (error) {
    console.error('Error obteniendo municipios:', error);
    return [];
  }
}

/**
 * Obtener localidades de un municipio (activas por defecto)
 */
export async function getLocalidades(municipioId, activo = true) {
  try {
    const filter = activo
      ? `municipioId = "${municipioId}" && activo = true`
      : `municipioId = "${municipioId}"`;
    return await pb.collection('localidades').getFullList({
      filter,
      sort: 'nombre'
    });
  } catch (error) {
    console.error('Error obteniendo localidades:', error);
    return [];
  }
}

/**
 * Obtener sectores de una localidad (activos por defecto)
 */
export async function getSectores(localidadId, activo = true) {
  try {
    const filter = activo
      ? `localidadId = "${localidadId}" && activo = true`
      : `localidadId = "${localidadId}"`;
    return await pb.collection('sectores').getFullList({
      filter,
      sort: 'nombre'
    });
  } catch (error) {
    console.error('Error obteniendo sectores:', error);
    return [];
  }
}

// ============================================================
// FUNCIONES DE ADMINISTRACIÓN (VERIFICACIÓN, DESTACADO, CALIFICACIÓN)
// ============================================================

/**
 * Verificar un negocio (solo admin)
 */
export async function verificarNegocio(negocioId) {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      throw new Error('No autorizado');
    }
    const adminId = pb.authStore.model.id;
    const updated = await pb.collection(COLLECTION).update(negocioId, {
      verificado: true,
      verificadoPor: adminId,
      fechaVerificacion: new Date().toISOString()
    });
    return updated;
  } catch (error) {
    console.error('Error verificando negocio:', error);
    throw error;
  }
}

/**
 * Alternar estado "destacado" de un negocio
 */
export async function toggleDestacado(negocioId, destacado) {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      throw new Error('No autorizado');
    }
    const updated = await pb.collection(COLLECTION).update(negocioId, { destacado });
    return updated;
  } catch (error) {
    console.error('Error cambiando destacado:', error);
    throw error;
  }
}

/**
 * Recalcular calificación promedio y total de comentarios
 */
export async function recalcularCalificacion(negocioId) {
  try {
    const comentarios = await pb.collection(COMENTARIOS_COLLECTION).getFullList({
      filter: `negocioId = "${negocioId}"`
    });
    const total = comentarios.length;
    const promedio = total > 0
      ? comentarios.reduce((sum, c) => sum + (c.calificacion || 0), 0) / total
      : 0;
    await pb.collection(COLLECTION).update(negocioId, {
      calificacion: Math.round(promedio * 10) / 10,
      totalComentarios: total
    });
  } catch (error) {
    console.error('Error recalculando calificación:', error);
    throw error;
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS DEL NEGOCIO (PARA DUEÑO/ADMIN)
// ============================================================

async function getNotificacionesNegocio(negocioId, limit = 100) {
  try {
    return await pb.collection('notificaciones').getFullList({
      filter: `tipoUsuario = "negocio" && entidadId = "${negocioId}"`,
      sort: '-created',
      limit: limit
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones del negocio:', error);
    return [];
  }
}

// ============================================================
// ACTIVAR NEGOCIO DESPUÉS DE PRIMERA COMPRA
// ============================================================
export async function activarNegocio(negocioId) {
  try {
    const negocio = await getNegocioById(negocioId);
    if (!negocio) return null;
    
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

// ============================================================
// ESTADÍSTICAS Y ACTIVIDAD RECIENTE DEL NEGOCIO
// ============================================================

export async function getEstadisticasNegocio(negocioId, periodo = 'semana') {
  try {
    const negocio = await getNegocioById(negocioId);
    if (!negocio) throw new Error('Negocio no encontrado');

    const comentarios = await pb.collection('comentarios_negocios').getFullList({
      filter: `negocioId = "${negocioId}"`,
      sort: '-created',
      fields: 'id,created,usuarioNombre,calificacion,comentario'
    });

    const notificaciones = await getNotificacionesNegocio(negocioId);

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    const inicioMes = new Date(hoy);
    inicioMes.setMonth(inicioMes.getMonth() - 1);

    const visitasNotif = notificaciones.filter(n => n.tipo === 'visita');
    const contactosWhatsapp = notificaciones.filter(n => n.tipo === 'contacto_whatsapp');
    const contactosLlamadas = notificaciones.filter(n => n.tipo === 'contacto_telefono');

    const visitasTotal = negocio.visitas || 0;
    const visitasHoy = visitasNotif.filter(v => new Date(v.fecha).toDateString() === hoy.toDateString()).length;
    const visitasSemana = visitasNotif.filter(v => new Date(v.fecha) >= inicioSemana).length;
    const visitasMes = visitasNotif.filter(v => new Date(v.fecha) >= inicioMes).length;

    const contactosTotal = contactosWhatsapp.length + contactosLlamadas.length;
    const contactosWhatsappCount = contactosWhatsapp.length;
    const contactosLlamadasCount = contactosLlamadas.length;

    const calificacionPromedio = comentarios.length > 0
      ? comentarios.reduce((sum, c) => sum + (c.calificacion || 5), 0) / comentarios.length
      : 0;

    const comentariosPositivos = comentarios.filter(c => (c.calificacion || 5) >= 4).length;
    const comentariosNegativos = comentarios.filter(c => (c.calificacion || 5) <= 2).length;

    const tendencias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });

      const visitasDia = visitasNotif.filter(v => new Date(v.fecha).toDateString() === fecha.toDateString()).length;
      const contactosDia = notificaciones.filter(n =>
        (n.tipo === 'contacto_whatsapp' || n.tipo === 'contacto_telefono') &&
        new Date(n.fecha).toDateString() === fecha.toDateString()
      ).length;

      tendencias.push({ fecha: fechaStr, visitas: visitasDia, contactos: contactosDia });
    }

    return {
      visitas: { total: visitasTotal, hoy: visitasHoy, semana: visitasSemana, mes: visitasMes },
      contactos: { total: contactosTotal, whatsapp: contactosWhatsappCount, llamadas: contactosLlamadasCount },
      comentarios: {
        total: comentarios.length,
        positivos: comentariosPositivos,
        negativos: comentariosNegativos,
        lista: comentarios.map(c => ({
          fecha: c.created,
          usuario: c.usuarioNombre || 'Usuario',
          calificacion: c.calificacion || 5,
          comentario: c.comentario || ''
        }))
      },
      calificacionPromedio: Math.round(calificacionPromedio * 10) / 10,
      tendencias
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del negocio:', error);
    throw error;
  }
}

export async function getActividadRecienteNegocio(negocioId, limit = 10) {
  try {
    const notificaciones = await getNotificacionesNegocio(negocioId, 5);
    const comentarios = await pb.collection('comentarios_negocios').getList(1, 5, {
      filter: `negocioId = "${negocioId}"`,
      sort: '-created',
      fields: 'id,created,usuarioNombre,comentario'
    });

    const actividad = [
      ...notificaciones.map(n => ({
        id: n.id,
        tipo: n.tipo,
        titulo: n.titulo || 'Notificación',
        mensaje: n.mensaje || '',
        fecha: n.created || n.fecha,
        leida: n.leida || false
      })),
      ...comentarios.items.map(c => ({
        id: c.id,
        tipo: 'comentario',
        titulo: '💬 Nuevo comentario',
        mensaje: `${c.usuarioNombre || 'Usuario'}: "${(c.comentario || '').substring(0, 50)}${(c.comentario || '').length > 50 ? '...' : ''}"`,
        fecha: c.created,
        leida: true
      }))
    ];

    actividad.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return actividad.slice(0, limit);
  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    return [];
  }
}

/**
 * Obtiene o crea una categoría de negocio a partir de un nombre.
 * @param {string} nombre - Nombre de la categoría (ej. "Ferretería")
 * @returns {Promise<string>} ID de la categoría encontrada o creada
 */
export async function getOrCreateCategoriaNegocio(nombre) {
  if (!nombre) return null;
  
  // Buscar por nombre exacto
  try {
    const existente = await pb.collection('categorias_negocios').getFirstListItem(`nombre = "${nombre}"`);
    return existente.id;
  } catch (e) {
    // No existe → crearla automáticamente
    const slug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const nueva = await pb.collection('categorias_negocios').create({
      nombre: nombre,
      slug: slug,
      activo: true,
      orden: 0
    });
    return nueva.id;
  }
}