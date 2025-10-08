// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  monthly_income?: number;
  currency?: string;
}

// Expense Types
export interface Expense {
  id: number;
  title: string;
  amount: number;
  description?: string;
  date: string;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  user_id: number;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  color: string;
  icon: string;
  user_id: number;
}

// Budget Types
export interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  spent?: number;
  user_id: number;
}

// Savings Types
export interface SavingsGoal {
  id: number;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: string;
  priority: number;
  is_achieved: boolean;
  user_id: number;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Expenses: undefined;
  Budget: undefined;
  Savings: undefined;
  Reports: undefined;
};

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
