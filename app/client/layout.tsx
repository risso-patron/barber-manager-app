export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen p-6 bg-gray-50">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Panel del Cliente</h2>
        <p className="text-sm text-gray-500">Reserva tus citas y gestiona tu perfil</p>
      </header>
      <main>{children}</main>
    </section>
  );
}