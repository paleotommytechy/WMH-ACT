
export type UserRole = 'student' | 'admin' | 'member';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  phone_number: string | null;
  profile_image: string | null;
  bio: string | null;
  gender: string | null;
  date_of_birth: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  timezone: string;

  // Professional / Learning
  role_title: string | null;
  skill_level: SkillLevel | null;
  primary_track: string | null;
  secondary_track: string | null;
  interests: string[] | null;
  goals: string | null;
  learning_focus: string | null;
  portfolio_link: string | null;
  github_link: string | null;
  linkedin_link: string | null;
  twitter_link: string | null;
  personal_website: string | null;

  // Productivity & Accountability
  current_streak: number;
  longest_streak: number;
  total_focus_hours: number;
  total_tasks_completed: number;
  total_submissions: number;
  active_days: number;
  weekly_consistency_score: number;
  monthly_consistency_score: number;
  productivity_rating: number;
  accountability_level: string;
  last_submission_date: string | null;
  last_active_at: string;

  // Gamification
  xp_points: number;
  current_level: number;
  badges: any[];
  achievements: any[];
  rank_title: string;
  reputation_score: number;

  // Weekly Review
  current_week_status: string;
  weekly_goal: string | null;
  weekly_focus: string | null;
  reflection_completion_rate: number;
  proof_submission_rate: number;

  // Community
  public_profile_enabled: boolean;
  allow_leaderboard_visibility: boolean;
  allow_public_portfolio: boolean;
  community_role: UserRole;
  mentorship_status: string;

  // System
  onboarding_completed: boolean;
  onboarding_step: number;
  preferred_theme: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
  account_status: string;
  created_at: string;
  updated_at: string;
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
  is_draft: boolean;
  created_at: string;
  review?: SubmissionReview;
}

export interface SubmissionReview {
  id: string;
  submission_id: string;
  admin_id: string | null;
  status: 'pending' | 'reviewed' | 'flagged' | 'excellent';
  admin_notes: string | null;
  low_effort_detected: boolean;
  created_at: string;
  updated_at: string;
  admin?: {
    full_name: string | null;
  };
}

export interface Announcement {
  id: string;
  created_by: string;
  title: string;
  content: string;
  is_active: boolean;
  target_role: string;
  created_at: string;
  expires_at: string | null;
}

export interface UserStats {
  totalHours: number;
  totalSubmissions: number;
  currentStreak: number;
  longestStreak: number;
  lastActive: string | null;
  status: 'active' | 'at-risk' | 'inactive';
}
