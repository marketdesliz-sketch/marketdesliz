/// <reference path="../pb_data/types.d.ts" />

// ═════════════════════════════════════════════════════════════════════════
// HOOK: Auto-actualizar calificacion + totalComentarios en servicios
// cuando se crea/edita/borra una review de reviews_servicios.
//
// Requiere: PocketBase v0.23+ (JSVM hooks API)
// Ubicación: pb_hooks/servicios_reviews.pb.js
// ═════════════════════════════════════════════════════════════════════════

/**
 * Recalcula la calificación promedio y el total de comentarios de un servicio
 * a partir de las reviews activas. Guarda los valores en el registro del
 * servicio.
 *
 * Se llama después de cada create/update/delete de una review.
 */
function recalcularCalificacionServicio(servicioId) {
  if (!servicioId) return;

  try {
    // 1. Traer todas las reviews activas del servicio
    const reviews = $app.findRecordsByFilter(
      'reviews_servicios',
      `servicioId = "${servicioId}" && activo = true`,
      '',
      0, // sin límite
      0  // sin offset
    );

    const totalComentarios = reviews.length;
    let calificacion = 0;

    if (totalComentarios > 0) {
      const suma = reviews.reduce((acc, r) => {
        const valor = r.getNumber('calificacion') || 0;
        return acc + valor;
      }, 0);
      // Redondear a 1 decimal
      calificacion = Math.round((suma / totalComentarios) * 10) / 10;
    }

    // 2. Actualizar el servicio
    const servicio = $app.findRecordById('servicios', servicioId);
    servicio.set('calificacion', calificacion);
    servicio.set('totalComentarios', totalComentarios);
    $app.save(servicio);

    console.log(
      `[servicios_reviews] Servicio ${servicioId} actualizado: ` +
      `${calificacion}★ · ${totalComentarios} comentarios`
    );
  } catch (err) {
    console.error(
      `[servicios_reviews] Error recalculando servicio ${servicioId}: ${err}`
    );
  }
}

// ─── Hooks ──────────────────────────────────────────────────────────────

// Después de crear una review
onRecordAfterCreateSuccess((e) => {
  const servicioId = e.record.getString('servicioId');
  recalcularCalificacionServicio(servicioId);
}, 'reviews_servicios');

// Después de actualizar una review (por ejemplo, si cambia la calificación o `activo`)
onRecordAfterUpdateSuccess((e) => {
  const servicioId = e.record.getString('servicioId');
  recalcularCalificacionServicio(servicioId);
}, 'reviews_servicios');

// Después de eliminar una review
onRecordAfterDeleteSuccess((e) => {
  const servicioId = e.record.getString('servicioId');
  recalcularCalificacionServicio(servicioId);
}, 'reviews_servicios');

console.log('[servicios_reviews] Hooks cargados correctamente');