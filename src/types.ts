export interface Habit {
  id: string;
  name: string;
  description?: string;
  whyItMatters?: string;
  benefits?: string;
  category: string;
  createdBy: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  achievements: string[];
  weeklyGoal: number;
  createdAt: string;
  isAdmin?: boolean;
  darkMode?: boolean;
}

export interface WeeklyProgress {
  id: string; // The week start date (YYYY-MM-DD, e.g. "2026-07-06")
  completions: { [habitKey: string]: boolean }; // key is habitId_DayOfWeek, e.g. "arrived_on_time_Monday"
  notes: { [day: string]: string }; // e.g. { "Monday": "Note content..." }
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon identifier
  color: string; // Tailwind color classes
}

export interface DailyReminder {
  id: string;
  time: string; // e.g. "08:00"
  message: string;
  enabled: boolean;
}
