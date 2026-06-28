// src/lib/nivelAdminService.js
// Servicio de administración de niveles (CRUD independiente)
// No depende de nivelClienteService para evitar problemas de bundling.

import pb from './pocketbase';

const COLLECTION = 'config_niveles';

export async function getNivelesList() {
  try {
    return await pb.collection(COLLECTION).getFullList({ sort: 'nivel' });
  } catch (error) {
    console.error('Error obteniendo niveles:', error);
    throw error;
  }
}

export async function createNivel(data) {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      throw new Error('No autorizado');
    }
    const existing = await pb.collection(COLLECTION).getFullList({
      filter: `nivel = ${data.nivel}`
    });
    if (existing.length > 0) {
      throw new Error(`El nivel ${data.nivel} ya existe`);
    }
    return await pb.collection(COLLECTION).create(data);
  } catch (error) {
    console.error('Error creando nivel:', error);
    throw error;
  }
}

export async function updateNivel(id, data) {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      throw new Error('No autorizado');
    }
    if (data.nivel) {
      const existing = await pb.collection(COLLECTION).getFullList({
        filter: `nivel = ${data.nivel} && id != "${id}"`
      });
      if (existing.length > 0) {
        throw new Error(`El nivel ${data.nivel} ya existe en otro registro`);
      }
    }
    return await pb.collection(COLLECTION).update(id, data);
  } catch (error) {
    console.error('Error actualizando nivel:', error);
    throw error;
  }
}

export async function deleteNivel(id) {
  try {
    if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
      throw new Error('No autorizado');
    }
    return await pb.collection(COLLECTION).delete(id);
  } catch (error) {
    console.error('Error eliminando nivel:', error);
    throw error;
  }
}