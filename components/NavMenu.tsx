'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/actions/auth'

interface Props {
  isSchoolAdmin: boolean
  isPlatformAdmin: boolean
}

export function NavMenu({ isSchoolAdmin, isPlatformAdmin }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" aria-label="Menú" />}
      >
        <Menu className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem render={<Link href="/profile" />}>Mi perfil</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/my-listings" />}>Mis publicaciones</DropdownMenuItem>
        {isSchoolAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>Admin</DropdownMenuItem>
        )}
        {isPlatformAdmin && (
          <DropdownMenuItem render={<Link href="/admin/platform" />}>Plataforma</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>Salir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
