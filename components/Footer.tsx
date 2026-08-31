export default function Footer() {
  return (
    <footer>
      {/* Social icons row */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-end gap-3">
        {[
          { icon: 'fa-facebook-f', bg: 'bg-blue-600' },
          { icon: 'fa-x-twitter', bg: 'bg-gray-900' },
          { icon: 'fa-instagram', bg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' },
          { icon: 'fa-youtube', bg: 'bg-[#FF0000]' },
        ].map(({ icon, bg }) => (
          <a key={icon} href="#" className={`${bg} text-white rounded-full w-9 h-9 flex items-center justify-center text-sm`}>
            <i className={`fa-brands ${icon}`} />
          </a>
        ))}
      </div>

      {/* Main footer grid */}
      <div className="bg-white py-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-5 gap-8">

          {/* Brand col */}
          <div>
            <p className="text-sm text-gray-600 leading-relaxed text-justify mb-5">
              Ofrecemos una amplia variedad de productos para el hogar...
            </p>
            <h3 className="font-semibold text-gray-900 mb-3">Métodos de Pago</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <i className="fa-brands fa-paypal text-blue-600 text-2xl" />
              <span className="text-blue-700 font-bold italic text-lg border border-gray-200 px-2 rounded">VISA</span>
              <span className="bg-blue-700 text-white text-[9px] font-bold px-2 py-1 rounded">AMEX</span>
            </div>
          </div>

          {/* Footer link columns */}
          {[
            { title: 'NUESTRA EMPRESA', links: ['Términos Y Condiciones', 'Envío Y Devoluciones', 'Pago Seguro', 'Sobre Nosotros', 'Aviso De Privacidad', 'Contáctanos', 'Tiendas'] },
            { title: 'ATENCIÓN A CLIENTES', links: ['Facturación', 'Métodos De Pago', 'PROFECO', 'AMVO', 'CONDUSEF'] },
            { title: 'TU CUENTA', links: ['Información Personal', 'Pedidos', 'Créditos', 'Direcciones'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-5">{title}</h3>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l} className="text-sm text-[#5B2BE0] cursor-pointer hover:underline">{l}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Address */}
          <div>
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-5">INFORMACIÓN</h3>
            <address className="text-sm text-gray-600 not-italic leading-relaxed">
              Av. Revolución #149 Col. Centro<br/>Xalapa, Veracruz, México
            </address>
            <p className="text-sm text-gray-600 mt-3">(800) 2424833</p>
            <p className="text-sm text-gray-600">marketdesliz@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Trust badges + copyright */}
      <div className="bg-[#5B2BE0] py-5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-6 flex-wrap">
          {/* Sectigo badge */}
          <div className="bg-white rounded-md px-4 py-3 flex items-center gap-3">
            <div className="bg-teal-700 rounded-md p-2">
              <i className="fa-solid fa-shield-halved text-white text-lg" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 uppercase font-semibold block">SECURED BY</span>
              <span className="text-sm font-black text-gray-800">sectigo</span>
            </div>
          </div>
        </div>
        <p className="text-center text-white text-sm mt-4">© 2026 - MarketDesliz S.A de C.V</p>
      </div>
    </footer>
  )
}