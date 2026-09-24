// src/components/Footer.jsx
import Link from 'next/link';
import Logo from './Logo';

const T = {
  ink: '#0F0F0F',
  inkMid: 'rgba(15, 15, 15, 0.58)',
  inkSoft: 'rgba(15, 15, 15, 0.38)',
  inkFaint: 'rgba(15, 15, 15, 0.22)',
  inkGhost: 'rgba(15, 15, 15, 0.10)',
  line: 'rgba(15, 15, 15, 0.08)',
};

const LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'Catálogos', href: '/catalogos' },
  { label: 'Cómo funciona', href: '/como-funciona' },
];

const SOPORTE = [
  { label: 'Centro de ayuda', href: '/ayuda' },
  { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
  { label: 'Términos y condiciones', href: '/terminos-condiciones' },
  { label: 'Política de privacidad', href: '/privacidad' },
];

const CONTACTO = {
  telefono: { label: '28 2141 4939', href: 'tel:2821414939' },
  email: { label: 'marketdesliz@gmail.com', href: 'mailto:marketdesliz@gmail.com' },
  ubicacion: 'Ciudad de México',
};

export default function Footer({ variant = 'public' }) {
  const year = new Date().getFullYear();

  // ─── Variante minimal · admin y subpáginas ──────────────────
  if (variant === 'minimal') {
    return (
      <footer
        style={{
          borderTop: `1px solid ${T.line}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-14 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <span className="text-[11px]" style={{ color: T.inkFaint }}>
            © {year} MarketDesliz
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.28em]"
            style={{ color: T.inkGhost, fontWeight: 500 }}
          >
            Desliza · Descubre · Conecta
          </span>
        </div>
      </footer>
    );
  }

  // ─── Variante public · home y páginas públicas ─────────────
  return (
    <footer
      style={{
        borderTop: `1px solid ${T.line}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-14 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          <div className="md:col-span-1">
            <Logo />
            <p
              className="text-[12.5px] leading-relaxed mt-5 max-w-xs"
              style={{ color: T.inkSoft }}
            >
              Desliza, descubre y conecta con los mejores productos para tu hogar.
            </p>
          </div>

          <div>
            <h4
              className="text-[10px] uppercase tracking-[0.22em] mb-4"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              Enlaces
            </h4>
            <ul className="space-y-3">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12.5px] transition-colors hover:text-[#0F0F0F]"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-[10px] uppercase tracking-[0.22em] mb-4"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              Soporte
            </h4>
            <ul className="space-y-3">
              {SOPORTE.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12.5px] transition-colors hover:text-[#0F0F0F]"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-[10px] uppercase tracking-[0.22em] mb-4"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              Contacto
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={CONTACTO.telefono.href}
                  className="text-[12.5px] transition-colors hover:text-[#0F0F0F]"
                  style={{ color: T.inkMid, fontWeight: 450 }}
                >
                  {CONTACTO.telefono.label}
                </a>
              </li>
              <li>
                <a
                  href={CONTACTO.email.href}
                  className="text-[12.5px] transition-colors hover:text-[#0F0F0F]"
                  style={{ color: T.inkMid, fontWeight: 450 }}
                >
                  {CONTACTO.email.label}
                </a>
              </li>
              <li className="text-[12.5px]" style={{ color: T.inkMid, fontWeight: 450 }}>
                {CONTACTO.ubicacion}
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${T.line}` }}
        >
          <span className="text-[11px]" style={{ color: T.inkFaint }}>
            © {year} MarketDesliz
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.28em]"
            style={{ color: T.inkGhost, fontWeight: 500 }}
          >
            Desliza · Descubre · Conecta
          </span>
        </div>
      </div>
    </footer>
  );
}