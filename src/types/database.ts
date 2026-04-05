export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ShiftType =
  | "work_shift"
  | "rest_day"
  | "holiday"
  | "transfer"
  | "permission";
export type UserRole = "employee" | "manager" | "admin";
export type NotificationType =
  | "shift_published"
  | "absence_approved"
  | "communication"
  | "new_shift";

export type Database = {
  public: {
    Tables: {
      store: {
        Row: {
          id: string;
          name: string;
          code: string;
          address: string | null;
          city: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          preferred_name: string | null;
          pronouns: string | null;
          birth_date: string | null;
          legal_gender: string | null;
          avatar_url: string | null;
          role: UserRole;
          admission_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          preferred_name?: string | null;
          pronouns?: string | null;
          birth_date?: string | null;
          legal_gender?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          admission_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          first_name?: string;
          last_name?: string;
          preferred_name?: string | null;
          pronouns?: string | null;
          birth_date?: string | null;
          legal_gender?: string | null;
          avatar_url?: string | null;
          admission_date?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      store_membership: {
        Row: {
          id: string;
          user_id: string;
          store_id: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_id: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          is_primary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "store_membership_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_membership_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "store";
            referencedColumns: ["id"];
          },
        ];
      };
      shift_template: {
        Row: {
          id: string;
          store_id: string;
          created_by: string;
          name: string;
          shift_type: ShiftType;
          start_time: string | null;
          end_time: string | null;
          color: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          created_by: string;
          name: string;
          shift_type: ShiftType;
          start_time?: string | null;
          end_time?: string | null;
          color: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          shift_type?: ShiftType;
          start_time?: string | null;
          end_time?: string | null;
          color?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shift_template_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "store";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shift_template_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      shift_assignment: {
        Row: {
          id: string;
          user_id: string;
          store_id: string;
          template_id: string | null;
          created_by: string;
          date: string;
          shift_type: ShiftType;
          label: string;
          start_time: string | null;
          end_time: string | null;
          color: string;
          published_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_id: string;
          template_id?: string | null;
          created_by: string;
          date: string;
          shift_type: ShiftType;
          label: string;
          start_time?: string | null;
          end_time?: string | null;
          color: string;
          published_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          template_id?: string | null;
          date?: string;
          shift_type?: ShiftType;
          label?: string;
          start_time?: string | null;
          end_time?: string | null;
          color?: string;
          published_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shift_assignment_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shift_assignment_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "store";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shift_assignment_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "shift_template";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shift_assignment_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      notification: {
        Row: {
          id: string;
          user_id: string;
          created_by: string | null;
          type: NotificationType;
          title: string;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_by?: string | null;
          type: NotificationType;
          title: string;
          body: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notification_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_manager: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      insert_absence_range: {
        Args: {
          p_user_id: string;
          p_store_id: string;
          p_created_by: string;
          p_shift_type: ShiftType;
          p_label: string;
          p_color: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Database["public"]["Tables"]["shift_assignment"]["Row"][];
      };
    };
  };
};

// Convenience row types
export type Store = Database["public"]["Tables"]["store"]["Row"];
export type User = Database["public"]["Tables"]["user"]["Row"];
export type StoreMembership =
  Database["public"]["Tables"]["store_membership"]["Row"];
export type ShiftTemplate =
  Database["public"]["Tables"]["shift_template"]["Row"];
export type ShiftAssignment =
  Database["public"]["Tables"]["shift_assignment"]["Row"];
export type Notification = Database["public"]["Tables"]["notification"]["Row"];
