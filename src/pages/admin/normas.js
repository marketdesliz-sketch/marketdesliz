// src/pages/admin/normas.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import Logo from '../../components/Logo';
import TerminalBar from '../../components/TerminalBar';
import Footer from '../../components/Footer';

// ─────────────────────────────────────────────────────────────────────────
// Mensajes propios de esta página
// ─────────────────────────────────────────────────────────────────────────
const NORMAS_MESSAGES = [
    'Reafirmando compromisos',
    'Recordando quién quieres ser',
    'Cumpliendo la palabra dada',
    'Midiendo el carácter cada día',
    'Revisando las reglas del oficio',
    'Volviendo al origen de todo',
    'Honrando lo prometido',
];

// ═════════════════════════════════════════════════════════════════════════
// EL CÓDIGO · edita, añade o quita normas según tu vida
// ═════════════════════════════════════════════════════════════════════════
const CODIGO = [
    {
        title: 'Disciplina',
        rules: [
            'No consumo alcohol durante horarios laborales, ni la noche previa a un día de trabajo.',
            'Me levanto a la misma hora todos los días, incluso cuando nadie me lo exige.',
            'El teléfono no entra a la mesa durante horas de trabajo profundo.',
            'Empiezo por lo difícil. Lo demás viene solo.',
            'Si digo que lo hago, lo hago. Sin excusas, sin retrasos.',
        ],
    },
    {
        title: 'Integridad',
        rules: [
            'Pago a mis proveedores, colaboradores y equipo a tiempo. Siempre.',
            'No prometo lo que no puedo cumplir. Prefiero decepcionar con la verdad que ilusionar con una mentira.',
            'Trato con el mismo respeto al cliente más pequeño que al más grande.',
            'No hablo mal de nadie que no esté presente. Si tengo algo que decir, lo digo de frente.',
            'Mis números son mis números. No los maquillo, ni para mí mismo.',
        ],
    },
    {
        title: 'Liderazgo',
        rules: [
            'Doy el ejemplo antes de exigir. El equipo me ve trabajar, no solo me escucha hablar.',
            'Reconozco mis errores en público. Aprendo de ellos en privado.',
            'Cuido a mi equipo como cuidaría a mi familia. Ellos sostienen lo que yo construyo.',
            'No le pido a nadie lo que no estoy dispuesto a hacer yo primero.',
            'Prefiero perder un cliente que perder mi palabra.',
        ],
    },
    {
        title: 'Crecimiento',
        rules: [
            'Leo todos los días. Mínimo treinta minutos, sin excepción.',
            'Aprendo algo nuevo cada semana. Nunca dejo de ser estudiante.',
            'Invierto en mí antes de invertir en lujos. Primero la mente, después los objetos.',
            'Me rodeo de personas más inteligentes que yo. La soledad del fundador es una trampa.',
            'Escribo lo que pienso. Pensar sin escribir es pensar a medias.',
        ],
    },
    {
        title: 'Salud',
        rules: [
            'Duermo mínimo siete horas. El cansancio toma malas decisiones por mí.',
            'Hago ejercicio al menos tres veces por semana. Mi cuerpo es el motor del negocio.',
            'Como con intención, no por ansiedad. El hambre emocional no se resuelve con comida.',
            'Camino. Pienso caminando. Las mejores ideas vienen sin pantalla.',
            'Voy al doctor cuando toca, no cuando duele.',
        ],
    },
    {
        title: 'Dinero',
        rules: [
            'Separo mis finanzas personales de las del negocio. Son dos libros distintos.',
            'Ahorro un porcentaje fijo cada mes, antes de gastar nada.',
            'No gasto lo que no tengo. El crédito es una herramienta, no una muleta.',
            'Reinvierto las ganancias antes de darme un aumento.',
            'Le pago primero al equipo, después a los proveedores, después a mí.',
        ],
    },
    {
        title: 'Familia',
        rules: [
            'Mi familia es mi porqué, no mi excusa.',
            'Cuando estoy con ellos, estoy con ellos. El teléfono se queda en otra habitación.',
            'No les cuento mis problemas del trabajo como si fueran suyos. Los cargo yo.',
            'Les dedico tiempo de calidad, no solo tiempo de presencia.',
            'Mi negocio existe para servirles a ellos, no al revés.',
        ],
    },
    {
        title: 'Responsabilidad',
        rules: [
            'Mi palabra es mi contrato. Lo que digo que haré, lo haré.',
            'Si me comprometo, cumplo. Si no puedo, aviso antes, no después.',
            'Asumo las consecuencias de mis decisiones, buenas o malas.',
            'Cuando algo sale mal, la pregunta no es "quién fue" sino "qué aprendo".',
            'El fracaso no me define. La forma en que me levanto, sí.',
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────
// RuleGroup
// ─────────────────────────────────────────────────────────────────────────
function RuleGroup({ group }) {
    return (
        <section>
            <h2
                className="text-[12px] uppercase tracking-[0.22em] mb-6"
                style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
            >
                {group.title}
            </h2>

            <ul className="space-y-4">
                {group.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-4">
                        <span
                            className="shrink-0 select-none"
                            style={{ color: T.inkFaint, fontSize: '14.5px', lineHeight: '1.6', paddingTop: '1px' }}
                        >
                            —
                        </span>
                        <p
                            className="text-[15px] leading-[1.65] tracking-[-0.005em]"
                            style={{ color: T.inkMid, fontWeight: 450 }}
                        >
                            {rule}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────
export default function NormasPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [adminUser, setAdminUser] = useState(null);
    const [today, setToday] = useState('');

    useEffect(() => {
        const d = new Date();
        const formatted = d
            .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            .replace(/^\w/, (c) => c.toUpperCase());
        setToday(formatted);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (!pb.authStore.isValid) { router.replace('/admin/login?redirect=/admin/normas'); return; }
                const user = pb.authStore.model;
                if (user?.role !== 'admin') { pb.authStore.clear(); router.replace('/admin/login'); return; }
                setAdminUser(user);
            } catch (err) {
                console.error('Error:', err);
                router.replace('/admin/login');
            } finally { setLoading(false); }
        };
        checkAuth();
    }, [router]);

    const adminName = adminUser?.nombre || adminUser?.email?.split('@')[0] || 'Administrador';

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
                <title>Mi código · Normas | MarketDesliz Admin</title>
                <meta name="description" content="Código personal del administrador · Compromisos y normas de conducta" />
                <meta name="robots" content="noindex, nofollow" />
                <meta name="theme-color" content="#0F0F0F" />
            </Head>

            <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
                {/* ═══ BARRA TERMINAL · con mensajes propios ═══ */}
                <TerminalBar mode="rotating" messages={NORMAS_MESSAGES} />

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

                        <nav className="flex items-center gap-7">
                            <Link
                                href="/admin/dashboard"
                                className="text-[12.5px] tracking-[-0.005em] transition-colors"
                                style={{ color: T.inkSoft, fontWeight: 450, WebkitTapHighlightColor: 'transparent' }}
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={() => { pb.authStore.clear(); router.push('/admin/login'); }}
                                className="text-[12.5px] tracking-[-0.005em] transition-colors"
                                style={{ color: 'rgba(197, 48, 48, 0.75)', fontWeight: 450, WebkitTapHighlightColor: 'transparent' }}
                            >
                                Salir
                            </button>
                        </nav>
                    </div>
                </header>

                {/* ═══ MAIN ═══ */}
                <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-16 md:py-24">
                    
                    {/* Imagen editorial · OPCIONAL */}
                    <section className="w-full mb-16 md:mb-20">
                        <div
                            className="relative w-full overflow-hidden"
                            style={{
                                background: T.bg,
                                aspectRatio: '1280 / 420',
                                maxHeight: '460px',
                            }}
                        >
                            <img
                                src="/images/normas-hero.jpg"
                                alt="Mi código"
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{
                                    filter: 'grayscale(100%) contrast(1.15) brightness(1.02)',
                                    mixBlendMode: 'multiply',
                                }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                    </section>

                    {/* Hero */}
                    <section className="mb-16 md:mb-24 max-w-3xl">
                        <p
                            className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
                            style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                        >
                            Documento personal · {today}
                        </p>

                        <h1
                            className="text-[40px] md:text-[64px] leading-[0.98] tracking-[-0.035em]"
                            style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                        >
                            Mi código.
                        </h1>

                        <p
                            className="font-serif italic text-[20px] md:text-[26px] leading-[1.35] tracking-[-0.015em] mt-5 md:mt-6"
                            style={{ color: T.inkMid, fontWeight: 400 }}
                        >
                            La persona que quiero ser no se improvisa. Se elige cada mañana.
                        </p>
                    </section>

                    {/* Juramento */}
                    <section className="mb-16 md:mb-24 max-w-3xl">
                        <div className="pl-6 md:pl-8" style={{ borderLeft: `2px solid ${T.accent}` }}>
                            <p
                                className="text-[16px] md:text-[19px] leading-[1.65] tracking-[-0.005em]"
                                style={{ color: T.ink, fontWeight: 450 }}
                            >
                                Yo, <strong style={{ fontWeight: 500 }}>{adminName}</strong>,
                                me comprometo conmigo mismo a cumplir las siguientes normas.
                                No son reglas impuestas por nadie — son decisiones que tomo
                                cada día para ser la persona que mi negocio, mi equipo y mi
                                familia necesitan que sea.
                            </p>

                            <p
                                className="text-[14px] md:text-[16px] leading-[1.7] mt-5"
                                style={{ color: T.inkSoft, fontWeight: 450 }}
                            >
                                Si algún día las incumplo, no me castigaré. Volveré a leerlas,
                                entenderé por qué las rompí, y empezaré de nuevo. La disciplina
                                no es perfección. Es regreso constante.
                            </p>
                        </div>
                    </section>

                    {/* El código · 2 columnas asimétricas */}
                    <section className="mb-16 md:mb-24">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 md:gap-x-20 gap-y-12 md:gap-y-20">
                            <div className="flex flex-col gap-12 md:gap-20">
                                <RuleGroup group={CODIGO[0]} />
                                <RuleGroup group={CODIGO[1]} />
                                <RuleGroup group={CODIGO[2]} />
                                <RuleGroup group={CODIGO[3]} />
                            </div>

                            <div className="flex flex-col gap-12 md:gap-20 md:pt-24">
                                <RuleGroup group={CODIGO[4]} />
                                <RuleGroup group={CODIGO[5]} />
                                <RuleGroup group={CODIGO[6]} />
                                <RuleGroup group={CODIGO[7]} />
                            </div>
                        </div>
                    </section>

                    {/* Juramento final */}
                    <section className="mb-16 md:mb-24 max-w-3xl">
                        <h2
                            className="text-[12px] uppercase tracking-[0.22em] mb-6"
                            style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                        >
                            Juramento
                        </h2>

                        <p
                            className="text-[16px] md:text-[19px] leading-[1.7] tracking-[-0.005em]"
                            style={{ color: T.inkMid, fontWeight: 450 }}
                        >
                            Prometo no ser perfecto. Prometo ser consistente. Prometo
                            recordar que el negocio que construyo no es más importante que
                            las personas para las que lo construyo. Prometo levantarme cada
                            vez que caiga, sin dramatizar la caída. Prometo que el día en
                            que deje de cumplir este código, dejaré también de llamarme
                            fundador.
                        </p>
                    </section>

                    {/* Firma */}
                    <section className="max-w-3xl">
                        <div className="pt-10" style={{ borderTop: `1px solid ${T.line}` }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <p
                                        className="text-[10px] uppercase tracking-[0.22em] mb-3"
                                        style={{ color: T.inkFaint, fontWeight: 500 }}
                                    >
                                        Firmado
                                    </p>
                                    <p
                                        className="font-serif italic text-[24px] leading-none"
                                        style={{ color: T.ink }}
                                    >
                                        {adminName}
                                    </p>
                                </div>

                                <div>
                                    <p
                                        className="text-[10px] uppercase tracking-[0.22em] mb-3"
                                        style={{ color: T.inkFaint, fontWeight: 500 }}
                                    >
                                        En
                                    </p>
                                    <p
                                        className="text-[14px] leading-relaxed tracking-[-0.005em]"
                                        style={{ color: T.inkMid, fontWeight: 450 }}
                                    >
                                        Ciudad de México, México
                                        <br />
                                        <span style={{ color: T.inkSoft }}>{today}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Nota final */}
                    <section className="mt-16 max-w-3xl">
                        <p
                            className="text-[13px] leading-[1.7] tracking-[-0.005em]"
                            style={{ color: T.inkSoft, fontWeight: 450 }}
                        >
                            Este documento es personal. No se comparte con el equipo ni con
                            clientes. Existe únicamente para recordarme, cada vez que lo
                            abra, quién decidí ser.
                        </p>
                    </section>
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