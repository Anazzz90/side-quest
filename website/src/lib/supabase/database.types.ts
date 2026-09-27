export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      community_memberships: {
        Row: {
          community_id: string
          created_at: string
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "optional_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      geographic_areas: {
        Row: {
          boundary: unknown
          created_at: string
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["area_status"]
          time_zone: string
          updated_at: string
        }
        Insert: {
          boundary?: unknown
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["area_status"]
          time_zone?: string
          updated_at?: string
        }
        Update: {
          boundary?: unknown
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["area_status"]
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      meetup_places: {
        Row: {
          accessibility_notes: string | null
          area_id: string
          created_at: string
          id: string
          label: string
          public_access_verified_at: string | null
          public_point: unknown
          status: string
          updated_at: string
        }
        Insert: {
          accessibility_notes?: string | null
          area_id: string
          created_at?: string
          id?: string
          label: string
          public_access_verified_at?: string | null
          public_point: unknown
          status?: string
          updated_at?: string
        }
        Update: {
          accessibility_notes?: string | null
          area_id?: string
          created_at?: string
          id?: string
          label?: string
          public_access_verified_at?: string | null
          public_point?: unknown
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_places_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "geographic_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          reason: string | null
          subject_id: string | null
          subject_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          subject_id?: string | null
          subject_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          subject_id?: string | null
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_audit_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: string
          quest_id: string | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          quest_id?: string | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          quest_id?: string | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      optional_communities: {
        Row: {
          area_id: string | null
          created_at: string
          id: string
          name: string
          status: string
          visibility: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          visibility: string
        }
        Update: {
          area_id?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "optional_communities_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "geographic_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_categories: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          label: string
          quest_type: string
          slug: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          label: string
          quest_type: string
          slug: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          quest_type?: string
          slug?: string
        }
        Relationships: []
      }
      quest_join_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          quest_id: string
          requester_user_id: string
          status: Database["public"]["Enums"]["join_request_status"]
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          quest_id: string
          requester_user_id: string
          status?: Database["public"]["Enums"]["join_request_status"]
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          quest_id?: string
          requester_user_id?: string
          status?: Database["public"]["Enums"]["join_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "quest_join_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quest_join_requests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_join_requests_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quest_private_instructions: {
        Row: {
          instructions: string
          quest_id: string
          updated_at: string
        }
        Insert: {
          instructions: string
          quest_id: string
          updated_at?: string
        }
        Update: {
          instructions?: string
          quest_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_private_instructions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: true
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_room_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          quest_id: string
          sender_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          quest_id: string
          sender_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          quest_id?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_room_messages_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_room_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quests: {
        Row: {
          accessibility_notes: string | null
          area_id: string
          capacity: number
          category_id: string
          cost_note: string | null
          created_at: string
          description: string
          expires_at: string
          favor_ack: boolean
          host_user_id: string
          id: string
          meetup_place_id: string
          proof_rule: Database["public"]["Enums"]["proof_rule"]
          quest_type: Database["public"]["Enums"]["quest_type"]
          scheduled_end: string
          scheduled_start: string
          status: Database["public"]["Enums"]["quest_status"]
          title: string
          updated_at: string
        }
        Insert: {
          accessibility_notes?: string | null
          area_id: string
          capacity: number
          category_id: string
          cost_note?: string | null
          created_at?: string
          description: string
          expires_at: string
          favor_ack?: boolean
          host_user_id: string
          id?: string
          meetup_place_id: string
          proof_rule?: Database["public"]["Enums"]["proof_rule"]
          quest_type: Database["public"]["Enums"]["quest_type"]
          scheduled_end: string
          scheduled_start: string
          status?: Database["public"]["Enums"]["quest_status"]
          title: string
          updated_at?: string
        }
        Update: {
          accessibility_notes?: string | null
          area_id?: string
          capacity?: number
          category_id?: string
          cost_note?: string | null
          created_at?: string
          description?: string
          expires_at?: string
          favor_ack?: boolean
          host_user_id?: string
          id?: string
          meetup_place_id?: string
          proof_rule?: Database["public"]["Enums"]["proof_rule"]
          quest_type?: Database["public"]["Enums"]["quest_type"]
          scheduled_end?: string
          scheduled_start?: string
          status?: Database["public"]["Enums"]["quest_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "geographic_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quest_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quests_meetup_place_id_fkey"
            columns: ["meetup_place_id"]
            isOneToOne: false
            referencedRelation: "meetup_places"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_user_id: string
          blocker_user_id: string
          created_at: string
        }
        Insert: {
          blocked_user_id: string
          blocker_user_id: string
          created_at?: string
        }
        Update: {
          blocked_user_id?: string
          blocker_user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_user_id_fkey"
            columns: ["blocker_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          age_attested_at: string | null
          created_at: string
          display_name: string
          leaderboard_opt_in: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          age_attested_at?: string | null
          created_at?: string
          display_name: string
          leaderboard_opt_in?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          age_attested_at?: string | null
          created_at?: string
          display_name?: string
          leaderboard_opt_in?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decide_join_request: {
        Args: {
          p_decision: Database["public"]["Enums"]["join_request_status"]
          p_request_id: string
        }
        Returns: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          quest_id: string
          requester_user_id: string
          status: Database["public"]["Enums"]["join_request_status"]
        }
        SetofOptions: {
          from: "*"
          to: "quest_join_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_quest_member: {
        Args: { p_quest_id: string; p_user_id: string }
        Returns: boolean
      }
      list_published_quest_points: {
        Args: {
          p_category_id?: string
          p_quest_type?: Database["public"]["Enums"]["quest_type"]
          p_search?: string
        }
        Returns: {
          category_label: string
          id: string
          lat: number
          lng: number
          title: string
        }[]
      }
      request_to_join: {
        Args: { p_quest_id: string }
        Returns: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          quest_id: string
          requester_user_id: string
          status: Database["public"]["Enums"]["join_request_status"]
        }
        SetofOptions: {
          from: "*"
          to: "quest_join_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_private_instructions: {
        Args: { p_instructions: string; p_quest_id: string }
        Returns: {
          instructions: string
          quest_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "quest_private_instructions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_has_join_request: {
        Args: { p_quest_id: string; p_user_id: string }
        Returns: boolean
      }
      user_hosts_quest: {
        Args: { p_quest_id: string; p_user_id: string }
        Returns: boolean
      }
      withdraw_join_request: {
        Args: { p_request_id: string }
        Returns: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          quest_id: string
          requester_user_id: string
          status: Database["public"]["Enums"]["join_request_status"]
        }
        SetofOptions: {
          from: "*"
          to: "quest_join_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_status: "active" | "restricted" | "suspended" | "closed"
      area_status: "draft" | "active" | "paused"
      join_request_status: "pending" | "accepted" | "declined" | "withdrawn"
      membership_status: "pending" | "active" | "removed"
      proof_rule: "host_confirmation" | "photo_evidence" | "none"
      quest_status: "draft" | "published" | "cancelled"
      quest_type: "activity" | "favor"
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
      account_status: ["active", "restricted", "suspended", "closed"],
      area_status: ["draft", "active", "paused"],
      join_request_status: ["pending", "accepted", "declined", "withdrawn"],
      membership_status: ["pending", "active", "removed"],
      proof_rule: ["host_confirmation", "photo_evidence", "none"],
      quest_status: ["draft", "published", "cancelled"],
      quest_type: ["activity", "favor"],
    },
  },
} as const

