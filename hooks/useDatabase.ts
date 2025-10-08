import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getBudgetSummary, getUserBudgets } from '../services/budgetService';
import { getMonthlyExpenseSummary, getUserCategories, getUserExpenses } from '../services/expenseService';
import { getSavingsSummary, getUserSavingsGoals } from '../services/savingsService';

export const useDatabase = () => {
  const { user } = useUser();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState({
    monthlyExpenses: 0,
    budgetSummary: { totalBudget: 0, totalSpent: 0, remaining: 0 },
    savingsSummary: { totalTarget: 0, totalSaved: 0, progress: 0 }
  });
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [
        expensesData,
        categoriesData,
        budgetsData,
        savingsData,
        monthlyExpenses,
        budgetSummary,
        savingsSummary
      ] = await Promise.all([
        getUserExpenses(user.id),
        getUserCategories(user.id),
        getUserBudgets(user.id),
        getUserSavingsGoals(user.id),
        getMonthlyExpenseSummary(user.id),
        getBudgetSummary(user.id),
        getSavingsSummary(user.id)
      ]);

      setExpenses(expensesData);
      setCategories(categoriesData);
      setBudgets(budgetsData);
      setSavingsGoals(savingsData);
      setSummaryData({
        monthlyExpenses,
        budgetSummary,
        savingsSummary
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  return {
    expenses,
    categories,
    budgets,
    savingsGoals,
    summaryData,
    loading,
    refreshData
  };
};