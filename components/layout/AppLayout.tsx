import { BottomNav } from './BottomNav'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Changed to 100dvh to prevent UI jumps on mobile browsers when scrolling
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col relative antialiased">
      {/* flex-1 ensures the main content pushes the bottom boundary down */}
      <main className="flex-1 w-full pb-20 sm:pb-24">
        {children}
      </main>
      
      <BottomNav />
    </div>
  )
}