import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// Cuenta hits en la tabla rate_limit_hits (ver migración 016) vía una función
// SECURITY DEFINER, así que funciona igual para clientes autenticados y anónimos.
// Falla "abierto": si el RPC en sí falla, no bloqueamos al usuario real por eso.
export async function checkRateLimit(key: string, maxCount: number, windowSeconds: number): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  })

  if (error) return true
  return data === true
}

export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return h.get('x-real-ip') ?? 'unknown'
}
