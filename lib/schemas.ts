import { z } from 'zod'

export const GARMENT_TYPES = [
  'remera', 'camisa', 'swetear', 'buzo', 'campera',
  'pantalon', 'pollera', 'zapatos',
] as const

export const GARMENT_LABELS: Record<string, string> = {
  remera: 'Remera',
  camisa: 'Camisa',
  swetear: 'Swetear',
  buzo: 'Buzo',
  campera: 'Campera',
  pantalon: 'Pantalón',
  pollera: 'Pollera',
  zapatos: 'Zapatos',
}

export const SIZES = ['2', '4', '6', '8', '10', '12', '14', '16', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44'] as const

export const CONDITION_LABELS: Record<string, string> = {
  como_nuevo: 'Como nuevo',
  buen_estado: 'Buen estado',
  regular: 'Regular',
}

export const GENDER_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  unisex: 'Unisex',
}

// ── Auth schemas ──────────────────────────────────────────────
export const signupSchema = z.object({
  invitationCode: z.string().min(1, 'El código de invitación es requerido').trim().toUpperCase(),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  phone: z.string().min(8, 'Teléfono inválido').max(20).regex(/^[\d\s\+\-\(\)]+$/, 'Solo números y símbolos de teléfono'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

// ── Book schema ───────────────────────────────────────────────
export const bookListingSchema = z.object({
  isbn: z.string().min(10, 'ISBN inválido').max(13, 'ISBN inválido').regex(/^\d+$/, 'El ISBN solo contiene números'),
  title: z.string().min(1, 'El título es requerido'),
  author: z.string().min(1, 'El autor es requerido'),
  subject: z.string().min(1, 'La materia es requerida'),
  grade: z.string().min(1, 'El grado es requerido'),
  condition: z.enum(['como_nuevo', 'buen_estado', 'regular']),
  price: z.coerce.number().min(0).max(999999).optional().nullable(),
  notes: z.string().max(280).optional().nullable(),
})

// ── Uniform schema ────────────────────────────────────────────
export const uniformListingSchema = z.object({
  garmentType: z.enum(GARMENT_TYPES),
  size: z.string().min(1, 'El talle es requerido'),
  gender: z.enum(['masculino', 'femenino', 'unisex']),
  color: z.string().max(30).optional().nullable(),
  condition: z.enum(['como_nuevo', 'buen_estado', 'regular']),
  price: z.coerce.number().min(0).max(999999).optional().nullable(),
  notes: z.string().max(280).optional().nullable(),
})

// ── Rating schema ─────────────────────────────────────────────
export const ratingSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(280).optional().nullable(),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type BookListingInput = z.infer<typeof bookListingSchema>
export type UniformListingInput = z.infer<typeof uniformListingSchema>
export type RatingInput = z.infer<typeof ratingSchema>
