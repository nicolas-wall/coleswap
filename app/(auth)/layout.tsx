import { GraduationCap } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-muted/30">
      {/* Mismo halo cálido que la landing, para que el ingreso no sea una caja sola en gris */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(50%_60%_at_50%_0%,var(--color-accent)_0%,transparent_70%)] opacity-60"
      />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary text-primary-foreground mb-3 shadow-warm">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="font-display text-3xl font-semibold">SchoolShop</h1>
          <p className="text-sm text-muted-foreground mt-1">Insumos escolares de tu colegio</p>
        </div>
        <div className="shadow-warm rounded-xl">{children}</div>
      </div>
    </div>
  )
}
