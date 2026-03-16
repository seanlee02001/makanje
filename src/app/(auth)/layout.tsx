import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-login flex flex-col">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-6">
        <h1 className="text-4xl font-bold text-white font-heading tracking-tight drop-shadow">MakanJe</h1>
        <p className="text-sm text-orange-100/80 mt-1 font-heading">Your family&apos;s weekly meal plan</p>
      </div>

      {/* Glass card rises from bottom */}
      <div className="bg-white/[0.68] dark:bg-black/[0.55] backdrop-blur-[24px] border-t border-white/[0.75] dark:border-white/[0.08] rounded-t-[32px] px-6 pt-7 pb-10 w-full">
        {children}
      </div>
    </div>
  )
}
