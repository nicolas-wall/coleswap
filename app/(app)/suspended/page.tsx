import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SuspendedPage() {
  return (
    <div className="max-w-md mx-auto py-16">
      <Alert variant="destructive">
        <AlertDescription>
          Tu cuenta fue suspendida por un administrador de tu colegio. Si creés que es un error, contactalo directamente.
        </AlertDescription>
      </Alert>
    </div>
  )
}
