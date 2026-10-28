// Shared layout for Estate Tea's policy pages (privacy, refunds).
export default function PolicyPage({ title, updated, sections, children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="glass-surface border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-light gold-text">Estate Tea</a>
          <a href="/" className="text-xs uppercase tracking-[.2em] text-gray-400 hover:text-[#D4AF37]">Shop</a>
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6">
        <article className="mx-auto max-w-2xl py-12">
          <p className="text-xs uppercase tracking-[.25em] text-[#D4AF37]">Estate Tea</p>
          <h1 className="mt-2 text-4xl font-light gold-text">{title}</h1>
          <p className="mt-3 text-xs text-gray-500">Last updated {updated}</p>
          {children}
          {sections.map(([heading, paras]) => (
            <section key={heading} className="mt-10">
              <h2 className="text-lg text-white">{heading}</h2>
              {paras.map((p, i) => <p key={i} className="mt-3 text-sm leading-7 text-gray-300">{p}</p>)}
            </section>
          ))}
        </article>
      </main>
      <PolicyFooter />
    </div>
  );
}

export function PolicyFooter() {
  return (
    <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-gray-500">
      <a href="/refunds" className="hover:text-[#D4AF37]">Refunds &amp; cancellations</a>
      <span className="mx-3 text-gray-700">·</span>
      <a href="/privacy" className="hover:text-[#D4AF37]">Privacy</a>
      <span className="mx-3 text-gray-700">·</span>
      <a href="https://wa.me/919742668951" target="_blank" rel="noreferrer" className="hover:text-[#D4AF37]">WhatsApp us</a>
      <span className="mx-3 text-gray-700">·</span>
      <a href="mailto:brew@estatetea.in" className="hover:text-[#D4AF37]">brew@estatetea.in</a>
    </footer>
  );
}
