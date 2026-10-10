// src/pages/admin/dashboard.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import pb from '../../lib/pocketbase';
import { formatMoney } from '../../lib/utils';
import { T } from '../../lib/tokens';
import Logo from '../../components/Logo';
import TerminalBar from '../../components/TerminalBar';
import Footer from '../../components/Footer';

// ═════════════════════════════════════════════════════════════════════════
// IMAGEN EDITORIAL DEL HERO
// Guárdala en: /public/images/admin-dashboard-hero.jpg
// ═════════════════════════════════════════════════════════════════════════
const HERO_IMAGE = '/images/admin-dashboard-hero.jpg';

// ─────────────────────────────────────────────────────────────────────────
// dashboardService · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const dashboardService = {
  async getStats() {
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
      const inicioAyer = new Date(inicioHoy);
      inicioAyer.setDate(inicioAyer.getDate() - 1);
      const finAyer = new Date(inicioHoy);

      const contarConFiltro = async (collection, filterExtra = '', fields = 'id') => {
        try {
          const result = await pb.collection(collection).getList(1, 1, { filter: filterExtra, fields });
          return result.totalItems;
        } catch { return 0; }
      };

      const clientesHoy = await contarConFiltro('users', '(role = "cliente" || role = "user")');
      const clientesAyer = await contarConFiltro('users', `(role = "cliente" || role = "user") && created < "${inicioHoy.toISOString()}"`);

      const productosHoy = await contarConFiltro('products', 'activo = true');
      const productosAyer = await contarConFiltro('products', `activo = true && created < "${inicioHoy.toISOString()}"`);

      const ordenesHoy = await contarConFiltro('orders', '');
      const ordenesAyer = await contarConFiltro('orders', `created < "${inicioHoy.toISOString()}"`);

      let vendedoresHoy = 0;
      let vendedoresAyer = 0;
      try {
        vendedoresHoy = await contarConFiltro('vendedores', 'activo = true');
        vendedoresAyer = await contarConFiltro('vendedores', `activo = true && created < "${inicioHoy.toISOString()}"`);
      } catch (e) { /* silencioso */ }

      const pagosHoyResult = await pb.collection('payments').getList(1, 50, {
        filter: `estado = "pendiente" && fechaVencimiento >= "${inicioHoy.toISOString()}" && fechaVencimiento < "${finHoy.toISOString()}"`,
        expand: 'userId',
        sort: 'fechaVencimiento',
      });

      const pagosAyerResult = await pb.collection('payments').getList(1, 1, {
        filter: `estado = "pendiente" && fechaVencimiento >= "${inicioAyer.toISOString()}" && fechaVencimiento < "${finAyer.toISOString()}"`,
        fields: 'id',
      });

      const deudaPagos = await pb.collection('payments').getFullList({
        filter: 'estado = "pendiente" || estado = "atrasado"',
        fields: 'montoProgramado,monto,created',
      });
      const deudaHoy = deudaPagos.reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0);

      const deudaAyerPagos = await pb.collection('payments').getFullList({
        filter: `(estado = "pendiente" || estado = "atrasado") && created < "${inicioHoy.toISOString()}"`,
        fields: 'montoProgramado,monto',
      });
      const deudaAyer = deudaAyerPagos.reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0);

      const pagosHoyConCliente = pagosHoyResult.items.map((pago) => ({
        ...pago,
        clienteNombre: pago.expand?.userId?.nombre || pago.expand?.userId?.email || 'Cliente',
      }));

      const calcularTendencia = (actual, anterior) => {
        if (anterior === 0) return { diferencia: actual, porcentaje: actual > 0 ? 100 : 0 };
        const diff = actual - anterior;
        const porcentaje = Math.round((diff / anterior) * 100);
        return { diferencia: diff, porcentaje };
      };

      const stats = {
        clientes: { valor: clientesHoy, tendencia: calcularTendencia(clientesHoy, clientesAyer) },
        productos: { valor: productosHoy, tendencia: calcularTendencia(productosHoy, productosAyer) },
        ordenes: { valor: ordenesHoy, tendencia: calcularTendencia(ordenesHoy, ordenesAyer) },
        vendedores: { valor: vendedoresHoy, tendencia: calcularTendencia(vendedoresHoy, vendedoresAyer) },
        pagosHoy: { valor: pagosHoyResult.totalItems, tendencia: calcularTendencia(pagosHoyResult.totalItems, pagosAyerResult.totalItems) },
        deudaTotal: { valor: deudaHoy, tendencia: calcularTendencia(deudaHoy, deudaAyer) },
      };

      return { stats, pagosHoy: pagosHoyConCliente };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  async registrarCobro(pagoId, monto, orderId) {
    await pb.collection('payments').update(pagoId, {
      estado: 'pagado',
      montoPagado: monto,
      fechaPago: new Date().toISOString(),
    });

    if (orderId) {
      const orden = await pb.collection('orders').getOne(orderId);
      const nuevoSaldo = Math.max(0, (orden.saldoRestante || 0) - monto);

      await pb.collection('orders').update(orderId, {
        saldoRestante: nuevoSaldo,
        pagosRealizados: (orden.pagosRealizados || 0) + 1,
        estadoPago: nuevoSaldo <= 0 ? 'completada' : orden.estadoPago,
      });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Secciones del menú admin · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const ADMIN_SECTIONS = [
  {
    key: 'marketdesliz',
    title: 'Servicios MarketDesliz',
    destacado: true,
    items: [
      { name: 'Deslizmoto Express', path: '/admin/deslizmoto' },
      { name: 'DeslizFood', path: '/admin/deslizfood' },
      { name: 'Encargos VIP', path: '/admin/encargos-vip' },
      { name: 'Publicidad', path: '/admin/publicidad' },
      { name: 'Invitaciones Digitales', path: '/admin/invitaciones' },
    ],
  },
  {
    key: 'operaciones',
    title: 'Operaciones',
    items: [
      { name: 'KYC Pendientes', path: '/admin/kyc' },
      { name: 'Tandas', path: '/admin/tandas' },
      { name: 'Clientes', path: '/admin/clientes' },
      { name: 'Tarjetas', path: '/admin/tarjetas' },
    ],
  },
  {
    key: 'catalogo',
    title: 'Catálogo',
    items: [
      { name: 'Productos', path: '/admin/productos' },
      { name: 'Negocios Aliados', path: '/admin/negocios' },
      { name: 'Servicios', path: '/admin/servicios' },
      { name: 'Fruta', path: '/admin/fruta' },
      { name: 'Ganado', path: '/admin/ganado' },
      { name: 'Éshé Parallel', path: '/admin/eshe-parallel' },
      { name: 'Empleos', path: '/admin/empleos' },
    ],
  },
  {
    key: 'finanzas',
    title: 'Finanzas y equipo',
    items: [
      { name: 'Órdenes', path: '/admin/ordenes' },
      { name: 'Pagos', path: '/admin/pagos' },
      { name: 'Vendedores', path: '/admin/vendedores' },
      { name: 'Cobradores', path: '/admin/cobradores' },
      { name: 'Cobranza en campo', path: '/admin/collector' },
    ],
  },
  {
    key: 'sistema',
    title: 'Sistema',
    items: [
      { name: 'Reportes', path: '/admin/reportes' },
      { name: 'Configuración', path: '/admin/configuracion' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// HeaderLink · link de texto con touch
// ─────────────────────────────────────────────────────────────────────────
function HeaderLink({ href, label, onClick, danger = false }) {
  const [hover, setHover] = useState(false);

  const colorActive = danger
    ? hover ? T.red : 'rgba(197, 48, 48, 0.75)'
    : hover ? T.ink : T.inkSoft;

  const style = {
    color: colorActive,
    fontSize: '12.5px',
    fontWeight: 450,
    letterSpacing: '-0.005em',
    transition: `color 0.2s ${T.ease}`,
    WebkitTapHighlightColor: 'transparent',
    padding: '6px 2px',
  };

  const handlers = {
    onTouchStart: () => setHover(true),
    onTouchEnd: () => setTimeout(() => setHover(false), 120),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };

  if (href) return <Link href={href} style={style} {...handlers}>{label}</Link>;
  return <button onClick={onClick} style={style} {...handlers}>{label}</button>;
}

// ─────────────────────────────────────────────────────────────────────────
// TextLink · link de lista con touch
// ─────────────────────────────────────────────────────────────────────────
function TextLink({ label, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block text-left w-full py-2 transition-all duration-200"
      style={{
        color: hover ? T.accent : T.inkMid,
        fontSize: '14.5px',
        fontWeight: 450,
        letterSpacing: '-0.005em',
        paddingLeft: hover ? '8px' : '0px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SectionBlock · título + items
// ─────────────────────────────────────────────────────────────────────────
function SectionBlock({ section, onNavigate }) {
  const isAccent = section.destacado;

  return (
    <section>
      <h2
        className="text-[12px] uppercase tracking-[0.22em] mb-5"
        style={{
          color: isAccent ? T.accent : T.inkFaint,
          fontWeight: 500,
          fontFeatureSettings: '"ss01"',
        }}
      >
        {section.title}
      </h2>
      <div>
        {section.items.map((item) => (
          <TextLink
            key={item.path}
            label={item.name}
            onClick={() => onNavigate(item.path)}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PaymentRow
// ─────────────────────────────────────────────────────────────────────────
function PaymentRow({ pago, onCobrar }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 200)}
      className="grid grid-cols-12 gap-4 py-6 md:py-7 items-baseline"
      style={{ transitionTimingFunction: T.ease }}
    >
      <div className="col-span-12 md:col-span-5">
        <p
          className="text-[16px] tracking-[-0.01em] transition-colors duration-200"
          style={{ color: hover ? T.ink : T.inkMid, fontWeight: 450, transitionTimingFunction: T.ease }}
        >
          {pago.clienteNombre}
        </p>
      </div>

      <div className="col-span-8 md:col-span-3">
        <p className="text-[12.5px] tracking-[-0.005em]" style={{ color: T.inkSoft, fontWeight: 450 }}>
          {new Date(pago.fechaVencimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
          {pago.numeroSemana !== undefined && (
            <span style={{ color: T.inkGhost }}> · Sem {pago.numeroSemana}</span>
          )}
        </p>
      </div>

      <div className="col-span-4 md:col-span-2 md:text-right">
        <p
          className="text-[15px] tabular-nums tracking-[-0.01em]"
          style={{ color: T.ink, fontWeight: 450, fontFeatureSettings: '"tnum"' }}
        >
          {formatMoney(pago.montoProgramado || pago.monto || 0)}
        </p>
      </div>

      <div className="col-span-12 md:col-span-2 md:text-right">
        <button
          onClick={onCobrar}
          className="text-[12.5px] tracking-[-0.005em] transition-all duration-200"
          style={{
            color: hover ? T.accent : T.inkSoft,
            fontWeight: 500,
            transitionTimingFunction: T.ease,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Cobrar →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [error, setError] = useState(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    const d = new Date();
    const formatted = d
      .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
      .replace(/^\w/, (c) => c.toUpperCase());
    setToday(formatted);
  }, []);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        if (!pb.authStore.isValid) { router.replace('/admin/login'); return; }
        const user = pb.authStore.model;
        if (user?.role !== 'admin') { pb.authStore.clear(); router.replace('/admin/login'); return; }
        setAdminUser(user);
        await cargarDatos();
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar datos');
      } finally { setLoading(false); }
    };
    checkAuthAndLoad();
  }, []);

  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await dashboardService.getStats();
      setPagosPendientes(data.pagosHoy);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('No se pudieron cargar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleLogout = () => {
    pb.authStore.clear();
    router.push('/admin/login');
  };

  const handleCobrar = useCallback(async (pago) => {
    const monto = pago.montoProgramado || pago.monto || 0;
    if (!confirm(`¿Confirmar cobro de $${monto.toLocaleString()} para ${pago.clienteNombre}?`)) return;
    try {
      await dashboardService.registrarCobro(pago.id, monto, pago.orderId);
      await cargarDatos(true);
    } catch (error) {
      console.error('Error al cobrar:', error);
      alert('Error al procesar el pago');
    }
  }, [cargarDatos]);

  const adminName = adminUser?.nombre || adminUser?.email?.split('@')[0] || 'Admin';
  const adminFirstName = adminName.split(' ')[0];

  // Loading
  if (loading) {
    return (
      <>
        <Head><title>Cargando | MarketDesliz Admin</title></Head>
        <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
          <div className="text-center">
            <span className="font-serif text-[32px] block mb-5 select-none" style={{ color: T.inkGhost }}>
              ʃƪʃƪ
            </span>
            <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: T.inkFaint, fontWeight: 500 }}>
              Cargando
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | MarketDesliz Admin</title>
        <meta name="description" content="Panel de administración de MarketDesliz" />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        {/* ═══ BARRA TERMINAL ═══ */}
        <TerminalBar mode="rotating" />

        {/* ═══ HEADER ═══ */}
        <header
          className="sticky top-0 z-30"
          style={{
            background: 'rgba(250, 250, 249, 0.85)',
            backdropFilter: 'saturate(180%) blur(16px)',
            WebkitBackdropFilter: 'saturate(180%) blur(16px)',
            borderBottom: `1px solid ${T.line}`,
          }}
        >
          <div className="max-w-[1280px] mx-auto px-6 md:px-14 h-14 flex items-center justify-between gap-6">
            <Link href="/admin/dashboard" style={{ WebkitTapHighlightColor: 'transparent' }}>
              <Logo badge="Admin" />
            </Link>

            <nav className="flex items-center gap-5 md:gap-7">
              <HeaderLink href="/admin/normas" label="Reglamento" />
              <HeaderLink
                onClick={() => cargarDatos(true)}
                label={refreshing ? 'Sincronizando' : 'Actualizar'}
              />
              <HeaderLink onClick={handleLogout} label="Salir" danger />
            </nav>
          </div>
        </header>

        {/* ═══ MAIN ═══ */}
        <main className="flex-1">

          {/* ─── IMAGEN EDITORIAL · pieza central ─────────────── */}
          <section className="w-full">
            <div
              className="relative w-full overflow-hidden"
              style={{
                background: T.bg,
                aspectRatio: '1280 / 480',
                maxHeight: '520px',
              }}
            >
              <img
                src={HERO_IMAGE}
                alt="MarketDesliz — Panel de administración"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: 'grayscale(100%) contrast(1.15) brightness(1.02)',
                  mixBlendMode: 'multiply',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </section>

          {/* ─── EDITORIAL HEADER · fecha + nombre ──────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-12 md:pb-20">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
            >
              {today}
            </p>

            <h1
              className="text-[36px] md:text-[64px] leading-[1.02] tracking-[-0.035em] max-w-3xl"
              style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
            >
              Hola, {adminFirstName}.
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              ¿Qué quieres gestionar hoy?
            </p>
          </section>

          {/* ─── SECCIONES · 3 columnas escalonadas ─────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 md:gap-x-20 gap-y-12 md:gap-y-16">
              <div className="flex flex-col gap-12 md:gap-16">
                <SectionBlock section={ADMIN_SECTIONS[0]} onNavigate={(path) => router.push(path)} />
                <SectionBlock section={ADMIN_SECTIONS[1]} onNavigate={(path) => router.push(path)} />
              </div>

              <div className="flex flex-col gap-12 md:gap-16 md:pt-20">
                <SectionBlock section={ADMIN_SECTIONS[2]} onNavigate={(path) => router.push(path)} />
                <SectionBlock section={ADMIN_SECTIONS[3]} onNavigate={(path) => router.push(path)} />
              </div>

              <div className="flex flex-col gap-12 md:gap-16 md:pt-40">
                <SectionBlock section={ADMIN_SECTIONS[4]} onNavigate={(path) => router.push(path)} />
              </div>
            </div>
          </section>

          {/* ─── COBROS PENDIENTES ──────────────────────────── */}
          {pagosPendientes.length > 0 && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
              <h2
                className="text-[12px] uppercase tracking-[0.22em] mb-4"
                style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
              >
                Cobros del día
              </h2>

              <h3
                className="text-[28px] md:text-[44px] leading-[1.08] tracking-[-0.03em] mb-10 md:mb-14 max-w-2xl"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                {pagosPendientes.length}{' '}
                {pagosPendientes.length === 1 ? 'pago pendiente.' : 'pagos pendientes.'}
              </h3>

              <div>
                {pagosPendientes.map((pago) => (
                  <PaymentRow key={pago.id} pago={pago} onCobrar={() => handleCobrar(pago)} />
                ))}
              </div>
            </section>
          )}

          {/* ─── ERROR ──────────────────────────────────────── */}
          {error && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16">
              <p className="text-[13px] tracking-[-0.005em]" style={{ color: T.red }}>
                {error}
              </p>
            </section>
          )}
        </main>

        {/* ═══ FOOTER minimal ═══ */}
        <Footer variant="minimal" />
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family: ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino', Georgia, 'Times New Roman', serif;
        }
        ::selection { background: rgba(79, 46, 232, 0.12); color: #0F0F0F; }
        * { -webkit-tap-highlight-color: transparent; font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1; }
      `}</style>
    </>
  );
}