import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ProductosRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Obtener todos los parámetros de la URL
    const { busqueda, categoria } = router.query;
    
    // Construir la URL de destino
    let destino = '/productos/categoria/todos';
    
    // Si hay categoría específica (diferente de 'todos')
    if (categoria && categoria !== 'todos' && categoria !== 'undefined') {
      destino = `/productos/categoria/${categoria}`;
    }
    
    // Agregar búsqueda si existe
    if (busqueda && busqueda.trim() !== '') {
      destino += `?busqueda=${encodeURIComponent(busqueda.trim())}`;
    }
    
    // Log para depuración
    console.log('🔄 Redirigiendo a:', destino);
    
    // Realizar la redirección
    router.replace(destino);
    
  }, [router.query, router]);
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm font-medium">Cargando catálogo...</p>
        <p className="text-gray-400 text-xs mt-1">MarketDesliz</p>
      </div>
    </div>
  );
}