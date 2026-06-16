// components/layout/Layout.jsx

import Header from "./Header"
import Sidebar from "./Sidebar"

export default function Layout({ children }) {

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh"
      }}
    >

      <Header />

      <div
        style={{
          display: "flex",
          flex: 1
        }}
      >

        <Sidebar />

        <main
          style={{
            flex: 1,
            padding: "20px",
            background: "#f3f4f6",
            overflowY: "auto"
          }}
        >

          {children}

        </main>

      </div>

    </div>

  )

}
