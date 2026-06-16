// src/lib/verificationService.js
export async function guardarCodigoVerificacion(telefono, codigo) {
  try {
    const pb = getPocketBase(); // Tu instancia de PocketBase
    
    await pb.collection('verificaciones').create({
      telefono: telefono,
      codigo: codigo,
      creado: new Date().toISOString(),
      expira: new Date(Date.now() + 5 * 60000).toISOString(),
      usado: false
    });
    
    console.log('✅ Código guardado en base de datos');
  } catch (error) {
    console.error('❌ Error guardando código:', error);
  }
}

export async function verificarCodigo(telefono, codigo) {
  try {
    const pb = getPocketBase();
    
    const result = await pb.collection('verificaciones').getFirstListItem(
      `telefono="${telefono}" && codigo="${codigo}" && expira > "${new Date().toISOString()}" && usado=false`
    );
    
    if (result) {
      // Marcar como usado
      await pb.collection('verificaciones').update(result.id, { usado: true });
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}