export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-5xl" role="img" aria-label="robot">
            🤖
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary">GOLF GHOST</h1>
        </div>
        <p className="text-text-secondary text-lg">AI-Powered Score Generation System</p>
      </div>

      {/* Glass Card Placeholder */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-bg-card/50 backdrop-blur-sm border border-border/50 shadow-xl">
        <div className="text-center">
          <p className="text-text-muted mb-6">Score generation form coming soon...</p>

          {/* Placeholder Glass Button */}
          <button
            className="
              relative px-8 py-4 rounded-full
              bg-gradient-to-br from-white/10 via-white/5 to-transparent
              border border-white/20
              text-text-primary font-medium
              backdrop-blur-sm
              shadow-lg shadow-black/20
              hover:scale-[0.98] hover:shadow-md
              transition-all duration-300 ease-out
              cursor-pointer
            "
          >
            Generate Ghost Round
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-text-muted text-sm">
        <p>ghost.jurigregg.com</p>
      </footer>
    </main>
  );
}
