// src/components/negocios/FiltrosNegocios.jsx
import { useState } from 'react';
import { 
  Filter, 
  X, 
  Search, 
  Clock, 
  Star, 
  MapPin,
  Store,
  ChevronDown,
  ChevronUp,
  Building2
} from 'lucide-react';

export default function FiltrosNegocios({ 
  categorias, 
  selectedCategoria, 
  onCategoriaChange,
  onSearchChange,
  onFilterChange,
  resultadosCount = 0
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    abiertoAhora: false,
    calificacionMinima: 0,
    conWhatsApp: false,
    ordenarPor: 'nombre'
  });
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearchChange) onSearchChange(value);
  };

  const handleAdvancedFilter = (key, value) => {
    const nuevosFiltros = { ...filtrosAvanzados, [key]: value };
    setFiltrosAvanzados(nuevosFiltros);
    if (onFilterChange) onFilterChange(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltrosAvanzados({
      abiertoAhora: false,
      calificacionMinima: 0,
      conWhatsApp: false,
      ordenarPor: 'nombre'
    });
    if (onCategoriaChange) onCategoriaChange('todos');
    if (onSearchChange) onSearchChange('');
    if (onFilterChange) onFilterChange(filtrosAvanzados);
  };

  const ordenOptions = [
    { value: 'nombre', label: 'Nombre A-Z' },
    { value: '-nombre', label: 'Nombre Z-A' },
    { value: 'visitas', label: 'Más visitados' },
    { value: '-created', label: 'Más recientes' }
  ];

  return (
    <>
      {/* Botón flotante de filtros para móvil */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#6C3BFF] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition transform hover:scale-105"
        >
          <Filter size={24} />
        </button>
      </div>

      {/* Panel de filtros - Desktop */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Filter size={18} className="text-[#6C3BFF]" /> Filtros
          </h3>
          <button onClick={limpiarFiltros} className="text-xs text-gray-400 hover:text-[#6C3BFF] transition">
            Limpiar todo
          </button>
        </div>

        {/* Búsqueda */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Nombre, categoría..."
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
          <select
            value={selectedCategoria}
            onChange={(e) => onCategoriaChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] bg-white text-sm"
          >
            <option value="todos">📋 Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Filtros avanzados (colapsable) */}
        <button
          onClick={() => setMostrarAvanzados(!mostrarAvanzados)}
          className="w-full flex justify-between items-center text-sm font-medium text-gray-700 py-2 border-t border-gray-100 pt-3 mt-2"
        >
          <span>Filtros avanzados</span>
          {mostrarAvanzados ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {mostrarAvanzados && (
          <div className="space-y-4 mt-3">
            {/* Abierto ahora */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <Clock size={14} /> Abierto ahora
              </label>
              <button
                onClick={() => handleAdvancedFilter('abiertoAhora', !filtrosAvanzados.abiertoAhora)}
                className={`w-10 h-5 rounded-full transition flex items-center ${filtrosAvanzados.abiertoAhora ? 'bg-[#6C3BFF]' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition transform ${filtrosAvanzados.abiertoAhora ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Calificación mínima */}
            <div>
              <label className="block text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Star size={14} /> Calificación mínima
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleAdvancedFilter('calificacionMinima', star)}
                    className={`transition ${filtrosAvanzados.calificacionMinima >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star size={20} fill={filtrosAvanzados.calificacionMinima >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Solo con WhatsApp */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <Building2 size={14} /> Tiene WhatsApp
              </label>
              <button
                onClick={() => handleAdvancedFilter('conWhatsApp', !filtrosAvanzados.conWhatsApp)}
                className={`w-10 h-5 rounded-full transition flex items-center ${filtrosAvanzados.conWhatsApp ? 'bg-[#6C3BFF]' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition transform ${filtrosAvanzados.conWhatsApp ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Ordenar por */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Ordenar por</label>
              <select
                value={filtrosAvanzados.ordenarPor}
                onChange={(e) => handleAdvancedFilter('ordenarPor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              >
                {ordenOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <Store size={14} /> {resultadosCount} negocios
            </span>
            <button onClick={limpiarFiltros} className="text-[#6C3BFF] hover:underline text-xs">
              Reiniciar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de filtros para móvil */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setIsOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Filter size={18} className="text-[#6C3BFF]" /> Filtros
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Nombre, categoría..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Categorías */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={selectedCategoria}
                  onChange={(e) => onCategoriaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm"
                >
                  <option value="todos">📋 Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filtros adicionales móvil */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAdvancedFilter('abiertoAhora', !filtrosAvanzados.abiertoAhora)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition ${filtrosAvanzados.abiertoAhora ? 'bg-[#6C3BFF] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Clock size={14} /> Abierto ahora
                </button>
                <button
                  onClick={() => handleAdvancedFilter('conWhatsApp', !filtrosAvanzados.conWhatsApp)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition ${filtrosAvanzados.conWhatsApp ? 'bg-[#6C3BFF] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Building2 size={14} /> Con WhatsApp
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={limpiarFiltros}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Limpiar todo
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 bg-[#6C3BFF] text-white rounded-xl font-medium hover:bg-purple-700 transition"
                >
                  Ver {resultadosCount} negocios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}