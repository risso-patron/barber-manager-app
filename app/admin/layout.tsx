export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen p-6 bg-gray-100">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Panel de Administración</h2>
        <p className="text-sm text-gray-500">Gestión de servicios, empleados e inventario</p>
      </header>
      <main>{children}</main>
    </section>
  );
}