// pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  ShoppingBag,
  Store,
  Wrench,
  Apple as AppleIcon,
  Users,
  Bell as BellIcon,
  ChevronRight,
  CreditCard,
  X,
  User,
  ChevronDown,
} from "lucide-react";
import LoginDropdown from "../components/LoginDropdown";

// ─── Componente LogoMark ──────────────────────────────────────────────
const LogoMark = ({ size = 72, color = "#5B2BE0" }) => (
  <div className="flex items-center gap-3">
    <span className="font-logo font-bold text-4xl text-primary tracking-tight">
      ʃƪʃƪ
    </span>
    <div className="flex flex-col">
      <span className="font-bold text-xl text-textMain tracking-tight leading-none">
        Market<span className="text-primary">Desliz</span>
      </span>
      <span className="text-[10px] text-textMuted tracking-[0.2em] uppercase font-medium">
        Desliza • Descubre • Conecta
      </span>
    </div>
  </div>
);

// ─── Action Card ──────────────────────────────────────────────────────
function ActionCard({ icon, title, subtitle, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between bg-white rounded-[20px] px-[22px] py-5 shadow-card border border-white/90 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-[14px] bg-primaryLight flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[15px] font-bold text-textMain mb-0.5 tracking-tight">{title}</p>
          <p className="text-[13px] text-textMuted font-normal">{subtitle}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#F5F4FA] flex items-center justify-center shrink-0">
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

// ─── Feature Item ─────────────────────────────────────────────────────
function FeatureItem({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-[38px] h-[38px] bg-bgPage rounded-[10px] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-textMain mb-0.5 tracking-tight">{title}</p>
        <p className="text-[12px] text-textMuted font-normal">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false); // 👈 NUEVO NOMBRE

  // Navegación
  const goTo = (path) => router.push(path);

  const notifications = [
    { id: 1, title: '¡Nueva colección Éshé Parallel!', description: 'Descubre la línea Otoño 2026', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido a MarketDesliz!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
    { id: 3, title: 'Productos disponibles', description: 'Descubre lo que tenemos para ti', time: 'Hace 1 día', read: true },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Head>
        <title>MarketDesliz — Desliza • Descubre • Conecta</title>
        <meta name="description" content="MarketDesliz: compra a crédito con pagos semanales, tandas digitales y vendedores verificados." />
      </Head>

      <div className="min-h-screen bg-[#ECEAF5] font-sans">
        {/* HEADER (mantiene el diseño original) */}
        <header className="px-6 md:px-12 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <LogoMark size={56} color="#5B2BE0" />

            <nav className="hidden md:flex items-center gap-8">
              {[
                { label: "Cómo funciona", path: "/como-funciona" },
                { label: "Acerca de nosotros", path: "/acerca-de-nosotros" },
                { label: "Trabaja Con Nosotros", path: "/trabaja-con-nosotros" },
                { label: "Éshé Parallel", path: "/eshe-parallel" }
              ].map((link) => (
                <span
                  key={link.label}
                  onClick={() => goTo(link.path)}
                  className="text-[15px] font-medium text-textMuted cursor-pointer transition-colors duration-200 hover:text-primary"
                >
                  {link.label}
                </span>
              ))}
            </nav>

            <div className="flex items-center gap-6">
              {/* Notificaciones (sin cambios) */}
              <div className="relative">
                <div
                  className="relative cursor-pointer"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <BellIcon size={22} className="text-textMuted" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-bgPage" />
                  )}
                </div>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-bold text-gray-800">Notificaciones</h3>
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowNotifications(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                          No tienes notificaciones
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${
                              !notif.read ? 'bg-primary/5' : ''
                            }`}
                            onClick={() => {
                              setShowNotifications(false);
                              goTo('/notificaciones');
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${!notif.read ? 'bg-primary' : 'bg-gray-300'}`} />
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t">
                      <button
                        className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                        onClick={() => {
                          setShowNotifications(false);
                          goTo('/notificaciones');
                        }}
                      >
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cuenta (usando el dropdown global) */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 text-textMuted hover:text-primary transition-colors"
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                >
                  <User size={20} />
                  <span className="text-sm font-medium">Mi cuenta</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {showLoginDropdown && (
                  <LoginDropdown
                    onClose={() => setShowLoginDropdown(false)}
                    onSuccess={() => {
                      // Opcional: actualizar estado de autenticación si es necesario
                      // const user = pb.authStore.model;
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN THREE-COLUMN LAYOUT (sin cambios) */}
        <main className="max-w-7xl mx-auto px-6 md:px-12 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px] items-start">
            {/* LEFT: Greeting + Action Cards */}
            <div className="lg:col-span-5 pt-7">
              <div className="mb-9">
                <h1 className="text-4xl md:text-5xl font-extrabold text-textMain leading-[1.1] tracking-[-0.03em] mb-2">
                  Hola, Bienvenido.
                </h1>
                <p className="text-xl text-textSub font-normal">
                  ¿Qué quieres hacer hoy?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <ActionCard
                  icon={<ShoppingBag size={22} />}
                  title="Explorar productos"
                  subtitle="Descubre lo que tenemos para ti"
                  onClick={() => goTo('/productos')}
                />
                <ActionCard
                  icon={<Store size={22} />}
                  title="Explorar negocios"
                  subtitle="Locales verificados"
                  onClick={() => goTo('/negocios')}
                />
                <ActionCard
                  icon={<Wrench size={22} />}
                  title="Explorar servicios"
                  subtitle="Encuentra profesionales cerca de ti"
                  onClick={() => goTo('/servicios')}
                />
                <ActionCard
                  icon={<AppleIcon size={22} />}
                  title="Fruta de temporada"
                  subtitle="Productos frescos y locales"
                  onClick={() => goTo('/fruta')}
                />
                <ActionCard
                  icon={<Users size={22} />}
                  title="Tandas exclusivas"
                  subtitle="Según tu nivel"
                  onClick={() => goTo('/tandas')}
                />
              </div>
            </div>

            {/* CENTER: 3D Glass Card */}
            <div className="lg:col-span-4 flex items-center justify-center relative min-h-[420px]">
              {/* Burbujas flotantes */}
              {[
                { w: 16, h: 16, top: 80, left: 60 },
                { w: 10, h: 10, top: 160, left: 30 },
                { w: 20, h: 20, bottom: 120, right: 50 },
                { w: 11, h: 11, bottom: 180, right: 30 },
                { w: 8, h: 8, top: 240, left: 80 },
              ].map((b, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/60 border border-white/80 backdrop-blur-sm"
                  style={{
                    width: b.w,
                    height: b.h,
                    top: b.top,
                    left: b.left,
                    bottom: b.bottom,
                    right: b.right,
                    boxShadow: "0 2px 8px rgba(130,90,220,0.10)",
                  }}
                />
              ))}

              <div className="relative inline-flex flex-col items-center">
                {/* Glass Card */}
                <div
                  className="w-[300px] h-[320px] md:w-[360px] md:h-[380px] rounded-[44px] flex items-center justify-center relative z-10 transition-all duration-500 hover:scale-105 cursor-pointer mt-16 md:mt-20"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(235,228,255,0.60) 100%)",
                    boxShadow: "30px 30px 80px rgba(130,90,220,0.18), -15px -15px 40px rgba(255,255,255,0.85), inset 0 1px 1px rgba(255,255,255,0.9)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    border: "1.5px solid rgba(255,255,255,0.75)",
                  }}
                  onClick={() => goTo('/trabaja-con-nosotros')}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className="font-logo font-bold text-7xl md:text-8xl tracking-tight"
                      style={{
                        background: 'linear-gradient(135deg, #5B2BE0, #9B5AFF)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      ʃƪʃƪ
                    </span>
                  </div>
                </div>

                {/* Anillos inferiores */}
                <div
                  className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 mt-4"
                  style={{ width: 320 }}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width: 320, height: 30,
                      marginTop: -8,
                      border: "1.5px solid rgba(180,160,240,0.35)",
                    }}
                  />
                  <div
                    className="rounded-full"
                    style={{
                      width: 290, height: 22,
                      marginTop: -18, opacity: 0.7,
                      border: "1.5px solid rgba(180,160,240,0.35)",
                    }}
                  />
                  <div
                    style={{
                      width: 300, height: 22,
                      background: "radial-gradient(ellipse at center, rgba(185,160,255,0.38) 0%, rgba(180,155,255,0.10) 70%, transparent 100%)",
                      borderRadius: "50%",
                      filter: "blur(4px)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: Feature List */}
            <div className="lg:col-span-3 pt-12 flex flex-col gap-6">
              <FeatureItem
                icon={<ShoppingBag size={18} />}
                title="Compra fácil"
                subtitle="A crédito o de contado"
              />
              <FeatureItem
                icon={<Users size={18} />}
                title="Pagos semanales"
                subtitle="Desde $50 por semana"
              />
              <FeatureItem
                icon={<CreditCard size={18} />}
                title="Tarjeta virtual"
                subtitle="Identificador único"
              />
            </div>
          </div>
        </main>

        {/* SCROLL HINT */}
        <div
          className="flex flex-col items-center gap-2 pt-2 pb-6 cursor-pointer"
          onClick={() => goTo('/productos')}
        >
          <div className="w-6 h-10 rounded-full border-2 border-textMuted/30 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 rounded-full bg-primary/60 animate-scroll-dot" />
          </div>
          <p className="text-[12px] text-textMuted tracking-[0.2em] uppercase font-medium">
            Desliza para descubrir
          </p>
        </div>

        {/* Estilos de animación */}
        <style jsx global>{`
          @keyframes scroll-dot {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(16px); opacity: 0; }
          }
          .animate-scroll-dot {
            animation: scroll-dot 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  );
}