// src/pages/preguntas-frecuentes.js (redirige a ayuda)
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PreguntasFrecuentesPage() {
  const router = useRouter();
  useEffect(() => { router.push('/ayuda'); }, []);
  return null;
}