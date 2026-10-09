// src/pages/productos/categoria/[[...slug]].js
import CategoriaPage from '../../[tipo]/categoria/[[...slug]]';

export default function ProductosCategoriaPage() {
  return <CategoriaPage tipoForzado="productos" />;
}