import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12" style={{ background: 'var(--canvas)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold tracking-[-0.5px]" style={{ color: 'var(--text-primary)' }}>
            MakanJe
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Family meal planning
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
