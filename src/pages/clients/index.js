// src/pages/clients/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import ClientCard from "../../components/clients/ClientCard";
import CreateClientForm from "../../components/clients/CreateClientForm";
import { getClients } from "../../lib/clientsService";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadClients() {
    setLoading(true);
    setError("");
    
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      setError("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <>
      <Head>
        <title>Clientes | MarketDesliz Admin</title>
      </Head>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>👥 Clientes</h1>
          <Link
            href="/admin/clientes"
            style={{
              background: "#6C3BFF",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px"
            }}
          >
            ← Volver al Admin
          </Link>
        </div>

        <CreateClientForm onCreated={loadClients} />

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

        {loading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner"></div>
            <p>Cargando clientes...</p>
          </div>
        )}

        {!loading && clients.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px",
            background: "white",
            borderRadius: "12px",
            border: "1px solid #eee"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>No hay clientes registrados</h3>
            <p style={{ color: "#666" }}>Comienza creando tu primer cliente</p>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "20px"
          }}
        >
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
            />
          ))}
        </div>
      </div>

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
    </>
  );
}