// src/pages/eshe-parallel.js
import Head from 'next/head';
import Link from 'next/link';
import {
  Eye, ChevronRight, ChevronLeft, Lock, Archive, Bookmark, LayoutGrid, Sun,
} from 'lucide-react';

// ─── Dorado editorial (mismo que el diseño original) ─────
const GOLD = '#c9a961';

// ─── SidebarSection ──────────────────────────────────────
function SidebarSection({ title, children, showArrow = true }) {
  return (
    <div className="border-b border-white/10 py-6 space-y-4">
      <div className="flex items-center justify-between group cursor-pointer px-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50">
          {title}
        </h3>
        {showArrow && (
          <ChevronRight
            className="w-3 h-3 text-white/40 group-hover:text-[#c9a961] transition-colors"
          />
        )}
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

export default function EsheParallelPage() {
  // ─── Data ──────────────────────────────────────────────
  const collectionItems = [
    { id: 'EP-0017', name: 'The Parallel Dress', price: '$8,900 MXN', stock: '17/40 disponibles', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_6c4ef76a9e_4dd348084d5c1fac.png' },
    { id: 'EP-0021', name: 'Parallel Blazer', price: '$9,900 MXN', stock: '12/30 disponibles', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_cdda51c72f_fc464b1a1d804cd2.png' },
    { id: 'EP-0032', name: 'Structured Corset', price: '$6,900 MXN', stock: '8/25 disponibles', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_e761a89054_aa9c6c2ef6f89792.png' },
    { id: 'EP-0040', name: 'Bias Silk Skirt', price: '$5,900 MXN', stock: '11/30 disponibles', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_a50f8831d1_00b9ec3b5eb908a0.png' },
    { id: 'EP-0055', name: 'Leather Trench', price: '$14,900 MXN', stock: '6/20 disponibles', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_c5092f5fd0_d33f4555f6ca9d9a.png' },
    { id: 'EP-0063', name: 'Satin Top', price: '$4,900 MXN', stock: '14/35 disponibles', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_9843fbc6f4_4ee382b6a1456f5a.png' },
    { id: 'EP-0071', name: 'Knot Detail Dress', price: '$7,900 MXN', stock: '9/28 disponibles', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_838dbfabb0_768b6e35f5e2a55b.png' },
    { id: 'EP-0086', name: 'Mini Skirt', price: '$4,500 MXN', stock: '16/40 disponibles', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_dbdaa929b9_fd71d55792602733.png' },
  ];

  const detailCards = [
    { title: 'Monograma exterior', desc: 'Discreto y elegante', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_3d82d9343c_3e9e1ac588527d07.png' },
    { title: 'Wordmark interior', desc: 'Solo para ti', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_d5680d78e1_0925873ebcfe9e20.png' },
    { title: 'Número de edición', desc: 'Único e irrepetible', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_a4391eec21_55ccc9ceffdec9ce.png' },
    { title: 'Herrajes ÉP', desc: 'Diseñados para durar', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_bded58c5f2_e37eb1b161b0653b.png' },
    { title: 'Detalle Parallel', desc: 'Sutil y exclusivo', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_864f365b93_d85ac5dbe3d8168b.png' },
  ];

  const selectionItems = [
    { id: 'EP-0040', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_a50f8831d1_00b9ec3b5eb908a0.png' },
    { id: 'EP-0021', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_cdda51c72f_fc464b1a1d804cd2.png' },
    { id: 'EP-0055', img_url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_c5092f5fd0_d33f4555f6ca9d9a.png' },
  ];

  const editTabs = [
    'Vestidos', 'Sastrería', 'Tops & Bodies',
    'Faldas & Pantalones', 'Outerwear', 'Ediciones limitadas',
  ];

  return (
    <>
      <Head>
        <title>Éshè Parallel — MarketDesliz</title>
        <meta name="description" content="Éshè Parallel. Una pieza. Pocas veces." />
        <meta name="theme-color" content="#0a0a0a" />
      </Head>

      <div className="flex h-screen overflow-hidden bg-white">
        {/* ═══ MAIN ═══════════════════════════════════════ */}
        <main className="flex-1 min-h-0 overflow-y-auto border-r border-gray-200">
          {/* Hero */}
          <div className="relative h-[800px] flex items-center px-12 border-b border-gray-200">
            <Link
              href="/"
              className="absolute top-8 left-8 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              aria-label="Volver al inicio"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </Link>

            <div className="absolute inset-0 z-0">
              <img
                className="w-full h-full object-cover opacity-60"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_4775d5bbe9_8498d31e5d11f368.png"
                alt="haute couture model in black dress"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent" />
            </div>

            <div className="relative z-10 space-y-8 max-w-2xl">
              <div className="space-y-4">
                <span className="text-4xl font-light tracking-[0.1em]">ÉP</span>
                <h1 className="text-8xl font-black uppercase leading-tight tracking-tighter italic text-black">
                  ÉSHÉ <br /> PARALLEL
                </h1>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-black/50">
                    COLLECTION 001
                  </span>
                  <div className="h-[1px] w-24 bg-black/20" />
                </div>
              </div>

              <p className="text-2xl italic opacity-80 text-black">
                Una pieza. Pocas veces.
              </p>

              <div className="flex gap-4">
                <button
                  className="bg-[#c9a961] text-black border border-[#c9a961] px-8 py-6 rounded-none text-xs font-bold tracking-widest hover:bg-[#b8985a] transition-all uppercase"
                >
                  Descubrir colección
                </button>
                <button
                  className="border border-black/20 text-black px-8 py-6 rounded-none text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-all uppercase"
                >
                  Sobre la colección
                </button>
              </div>
            </div>
          </div>

          {/* The Edit Navigation */}
          <div className="bg-[#fdfbf7] text-black border-b border-gray-200 sticky top-0 z-50">
            <div className="flex justify-between items-center px-12 py-6">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold">THE EDIT</span>
              <div className="flex gap-12">
                {editTabs.map((cat, i) => (
                  <button
                    key={cat}
                    className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-colors hover:text-[#c9a961] ${
                      i === 0 ? 'underline underline-offset-8 decoration-2' : ''
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Collection Grid */}
          <section className="p-12 space-y-12 bg-white text-black">
            <div className="space-y-2">
              <h2 className="text-xl uppercase tracking-[0.3em] font-bold">COLLECTION 001</h2>
              <p className="text-sm text-gray-500">Piezas seleccionadas. Ediciones controladas.</p>
            </div>

            <div className="grid grid-cols-4 gap-8">
              {collectionItems.map((item) => (
                <div key={item.id} className="group cursor-pointer space-y-4">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <img
                      src={item.img_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">{item.id}</span>
                        <h3 className="text-sm font-bold tracking-wide">{item.name}</h3>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-black">{item.price}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{item.stock}</p>
                      </div>
                      <button className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 hover:text-[#c9a961] transition-colors">
                        DESCUBRIR <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center py-12">
              <button className="text-[10px] uppercase tracking-[0.4em] font-bold border-b border-black pb-2 flex items-center gap-2">
                VER MÁS PIEZAS <ChevronRight className="w-3 h-3 rotate-90" />
              </button>
            </div>
          </section>

          {/* Details Section */}
          <section className="bg-black text-white p-12 space-y-12">
            <div className="text-center space-y-4">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#c9a961]">
                THE PARALLEL DETAIL
              </span>
              <p className="text-sm text-white/60 italic">Lo reconoces cuando sabes dónde mirar.</p>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {detailCards.map((card) => (
                <div key={card.title} className="space-y-4 text-center">
                  <div className="border border-white/15 p-8 aspect-square flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer">
                    <img src={card.img_url} className="max-w-[80%] opacity-80" alt={card.title} />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold">{card.title}</h4>
                    <p className="text-[10px] text-white/60 italic">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Authenticity Section */}
          <section className="bg-[#fdfbf7] p-12 border-t border-gray-200">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-black">AUTHENTICITY</span>
            </div>
            <div className="grid grid-cols-3 gap-12">
              {[
                { title: 'Número de edición', desc: 'Identifica tu pieza dentro de la colección.' },
                { title: 'Certificado de autenticidad', desc: 'Garantía de originalidad de Èshè Parallel.' },
                { title: 'Empaque exclusivo', desc: 'Cada detalle pensado para tu experiencia.' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-6">
                  <div className="w-12 h-12 border border-black/20 flex items-center justify-center rounded-sm">
                    <Archive className="w-5 h-5 opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">{item.title}</h4>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="relative h-[400px] flex items-center justify-center border-t border-gray-200">
            <img
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_ff2a02844c_2377fe2b7c6cd12a.png"
              alt="luxury fashion editorial"
            />
            <div className="relative text-center space-y-6">
              <h2 className="text-5xl font-black uppercase tracking-tighter italic text-black">
                ÈSHÈ PARALLEL
              </h2>
              <p className="text-lg italic text-black/70">Una pieza. Pocas veces.</p>
            </div>
          </footer>
        </main>

        {/* ═══ SIDEBAR DERECHA ═══════════════════════════ */}
        <aside className="w-[380px] bg-[#0a0a0a] border-l border-white/10 flex-shrink-0 flex flex-col overflow-y-auto">
          {/* Tu nivel */}
          <SidebarSection title="Tu nivel" showArrow={false}>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/15">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#c9a961]/20 flex items-center justify-center">
                  <Archive className="w-6 h-6 text-[#c9a961]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#c9a961]">Oro</h4>
                  <p className="text-[10px] text-white/60 italic">10 productos pagados</p>
                </div>
              </div>
              <Eye className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-[10px] text-white/50 italic px-4 leading-relaxed">
              Las compras de ganado también suman a tu historial.
            </p>
            <button className="w-full text-left px-4 flex items-center justify-between group">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/90 group-hover:text-[#c9a961] transition-colors">
                Ver mi nivel
              </span>
              <ChevronRight className="w-3 h-3 text-white/40 group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
            </button>
          </SidebarSection>

          {/* Explorar colección */}
          <SidebarSection title="Explorar colección">
            <div className="space-y-3">
              <Link
                href="/temporada"
                className="flex items-center justify-between p-4 bg-white/5 border border-white/15 hover:bg-white/10 hover:border-[#c9a961]/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-white/20 flex items-center justify-center group-hover:border-[#c9a961]/60 transition-colors">
                    <Sun className="w-4 h-4 text-[#c9a961]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/90 group-hover:text-[#c9a961] transition-colors">
                      Temporada
                    </h4>
                    <p className="text-[10px] text-white/50 italic">Nuevas piezas cada estación</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/catalogos"
                className="flex items-center justify-between p-4 bg-white/5 border border-white/15 hover:bg-white/10 hover:border-[#c9a961]/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-white/20 flex items-center justify-center group-hover:border-[#c9a961]/60 transition-colors">
                    <LayoutGrid className="w-4 h-4 text-[#c9a961]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/90 group-hover:text-[#c9a961] transition-colors">
                      Catálogos
                    </h4>
                    <p className="text-[10px] text-white/50 italic">Todas las categorías</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </SidebarSection>

          {/* Compra de contado */}
          <SidebarSection title="Compra de contado">
            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/15">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-white/60" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-white/60 italic leading-relaxed">
                  El precio se cubre de contado al vendedor.
                </p>
              </div>
            </div>
          </SidebarSection>

          {/* Tu selección */}
          <SidebarSection title="Tu selección">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#c9a961] fill-[#c9a961]" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">
                  3 piezas guardadas
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {selectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-[3/4] bg-white/5 overflow-hidden border border-white/10 hover:border-[#c9a961]/40 transition-colors cursor-pointer"
                  >
                    <img
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-300"
                      src={item.img_url}
                      alt={item.id}
                    />
                  </div>
                ))}
              </div>

              <button className="w-full flex items-center justify-between group pt-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/90 group-hover:text-[#c9a961] transition-colors">
                  Ver selección
                </span>
                <ChevronRight className="w-3 h-3 text-white/40 group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </SidebarSection>

          {/* Tu Èshè */}
          <SidebarSection title="Tu Èshè">
            <div className="p-4 bg-white/5 border border-white/15 flex gap-4">
              <div className="w-20 aspect-[3/4] bg-white/10 overflow-hidden border border-white/10 shrink-0">
                <img
                  className="w-full h-full object-cover"
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_3247d244bd_28a7b4018eb76483.png"
                  alt="minimalist black silk skirt"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[8px] uppercase tracking-wider text-white/50">EP-0040</span>
                <h4 className="text-[10px] font-bold uppercase text-white/90 truncate">
                  Bias Silk Skirt
                </h4>
                <p className="text-[10px] text-[#c9a961] italic">Edition 011 / 30</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-between group px-4 mt-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/90 group-hover:text-[#c9a961] transition-colors">
                Ver mi pieza
              </span>
              <ChevronRight className="w-3 h-3 text-white/40 group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
            </button>
          </SidebarSection>

          {/* Collection Status */}
          <SidebarSection title="Collection Status" showArrow={false}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '8', label: 'Diseños' },
                { value: '214', label: 'Piezas' },
                { value: '2', label: 'Archived' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <span className="text-2xl font-bold text-white/90">{stat.value}</span>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
            <button className="w-full flex items-center justify-between group pt-6">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/90 group-hover:text-[#c9a961] transition-colors">
                Ver archivo
              </span>
              <ChevronRight className="w-3 h-3 text-white/40 group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
            </button>
          </SidebarSection>

          {/* CTA final */}
          <div className="mt-auto p-6">
            <div className="bg-[#e7d9bf] text-black p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-widest leading-tight">
                  Descubre el universo <br /> Èshè Parallel
                </h3>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] italic">Ediciones limitadas.</p>
                <p className="text-[10px] italic">Piezas atemporales.</p>
                <p className="text-[10px] italic">Hechas para pocas manos.</p>
              </div>
              <button className="w-full py-4 border border-black/20 flex items-center justify-center gap-2 group transition-all hover:bg-black hover:text-white">
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  Sobre Èshè Parallel
                </span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}