export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type ListingType = 'book' | 'uniform'
export type ListingStatus = 'active' | 'sold' | 'removed'
export type ConditionType = 'como_nuevo' | 'buen_estado' | 'regular'
export type GarmentType = 'camisa' | 'pantalon' | 'pollera' | 'buzo' | 'zapatos' | 'medias' | 'guardapolvo' | 'corbata' | 'bermuda' | 'campera'
export type GenderType = 'masculino' | 'femenino' | 'unisex'
export type RatingRole = 'buyer' | 'seller'

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          slug: string
          city: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          city: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          city?: string
          created_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          school_id: string
          code: string
          used_by: string | null
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          code: string
          used_by?: string | null
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          code?: string
          used_by?: string | null
          used_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          id: string
          school_id: string
          display_name: string
          phone: string
          email: string
          rating_avg: number | null
          rating_count: number
          created_at: string
        }
        Insert: {
          id: string
          school_id: string
          display_name: string
          phone: string
          email: string
          rating_avg?: number | null
          rating_count?: number
          created_at?: string
        }
        Update: {
          school_id?: string
          display_name?: string
          phone?: string
          email?: string
          rating_avg?: number | null
          rating_count?: number
          created_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          school_id: string
          family_id: string
          type: ListingType
          status: ListingStatus
          price: number | null
          condition: ConditionType
          notes: string | null
          created_at: string
          sold_at: string | null
        }
        Insert: {
          id?: string
          school_id: string
          family_id: string
          type: ListingType
          status?: ListingStatus
          price?: number | null
          condition: ConditionType
          notes?: string | null
          created_at?: string
          sold_at?: string | null
        }
        Update: {
          school_id?: string
          family_id?: string
          type?: ListingType
          status?: ListingStatus
          price?: number | null
          condition?: ConditionType
          notes?: string | null
          created_at?: string
          sold_at?: string | null
        }
        Relationships: []
      }
      book_details: {
        Row: {
          listing_id: string
          isbn: string
          title: string
          author: string
          subject: string
          grade: string
        }
        Insert: {
          listing_id: string
          isbn: string
          title: string
          author: string
          subject: string
          grade: string
        }
        Update: {
          isbn?: string
          title?: string
          author?: string
          subject?: string
          grade?: number
        }
        Relationships: []
      }
      uniform_details: {
        Row: {
          listing_id: string
          garment_type: GarmentType
          size: string
          gender: GenderType
          color: string | null
        }
        Insert: {
          listing_id: string
          garment_type: GarmentType
          size: string
          gender: GenderType
          color?: string | null
        }
        Update: {
          garment_type?: GarmentType
          size?: string
          gender?: GenderType
          color?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          listing_id: string
          buyer_family_id: string
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_family_id: string
          created_at?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          listing_id: string
          rater_family_id: string
          rated_family_id: string
          role: RatingRole
          score: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          rater_family_id: string
          rated_family_id: string
          role: RatingRole
          score: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, unknown>
    Functions: {
      get_my_school_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      listing_type: ListingType
      listing_status: ListingStatus
      condition_type: ConditionType
      garment_type: GarmentType
      gender_type: GenderType
      rating_role: RatingRole
    }
    CompositeTypes: Record<string, unknown>
  }
}

// Tipos conveniencia
export type School = Database['public']['Tables']['schools']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Family = Database['public']['Tables']['families']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']
export type BookDetails = Database['public']['Tables']['book_details']['Row']
export type UniformDetails = Database['public']['Tables']['uniform_details']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']

// Tipos compuestos para queries con join
export type ListingWithDetails = Listing & {
  book_details: BookDetails | null
  uniform_details: UniformDetails | null
  family: Pick<Family, 'id' | 'display_name' | 'phone' | 'email' | 'rating_avg' | 'rating_count'>
}
