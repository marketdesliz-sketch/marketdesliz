// src/pages/clients/crear.js
import { useState } from "react";
import { useRouter } from "next/router";
import pb from "../../lib/pocketbase";

export default function CrearCliente() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccionCalle: "",
    direccionNumero: "",
    direccionColonia: "",
    direccionCiudad: "",
    direccionEstado: "",
    direccionCp: ""
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const telefonoLimpio = form.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length !== 10) {
      setError("El teléfono debe tener 10 dígitos");
      setLoading(false);
      return;
    }

    try {
      const tempEmail = form.email || `cliente_${telefonoLimpio}@marketdesliz.com`;
      
      const newUser = await pb.collection('users').create({
        nombre: form.nombre,
        telefono: telefonoLimpio,
        email: tempEmail,
        password: 'MarketDesliz2024!',
        passwordConfirm: 'MarketDesliz2024!',
        role: 'cliente',
        activo: true
      });

      await pb.collection('clients').create({
        userId: newUser.id,
        direccionCalle: form.direccionCalle || '',
        direccionNumero: form.direccionNumero || '',
        direccionColonia: form.direccionColonia || '',
        direccionCiudad: form.direccionCiudad || '',
        direccionEstado: form.direccionEstado || '',
        direccionCp: form.direccionCp || '',
        diaPago: 'lunes',
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
        datosCompletos: false,
        aceptaTerminos: false,
        documentosCompletos: false
      });

      alert("✅ Cliente creado exitosamente");
      router.push("/admin/clientes");

    } catch (error) {
      console.error("Error creando cliente:", error);
      if (error.message?.includes('email')) {
        setError("Error: El correo electrónico ya está registrado");
      } else if (error.message?.includes('telefono')) {
        setError("Error: El número de teléfono ya está registrado");
      } else {
        setError(error.message || "Error al crear el cliente");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Crear Cliente</h1>

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
          <label style={{ display: "block", marginBottom: "5px" }}>Nombre completo *</label>
          <input
            name="nombre"
            placeholder="Juan Pérez"
            value={form.nombre}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Teléfono *</label>
          <input
            name="telefono"
            placeholder="5512345678"
            value={form.telefono}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
          <small style={{ color: "#666" }}>10 dígitos, ejemplo: 5512345678</small>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Correo electrónico (opcional)</label>
          <input
            name="email"
            type="email"
            placeholder="cliente@ejemplo.com"
            value={form.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <h3 style={{ margin: "20px 0 15px" }}>Dirección</h3>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Calle</label>
          <input
            name="direccionCalle"
            placeholder="Av. Insurgentes"
            value={form.direccionCalle}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Número exterior</label>
          <input
            name="direccionNumero"
            placeholder="123"
            value={form.direccionNumero}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Colonia</label>
          <input
            name="direccionColonia"
            placeholder="Condesa"
            value={form.direccionColonia}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Ciudad</label>
          <input
            name="direccionCiudad"
            placeholder="Ciudad de México"
            value={form.direccionCiudad}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Estado</label>
          <input
            name="direccionEstado"
            placeholder="CDMX"
            value={form.direccionEstado}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Código Postal</label>
          <input
            name="direccionCp"
            placeholder="06100"
            maxLength="5"
            value={form.direccionCp}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#ccc" : "#6C3BFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "20px"
          }}
        >
          {loading ? "Creando..." : "Crear Cliente"}
        </button>
      </form>
    </div>
  );
}