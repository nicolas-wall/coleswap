'use client'

import Link from 'next/link'
import { Menu, User, Package, ShieldCheck, Building2, LogOut, BookOpen, Shirt } from 'lucide-react'
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
        render={<Button variant="ghost" size="sm" aria-label="Menú" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground shrink-0" />}
      >
        <Menu className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem render={<Link href="/sell/book" />}>
          <BookOpen className="size-4" />
          Publicar libro
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/sell/uniform" />}>
          <Shirt className="size-4" />
          Publicar uniforme
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <User className="size-4" />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/my-listings" />}>
          <Package className="size-4" />
          Mis publicaciones
        </DropdownMenuItem>
        {isSchoolAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <ShieldCheck className="size-4" />
            Admin
          </DropdownMenuItem>
        )}
        {isPlatformAdmin && (
          <DropdownMenuItem render={<Link href="/admin/platform" />}>
            <Building2 className="size-4" />
            Plataforma
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
