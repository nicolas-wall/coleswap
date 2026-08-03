import { Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/server'

interface FamilyWithSchool {
  schools: { name: string } | null
}

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let schoolName = ''
  if (user) {
    const { data: family } = await supabase
      .from('families')
      .select('schools(name)')
      .eq('id', user.id)
      .maybeSingle() as { data: FamilyWithSchool | null; error: unknown }
    schoolName = family?.schools?.name ?? ''
  }

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <Clock className="size-10 mx-auto text-muted-foreground" />
      <h1 className="text-lg font-semibold">Tu solicitud está esperando aprobación</h1>
      <Alert>
        <AlertDescription>
          {schoolName
            ? `Un moderador de ${schoolName} tiene que aprobar tu cuenta antes de que puedas entrar.`
            : 'Un moderador de tu colegio tiene que aprobar tu cuenta antes de que puedas entrar.'}
          {' '}Volvé a intentar más tarde.
        </AlertDescription>
      </Alert>
    </div>
  )
}
