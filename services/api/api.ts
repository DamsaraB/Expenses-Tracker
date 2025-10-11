import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  ApiError,
  RegisterRequest,
  LoginRequest,
  TokenResponse,
  UserResponse,
  CategoryCreate,
  CategoryUpdate,
  CategoryResponse,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseResponse,
  ExpenseListParams,
  ExpenseSummary,
  CategoryBreakdown,
  ExpenseTrends,
  BudgetCreate,
  BudgetUpdate,
  BudgetResponse,
  BudgetStatus,
  IncomeCreate,
  IncomeUpdate,
  IncomeResponse,
  SavingsGoalCreate,
  SavingsGoalUpdate,
  SavingsGoalResponse,
  SavingsGoalListParams,
  SavingsGoalProgress,
  SavingsTransactionCreate,
  SavingsTransactionUpdate,
  SavingsTransactionResponse,
  GoalContribution,
} from './types'; 

// Base URL Configuration
const BASE_URL = __DEV__ 
  ? 'http://129.154.41.196:8000' 
  : 'http://129.154.41.196:8000';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// API Client Instance
class ApiClient {
  private client: ReturnType<typeof axios.create>;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor - Add auth token
      this.client.interceptors.request.use(
      (config) => {
        // Use the token already loaded in memory
        if (this.token) {
          if (!config.headers) {
            config.headers = {};
          }
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: any) => {
        if (error?.response?.status === 401) {
          await this.clearAuth();
          // Optionally navigate to login
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error?.response) {
      const detail = (error.response.data as any)?.detail || 'An error occurred';
      return {
        message: detail,
        status: error.response.status,
        detail,
      };
    } else if (error?.request) {
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    }
    return {
      message: error?.message || 'Unknown error',
      status: 0,
    };
  }

  // Token Management
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  async clearAuth(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  // Generic request method
  async request<T>(config: any): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}

const apiClient = new ApiClient();

// ==================== AUTH APIs ====================
export const authApi = {
  register: async (data: RegisterRequest): Promise<UserResponse> => {
    return apiClient.request({
      method: 'POST',
      url: '/api/users/register',
      data,
    });
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.request<TokenResponse>({
      method: 'POST',
      url: '/api/users/login',
      data,
    });
    await apiClient.setToken(response.access_token);
    return response;
  },

  logout: async (): Promise<void> => {
    await apiClient.clearAuth();
  },
};

// ==================== CATEGORIES APIs ====================
export const categoriesApi = {
  list: async (): Promise<CategoryResponse[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/categories/',
    });
  },

  create: async (data: CategoryCreate): Promise<CategoryResponse> => {
    return apiClient.request({
      method: 'POST',
      url: '/api/categories/',
      data,
    });
  },

  update: async (id: number, data: CategoryUpdate): Promise<CategoryResponse> => {
    return apiClient.request({
      method: 'PUT',
      url: `/api/categories/${id}`,
      data,
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.request({
      method: 'DELETE',
      url: `/api/categories/${id}`,
    });
  },
};

// ==================== EXPENSES APIs ====================
export const expensesApi = {
  list: async (params?: ExpenseListParams): Promise<ExpenseResponse[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/expenses/',
      params,
    });
  },

  create: async (data: ExpenseCreate): Promise<ExpenseResponse> => {
    return apiClient.request({
      method: 'POST',
      url: '/api/expenses/',
      data,
    });
  },

  update: async (id: number, data: ExpenseUpdate): Promise<ExpenseResponse> => {
    return apiClient.request({
      method: 'PUT',
      url: `/api/expenses/${id}`,
      data,
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.request({
      method: 'DELETE',
      url: `/api/expenses/${id}`,
    });
  },

  summary: async (month?: string): Promise<ExpenseSummary[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/expenses/summary',
      params: { month },
    });
  },

  categoryBreakdown: async (month?: string): Promise<CategoryBreakdown[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/expenses/category-breakdown',
      params: { month },
    });
  },

  trends: async (start?: string, end?: string): Promise<ExpenseTrends[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/expenses/trends',
      params: { start, end },
    });
  },
};

