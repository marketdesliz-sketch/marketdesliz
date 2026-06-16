// src/lib/notificacionesNegocios.js
// Este archivo re-exporta funciones relacionadas con notificaciones de negocios
// para mantener compatibilidad con las importaciones existentes

import {
  getNotificacionesNegocio,
  marcarNotificacionLeida,
  crearNotificacionNegocio,
  notificarAdmin,
  notificarNuevaOrden,
  notificarNuevoPago,
  notificarNuevaKYC,
  notificarSolicitudVendedor,
  notificarCambioNivel,
  formatMoney,
  formatTelefono,
  generarFolio,
  generarFolioKYC,
  isTelegramConfigurado,
  testTelegramConnection
} from './notificaciones';

// Re-exportar todo
export {
  getNotificacionesNegocio,
  marcarNotificacionLeida,
  crearNotificacionNegocio,
  notificarAdmin,
  notificarNuevaOrden,
  notificarNuevoPago,
  notificarNuevaKYC,
  notificarSolicitudVendedor,
  notificarCambioNivel,
  formatMoney,
  formatTelefono,
  generarFolio,
  generarFolioKYC,
  isTelegramConfigurado,
  testTelegramConnection
};

// Export default para compatibilidad
export default {
  getNotificacionesNegocio,
  marcarNotificacionLeida,
  crearNotificacionNegocio,
  notificarAdmin,
  notificarNuevaOrden,
  notificarNuevoPago,
  notificarNuevaKYC,
  notificarSolicitudVendedor,
  notificarCambioNivel,
  formatMoney,
  formatTelefono,
  generarFolio,
  generarFolioKYC,
  isTelegramConfigurado,
  testTelegramConnection
};