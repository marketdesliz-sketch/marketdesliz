// src/pages/admin/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import pb from '../../lib/pocketbase';

export default function AdminIndex() {
  const router = useRouter();
  
  useEffect(() => {
    // Siempre ir al login, sin importar si hay sesión
    router.replace('/admin/login');
  }, []);
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div>Redirigiendo al login...</div>
    </div>
  );
}