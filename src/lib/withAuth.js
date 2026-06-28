// lib/withAuth.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import pb from './pocketbase';

export function withAuth(Component, requiredRole = null) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    useEffect(() => {
      if (!pb.authStore.isValid) {
        router.replace('/admin/login');
        return;
      }
      if (requiredRole && pb.authStore.model?.role !== requiredRole) {
        router.replace('/admin/login');
      }
    }, []);
    if (!pb.authStore.isValid) return null;
    return <Component {...props} />;
  };
}