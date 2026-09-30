export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          car_id: string
          comment: string | null
          created_at: string
          deposit_kzt: number
          expires_at: string
          id: string
          status: Database["public"]["Enums"]["booking_status"]
          user_id: string
        }
        Insert: {
          car_id: string
          comment?: string | null
          created_at?: string
          deposit_kzt?: number
          expires_at?: string
          id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id: string
        }
        Update: {
          car_id?: string
          comment?: string | null
          created_at?: string
          deposit_kzt?: number
          expires_at?: string
          id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          body: string
          brand: string
          created_at: string
          description: string | null
          fuel: string
          horsepower: number
          id: string
          mileage_km: number
          model: string
          price_kzt: number
          slug: string
          status: Database["public"]["Enums"]["car_status"]
          transmission: string
          trim: string | null
          year: number
        }
        Insert: {
          body: string
          brand: string
          created_at?: string
          description?: string | null
          fuel?: string
          horsepower?: number
          id?: string
          mileage_km?: number
          model: string
          price_kzt: number
          slug: string
          status?: Database["public"]["Enums"]["car_status"]
          transmission?: string
          trim?: string | null
          year: number
        }
        Update: {
          body?: string
          brand?: string
          created_at?: string
          description?: string | null
          fuel?: string
          horsepower?: number
          id?: string
          mileage_km?: number
          model?: string
          price_kzt?: number
          slug?: string
          status?: Database["public"]["Enums"]["car_status"]
          transmission?: string
          trim?: string | null
          year?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_kzt: number
          booking_id: string | null
          car_id: string
          created_at: string
          discount_kzt: number
          extras: Json
          id: string
          method: string
          order_no: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount_kzt: number
          booking_id?: string | null
          car_id: string
          created_at?: string
          discount_kzt?: number
          extras?: Json
          id?: string
          method?: string
          order_no: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount_kzt?: number
          booking_id?: string | null
          car_id?: string
          created_at?: string
          discount_kzt?: number
          extras?: Json
          id?: string
          method?: string
          order_no?: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author?: string
          body: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      test_drives: {
        Row: {
          car_id: string
          comment: string | null
          created_at: string
          id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["test_drive_status"]
          user_id: string
        }
        Insert: {
          car_id: string
          comment?: string | null
          created_at?: string
          id?: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["test_drive_status"]
          user_id: string
        }
        Update: {
          car_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["test_drive_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_drives_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status:
        | "created"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "expired"
      car_status: "available" | "booked" | "sold"
      payment_status: "pending" | "paid" | "failed"
      test_drive_status: "planned" | "confirmed" | "done" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "created",
        "confirmed",
        "completed",
        "cancelled",
        "expired",
      ],
      car_status: ["available", "booked", "sold"],
      payment_status: ["pending", "paid", "failed"],
      test_drive_status: ["planned", "confirmed", "done", "cancelled"],
    },
  },
} as const
