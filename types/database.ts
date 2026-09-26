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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_value: Json | null
          before_value: Json | null
          community_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          community_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          community_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          branding_config: Json
          created_at: string
          id: string
          identifier_type: string
          name: string
          privacy_config: Json
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          branding_config?: Json
          created_at?: string
          id?: string
          identifier_type: string
          name: string
          privacy_config?: Json
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          branding_config?: Json
          created_at?: string
          id?: string
          identifier_type?: string
          name?: string
          privacy_config?: Json
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          community_id: string
          created_at: string
          deleted_at: string | null
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          unique_identifier_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          community_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          unique_identifier_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          unique_identifier_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          code_display_hint: string | null
          community_id: string
          created_at: string
          created_by: string
          email: string | null
          expires_at: string | null
          id: string
          identifier_hash: string
          prefill_data: Json | null
          redeemed_at: string | null
          redeemed_by_membership_id: string | null
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          code_display_hint?: string | null
          community_id: string
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string | null
          id?: string
          identifier_hash: string
          prefill_data?: Json | null
          redeemed_at?: string | null
          redeemed_by_membership_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          code_display_hint?: string | null
          community_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          identifier_hash?: string
          prefill_data?: Json | null
          redeemed_at?: string | null
          redeemed_by_membership_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_redeemed_by_membership_id_fkey"
            columns: ["redeemed_by_membership_id"]
            isOneToOne: false
            referencedRelation: "community_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          city_code: string | null
          city_name: string | null
          country_code: string
          country_name: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          province_code: string | null
          province_name: string | null
        }
        Insert: {
          city_code?: string | null
          city_name?: string | null
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          province_code?: string | null
          province_name?: string | null
        }
        Update: {
          city_code?: string | null
          city_name?: string | null
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          province_code?: string | null
          province_name?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          id: number
          identifier: string
        }
        Insert: {
          attempt_type: string
          created_at?: string
          id?: never
          identifier: string
        }
        Update: {
          attempt_type?: string
          created_at?: string
          id?: never
          identifier?: string
        }
        Relationships: []
      }
      member_locations: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_current: boolean
          location_id: string
          membership_id: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          location_id: string
          membership_id: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          location_id?: string
          membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_locations_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "community_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      member_profiles: {
        Row: {
          bio: string | null
          company_or_industry: string | null
          created_at: string
          display_name: string
          education: string | null
          id: string
          membership_id: string
          occupation: string | null
          photo_url: string | null
          profile_completed_at: string | null
          updated_at: string
          visibility_config: Json
        }
        Insert: {
          bio?: string | null
          company_or_industry?: string | null
          created_at?: string
          display_name: string
          education?: string | null
          id?: string
          membership_id: string
          occupation?: string | null
          photo_url?: string | null
          profile_completed_at?: string | null
          updated_at?: string
          visibility_config?: Json
        }
        Update: {
          bio?: string | null
          company_or_industry?: string | null
          created_at?: string
          display_name?: string
          education?: string | null
          id?: string
          membership_id?: string
          occupation?: string | null
          photo_url?: string | null
          profile_completed_at?: string | null
          updated_at?: string
          visibility_config?: Json
        }
        Relationships: [
          {
            foreignKeyName: "member_profiles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "community_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_community_admin: {
        Args: { target_community_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      owns_membership: {
        Args: { target_membership_id: string }
        Returns: boolean
      }
      redeem_invitation: {
        Args: { p_invitation_id: string; p_user_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          community_id: string
          created_at: string
          deleted_at: string | null
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          unique_identifier_hash: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "community_memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      field_visibility: "members" | "admin_only" | "hidden"
      invitation_status: "pending" | "redeemed" | "revoked" | "expired"
      membership_role: "member" | "community_admin"
      membership_status:
        | "pending"
        | "approved"
        | "suspended"
        | "rejected"
        | "deleted"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      field_visibility: ["members", "admin_only", "hidden"],
      invitation_status: ["pending", "redeemed", "revoked", "expired"],
      membership_role: ["member", "community_admin"],
      membership_status: [
        "pending",
        "approved",
        "suspended",
        "rejected",
        "deleted",
      ],
    },
  },
} as const
