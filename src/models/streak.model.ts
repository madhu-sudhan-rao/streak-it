// Types for streak
export interface Streak {
  id: number;
  name: string;
  description?: string;
  count: number;
  createdDate: string; // stored as date string
  lastCompleted: string | null; // date string or null
  completedDates: string[]; // array of date strings
  emoji?: string; // optional emoji for the streak
}