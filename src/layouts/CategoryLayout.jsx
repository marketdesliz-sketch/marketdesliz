// src/layouts/CategoryLayout.jsx
import ModernHeader from '../components/layout/ModernHeader';  

export default function CategoryLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader />
      <main className="max-w-7xl mx-auto px-4 py-6 pt-20">
        {children}
      </main>
    </div>
  );
}