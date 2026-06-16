// src/pages/api/enviar-recordatorio-pago.js
import pb from '../../lib/pocketbase';
import { enviarRecordatorioManual } from '../../lib/tandaPagosService';

export default async function handler(req, res) {
  // ✅ Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  const { tandaMemberId } = req.body;

  // ✅ Validar que el ID sea proporcionado
  if (!tandaMemberId) {
    return res.status(400).json({ 
      success: false, 
      error: 'tandaMemberId es requerido' 
    });
  }

  try {
    // ✅ Verificar autenticación
    if (!pb.authStore.isValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autorizado. Inicia sesión nuevamente.' 
      });
    }

    // ✅ Enviar recordatorio manual
    const result = await enviarRecordatorioManual(tandaMemberId);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Recordatorio enviado exitosamente',
      data: result 
    });
    
  } catch (error) {
    console.error('❌ Error en API enviar-recordatorio-pago:', error);
    
    // ✅ Manejo de errores específicos
    if (error.message === 'El usuario ya pagó la segunda parte') {
      return res.status(400).json({ 
        success: false, 
        error: 'Este pago ya ha sido completado' 
      });
    }
    
    if (error.message === 'El usuario no ha pagado la primera parte') {
      return res.status(400).json({ 
        success: false, 
        error: 'Primero debe registrarse la primera parte del pago' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al enviar el recordatorio' 
    });
  }
}
