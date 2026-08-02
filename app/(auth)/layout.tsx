import { GraduationCap } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary text-primary-foreground mb-3">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SchoolShop</h1>
          <p className="text-sm text-muted-foreground mt-1">Insumos escolares de tu colegio</p>
        </div>
        {children}
      </div>
    </div>
  )
}
