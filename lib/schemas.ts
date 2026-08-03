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
const baseSignupFields = {
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
}

export const signupSchema = z.object({
  invitationCode: z.string().min(1, 'El código de invitación es requerido').trim().toUpperCase(),
  ...baseSignupFields,
})

export const requestJoinSchema = z.object({
  schoolId: z.string().uuid('Elegí un colegio'),
  ...baseSignupFields,
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

// ── Book schema ───────────────────────────────────────────────
export const bookListingSchema = z.object({
  isbn: z.string().min(10, 'ISBN inválido').max(13, 'ISBN inválido').regex(/^\d+$/, 'El ISBN solo contiene números'),
  title: z.string().min(1, 'El título es requerido').max(200),
  author: z.string().min(1, 'El autor es requerido').max(150),
  publisher: z.string().max(150).optional().nullable(),
  subject: z.string().min(1, 'La materia es requerida').max(100),
  grade: z.string().min(1, 'El grado es requerido').max(50),
  condition: z.enum(['como_nuevo', 'buen_estado', 'regular']),
  price: z.coerce.number().min(0).max(999999).optional().nullable(),
  notes: z.string().max(280).optional().nullable(),
})

// ── Uniform schema ────────────────────────────────────────────
export const uniformListingSchema = z.object({
  garmentType: z.enum(GARMENT_TYPES),
  size: z.string().min(1, 'El talle es requerido').max(20),
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

// ── Profile schema ────────────────────────────────────────────
const optionalPhone = z.string().max(20).regex(/^[\d\s\+\-\(\)]+$/, 'Solo números y símbolos de teléfono').optional().or(z.literal(''))

export const profileSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  phone: optionalPhone,
  socialHandle: z.string().max(50).optional().nullable(),
  contactNote: z.string().max(280).optional().nullable(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

// ── Child schema ─────────────────────────────────────────────
export const childSchema = z.object({
  name: z.string().max(60).optional().nullable(),
  grade: z.string().min(1, 'El grado es requerido').max(50),
})

// ── School schema ────────────────────────────────────────────
export const schoolSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120),
  shortName: z.string().max(30).optional().nullable(),
  city: z.string().min(1, 'La ciudad es requerida').max(80),
  slug: z.string().min(1, 'El slug es requerido').max(80).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  crestUrl: z.string().url().optional().nullable(),
})

// ── Message schema ───────────────────────────────────────────
export const messageSchema = z.object({
  body: z.string().trim().min(1, 'Escribí un mensaje').max(1000, 'Máximo 1000 caracteres'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type RequestJoinInput = z.infer<typeof requestJoinSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type BookListingInput = z.infer<typeof bookListingSchema>
export type UniformListingInput = z.infer<typeof uniformListingSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ChildInput = z.infer<typeof childSchema>
export type SchoolInput = z.infer<typeof schoolSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
