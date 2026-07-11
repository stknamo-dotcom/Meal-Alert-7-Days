export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type MealStatus = "planned" | "eaten" | "skipped";

export interface MealItem {
  id: string; // e.g., "Monday-breakfast" or timestamp
  day: DayOfWeek;
  mealType: MealType;
  menuName: string;
  calories: number;
  description: string;
  status: MealStatus;
  notified?: boolean;
  time?: string; // e.g., "08:00" - if set, overrides global notificationTime
  isCustom?: boolean; // If true, this meal was added by the user and can be deleted
}

export interface NotificationTimes {
  breakfast: string; // "08:00"
  lunch: string;     // "12:00"
  dinner: string;    // "18:00"
}

export interface HealthLog {
  id: string;
  timestamp: number;
  mealId: string;
  menuName: string;
  day: DayOfWeek;
  mealType: MealType;
  action: "eaten" | "skipped";
}

export interface ReminderNotification {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  mealType: MealType;
  read: boolean;
}
