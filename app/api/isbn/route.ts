import { NextRequest, NextResponse } from 'next/server'
import { lookupISBN } from '@/lib/open-library'

export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get('isbn')
  if (!isbn) {
    return NextResponse.json({ error: 'ISBN requerido' }, { status: 400 })
  }

  const clean = isbn.replace(/\D/g, '')
  if (!/^\d{10}(\d{3})?$/.test(clean)) {
    return NextResponse.json({ error: 'ISBN inválido' }, { status: 400 })
  }

  const book = await lookupISBN(clean)
  return NextResponse.json({ book })
}
