import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-700">MakanJe</h1>
          <p className="text-sm text-gray-500 mt-1">Family meal planning, simplified</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">{children}</div>
      </div>
    </div>
  )
}
