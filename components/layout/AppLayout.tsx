import { BottomNav } from './BottomNav'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pb-24 min-h-screen">{children}</main>
      <BottomNav />
    </div>
  )
}
