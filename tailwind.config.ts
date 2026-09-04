/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // === COLORES EXISTENTES (los mantienes) ===
        primaryHex: "#5B2BE0",
        primaryLight: "#F3EEFF",
        primaryDark: "#4A1FB8",
        bgPage: "#ECEAF5",
        textMain: "#111028",
        textMuted: "#9895B4",
        textSub: "#7B7A99",
        cardBg: "#FFFFFF",
        
        // === COLORES DE SHADCN (agregados) ===
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        
        // === BRAND (lo mantienes para compatibilidad) ===
        brand: {
          50: "#f3f0ff",
          100: "#ede8ff",
          200: "#ddd5ff",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Poppins", "sans-serif"],
        logo: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        "2.5xl": "20px",
        "3.5xl": "28px",
        "4.5xl": "44px",
        "2xl": "1rem",
        "3xl": "1.5rem",
        // === SHADCN ===
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 2px 12px rgba(90,50,200,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        "card-hover": "0 6px 24px rgba(90,50,200,0.13)",
        glass: "30px 30px 80px rgba(130,90,220,0.18), -15px -15px 40px rgba(255,255,255,0.85), inset 0 1px 1px rgba(255,255,255,0.9)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}