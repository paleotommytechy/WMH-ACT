
export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  streak_count: number;
  longest_streak: number;
  last_submission_date: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  task_name: string;
  time_spent: number;
  reflection: string;
  proof_url: string | null;
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
