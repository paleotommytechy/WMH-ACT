
export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  task_completed: string;
  time_spent: number;
  reflection: string;
  proof_url: string | null;
  proof_filename: string | null;
  submitted_date: string;
  created_at: string;
}

export interface UserStats {
  totalHours: number;
  totalSubmissions: number;
  currentStreak: number;
  longestStreak: number;
  lastActive: string | null;
  status: 'active' | 'at-risk' | 'inactive';
}