// ==================== BUDGETS APIs ====================
export const budgetsApi = {
  list: async (): Promise<BudgetResponse[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/budgets/',
    });
  },

  create: async (data: BudgetCreate): Promise<BudgetResponse> => {
    return apiClient.request({
      method: 'POST',
      url: '/api/budgets/',
      data,
    });
  },

  update: async (id: number, data: BudgetUpdate): Promise<{ message: string }> => {
    return apiClient.request({
      method: 'PUT',
      url: `/api/budgets/${id}`,
      data,
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.request({
      method: 'DELETE',
      url: `/api/budgets/${id}`,
    });
  },

  status: async (): Promise<BudgetStatus[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/budgets/status',
    });
  },
};

// ==================== INCOME APIs ====================
export const incomeApi = {
  create: async (data: IncomeCreate): Promise<{ message: string }> => {
    return apiClient.request({
      method: 'POST',
      url: '/api/income/',
      data,
    });
  },

  get: async (id: number): Promise<IncomeResponse> => {
    return apiClient.request({
      method: 'GET',
      url: `/api/income/${id}`,
    });
  },

  update: async (id: number, data: IncomeUpdate): Promise<{ message: string }> => {
    return apiClient.request({
      method: 'PUT',
      url: `/api/income/${id}`,
      data,
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.request({
      method: 'DELETE',
      url: `/api/income/${id}`,
    });
  },

  total: async (startDate: string, endDate: string): Promise<{ total_income: number }> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/income/total',
      params: { start_date: startDate, end_date: endDate },
    });
  },
};

// ==================== SAVINGS GOALS APIs ====================
export const savingsGoalsApi = {
  list: async (params?: SavingsGoalListParams): Promise<SavingsGoalResponse[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/savings-goals/',
      params,
    });
  },

  create: async (data: SavingsGoalCreate): Promise<SavingsGoalResponse> => {
    return apiClient.request({
      method: 'POST',
      url: '/api/savings-goals/',
      data,
    });
  },

  update: async (id: number, data: SavingsGoalUpdate): Promise<SavingsGoalResponse> => {
    return apiClient.request({
      method: 'PUT',
      url: `/api/savings-goals/${id}`,
      data,
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.request({
      method: 'DELETE',
      url: `/api/savings-goals/${id}`,
    });
  },

  progress: async (): Promise<SavingsGoalProgress[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/savings-goals/progress',
    });
  },
};

// ==================== SAVINGS TRANSACTIONS APIs ====================
export const savingsTransactionsApi = {
  list: async (goalId?: number): Promise<SavingsTransactionResponse[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/savings-transactions/',
      params: { goal_id: goalId },
    });
  },

  create: async (data: SavingsTransactionCreate): Promise<SavingsTransactionResponse> => {
    return apiClient.request({
      method: 'POST',
      url: '/api/savings-transactions/',
      data,
    });
  },

  update: async (id: number, data: SavingsTransactionUpdate): Promise<SavingsTransactionResponse> => {
    return apiClient.request({
      method: 'PUT',
      url: `/api/savings-transactions/${id}`,
      data,
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.request({
      method: 'DELETE',
      url: `/api/savings-transactions/${id}`,
    });
  },

  goalContributions: async (): Promise<GoalContribution[]> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/savings-transactions/goal-contributions',
    });
  },
};

// ==================== REPORTS APIs ====================
export const reportsApi = {
  monthlyExpenditure: async (year: number): Promise<any> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/reports/monthly-expenditure',
      params: { year },
    });
  },

  budgetAdherence: async (startDate: string, endDate: string): Promise<any> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/reports/budget-adherence',
      params: { start_date: startDate, end_date: endDate },
    });
  },

  savingsProgress: async (): Promise<any> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/reports/savings-progress',
    });
  },

  categoryDistribution: async (startDate: string, endDate: string): Promise<any> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/reports/category-distribution',
      params: { start_date: startDate, end_date: endDate },
    });
  },

  savingsForecast: async (monthsAhead: number = 12): Promise<any> => {
    return apiClient.request({
      method: 'GET',
      url: '/api/reports/savings-forecast',
      params: { months_ahead: monthsAhead },
    });
  },
};

