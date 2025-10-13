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
  updated_at: string;
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
  title?: string; // <-- Add this line
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
  spent_amount: number;
  title: string;
  spent: number;
  server_id: number;
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
  is_recurring?: boolean;
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
  updated_at: string;
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

// Add these interfaces to your types file

export interface MonthlyExpenditureData {
  month_number: number;
  month_name: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  trend: string;
}

export interface BudgetAdherenceData {
  budget_id: number;
  category_name: string;
  budget_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  status: 'Over Budget' | 'Alert' | 'On Track';
}

export interface SavingsProgressData {
  goal_id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  is_achieved: boolean;
  category: string;
  priority: string;
  progress_percentage: number;
}

export interface CategoryDistributionData {
  category_name: string;
  color: string;
  icon: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  percentage_of_total: number;
}

export interface SavingsForecastData {
  month_offset: number;
  forecast_month: string;
  projected_income: number;
  projected_expense: number;
  projected_monthly_savings: number;
  cumulative_savings: number;
  trend: 'Positive' | 'Negative';
}

export interface ReportResponse<T> {
  data: T[];
}
