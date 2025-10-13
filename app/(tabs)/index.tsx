import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { getBudgetSummary } from '../../services/budgetService';
import { getMonthlyRemainingSalary } from '../../services/database';
import { getUserExpenses } from '../../services/expenseService';
import { getSavingsSummary } from '../../services/savingsService';

type Expense = {
  id: string;
  title: string;
  amount: number;
  expense_date: string;
  category_name?: string;
  category_icon?: string;
};

type BudgetSummary = {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
};

type SavingsSummary = {
  totalTarget: number;
  totalSaved: number;
  progress: number;
};

export default function HomeScreen() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<{
    totalExpenses: number;
    recentExpenses: Expense[];
    budgetSummary: BudgetSummary;
    savingsSummary: SavingsSummary;
     remainingSalary: number;
  }>({
    totalExpenses: 0,
    recentExpenses: [],
    budgetSummary: { totalBudget: 0, totalSpent: 0, remaining: 0 },
     savingsSummary: { totalTarget: 0, totalSaved: 0, progress: 0 },
     remainingSalary: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
  }, [user?.monthly_income]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [expenses, budgetSummary, savingsSummary] = await Promise.all([
        getUserExpenses(user.id, 5), 
        getBudgetSummary(user.id),
        getSavingsSummary(user.id)
      ]);

      const currentMonth = new Date().toISOString().substr(0, 7);
      const monthlyExpenses = expenses.filter(expense => 
        expense.expense_date.startsWith(currentMonth)
      );
      const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      const remainingSalary = await getMonthlyRemainingSalary(user.id, currentMonth);

      setDashboardData({
        totalExpenses,
        recentExpenses: expenses.map(expense => ({
          ...expense,
          id: expense.id.toString()
        })),
        budgetSummary,
        savingsSummary,
        remainingSalary
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Add Expense':
        router.push('/expenses');
        break;
      case 'View Budget':
        router.push('/budget');
        break;
      case 'Add Savings Goal':
        router.push('/savings');
        break;
      case 'View Reports':
        router.push('/profile');
        break;
      default:
        Alert.alert('Quick Action', `${action} feature coming soon!`);
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'Rs',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `Rs. ${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
    }
  };

  const getBudgetProgress = () => {
    const { totalBudget, totalSpent } = dashboardData.budgetSummary;
    if (totalBudget === 0) return 0;
    return Math.min((totalSpent / totalBudget) * 100, 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
            <Text style={styles.title}>Personal Finance</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: 12, padding: 8, backgroundColor: '#007AFF', borderRadius: 8 }}
              onPress={() => router.push('/debug')}
            >
              <Ionicons name="bug-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Salary Card */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Remaining Salary</Text>
              <Ionicons name="wallet-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
              {formatCurrency(dashboardData.remainingSalary)}
            </Text>
            <Text style={styles.summarySubtext}>After this month's expenses</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          
          {/* Expenses Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Ionicons name="trending-down" size={20} color="#F44336" />
            </View>
            <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
              {formatCurrency(dashboardData.totalExpenses)}
            </Text>
          </View>

          {/* Budget Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Budget Status</Text>
              <Ionicons name="pie-chart" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.summaryAmount}>
              {formatCurrency(dashboardData.budgetSummary.remaining)}
            </Text>
            <Text style={styles.summarySubtext}>Remaining</Text>
          </View>

          {/* Savings Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Savings Progress</Text>
              <Ionicons name="wallet" size={20} color="#2196F3" />
            </View>
            <Text style={styles.summaryAmount}>
              {formatCurrency(dashboardData.savingsSummary.totalSaved)}
            </Text>
            <Text style={styles.summarySubtext}>
              {dashboardData.savingsSummary.progress.toFixed(1)}% of goals
            </Text>
          </View>

          {/* Budget Progress Card */}
          {dashboardData.budgetSummary.totalBudget > 0 && (
            <View style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>Monthly Budget</Text>
                <Text style={styles.budgetAmount}>
                  {formatCurrency(dashboardData.budgetSummary.totalSpent)} / {formatCurrency(dashboardData.budgetSummary.totalBudget)}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getBudgetProgress()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.budgetRemaining}>
                {formatCurrency(dashboardData.budgetSummary.remaining)} remaining
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('Add Expense')}
            >
              <Ionicons name="add-circle" size={32} color="#007AFF" />
              <Text style={styles.actionText}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('View Budget')}
            >
              <Ionicons name="pie-chart" size={32} color="#4CAF50" />
              <Text style={styles.actionText}>View Budget</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('Add Savings Goal')}
            >
              <Ionicons name="rocket-outline" size={32} color="#FF9800" />
              <Text style={styles.actionText}>Savings Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('View Profile')}
            >
              <Ionicons name="analytics" size={32} color="#9C27B0" />
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/expenses')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.recentExpenses.length > 0 ? (
            dashboardData.recentExpenses.map((expense) => (
              <View key={expense.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionEmoji}>{expense.category_icon || '💳'}</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>{expense.title}</Text>
                  <Text style={styles.transactionCategory}>{expense.category_name}</Text>
                  <Text style={styles.transactionDate}>{new Date(expense.expense_date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.transactionAmount}>-{formatCurrency(expense.amount)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>No recent transactions</Text>
              <Text style={styles.emptySubtext}>Add your first expense to see it here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  notificationButton: {
    padding: 8,
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summarySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  budgetRemaining: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginTop: 8,
    textAlign: 'center',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
