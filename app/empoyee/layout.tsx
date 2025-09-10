export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen p-6 bg-white">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Panel del Barbero</h2>
        <p className="text-sm text-gray-500">Revisa tu agenda y gestiona tus horarios</p>
      </header>
      <main>{children}</main>
    </section>
  );
}