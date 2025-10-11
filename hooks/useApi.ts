import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  authApi,
  categoriesApi,
  expensesApi,
  budgetsApi,
  incomeApi,
  savingsGoalsApi,
  savingsTransactionsApi,
  reportsApi,
} from '../services/api/api';
import type * as Types from '../services/api/types';

// Query Keys
export const queryKeys = {
  auth: ['auth'] as const,
  categories: ['categories'] as const,
  expenses: ['expenses'] as const,
  expensesByParams: (params?: Types.ExpenseListParams) => ['expenses', params] as const,
  budgets: ['budgets'] as const,
  budgetStatus: ['budgets', 'status'] as const,
  income: ['income'] as const,
  savingsGoals: ['savings-goals'] as const,
  savingsGoalProgress: ['savings-goals', 'progress'] as const,
  savingsTransactions: ['savings-transactions'] as const,
  savingsTransactionsByGoal: (goalId?: number) => ['savings-transactions', goalId] as const,
  reports: {
    monthlyExpenditure: (year: number) => ['reports', 'monthly-expenditure', year] as const,
    budgetAdherence: (start: string, end: string) => ['reports', 'budget-adherence', start, end] as const,
    savingsProgress: ['reports', 'savings-progress'] as const,
    categoryDistribution: (start: string, end: string) => ['reports', 'category-distribution', start, end] as const,
    savingsForecast: (months: number) => ['reports', 'savings-forecast', months] as const,
  },
};

// ==================== AUTH HOOKS ====================
export function useCategoryBreakdown(month?: string, options?: UseQueryOptions<Types.CategoryBreakdown[], Error>) {
  return useQuery({
    queryKey: ['expenses', 'category-breakdown', month],
    queryFn: () => expensesApi.categoryBreakdown(month),
    ...options,
  });
}

export function useExpenseTrends(start?: string, end?: string, options?: UseQueryOptions<Types.ExpenseTrends[], Error>) {
  return useQuery({
    queryKey: ['expenses', 'trends', start, end],
    queryFn: () => expensesApi.trends(start, end),
    ...options,
  });
}

// ==================== BUDGETS HOOKS ====================
export function useBudgets(options?: UseQueryOptions<Types.BudgetResponse[], Error>) {
  return useQuery({
    queryKey: queryKeys.budgets,
    queryFn: budgetsApi.list,
    ...options,
  });
}

export function useCreateBudget(options?: UseMutationOptions<Types.BudgetResponse, Error, Types.BudgetCreate>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetStatus });
    },
    ...options,
  });
}

export function useUpdateBudget(options?: UseMutationOptions<{ message: string }, Error, { id: number; data: Types.BudgetUpdate }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => budgetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetStatus });
    },
    ...options,
  });
}

export function useDeleteBudget(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetStatus });
    },
    ...options,
  });
}

export function useBudgetStatus(options?: UseQueryOptions<Types.BudgetStatus[], Error>) {
  return useQuery({
    queryKey: queryKeys.budgetStatus,
    queryFn: budgetsApi.status,
    ...options,
  });
}

// ==================== INCOME HOOKS ====================
export function useCreateIncome(options?: UseMutationOptions<{ message: string }, Error, Types.IncomeCreate>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incomeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.income });
    },
    ...options,
  });
}

export function useIncome(id: number, options?: UseQueryOptions<Types.IncomeResponse, Error>) {
  return useQuery({
    queryKey: [...queryKeys.income, id],
    queryFn: () => incomeApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useUpdateIncome(options?: UseMutationOptions<{ message: string }, Error, { id: number; data: Types.IncomeUpdate }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => incomeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.income });
    },
    ...options,
  });
}

export function useDeleteIncome(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incomeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.income });
    },
    ...options,
  });
}

export function useTotalIncome(startDate: string, endDate: string, options?: UseQueryOptions<{ total_income: number }, Error>) {
  return useQuery({
    queryKey: [...queryKeys.income, 'total', startDate, endDate],
    queryFn: () => incomeApi.total(startDate, endDate),
    enabled: !!startDate && !!endDate,
    ...options,
  });
}

// ==================== SAVINGS GOALS HOOKS ====================
export function useSavingsGoals(params?: Types.SavingsGoalListParams, options?: UseQueryOptions<Types.SavingsGoalResponse[], Error>) {
  return useQuery({
    queryKey: [...queryKeys.savingsGoals, params],
    queryFn: () => savingsGoalsApi.list(params),
    ...options,
  });
}

export function useCreateSavingsGoal(options?: UseMutationOptions<Types.SavingsGoalResponse, Error, Types.SavingsGoalCreate>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savingsGoalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoalProgress });
    },
    ...options,
  });
}

export function useUpdateSavingsGoal(options?: UseMutationOptions<Types.SavingsGoalResponse, Error, { id: number; data: Types.SavingsGoalUpdate }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => savingsGoalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoalProgress });
    },
    ...options,
  });
}

