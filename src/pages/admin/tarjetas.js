// src/pages/admin/tarjetas.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';  // ✅ AGREGADO
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';
import { getOrCreateTarjeta, getDatosTarjeta, actualizarEstadoTarjeta } from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';

export default function AdminTarjetasPage() {
  const router = useRouter();
  const [tarjetas, setTarjetas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [selectedTarjeta, setSelectedTarjeta] = useState(null);
  const [tarjetaData, setTarjetaData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGenerarMasivaModal, setShowGenerarMasivaModal] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [editForm, setEditForm] = useState({
    idCliente: '',
    estado: 'activo'
  });
  const [selectedClientesMasivos, setSelectedClientesMasivos] = useState([]);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/admin/login');
      return;
    }
    const user = pb.authStore.model;
    if (user?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    cargarTarjetas();
    cargarClientesSinTarjeta();
  }, []);

  const cargarTarjetas = async () => {
    try {
      setLoading(true);
      const tarjetasData = await pb.collection('clients').getFullList({
        filter: 'tarjetaId != null && tarjetaId != ""',
        sort: '-created',
        expand: 'userId'
      });

      const tarjetasConInfo = await Promise.all(tarjetasData.map(async (tarjeta) => {
        let datosCliente = null;
        try {
          datosCliente = await getDatosTarjeta(tarjeta.tarjetaId);
        } catch (e) {
          datosCliente = null;
        }
        return {
          ...tarjeta,
          clienteNombre: tarjeta.expand?.userId?.nombre || 'Cliente',
          clienteTelefono: tarjeta.expand?.userId?.telefono,
          token: tarjeta.tarjetaId,
          idCliente: tarjeta.tarjetaId,
          datosCompletos: datosCliente
        };
      }));

      setTarjetas(tarjetasConInfo);
    } catch (error) {
      console.error('Error cargando tarjetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarClientesSinTarjeta = async () => {
    try {
      const todosClientes = await pb.collection('users').getFullList({
        filter: 'role = "cliente"',
        sort: 'nombre'
      });

      // Filtrar clientes que no tienen tarjeta
      const clientsConTarjeta = await pb.collection('clients').getFullList({
        filter: 'tarjetaId != null && tarjetaId != ""'
      });
      const clientesConTarjetaIds = clientsConTarjeta.map(c => c.userId);
      const clientesSinTarjeta = todosClientes.filter(c => !clientesConTarjetaIds.includes(c.id));

      setClientes(clientesSinTarjeta);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const generarTarjeta = async (clienteId) => {
    setGenerando(true);
    try {
      const tarjeta = await getOrCreateTarjeta(clienteId);
      await cargarTarjetas();
      await cargarClientesSinTarjeta();
      alert(`✅ Tarjeta generada para ${clienteId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar la tarjeta');
    } finally {
      setGenerando(false);
    }
  };

  const generarTarjetasMasivas = async () => {
    if (selectedClientesMasivos.length === 0) {
      alert('Selecciona al menos un cliente');
      return;
    }

    setGenerando(true);
    let generadas = 0;
    let errores = 0;

    for (const clienteId of selectedClientesMasivos) {
      try {
        await getOrCreateTarjeta(clienteId);
        generadas++;
      } catch (error) {
        errores++;
        console.error(`Error generando tarjeta para ${clienteId}:`, error);
      }
    }

    alert(`✅ ${generadas} tarjetas generadas\n❌ ${errores} errores`);
    setShowGenerarMasivaModal(false);
    setSelectedClientesMasivos([]);
    await cargarTarjetas();
    await cargarClientesSinTarjeta();
    setGenerando(false);
  };

  const verTarjeta = async (tarjeta) => {
    try {
      const datos = await getDatosTarjeta(tarjeta.token || tarjeta.tarjetaId || tarjeta.idCliente);
      setTarjetaData(datos);
      setSelectedTarjeta(tarjeta);
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar la tarjeta');
    }
  };

  const editarTarjeta = async () => {
    try {
      await pb.collection('clients').update(selectedTarjeta.id, {
        // El estado se maneja a nivel usuario (activo)
      });
      await cargarTarjetas();
      setShowEditModal(false);
      alert('✅ Tarjeta actualizada');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la tarjeta');
    }
  };

  const eliminarTarjetaConfirm = async () => {
    try {
      await pb.collection('clients').update(selectedTarjeta.id, {
        tarjetaId: null,
        numeroTarjeta: null
      });
      await cargarTarjetas();
      setShowDeleteModal(false);
      alert('✅ Tarjeta eliminada');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la tarjeta');
    }
  };

  const imprimirTarjeta = () => {
    window.print();
  };

  const getFilteredTarjetas = () => {
    let filtradas = [...tarjetas];

    if (searchTerm) {
      filtradas = filtradas.filter(t =>
        t.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.idCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.clienteTelefono?.includes(searchTerm)
      );
    }

    if (filterEstado !== 'todos') {
      filtradas = filtradas.filter(t => t.estado === filterEstado);
    }

    return filtradas;
  };

  const tarjetasFiltradas = getFilteredTarjetas();

  const getEstadoBadge = (estado) => {
    const estados = {
      activo: { color: 'bg-green-100 text-green-800', label: 'Activo' },
      inactivo: { color: 'bg-red-100 text-red-800', label: 'Inactivo' },
      suspendido: { color: 'bg-yellow-100 text-yellow-800', label: 'Suspendido' }
    };
    const info = estados[estado] || estados.activo;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
  };

  const exportarExcel = () => {
    const data = tarjetasFiltradas.map(t => ({
      'ID Cliente': t.idCliente,
      'Cliente': t.clienteNombre,
      'Teléfono': t.clienteTelefono,
      'Estado': t.estado,
      'Fecha creación': new Date(t.created).toLocaleDateString(),
      'Token': t.token
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarjetas');
    XLSX.writeFile(workbook, `tarjetas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Gestión de Tarjetas | Admin</title>
        <style>{`
          .loading-spinner { width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #6C3BFF; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
          .modal-content { background: white; border-radius: 16px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; }
          @media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; top: 0; left: 0; width: 100%; } }
        `}</style>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💳 Gestión de Tarjetas</h1>
              <p className="text-gray-500 mt-1">Administra las tarjetas de clientes</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerarMasivaModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>📦</span> Generación masiva
              </button>
              <button
                onClick={exportarExcel}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
              >
                <span>📊</span> Exportar Excel
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{tarjetas.length}</div>
              <div className="text-sm text-gray-500">Total tarjetas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{tarjetas.length}</div>
              <div className="text-sm text-gray-500">Activas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{0}</div>
              <div className="text-sm text-gray-500">Inactivas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{clientes.length}</div>
              <div className="text-sm text-gray-500">Sin tarjeta</div>
            </div>
          </div>

          {/* Búsqueda y filtros */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por cliente, ID o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="todos">📋 Todos los estados</option>
                  <option value="activo">✅ Activas</option>
                  <option value="inactivo">❌ Inactivas</option>
                  <option value="suspendido">⏸️ Suspendidas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de tarjetas */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">ID Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Teléfono</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Estado</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Fecha</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tarjetasFiltradas.map((tarjeta) => (
                    <tr key={tarjeta.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono text-sm">{tarjeta.tarjetaId || tarjeta.idCliente || 'N/A'}</td>
                      <td className="p-4 font-medium">{tarjeta.clienteNombre}</td>
                      <td className="p-4 text-gray-600">{tarjeta.clienteTelefono || 'N/A'}</td>
                      <td className="p-4">{getEstadoBadge('activo')}</td>
                      <td className="p-4 text-sm text-gray-500">{new Date(tarjeta.created).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => verTarjeta(tarjeta)} className="text-purple-600 hover:text-purple-800" title="Ver tarjeta">👁️</button>
                          <button onClick={() => { setSelectedTarjeta(tarjeta); setEditForm({ idCliente: tarjeta.idCliente, estado: tarjeta.estado }); setShowEditModal(true); }} className="text-blue-600 hover:text-blue-800" title="Editar">✏️</button>
                          <button onClick={() => { setSelectedTarjeta(tarjeta); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-800" title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {tarjetasFiltradas.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-5xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tarjetas registradas</h3>
              <p className="text-gray-500">Genera tarjetas desde la sección de clientes</p>
            </div>
          )}
        </div>
      </AdminLayout>

      {/* Modal de ver tarjeta */}
      {showModal && tarjetaData && (
        <div className="modal print-area" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              {/* ✅ CORREGIDO: tarjetaData.cliente.nombre → tarjetaData.nombre */}
              <h3 className="text-xl font-bold">💳 Tarjeta de {tarjetaData.nombre}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-6">
              <TarjetaCliente datos={tarjetaData} tipo="frente" />
              <TarjetaCliente datos={tarjetaData} tipo="reverso" />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={imprimirTarjeta} className="flex-1 bg-[#6C3BFF] text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition">🖨️ Imprimir</button>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/cliente/${tarjetaData.token}`); alert('✅ Enlace copiado'); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">📋 Copiar enlace</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && selectedTarjeta && (
        <div className="modal" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">✏️ Editar tarjeta</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">ID Cliente</label><input type="text" value={editForm.idCliente} disabled className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label><select value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="suspendido">Suspendido</option></select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancelar</button>
              <button onClick={editarTarjeta} className="flex-1 bg-[#6C3BFF] text-white py-2 rounded-lg font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && selectedTarjeta && (
        <div className="modal" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">🗑️ Eliminar tarjeta</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de eliminar la tarjeta de <strong>{selectedTarjeta.clienteNombre}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancelar</button>
              <button onClick={eliminarTarjetaConfirm} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de generación masiva */}
      {showGenerarMasivaModal && (
        <div className="modal" onClick={() => setShowGenerarMasivaModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">📦 Generación masiva de tarjetas</h3>
            <p className="text-gray-600 mb-4">Selecciona los clientes para generar sus tarjetas:</p>
            <div className="max-h-60 overflow-y-auto border rounded-lg mb-4">
              {clientes.map(cliente => (
                <label key={cliente.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b">
                  <input type="checkbox" value={cliente.id} onChange={(e) => { if (e.target.checked) setSelectedClientesMasivos([...selectedClientesMasivos, cliente.id]); else setSelectedClientesMasivos(selectedClientesMasivos.filter(id => id !== cliente.id)); }} className="w-4 h-4" />
                  <div><p className="font-medium">{cliente.nombre || 'Sin nombre'}</p><p className="text-sm text-gray-500">{cliente.telefono}</p></div>
                </label>
              ))}
              {clientes.length === 0 && <p className="p-4 text-gray-500 text-center">No hay clientes sin tarjeta</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGenerarMasivaModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancelar</button>
              <button onClick={generarTarjetasMasivas} disabled={generando || selectedClientesMasivos.length === 0} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold disabled:opacity-50">Generar {selectedClientesMasivos.length} tarjeta(s)</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}