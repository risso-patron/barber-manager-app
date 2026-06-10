export function OrnoLogo() {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      <div className="relative">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>O</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
      </div>
      <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Ornó</h1>
    </div>
  );
}
