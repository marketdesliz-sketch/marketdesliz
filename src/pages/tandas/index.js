// src/pages/tandas/index.js
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Target, Users, Calendar, ShieldCheck, XCircle, Award, Star,
  Key, Lock, Filter, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, Grid2X2, HandCoins, Coins, Wallet, Trophy,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { getNivelTandaPermitido } from '../../lib/tandasService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

const ITEMS_PER_PAGE = 12;

// ─────────────────────────────────────────────────────────────────────────
// Niveles base · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const NIVELES_BASE = [
  { nivel: 1, nombre: 'Básico', icon: HandCoins },
  { nivel: 2, nombre: 'Bronce', icon: Coins },
  { nivel: 3, nombre: 'Plata', icon: Wallet },
  { nivel: 4, nombre: 'Oro', icon: Trophy },
  { nivel: 5, nombre: 'Platino', icon: Award },
  { nivel: 6, nombre: 'Más niveles', icon: Grid2X2, esMas: true },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-4"
      style={{
        color: accent ? T.accent : T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
    </p>
  );
}

function TextLink({ label, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="transition-colors duration-200"
      style={{
        color: hover ? T.accent : T.inkSoft,
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      {label} →
    </button>
  );
}

function NivelCard({ nivelItem, isActive, count, onClick }) {
  const [hover, setHover] = useState(false);
  const Icon = nivelItem.icon;
  const highlighted = isActive || hover;

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col items-center justify-center gap-3 py-6 px-3 transition-all duration-300"
      style={{
        background: 'transparent',
        border: `1px solid ${highlighted ? T.line : 'transparent'}`,
        borderRadius: '8px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      <div
        className="flex items-center justify-center transition-colors duration-300"
        style={{
          width: '44px',
          height: '44px',
          background: highlighted ? T.accent : 'rgba(15, 15, 15, 0.04)',
          borderRadius: '8px',
          transitionTimingFunction: T.ease,
        }}
      >
        <Icon
          size={20}
          strokeWidth={1.75}
          style={{
            color: highlighted ? '#FFFFFF' : T.inkMid,
            transition: `color 0.3s ${T.ease}`,
          }}
        />
      </div>
      <div className="text-center">
        <span
          className="text-[12px] block transition-colors duration-300"
          style={{
            color: highlighted ? T.ink : T.inkMid,
            fontWeight: 500,
            letterSpacing: '-0.005em',
            transitionTimingFunction: T.ease,
          }}
        >
          {nivelItem.esMas ? nivelItem.nombre : `Nivel ${nivelItem.nivel}`}
        </span>
        {!nivelItem.esMas && (
          <span
            className="text-[10px] uppercase tracking-[0.15em] mt-1 block transition-colors duration-300"
            style={{
              color: highlighted ? T.accent : T.inkFaint,
              fontWeight: 500,
              transitionTimingFunction: T.ease,
            }}
          >
            {nivelItem.nombre}
            {count > 0 && ` · ${count}`}
          </span>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TandaCard · card con progreso, bloqueo y CTA
// ─────────────────────────────────────────────────────────────────────────
function TandaCard({ tanda, user, onUnirse, onLogin }) {
  const [hover, setHover] = useState(false);

  const totalMembers = tanda.cupoMaximo || 20;
  const miembrosActuales = tanda.miembrosActuales || 0;
  const disponibles = totalMembers - miembrosActuales;
  const progreso = (miembrosActuales / totalMembers) * 100;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col transition-all duration-300"
      style={{
        background: T.bg,
        border: `1px solid ${hover ? 'rgba(15,15,15,0.14)' : T.line}`,
        borderRadius: '8px',
        overflow: 'hidden',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 1px 2px rgba(15,15,15,0.04), 0 8px 24px rgba(15,15,15,0.06)'
          : 'none',
        transitionTimingFunction: T.ease,
      }}
    >
      {/* Header */}
      <div
        className="p-5 flex flex-col gap-2"
        style={{ borderBottom: `1px solid ${T.line}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-[15.5px] leading-snug tracking-[-0.005em] flex-1 min-w-0"
            style={{ color: T.ink, fontWeight: 500 }}
          >
            {tanda.nombre}
          </h3>
          <span
            className="shrink-0 px-2 py-0.5"
            style={{
              background: 'rgba(79, 46, 232, 0.06)',
              color: T.accent,
              borderRadius: '3px',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600,
            }}
          >
            Nivel {tanda.nivelRequerido || 1}
          </span>
        </div>
        {tanda.descripcion && (
          <p
            className="text-[12.5px] leading-[1.55] line-clamp-2"
            style={{ color: T.inkSoft, fontWeight: 450 }}
          >
            {tanda.descripcion}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Monto */}
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.18em] mb-1.5"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            Monto total
          </p>
          <p
            className="text-[26px] tabular-nums tracking-[-0.02em] leading-none"
            style={{
              color: T.accent,
              fontWeight: 500,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {formatMoney(tanda.montoTotal || 0)}
          </p>
        </div>

        {/* Progreso */}
        <div>
          <div className="flex justify-between items-baseline text-[11px] mb-2">
            <span style={{ color: T.inkSoft, fontWeight: 450 }}>
              {miembrosActuales} de {totalMembers} participantes
            </span>
            <span
              className="tabular-nums"
              style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
            >
              {disponibles} lugares
            </span>
          </div>
          <div
            className="w-full overflow-hidden"
            style={{
              height: '5px',
              background: 'rgba(15,15,15,0.04)',
              borderRadius: '3px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progreso}%`,
                background: T.accent,
                borderRadius: '3px',
                transition: `width 0.6s ${T.ease}`,
              }}
            />
          </div>
        </div>

        {/* Aviso bloqueo */}
        {tanda.bloqueadaPorProgreso && (
          <div
            className="flex items-start gap-2 px-3 py-2.5"
            style={{
              background: 'rgba(184, 130, 14, 0.06)',
              borderLeft: '2px solid #B8820E',
              borderRadius: '4px',
            }}
          >
            <Lock
              size={12}
              strokeWidth={1.75}
              style={{ color: '#B8820E', flexShrink: 0, marginTop: 2 }}
            />
            <p
              className="text-[11.5px] leading-[1.55]"
              style={{ color: '#8A6109', fontWeight: 450 }}
            >
              {tanda.mensajeBloqueo || `Requiere nivel ${tanda.nivelRequerido}`}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          {tanda.bloqueadaPorProgreso ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 h-11 text-[13px] cursor-not-allowed"
              style={{
                background: 'rgba(15,15,15,0.04)',
                border: `1px solid ${T.line}`,
                borderRadius: '6px',
                color: T.inkFaint,
                fontWeight: 500,
              }}
            >
              <Lock size={14} strokeWidth={1.75} /> Nivel bloqueado
            </button>
          ) : (
            <button
              onClick={() => {
                if (!user) onLogin();
                else onUnirse();
              }}
              className="w-full flex items-center justify-center gap-2 h-11 text-white text-[13px]"
              style={{
                background: T.accent,
                borderRadius: '6px',
                fontWeight: 500,
                letterSpacing: '0.01em',
                WebkitTapHighlightColor: 'transparent',
                transitionTimingFunction: T.ease,
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
            >
              <Key size={14} strokeWidth={1.75} /> Unirse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Modal de código de invitación
// ─────────────────────────────────────────────────────────────────────────
function CodigoModal({ selectedTanda, codigo, setCodigo, error, loading, onClose, onSubmit }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,15,15,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden"
        style={{
          background: T.bg,
          borderRadius: '10px',
          border: `1px solid ${T.line}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-7 text-center">
          <div
            className="inline-flex items-center justify-center mb-5"
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(79, 46, 232, 0.06)',
              borderRadius: '12px',
            }}
          >
            <Key size={24} strokeWidth={1.5} style={{ color: T.accent }} />
          </div>

          <p
            className="text-[10px] uppercase tracking-[0.28em] mb-3"
            style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
          >
            Invitación
          </p>

          <h3
            className="text-[24px] md:text-[28px] leading-tight tracking-[-0.025em] mb-3"
            style={{ color: T.ink, fontWeight: 400 }}
          >
            Ingresa tu
            <span className="font-serif italic" style={{ color: T.inkMid }}>
              {' '}código.
            </span>
          </h3>

          <p
            className="text-[13px] leading-[1.55] mb-6 max-w-xs mx-auto"
            style={{ color: T.inkSoft, fontWeight: 450 }}
          >
            {selectedTanda
              ? `Para unirte a "${selectedTanda.nombre}"`
              : 'Te fue proporcionado por un vendedor o administrador'}
          </p>

          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="A1B2C3D4"
            maxLength={8}
            autoFocus
            className="w-full text-center uppercase transition-colors outline-none"
            style={{
              height: '56px',
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '6px',
              color: T.ink,
              fontSize: '20px',
              fontWeight: 500,
              letterSpacing: '0.25em',
              fontFamily: 'ui-monospace, monospace',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
          />

          {error && (
            <div
              className="mt-4 flex items-start gap-2.5 px-3 py-2.5 text-left"
              style={{
                background: 'rgba(197, 48, 48, 0.06)',
                borderLeft: `2px solid ${T.red}`,
                borderRadius: '4px',
              }}
            >
              <AlertCircle
                size={13}
                strokeWidth={1.75}
                style={{ color: T.red, flexShrink: 0, marginTop: 2 }}
              />
              <p
                className="text-[12px] leading-[1.55]"
                style={{ color: T.red, fontWeight: 450 }}
              >
                {error}
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button
              onClick={onClose}
              className="h-11 text-[13px] transition-colors"
              style={{
                background: 'transparent',
                border: `1px solid ${T.line}`,
                borderRadius: '6px',
                color: T.inkMid,
                fontWeight: 500,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="h-11 text-white text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: T.accent,
                borderRadius: '6px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = T.accentDeep;
              }}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Key size={14} strokeWidth={1.75} /> Unirme
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// formatMoney helper
// ─────────────────────────────────────────────────────────────────────────
const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount);
};

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function TandasPage() {
  const router = useRouter();
  const { nivel: nivelQuery, page = 1 } = router.query;

  const { user, loading: authLoading, openLogin } = useAuth();

  const [tandas, setTandas] = useState([]);
  const [totalTandas, setTotalTandas] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nivelCliente, setNivelCliente] = useState(0);
  const [nivelMaximoParticipado, setNivelMaximoParticipado] = useState(0);
  const [filtroNivel, setFiltroNivel] = useState(nivelQuery || 'todos');
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [unirseLoading, setUnirseLoading] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [selectedTanda, setSelectedTanda] = useState(null);
  const [nivelesDisponibles, setNivelesDisponibles] = useState([]);
  const [tandasPorNivel, setTandasPorNivel] = useState({});

  // Cargar niveles disponibles
  useEffect(() => {
    cargarNivelesDisponibles();
  }, []);

  // Init
  useEffect(() => {
    if (authLoading) return;

    const init = async () => {
      let nivel = 0;
      let maxParticipado = 0;

      if (user) {
        try {
          const clientRecord = await pb
            .collection('clients')
            .getFirstListItem(`userId = "${user.id}"`);
          nivel = clientRecord.nivel || 0;
          setNivelCliente(nivel);
        } catch (e) {
          setNivelCliente(0);
        }

        try {
          const result = await getNivelTandaPermitido(user.id);
          maxParticipado = result.nivelMaximoParticipado;
          setNivelMaximoParticipado(maxParticipado);
        } catch (e) {
          console.log('Error obteniendo progreso:', e);
        }
      } else {
        setNivelCliente(0);
        setNivelMaximoParticipado(0);
      }

      await cargarTandas(user, nivel, maxParticipado);
      setLoading(false);
    };

    init();
  }, [user, authLoading]);

  const cargarNivelesDisponibles = async () => {
    try {
      const niveles = await pb.collection('config_niveles').getFullList({
        sort: 'nivel',
        fields: 'nivel,nombre',
      });
      setNivelesDisponibles(niveles);
    } catch (e) {
      setNivelesDisponibles([
        { nivel: 1, nombre: 'Básico' },
        { nivel: 2, nombre: 'Bronce' },
        { nivel: 3, nombre: 'Plata' },
        { nivel: 4, nombre: 'Oro' },
      ]);
    }
  };

  const cargarTandas = useCallback(
    async (currentUser = null, nivel = null, maxParticipado = null) => {
      try {
        setLoading(true);
        setError(null);

        const userObj = currentUser || user;
        const nivelClienteActual = nivel !== null ? nivel : nivelCliente;
        const maxParticipadoActual =
          maxParticipado !== null ? maxParticipado : nivelMaximoParticipado;

        let filter = 'estado = "abierta" && activa = true';

        if (filtroNivel !== 'todos') {
          const nivelNum = parseInt(filtroNivel);
          if (!isNaN(nivelNum)) {
            filter += ` && nivelRequerido = ${nivelNum}`;
          }
        }

        const sort = 'nivelRequerido, nombre';

        const countResult = await pb.collection('tandas').getList(1, 1, {
          filter,
          fields: 'id',
        });
        setTotalTandas(countResult.totalItems);

        const records = await pb
          .collection('tandas')
          .getList(currentPage, ITEMS_PER_PAGE, {
            filter,
            sort,
          });

        const tandaIds = records.items.map((t) => t.id);
        let allMembers = [];
        if (tandaIds.length > 0) {
          const idFilter = tandaIds.map((id) => `tandaId = "${id}"`).join(' || ');
          allMembers = await pb.collection('tanda_members').getFullList({
            filter: idFilter,
            fields: 'id,tandaId,userId,posicion,gasFeePaid,estadoPago,codigoUsado',
          });
        }

        const membersByTanda = {};
        allMembers.forEach((m) => {
          if (!membersByTanda[m.tandaId]) membersByTanda[m.tandaId] = [];
          membersByTanda[m.tandaId].push(m);
        });

        const tandasConInfo = records.items.map((tanda) => {
          const miembros = membersByTanda[tanda.id] || [];
          const cupoMaximo = tanda.cupoMaximo || 20;
          const miembrosActuales = miembros.length;

          let bloqueadaPorProgreso = false;
          let mensajeBloqueo = '';

          if (userObj) {
            if (maxParticipadoActual === 0 && tanda.nivelRequerido > 1) {
              bloqueadaPorProgreso = true;
              mensajeBloqueo = 'Debes comenzar desde nivel básico';
            } else if (
              maxParticipadoActual > 0 &&
              tanda.nivelRequerido > maxParticipadoActual + 1
            ) {
              bloqueadaPorProgreso = true;
              mensajeBloqueo = `Completa nivel ${maxParticipadoActual} primero`;
            }
          }

          return {
            ...tanda,
            miembrosActuales,
            cupoDisponible: cupoMaximo - miembrosActuales,
            bloqueadaPorProgreso,
            mensajeBloqueo,
            miembros,
          };
        });

        setTandas(tandasConInfo);

        const counts = {};
        tandasConInfo.forEach((t) => {
          const nivel = t.nivelRequerido || 1;
          counts[nivel] = (counts[nivel] || 0) + 1;
        });
        setTandasPorNivel(counts);
      } catch (err) {
        console.error('Error cargando tandas:', err);
        setError('No pudimos cargar las tandas. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    },
    [
      filtroNivel,
      currentPage,
      user,
      nivelCliente,
      nivelMaximoParticipado,
    ]
  );

  useEffect(() => {
    if (!loading) cargarTandas();
  }, [filtroNivel, currentPage]);

  const actualizarURL = useCallback(
    (params) => {
      const query = {
        nivel: filtroNivel !== 'todos' ? filtroNivel : undefined,
        page: currentPage > 1 ? currentPage : undefined,
        ...params,
      };
      Object.keys(query).forEach((key) => {
        if (query[key] === undefined || query[key] === '') delete query[key];
      });
      router.push({ pathname: '/tandas', query }, undefined, { shallow: true });
    },
    [filtroNivel, currentPage, router]
  );

  useEffect(() => {
    if (filtroNivel !== 'todos') {
      localStorage.setItem('tandas_filtro_nivel', filtroNivel);
    } else {
      localStorage.removeItem('tandas_filtro_nivel');
    }
  }, [filtroNivel]);

  useEffect(() => {
    const saved = localStorage.getItem('tandas_filtro_nivel');
    if (saved && !nivelQuery) setFiltroNivel(saved);
  }, []);

  const handleFiltroNivelChange = (e) => {
    const value = e.target.value;
    setFiltroNivel(value);
    setCurrentPage(1);
    actualizarURL({ nivel: value !== 'todos' ? value : undefined, page: 1 });
  };

  const handleNivelClick = (nivel) => {
    const nuevo = nivel === filtroNivel ? 'todos' : nivel.toString();
    setFiltroNivel(nuevo);
    setCurrentPage(1);
    actualizarURL({ nivel: nuevo !== 'todos' ? nuevo : undefined, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    actualizarURL({ page: newPage });
  };

  const handleUnirseConCodigo = async () => {
    if (!user) {
      openLogin();
      return;
    }

    const code = codigoInvitacion.trim().toUpperCase();
    if (!code) {
      setErrorModal('Ingresa un código de invitación');
      return;
    }

    setUnirseLoading(true);
    setErrorModal('');

    try {
      const tanda = await pb
        .collection('tandas')
        .getFirstListItem(
          `codigoInvitacion = "${code}" && estado = "abierta"`
        );

      if (!tanda) throw new Error('Código de invitación inválido o tanda no disponible');

      if (tanda.nivelRequerido > nivelCliente) {
        throw new Error(
          `Necesitas nivel ${tanda.nivelRequerido} para unirte a esta tanda`
        );
      }

      const miembros = await pb.collection('tanda_members').getFullList({
        filter: `tandaId = "${tanda.id}"`,
      });

      if (miembros.length >= (tanda.cupoMaximo || 20)) {
        throw new Error('Esta tanda ya está completa');
      }

      const yaInscrito = await pb
        .collection('tanda_members')
        .getFirstListItem(`tandaId = "${tanda.id}" && userId = "${user.id}"`)
        .catch(() => null);

      if (yaInscrito) throw new Error('Ya estás inscrito en esta tanda');

      const nuevaPosicion = miembros.length + 1;
      await pb.collection('tanda_members').create({
        tandaId: tanda.id,
        userId: user.id,
        posicion: nuevaPosicion,
        estadoPago: 'al_corriente',
        gasFeePaid: false,
        codigoUsado: code,
      });

      await pb.collection('tandas').update(tanda.id, {
        miembrosActuales: nuevaPosicion,
      });

      setShowCodigoModal(false);
      setCodigoInvitacion('');
      setSelectedTanda(null);
      cargarTandas();
      alert(`Te has unido a la tanda "${tanda.nombre}" exitosamente`);
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setUnirseLoading(false);
    }
  };

  const closeCodigoModal = () => {
    setShowCodigoModal(false);
    setCodigoInvitacion('');
    setErrorModal('');
    setSelectedTanda(null);
  };

  const notifications = [
    { id: 1, title: '¡Nuevas tandas!', description: 'Descubre las tandas de tu nivel', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Loading ──────────────────────────────────────────
  if ((loading || authLoading) && currentPage === 1) {
    return (
      <>
        <Head><title>Cargando | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <TerminalBar mode="rotating" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span
                className="font-serif text-[32px] block mb-5 select-none"
                style={{ color: T.inkGhost }}
              >
                ʃƪʃƪ
              </span>
              <p
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                Cargando tandas
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Tandas Disponibles | MarketDesliz</title>
        <meta
          name="description"
          content="Únete a una tanda y recibe tu dinero en semanas. Sistema de tandas seguro y transparente."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Hero editorial ──────────────────────────── */}
          <section className="mb-12">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Tandas · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[64px] leading-[1] tracking-[-0.035em] max-w-3xl mb-6"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Ahorra
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}en grupo.
              </span>
            </h1>

            <p
              className="text-[16px] md:text-[20px] leading-[1.5] max-w-xl mb-8"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Únete a grupos de personas en tandas de tu nivel. Sin intereses, con total
              transparencia.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowCodigoModal(true)}
                className="inline-flex items-center gap-2 h-11 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                <Key size={14} strokeWidth={1.75} /> Tengo un código
              </button>
              {user && (
                <Link
                  href="/tandas/mis-tandas"
                  className="inline-flex items-center gap-2 h-11 px-5 text-[13px] transition-colors"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
                    fontWeight: 500,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Target size={14} strokeWidth={1.75} /> Mis tandas
                </Link>
              )}
            </div>
          </section>

          {/* ─── Info del usuario ────────────────────────── */}
          {user && (
            <section className="mb-12">
              <SectionLabel>Tu progreso</SectionLabel>

              <div
                className="grid grid-cols-1 sm:grid-cols-3"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <StatBlock
                  label="Nivel actual"
                  value={`Nivel ${nivelCliente}`}
                  border={false}
                />
                <StatBlock
                  label="Nivel máximo"
                  value={`Nivel ${nivelMaximoParticipado || 1}`}
                />
                <StatBlock
                  label="Siguiente nivel"
                  value={`Nivel ${nivelMaximoParticipado + 1}`}
                  accent
                />
              </div>
            </section>
          )}

          {/* ─── Niveles disponibles ─────────────────────── */}
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-5">
              <SectionLabel>Niveles disponibles</SectionLabel>
              {filtroNivel !== 'todos' && (
                <TextLink
                  label="Ver todos"
                  onClick={() => handleNivelClick(filtroNivel)}
                />
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {NIVELES_BASE.map((nivelItem) => {
                const isActive = filtroNivel === nivelItem.nivel.toString();
                const count = tandasPorNivel[nivelItem.nivel] || 0;
                const handleClick = nivelItem.esMas
                  ? () => router.push('/tandas')
                  : () => handleNivelClick(nivelItem.nivel);
                return (
                  <NivelCard
                    key={nivelItem.nivel}
                    nivelItem={nivelItem}
                    isActive={isActive}
                    count={count}
                    onClick={handleClick}
                  />
                );
              })}
            </div>
          </section>

          {/* ─── Filtros ─────────────────────────────────── */}
          <section className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: T.inkFaint, fontWeight: 500 }}
                >
                  <Filter size={11} strokeWidth={1.75} />
                  Filtrar
                </div>

                <select
                  value={filtroNivel}
                  onChange={handleFiltroNivelChange}
                  className="appearance-none outline-none"
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
                    fontSize: '12.5px',
                    fontWeight: 450,
                    cursor: 'pointer',
                  }}
                >
                  <option value="todos">Todos los niveles</option>
                  {nivelesDisponibles.map((n) => {
                    const count = tandasPorNivel[n.nivel] || 0;
                    return (
                      <option key={n.nivel} value={n.nivel}>
                        Nivel {n.nivel} - {n.nombre} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <span
                className="text-[11px] tabular-nums"
                style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
              >
                {loading
                  ? '…'
                  : `${totalTandas} ${totalTandas === 1 ? 'tanda' : 'tandas'} disponibles`}
              </span>
            </div>
          </section>

          {/* ─── Lista de tandas ─────────────────────────── */}
          {error ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <XCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                Error al cargar las tandas
              </h3>
              <p
                className="text-[13px] max-w-md mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <button
                onClick={() => cargarTandas()}
                className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                <RefreshCw size={14} strokeWidth={1.75} /> Reintentar
              </button>
            </div>
          ) : tandas.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <Target
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                No hay tandas disponibles
              </h3>
              <p
                className="text-[13px] max-w-md mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {filtroNivel !== 'todos'
                  ? `No hay tandas de nivel ${filtroNivel}.`
                  : 'Pronto abriremos nuevas tandas para ti.'}
              </p>
              {!user && (
                <button
                  onClick={openLogin}
                  className="h-10 px-5 text-white text-[13px]"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Registrarme ahora
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {tandas.map((tanda) => (
                  <TandaCard
                    key={tanda.id}
                    tanda={tanda}
                    user={user}
                    onUnirse={() => {
                      setSelectedTanda(tanda);
                      setShowCodigoModal(true);
                    }}
                    onLogin={openLogin}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalTandas > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 h-9 px-4 text-[12.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage > 1) {
                        e.currentTarget.style.borderColor = T.accent;
                        e.currentTarget.style.color = T.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = T.line;
                      e.currentTarget.style.color = T.inkMid;
                    }}
                  >
                    <ChevronLeft size={13} strokeWidth={1.75} /> Anterior
                  </button>

                  <span
                    className="px-3 text-[12px] tabular-nums"
                    style={{
                      color: T.inkFaint,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {currentPage} / {Math.ceil(totalTandas / ITEMS_PER_PAGE)}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalTandas / ITEMS_PER_PAGE)}
                    className="flex items-center gap-1.5 h-9 px-4 text-[12.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor:
                        currentPage >= Math.ceil(totalTandas / ITEMS_PER_PAGE)
                          ? 'not-allowed'
                          : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage < Math.ceil(totalTandas / ITEMS_PER_PAGE)) {
                        e.currentTarget.style.borderColor = T.accent;
                        e.currentTarget.style.color = T.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = T.line;
                      e.currentTarget.style.color = T.inkMid;
                    }}
                  >
                    Siguiente <ChevronRight size={13} strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── Beneficios ──────────────────────────────── */}
          <section className="mt-16">
            <SectionLabel>Beneficios</SectionLabel>

            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 md:p-8"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <BeneficioItem
                title="Sin intereses"
                desc="Recibe tu dinero sin pagar extra."
              />
              <BeneficioItem
                title="Pagos flexibles"
                desc="Elige la frecuencia de pago que prefieras."
              />
              <BeneficioItem
                title="100% seguro"
                desc="Sistema verificado y transparente."
              />
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* ─── Modal de código ─────────────────────────── */}
      {showCodigoModal && (
        <CodigoModal
          selectedTanda={selectedTanda}
          codigo={codigoInvitacion}
          setCodigo={setCodigoInvitacion}
          error={errorModal}
          loading={unirseLoading}
          onClose={closeCodigoModal}
          onSubmit={handleUnirseConCodigo}
        />
      )}

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

// ─────────────────────────────────────────────────────────────────────────
// StatBlock · bloque de nivel de progreso
// ─────────────────────────────────────────────────────────────────────────
function StatBlock({ label, value, accent = false, border = true }) {
  return (
    <div
      className="p-6"
      style={{
        borderLeft: border ? `1px solid ${T.line}` : 'none',
      }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.18em] mb-2"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        className="text-[18px] tracking-[-0.01em]"
        style={{
          color: accent ? T.accent : T.ink,
          fontWeight: 500,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BeneficioItem
// ─────────────────────────────────────────────────────────────────────────
function BeneficioItem({ title, desc }) {
  return (
    <div>
      <p className="text-[13.5px] mb-1.5" style={{ color: T.ink, fontWeight: 500 }}>
        {title}
      </p>
      <p className="text-[12.5px] leading-[1.55]" style={{ color: T.inkSoft, fontWeight: 450 }}>
        {desc}
      </p>
    </div>
  );
}