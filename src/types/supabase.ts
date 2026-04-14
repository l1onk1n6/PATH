/**
 * Supabase Database type definitions
 *
 * Keep in sync with migrations in supabase/migrations/.
 * To regenerate from a live project run:
 *   npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      persons: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          avatar: string | null;
          active_resume_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          avatar?: string | null;
          active_resume_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          avatar?: string | null;
          active_resume_id?: string | null;
          created_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          person_id: string;
          user_id: string;
          name: string;
          status: string;
          job_url: string | null;
          deadline: string | null;
          template_id: string;
          accent_color: string | null;
          personal_info: Json;
          cover_letter: Json | null;
          work_experience: Json;
          education: Json;
          skills: Json;
          languages: Json;
          projects: Json;
          certificates: Json;
          custom_sections: Json;
          share_token: string | null;
          reminder_days: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          user_id: string;
          name: string;
          status?: string;
          job_url?: string | null;
          deadline?: string | null;
          template_id: string;
          accent_color?: string | null;
          personal_info?: Json;
          cover_letter?: Json | null;
          work_experience?: Json;
          education?: Json;
          skills?: Json;
          languages?: Json;
          projects?: Json;
          certificates?: Json;
          custom_sections?: Json;
          share_token?: string | null;
          reminder_days?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          user_id?: string;
          name?: string;
          status?: string;
          job_url?: string | null;
          deadline?: string | null;
          template_id?: string;
          accent_color?: string | null;
          personal_info?: Json;
          cover_letter?: Json | null;
          work_experience?: Json;
          education?: Json;
          skills?: Json;
          languages?: Json;
          projects?: Json;
          certificates?: Json;
          custom_sections?: Json;
          share_token?: string | null;
          reminder_days?: number[];
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          resume_id: string;
          user_id: string;
          name: string;
          type: string;
          size: number;
          category: string;
          storage_path: string | null;
          data_url: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          user_id: string;
          name: string;
          type: string;
          size: number;
          category: string;
          storage_path?: string | null;
          data_url?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          size?: number;
          category?: string;
          storage_path?: string | null;
          data_url?: string | null;
          uploaded_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          position: string;
          status: string;
          type: string;
          applied_date: string | null;
          deadline: string | null;
          notes: string | null;
          url: string | null;
          resume_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          position: string;
          status?: string;
          type?: string;
          applied_date?: string | null;
          deadline?: string | null;
          notes?: string | null;
          url?: string | null;
          resume_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company?: string;
          position?: string;
          status?: string;
          type?: string;
          applied_date?: string | null;
          deadline?: string | null;
          notes?: string | null;
          url?: string | null;
          resume_id?: string | null;
        };
      };
      share_links: {
        Row: {
          id: string;
          resume_id: string;
          user_id: string;
          token: string;
          label: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          user_id: string;
          token?: string;
          label?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          user_id?: string;
          token?: string;
          label?: string | null;
          is_active?: boolean;
        };
      };
      resume_views: {
        Row: {
          id: string;
          share_link_id: string;
          viewed_at: string;
          country: string | null;
          country_code: string | null;
          city: string | null;
          device: string | null;
          browser: string | null;
          referrer: string | null;
          duration_s: number | null;
        };
        Insert: {
          id?: string;
          share_link_id: string;
          viewed_at?: string;
          country?: string | null;
          country_code?: string | null;
          city?: string | null;
          device?: string | null;
          browser?: string | null;
          referrer?: string | null;
          duration_s?: number | null;
        };
        Update: {
          duration_s?: number | null;
        };
      };
      contact_log: {
        Row: {
          id: string;
          user_id: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sent_at?: string;
        };
        Update: never;
      };
      contact_log_public: {
        Row: {
          id: string;
          ip_hash: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          ip_hash: string;
          sent_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
