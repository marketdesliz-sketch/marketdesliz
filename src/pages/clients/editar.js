// src/pages/clients/editar.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import pb from "../../lib/pocketbase";

export default function EditarCliente() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [client, setClient] = useState({
    nombre: "",
    telefono: "",
    email: "",
    activo: true,
    direccionCalle: "",
    direccionNumero: "",
    direccionColonia: "",
    direccionCiudad: "",
    direccionEstado: "",
    direccionCp: "",
    diaPago: "lunes"
  });

  const [clientDataId, setClientDataId] = useState(null);

  useEffect(() => {
    if (!id) return;
    cargarCliente();
  }, [id]);

  const cargarCliente = async () => {
    try {
      setLoading(true);
      
      const user = await pb.collection('users').getOne(id);
      
      let clientData = null;
      let clientDataIdTemp = null;
      try {
        clientData = await pb.collection('clients').getFirstListItem(
          `userId = "${id}"`
        );
        clientDataIdTemp = clientData.id;
      } catch (e) {
        console.log('No hay datos extendidos para este cliente');
      }
      
      setClientDataId(clientDataIdTemp);
      setClient({
        nombre: user.nombre || "",
        telefono: user.telefono || "",
        email: user.email || "",
        activo: user.activo !== false,
        direccionCalle: clientData?.direccionCalle || "",
        direccionNumero: clientData?.direccionNumero || "",
        direccionColonia: clientData?.direccionColonia || "",
        direccionCiudad: clientData?.direccionCiudad || "",
        direccionEstado: clientData?.direccionEstado || "",
        direccionCp: clientData?.direccionCp || "",
        diaPago: clientData?.diaPago || "lunes"
      });
      
    } catch (error) {
      console.error("Error cargando cliente:", error);
      setError("Error al cargar el cliente");
    } finally {
      setLoading(false);
    }
  };

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setClient({
      ...client,
      [name]: type === "checkbox" ? checked : value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const telefonoLimpio = client.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length !== 10 && client.telefono) {
      setError("El teléfono debe tener 10 dígitos");
      setSaving(false);
      return;
    }

    try {
      await pb.collection('users').update(id, {
        nombre: client.nombre,
        telefono: telefonoLimpio || client.telefono,
        email: client.email,
        activo: client.activo
      });

      const clientDataUpdate = {
        direccionCalle: client.direccionCalle || '',
        direccionNumero: client.direccionNumero || '',
        direccionColonia: client.direccionColonia || '',
        direccionCiudad: client.direccionCiudad || '',
        direccionEstado: client.direccionEstado || '',
        direccionCp: client.direccionCp || '',
        diaPago: client.diaPago || 'lunes',
        datosCompletos: true
      };

      if (clientDataId) {
        await pb.collection('clients').update(clientDataId, clientDataUpdate);
      } else {
        await pb.collection('clients').create({
          userId: id,
          ...clientDataUpdate,
          nivel: 0,
          productosComprados: 0,
          productosPagados: 0,
          productosEnCurso: 0,
          deudaActual: 0,
          limiteDeuda: 5000,
          estadoKyc: 'pendiente',
          trustScore: 0,
          totalGastado: 0,
          fechaUltimaCompra: null,
          aceptaTerminos: false,
          documentosCompletos: false
        });
      }

      alert("✅ Cliente actualizado correctamente");
      router.push("/admin/clientes");

    } catch (error) {
      console.error("Error actualizando cliente:", error);
      if (error.message?.includes('email')) {
        setError("Error: El correo electrónico ya está registrado");
      } else if (error.message?.includes('telefono')) {
        setError("Error: El número de teléfono ya está registrado");
      } else {
        setError(error.message || "Error al actualizar el cliente");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner"></div>
        <p>Cargando cliente...</p>
        <style jsx>{`
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #6C3BFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Editar Cliente</h1>

      {error && (
        <div style={{
          background: "#fee",
          border: "1px solid #fcc",
          color: "#c33",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Nombre completo</label>
          <input
            name="nombre"
            value={client.nombre}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Teléfono</label>
          <input
            name="telefono"
            value={client.telefono}
            onChange={handleChange}
            placeholder="5512345678"
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
          <small style={{ color: "#666" }}>10 dígitos</small>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Correo electrónico</label>
          <input
            name="email"
            type="email"
            value={client.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Día de pago</label>
          <select
            name="diaPago"
            value={client.diaPago}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          >
            <option value="lunes">Lunes</option>
            <option value="martes">Martes</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            name="activo"
            checked={client.activo}
            onChange={handleChange}
            style={{ width: "20px", height: "20px" }}
          />
          <label>Cliente activo</label>
        </div>

        <h3 style={{ margin: "20px 0 15px" }}>Dirección</h3>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Calle</label>
          <input
            name="direccionCalle"
            value={client.direccionCalle}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Número exterior</label>
          <input
            name="direccionNumero"
            value={client.direccionNumero}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Colonia</label>
          <input
            name="direccionColonia"
            value={client.direccionColonia}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Ciudad</label>
          <input
            name="direccionCiudad"
            value={client.direccionCiudad}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Estado</label>
          <input
            name="direccionEstado"
            value={client.direccionEstado}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Código Postal</label>
          <input
            name="direccionCp"
            value={client.direccionCp}
            onChange={handleChange}
            maxLength="5"
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: "100%",
            padding: "12px",
            background: saving ? "#ccc" : "#6C3BFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: saving ? "not-allowed" : "pointer",
            marginTop: "20px"
          }}
        >
          {saving ? "Actualizando..." : "Actualizar Cliente"}
        </button>
      </form>
    </div>
  );
}