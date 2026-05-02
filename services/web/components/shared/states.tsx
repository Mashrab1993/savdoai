export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`h-12 bg-slate-${i === 0 ? 200 : 100} rounded-lg`} style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  )
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex w-16 h-16 rounded-full bg-rose-100 items-center justify-center mb-4">
        <span className="text-3xl">⚠</span>
      </div>
      <p className="text-lg font-medium text-rose-800 mb-2">Xato yuz berdi</p>
      <p className="text-sm text-slate-500">{message}</p>
      {retry && (
        <button onClick={retry} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          Qayta urinib ko'rish
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, desc, icon }: { title: string; desc: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
        {icon || <span className="text-3xl text-slate-400">∅</span>}
      </div>
      <p className="text-lg font-medium text-slate-700 mb-1">{title}</p>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  )
}
