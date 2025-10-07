import { Budget, Expense, ExpenseCategory, SavingsGoal } from '../types';

// Mock Expense Categories
export const expenseCategories: ExpenseCategory[] = [
  { id: '1', name: 'Food & Dining', color: '#FF6B6B', icon: '🍽️' },
  { id: '2', name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
  { id: '3', name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
  { id: '4', name: 'Entertainment', color: '#96CEB4', icon: '🎬' },
  { id: '5', name: 'Bills & Utilities', color: '#FFEAA7', icon: '⚡' },
  { id: '6', name: 'Healthcare', color: '#DDA0DD', icon: '🏥' },
  { id: '7', name: 'Education', color: '#98D8C8', icon: '📚' },
  { id: '8', name: 'Travel', color: '#F7DC6F', icon: '✈️' },
];

// Mock Expenses
export const mockExpenses: Expense[] = [
  {
    id: '1',
    title: 'Grocery Shopping',
    amount: 85.50,
    category: 'Food & Dining',
    date: '2024-01-15',
    description: 'Weekly grocery shopping at Whole Foods',
  },
  {
    id: '2',
    title: 'Gas Station',
    amount: 45.00,
    category: 'Transportation',
    date: '2024-01-14',
    description: 'Fuel for car',
  },
  {
    id: '3',
    title: 'Netflix Subscription',
    amount: 15.99,
    category: 'Entertainment',
    date: '2024-01-13',
    description: 'Monthly subscription',
  },
  {
    id: '4',
    title: 'Electric Bill',
    amount: 120.00,
    category: 'Bills & Utilities',
    date: '2024-01-12',
    description: 'Monthly electricity bill',
  },
  {
    id: '5',
    title: 'Coffee Shop',
    amount: 8.50,
    category: 'Food & Dining',
    date: '2024-01-11',
    description: 'Morning coffee',
  },
];

// Mock Budgets
export const mockBudgets: Budget[] = [
  {
    id: '1',
    category: 'Food & Dining',
    amount: 500,
    spent: 320.50,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  {
    id: '2',
    category: 'Transportation',
    amount: 200,
    spent: 145.00,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  {
    id: '3',
    category: 'Entertainment',
    amount: 100,
    spent: 75.99,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  {
    id: '4',
    category: 'Shopping',
    amount: 300,
    spent: 180.00,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
];

// Mock Savings Goals
export const mockSavingsGoals: SavingsGoal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 6500,
    targetDate: '2024-12-31',
    category: 'Emergency',
  },
  {
    id: '2',
    title: 'Vacation to Europe',
    targetAmount: 5000,
    currentAmount: 2800,
    targetDate: '2024-06-15',
    category: 'Travel',
  },
  {
    id: '3',
    title: 'New Laptop',
    targetAmount: 2000,
    currentAmount: 1200,
    targetDate: '2024-04-01',
    category: 'Electronics',
  },
  {
    id: '4',
    title: 'Home Down Payment',
    targetAmount: 50000,
    currentAmount: 15000,
    targetDate: '2025-12-31',
    category: 'Housing',
  },
];

// Mock Summary Data
export const mockSummaryData = {
  totalExpenses: 274.99,
  totalIncome: 5000,
  totalSavings: 25100,
  monthlyBudget: 1100,
  budgetSpent: 721.49,
  remainingBudget: 378.51,
};
