// src/hooks/useClients.js
import { useState, useEffect, useCallback } from 'react';
import pb from '../lib/pocketbase';

export default function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const records = await pb.collection('users').getFullList({
        filter: 'role = "cliente"',
        sort: '-created'
      });
      
      const clientsWithData = await Promise.all(
        records.map(async (user) => {
          let clientData = null;
          try {
            clientData = await pb.collection('clients').getFirstListItem(
              `userId = "${user.id}"`
            );
          } catch (e) {
            // No tiene registro en clients aún
          }
          
          return {
            ...user,
            clientData,
            // Datos combinados para fácil acceso
            nombre: user.nombre || 'Sin nombre',
            telefono: user.telefono || '',
            email: user.email || '',
            nivel: clientData?.nivel || 0,
            deudaActual: clientData?.deudaActual || 0,
            estadoKyc: clientData?.estadoKyc || 'pendiente',
            productosEnCurso: clientData?.productosEnCurso || 0,
            productosPagados: clientData?.productosPagados || 0,
            diaPago: clientData?.diaPago || 'lunes'
          };
        })
      );
      
      setClients(clientsWithData);
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function getClientById(clientId) {
    try {
      const user = await pb.collection('users').getOne(clientId);
      let clientData = null;
      
      try {
        clientData = await pb.collection('clients').getFirstListItem(
          `userId = "${clientId}"`
        );
      } catch (e) {
        // No tiene registro en clients
      }
      
      return {
        ...user,
        clientData,
        nombre: user.nombre || 'Sin nombre',
        telefono: user.telefono || '',
        email: user.email || '',
        nivel: clientData?.nivel || 0,
        deudaActual: clientData?.deudaActual || 0,
        estadoKyc: clientData?.estadoKyc || 'pendiente',
        productosEnCurso: clientData?.productosEnCurso || 0,
        productosPagados: clientData?.productosPagados || 0,
        totalGastado: clientData?.totalGastado || 0,
        diaPago: clientData?.diaPago || 'lunes',
        direccionCompleta: clientData ? [
          clientData.direccionCalle,
          clientData.direccionNumero ? `#${clientData.direccionNumero}` : '',
          clientData.direccionColonia,
          clientData.direccionMunicipio,
          clientData.direccionEstado
        ].filter(Boolean).join(', ') : 'Sin dirección'
      };
    } catch (err) {
      console.error('Error obteniendo cliente:', err);
      return null;
    }
  }

  async function updateClient(clientId, data) {
    try {
      // Actualizar datos básicos en users
      if (data.nombre || data.email || data.telefono) {
        const userUpdate = {};
        if (data.nombre) userUpdate.nombre = data.nombre;
        if (data.email) userUpdate.email = data.email;
        if (data.telefono) userUpdate.telefono = data.telefono;
        
        await pb.collection('users').update(clientId, userUpdate);
      }
      
      // Actualizar o crear registro en clients
      try {
        const existing = await pb.collection('clients').getFirstListItem(
          `userId = "${clientId}"`
        );
        
        await pb.collection('clients').update(existing.id, {
          direccionCalle: data.direccionCalle || existing.direccionCalle,
          direccionNumero: data.direccionNumero || existing.direccionNumero,
          direccionInterior: data.direccionInterior || '',
          direccionColonia: data.direccionColonia || existing.direccionColonia,
          direccionMunicipio: data.direccionMunicipio || existing.direccionMunicipio,
          direccionCiudad: data.direccionCiudad || existing.direccionCiudad,
          direccionEstado: data.direccionEstado || existing.direccionEstado,
          direccionCp: data.direccionCp || existing.direccionCp,
          direccionReferencias: data.direccionReferencias || '',
          diaPago: data.diaPago || existing.diaPago,
          telefonoAlternativo: data.telefonoAlternativo || existing.telefonoAlternativo,
          datosCompletos: true
        });
      } catch (e) {
        await pb.collection('clients').create({
          userId: clientId,
          direccionCalle: data.direccionCalle || '',
          direccionNumero: data.direccionNumero || '',
          direccionInterior: data.direccionInterior || '',
          direccionColonia: data.direccionColonia || '',
          direccionMunicipio: data.direccionMunicipio || '',
          direccionCiudad: data.direccionCiudad || '',
          direccionEstado: data.direccionEstado || '',
          direccionCp: data.direccionCp || '',
          direccionReferencias: data.direccionReferencias || '',
          diaPago: data.diaPago || 'lunes',
          telefonoAlternativo: data.telefonoAlternativo || '',
          datosCompletos: true,
          nivel: 0,
          productosComprados: 0,
          productosPagados: 0,
          productosEnCurso: 0,
          deudaActual: 0,
          limiteDeuda: 5000,
          estadoKyc: 'pendiente',
          trustScore: 0,
          totalGastado: 0,
          fechaUltimaCompra: null,
          aceptaTerminos: false,
          documentosCompletos: false
        });
      }
      
      await loadClients();
      return true;
    } catch (err) {
      console.error('Error actualizando cliente:', err);
      throw err;
    }
  }

  async function deleteClient(clientId) {
    try {
      // Eliminar registro en clients si existe
      try {
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `userId = "${clientId}"`
        );
        await pb.collection('clients').delete(clientRecord.id);
      } catch (e) {
        // No existe registro en clients
      }
      
      // Eliminar usuario
      await pb.collection('users').delete(clientId);
      await loadClients();
      return true;
    } catch (err) {
      console.error('Error eliminando cliente:', err);
      throw err;
    }
  }

  async function searchClients(query) {
    if (!query || query.trim().length < 2) {
      return clients;
    }
    
    const term = query.toLowerCase().trim();
    return clients.filter(c => 
      (c.nombre || '').toLowerCase().includes(term) ||
      (c.telefono || '').includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.id || '').toLowerCase().includes(term)
    );
  }

  return {
    clients,
    loading,
    error,
    loadClients,
    getClientById,
    updateClient,
    deleteClient,
    searchClients
  };
}