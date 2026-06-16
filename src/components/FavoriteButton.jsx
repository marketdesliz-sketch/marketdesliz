// src/components/FavoriteButton.jsx
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import pb from '../lib/pocketbase';

export default function FavoriteButton({ productId, productName, onToggle }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { checkIfFavorite(); }, [productId]);

  const checkIfFavorite = async () => {
    if (!pb.authStore.isValid) return;
    try {
      const user = pb.authStore.model;
      const result = await pb.collection('favoritos').getFirstListItem(
        `userId = "${user.id}" && productId = "${productId}"`
      );
      setIsFavorite(!!result);
    } catch { setIsFavorite(false); }
  };

  const toggleFavorite = async () => {
    if (!pb.authStore.isValid) {
      window.dispatchEvent(new CustomEvent('openLoginModal'));
      return;
    }
    setLoading(true);
    try {
      const user = pb.authStore.model;
      if (isFavorite) {
        const favorite = await pb.collection('favoritos').getFirstListItem(
          `userId = "${user.id}" && productId = "${productId}"`
        );
        await pb.collection('favoritos').delete(favorite.id);
        setIsFavorite(false);
      } else {
        await pb.collection('favoritos').create({ userId: user.id, productId });
        setIsFavorite(true);
      }
      onToggle?.();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally { setLoading(false); }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
        isFavorite
          ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  );
}
