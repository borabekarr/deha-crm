export function DashboardHeader() {
  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.6)',
      }}
    >
      <span
        className="text-xl font-black tracking-tight text-foreground"
        style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
      >
        deha
        <span className="text-emerald-500">.</span>
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative flex size-9 items-center justify-center rounded-full bg-white/70 text-muted-foreground shadow-sm border border-white/60"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            notifications
          </span>
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 size-2 rounded-full bg-red-500"
          />
        </button>

        <div
          className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-black shadow-sm"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          B
        </div>
      </div>
    </div>
  )
}
