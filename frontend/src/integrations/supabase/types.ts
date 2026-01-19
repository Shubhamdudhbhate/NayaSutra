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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cases: {
        Row: {
          case_number: string
          case_type: Database["public"]["Enums"]["case_type"]
          court_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          party_a_name: string
          party_b_name: string
          status: Database["public"]["Enums"]["case_status"]
          title: string
          unique_identifier: string
          updated_at: string
        }
        Insert: {
          case_number: string
          case_type: Database["public"]["Enums"]["case_type"]
          court_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          party_a_name: string
          party_b_name: string
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          unique_identifier: string
          updated_at?: string
        }
        Update: {
          case_number?: string
          case_type?: Database["public"]["Enums"]["case_type"]
          court_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          party_a_name?: string
          party_b_name?: string
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          unique_identifier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role_category: string
          updated_at: string
          user_id: string
          wallet_address: string | null
          is_wallet_verified: boolean
          wallet_verified_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          role_category?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
          is_wallet_verified?: boolean
          wallet_verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role_category?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
          is_wallet_verified?: boolean
          wallet_verified_at?: string | null
        }
        Relationships: []
      }
      firs: {
        Row: {
          id: string
          fir_number: string
          police_station: string
          informant_name: string
          informant_contact: string
          incident_date: string
          incident_place: string
          offense_nature: string
          bns_section: string
          accused_name: string | null
          victim_name: string
          description: string | null
          status: Database["public"]["Enums"]["fir_status"]
          created_at: string
          officer_id: string | null
        }
        Insert: {
          id?: string
          fir_number: string
          police_station: string
          informant_name: string
          informant_contact: string
          incident_date: string
          incident_place: string
          offense_nature: string
          bns_section: string
          accused_name?: string | null
          victim_name: string
          description?: string | null
          status?: Database["public"]["Enums"]["fir_status"]
          created_at?: string
          officer_id?: string | null
        }
        Update: {
          id?: string
          fir_number?: string
          police_station?: string
          informant_name?: string
          informant_contact?: string
          incident_date?: string
          incident_place?: string
          offense_nature?: string
          bns_section?: string
          accused_name?: string | null
          victim_name?: string
          description?: string | null
          status?: Database["public"]["Enums"]["fir_status"]
          created_at?: string
          officer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "firs_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      investigation_files: {
        Row: {
          id: string
          fir_id: string
          file_url: string
          file_type: Database["public"]["Enums"]["investigation_file_type"]
          notes: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          fir_id: string
          file_url: string
          file_type: Database["public"]["Enums"]["investigation_file_type"]
          notes?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          fir_id?: string
          file_url?: string
          file_type?: Database["public"]["Enums"]["investigation_file_type"]
          notes?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_files_fir_id_fkey"
            columns: ["fir_id"]
            isOneToOne: false
            referencedRelation: "firs"
            referencedColumns: ["id"]
          }
        ]
      }
      wallet_audit_log: {
        Row: {
          id: string
          profile_id: string
          action: string
          old_value: string | null
          new_value: string | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          action: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          action?: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      verify_wallet_authorization: {
        Args: {
          p_wallet_address: string
          p_role_category: string
        }
        Returns: Array<{
          is_authorized: boolean
          profile_id: string
          full_name: string
          role_category: string
        }>
      }
    }
    Enums: {
      case_status:
        | "pending"
        | "active"
        | "hearing"
        | "verdict_pending"
        | "closed"
        | "appealed"
      case_type: "criminal" | "civil"
      fir_status: "Registered" | "Under Investigation" | "Chargesheet Filed" | "Closed"
      investigation_file_type: "Supplementary Chargesheet" | "Forensic Report" | "Witness Statement"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      case_status: [
        "pending",
        "active",
        "hearing",
        "verdict_pending",
        "closed",
        "appealed",
      ],
      case_type: ["criminal", "civil"],
      fir_status: ["Registered", "Under Investigation", "Chargesheet Filed", "Closed"],
      investigation_file_type: ["Supplementary Chargesheet", "Forensic Report", "Witness Statement"],
    },
  },
} as const
