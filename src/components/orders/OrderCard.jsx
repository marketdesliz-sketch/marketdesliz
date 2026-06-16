// src/components/orders/OrderCard.jsx
export default function OrderCard({ order }) {
  // Obtener nombre del producto desde expand si está disponible
  const productName = order.expand?.productId?.nombre || order.productName || 'Producto';

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div
      style={{
        background: "white",
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        marginBottom: "10px"
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
        {productName}
      </h3>

      <p style={{ margin: '4px 0' }}>
        <strong>Total:</strong> {formatMoney(order.totalPagar)}
      </p>

      <p style={{ margin: '4px 0' }}>
        <strong>Saldo:</strong> {formatMoney(order.saldoRestante)}
      </p>

      <p style={{ margin: '4px 0' }}>
        <strong>Semanas:</strong> {order.semanasTotales}
      </p>
    </div>
  );
}