export function useDeleteSavingsGoal(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savingsGoalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoalProgress });
    },
    ...options,
  });
}

export function useSavingsGoalProgress(options?: UseQueryOptions<Types.SavingsGoalProgress[], Error>) {
  return useQuery({
    queryKey: queryKeys.savingsGoalProgress,
    queryFn: savingsGoalsApi.progress,
    ...options,
  });
}

// ==================== SAVINGS TRANSACTIONS HOOKS ====================
export function useSavingsTransactions(goalId?: number, options?: UseQueryOptions<Types.SavingsTransactionResponse[], Error>) {
  return useQuery({
    queryKey: queryKeys.savingsTransactionsByGoal(goalId),
    queryFn: () => savingsTransactionsApi.list(goalId),
    ...options,
  });
}

export function useCreateSavingsTransaction(options?: UseMutationOptions<Types.SavingsTransactionResponse, Error, Types.SavingsTransactionCreate>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savingsTransactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTransactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoalProgress });
    },
    ...options,
  });
}

export function useUpdateSavingsTransaction(options?: UseMutationOptions<Types.SavingsTransactionResponse, Error, { id: number; data: Types.SavingsTransactionUpdate }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => savingsTransactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTransactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
    },
    ...options,
  });
}

export function useDeleteSavingsTransaction(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savingsTransactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTransactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals });
    },
    ...options,
  });
}

export function useGoalContributions(options?: UseQueryOptions<Types.GoalContribution[], Error>) {
  return useQuery({
    queryKey: [...queryKeys.savingsTransactions, 'contributions'],
    queryFn: savingsTransactionsApi.goalContributions,
    ...options,
  });
}

// ==================== REPORTS HOOKS ====================
export function useMonthlyExpenditure(year: number, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.reports.monthlyExpenditure(year),
    queryFn: () => reportsApi.monthlyExpenditure(year),
    enabled: !!year,
    ...options,
  });
}

export function useBudgetAdherence(startDate: string, endDate: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.reports.budgetAdherence(startDate, endDate),
    queryFn: () => reportsApi.budgetAdherence(startDate, endDate),
    enabled: !!startDate && !!endDate,
    ...options,
  });
}

export function useSavingsProgressReport(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.reports.savingsProgress,
    queryFn: reportsApi.savingsProgress,
    ...options,
  });
}

export function useCategoryDistribution(startDate: string, endDate: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.reports.categoryDistribution(startDate, endDate),
    queryFn: () => reportsApi.categoryDistribution(startDate, endDate),
    enabled: !!startDate && !!endDate,
    ...options,
  });
}

export function useSavingsForecast(monthsAhead: number = 12, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.reports.savingsForecast(monthsAhead),
    queryFn: () => reportsApi.savingsForecast(monthsAhead),
    ...options,
  });
}

export function useLogin(options?: UseMutationOptions<Types.TokenResponse, Error, Types.LoginRequest>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth });
    },
    ...options,
  });
}

export function useRegister(options?: UseMutationOptions<Types.UserResponse, Error, Types.RegisterRequest>) {
  return useMutation({
    mutationFn: authApi.register,
    ...options,
  });
}

export function useLogout(options?: UseMutationOptions<void, Error, void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
    },
    ...options,
  });
}

// ==================== CATEGORIES HOOKS ====================
export function useCategories(options?: UseQueryOptions<Types.CategoryResponse[], Error>) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.list,
    ...options,
  });
}

export function useCreateCategory(options?: UseMutationOptions<Types.CategoryResponse, Error, Types.CategoryCreate>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    ...options,
  });
}

export function useUpdateCategory(options?: UseMutationOptions<Types.CategoryResponse, Error, { id: number; data: Types.CategoryUpdate }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    ...options,
  });
}

export function useDeleteCategory(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    ...options,
  });
}

// ==================== EXPENSES HOOKS ====================
export function useExpenses(params?: Types.ExpenseListParams, options?: UseQueryOptions<Types.ExpenseResponse[], Error>) {
  return useQuery({
    queryKey: queryKeys.expensesByParams(params),
    queryFn: () => expensesApi.list(params),
    ...options,
  });
}

export function useCreateExpense(options?: UseMutationOptions<Types.ExpenseResponse, Error, Types.ExpenseCreate>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetStatus });
    },
    ...options,
  });
}

export function useUpdateExpense(options?: UseMutationOptions<Types.ExpenseResponse, Error, { id: number; data: Types.ExpenseUpdate }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetStatus });
    },
    ...options,
  });
}

export function useDeleteExpense(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetStatus });
    },
    ...options,
  });
}

export function useExpenseSummary(month?: string, options?: UseQueryOptions<Types.ExpenseSummary[], Error>) {
  return useQuery({
    queryKey: ['expenses', 'summary', month],
    queryFn: () => expensesApi.summary(month),
    ...options,
  });
}
