export interface ApiError {
  message: string;
  status: number;
  detail?: string;
}

// Auth Types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  monthly_income?: number;
  currency?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
  monthly_income: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// Category Types
export interface CategoryCreate {
  name: string;
  color?: string;
  icon?: string;
  is_default?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export interface CategoryResponse {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

// Expense Types
export interface ExpenseCreate {
  category_id: number;
  title: string;
  amount: number;
  description?: string;
  expense_date: string;
  payment_method?: string;
}

export interface ExpenseUpdate {
  category_id?: number;
  title?: string;
  amount?: number;
  description?: string;
  expense_date?: string;
  payment_method?: string;
}

export interface ExpenseResponse {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  amount: number;
  description?: string;
  expense_date: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  last_modified: string;
}

export interface ExpenseListParams {
  user_id?: number;
  category_id?: number;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  modified_since?: string;
}

export interface ExpenseSummary {
  month: string;
  total: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

export interface ExpenseTrends {
  expense_date: string;
  total: number;
}

// Budget Types
export interface BudgetCreate {
  category_id: number;
  amount: number;
  period?: string;
  start_date: string;
  end_date: string;
  alert_threshold?: number;
}

export interface BudgetUpdate {
  amount?: number;
  period?: string;
  start_date?: string;
  end_date?: string;
  alert_threshold?: number;
  is_active?: boolean;
}

export interface BudgetResponse {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetStatus {
  budget_id: number;
  category_name: string;
  budget_amount: number;
  spent_amount: number;
  remaining: number;
  percentage_used: number;
  status: 'under' | 'near' | 'over';
}

// Income Types
export interface IncomeCreate {
  title: string;
  amount: number;
  source: string;
  description?: string;
  income_date: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
}

export interface IncomeUpdate {
  title?: string;
  amount?: number;
  source?: string;
  description?: string;
  income_date?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
}

export interface IncomeResponse {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  source: string;
  description?: string;
  income_date: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  created_at: string;
  updated_at: string;
}

// Savings Goal Types
export interface SavingsGoalCreate {
  title: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  category: string;
  priority?: number;
}

export interface SavingsGoalUpdate {
  title?: string;
  description?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  category?: string;
  priority?: number;
  is_achieved?: boolean;
  is_active?: boolean;
}

export interface SavingsGoalResponse {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: string;
  priority: number;
  is_achieved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalListParams {
  category?: string;
  is_achieved?: boolean;
  is_active?: boolean;
}

export interface SavingsGoalProgress {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  percent_complete: number;
  is_achieved: boolean;
}

// Savings Transaction Types
export interface SavingsTransactionCreate {
  goal_id: number;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  description?: string;
  transaction_date: string;
}

export interface SavingsTransactionUpdate {
  amount?: number;
  transaction_type?: 'deposit' | 'withdrawal';
  description?: string;
  transaction_date?: string;
}

export interface SavingsTransactionResponse {
  id: number;
  user_id: number;
  goal_id: number;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  description?: string;
  transaction_date: string;
  created_at: string;
}

export interface GoalContribution {
  goal_id: number;
  total_deposited: number;
  total_withdrawn: number;
  net_contribution: number;
}
