
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Helper for type-safe queries if needed later
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: 'student' | 'admin';
          streak_count: number;
          longest_streak: number;
          last_submission_date: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: 'student' | 'admin';
          streak_count?: number;
          longest_streak?: number;
          last_submission_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: 'student' | 'admin';
          streak_count?: number;
          longest_streak?: number;
          last_submission_date?: string | null;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          task_name: string;
          time_spent: number;
          reflection: string;
          proof_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_name: string;
          time_spent: number;
          reflection: string;
          proof_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
