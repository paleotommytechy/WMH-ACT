
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
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'student' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'student' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'student' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          task_completed: string;
          time_spent: number;
          reflection: string;
          proof_url: string | null;
          proof_filename: string | null;
          submitted_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_completed: string;
          time_spent: number;
          reflection: string;
          proof_url?: string | null;
          proof_filename?: string | null;
          submitted_date: string;
          created_at?: string;
        };
      };
    };
  };
};
