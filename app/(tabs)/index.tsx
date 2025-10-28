import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { categoriesApi, expensesApi } from '../../services/api/api'; // Add imports
import { getBudgetSummary } from '../../services/budgetService';
import { getUserExpenses } from '../../services/expenseService';
import { getSavingsSummary, getSavingsTransactionsForGoal, getUserSavingsGoals } from '../../services/savingsService';
import PageHeader from '../components/PageHeader';

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

// Add type for savings transaction:
type SavingsTransaction = {
  id: number;
  goal_id: number;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  description?: string;
};

type ExpenseBreakdownItem = {
  name: string;
  icon: string;
  color: string;
  total: number;
};

export default function HomeScreen() {
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const [dashboardData, setDashboardData] = useState<{
    totalExpenses: number;
    totalIncome: number; // Add totalIncome
    recentExpenses: Expense[];
    budgetSummary: BudgetSummary;
    savingsSummary: SavingsSummary;
  }>({
    totalExpenses: 0,
    totalIncome: 0, // Initialize totalIncome
    recentExpenses: [],
    budgetSummary: { totalBudget: 0, totalSpent: 0, remaining: 0 },
    savingsSummary: { totalTarget: 0, totalSaved: 0, progress: 0 }
  });
  const [recentSavings, setRecentSavings] = useState<SavingsTransaction[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Real-time updates: Reload data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadDashboardData();
      }
    }, [user])
  );

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get current month date range
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().substr(0, 7);
      const startOfMonth = `${currentMonth}-01`;
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        .toISOString().substr(0, 10);

      const [expenses, budgetSummary, savingsSummary, monthlyExpenses, categoriesData] = await Promise.all([
        getUserExpenses(user.id, 5),
        getBudgetSummary(user.id),
        getSavingsSummary(user.id),
        // Fetch monthly expenses from backend
        expensesApi.list({ 
          user_id: user.id,
          start_date: startOfMonth,
          end_date: endOfMonth 
        }).catch(() => []),
        // Fetch categories for mapping
        categoriesApi.list().catch(() => []),
      ]);

      

      // Calculate total expenses for the month
      const totalExpenses = monthlyExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);

      // Get monthly salary from user profile
      const monthlySalary = user.monthly_income || 0;

      // Get recent savings transactions (from all goals)
      const goals = getUserSavingsGoals(user.id) || [];
      let savingsTx: SavingsTransaction[] = [];
      for (const goal of goals) {
        const txs = getSavingsTransactionsForGoal(goal.id) || [];
        savingsTx = savingsTx.concat(txs);
      }
      // Sort and take latest 5
      savingsTx = savingsTx.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).slice(0, 5);
      setRecentSavings(savingsTx);

      // Calculate expense breakdown by category directly from monthly expenses
      const categoryTotals = new Map<number, { name: string; icon: string; color: string; total: number }>();
      
      // Define some default colors for fallback
      const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
      let colorIndex = 0;
      
      monthlyExpenses.forEach((expense: any) => {
        const category = categoriesData.find((cat: any) => cat.id === expense.category_id);
        const categoryId = expense.category_id || 0;
        
        if (categoryTotals.has(categoryId)) {
          const existing = categoryTotals.get(categoryId)!;
          existing.total += expense.amount;
        } else {
          categoryTotals.set(categoryId, {
            name: category?.name || 'Uncategorized',
            icon: category?.icon || '💳',
            color: category?.color || defaultColors[colorIndex++ % defaultColors.length],
            total: expense.amount,
          });
        }
      });
      
      const breakdown = Array.from(categoryTotals.values()).sort((a, b) => b.total - a.total);
      setExpenseBreakdown(breakdown);

      setDashboardData({
        totalExpenses,
        totalIncome: monthlySalary, // Use monthly salary from user profile
        recentExpenses: expenses.map(expense => ({
          ...expense,
          id: expense.id.toString()
        })),
        budgetSummary,
        savingsSummary
      });
    } catch (error) {
      // Fallback to local data - Don't show alerts for background sync failures
      try {
        const localExpenses = await getUserExpenses(user.id, 5);
        const currentMonth = new Date().toISOString().substr(0, 7);
        const monthlyExpenses = localExpenses.filter(expense => 
          expense.expense_date.startsWith(currentMonth)
        );
        const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        setDashboardData(prev => ({
          ...prev,
          totalExpenses,
          totalIncome: user.monthly_income || 0, // Use monthly salary from user profile
          recentExpenses: localExpenses.map(expense => ({
            ...expense,
            id: expense.id.toString()
          })),
        }));
      } catch (localError) {
        // Silently handle errors - app will show empty state
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Add Expense':
        router.push('/expenses');
        break;
      case 'Add Savings Goal':
        router.push('/savings');
        break;
      case 'View Reports':
        router.push('./reports');
        break;
      case 'Manage Income': // Add new action
        router.push('/profile/income');
        break;
      default:
        Alert.alert('Quick Action', `${action} feature coming soon!`);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${Number(amount || 0).toLocaleString('en-LK', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: Colors[isDarkMode ? 'dark' : 'light'].text }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const remainingBalance = dashboardData.totalIncome - dashboardData.totalExpenses;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#F5F5F5' : '#F8F9FA' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <PageHeader
          title={"HOME"}
          leftIconName="person-outline"
          rightIconName="notifications-outline"
          onLeftPress={() => router.push('/profile')}
        />

        {/* Total Balance Card */}
        <View style={styles.balanceCardContainer}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Remaining Salary</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(remainingBalance)}</Text>

            {/* Salary Breakdown */}
            <View style={styles.balanceBreakdown}>
              <View style={styles.balanceBreakdownRow}>
                <Text style={styles.balanceBreakdownLabel}>Monthly Salary</Text>
                <Text style={styles.balanceBreakdownValue}>{formatCurrency(dashboardData.totalIncome)}</Text>
              </View>
              <View style={styles.balanceBreakdownRow}>
                <Text style={styles.balanceBreakdownLabel}>Expenses</Text>
                <Text style={[styles.balanceBreakdownValue, { color: '#FF6B6B' }]}>-{formatCurrency(dashboardData.totalExpenses)}</Text>
              </View>
            </View>

            <View style={styles.cardNumberContainer}>
              <Text style={styles.cardNumber}>2044  7845  3867  1995</Text>
            </View>
            <View style={styles.cardLogoContainer}>
              <View style={styles.mastercardCircle1} />
              <View style={styles.mastercardCircle2} />
            </View>
          </View>
        </View>

        {/* Expense Breakdown Pie Chart */}
        <View style={styles.analyticsSection}>
          <View style={styles.analyticsSectionHeader}>
            <Text style={styles.analyticsTitle}>Expense Breakdown</Text>
            <Text style={styles.monthLabel}>This Month</Text>
          </View>
          
          <View style={styles.chartContainer}>
            <Text style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>
              Debug: {expenseBreakdown.length} categories found
            </Text>
            {expenseBreakdown.length > 0 ? (
              <>
                {/* Pie Chart */}
                <View style={styles.pieChartContainer}>
                  <Svg width={200} height={200} viewBox="0 0 200 200">
                    <G rotation="0" origin="100, 100">
                      {(() => {
                        const total = expenseBreakdown.reduce((sum, item) => sum + item.total, 0);
                        let currentAngle = 0;
                        
                        return expenseBreakdown.map((item, index) => {
                          const percentage = (item.total / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;
                          
                          // Convert to radians
                          const startRad = (startAngle - 90) * (Math.PI / 180);
                          const endRad = (currentAngle - 90) * (Math.PI / 180);
                          
                          // Calculate arc path
                          const radius = 80;
                          const x1 = 100 + radius * Math.cos(startRad);
                          const y1 = 100 + radius * Math.sin(startRad);
                          const x2 = 100 + radius * Math.cos(endRad);
                          const y2 = 100 + radius * Math.sin(endRad);
                          
                          const largeArcFlag = angle > 180 ? 1 : 0;
                          
                          const pathData = [
                            `M 100 100`,
                            `L ${x1} ${y1}`,
                            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            `Z`
                          ].join(' ');
                          
                          return (
                            <G key={index}>
                              <Circle
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                stroke={item.color}
                                strokeWidth={radius}
                                strokeDasharray={`${(percentage / 100) * (2 * Math.PI * radius)} ${2 * Math.PI * radius}`}
                                strokeDashoffset={-1 * (startAngle / 360) * (2 * Math.PI * radius)}
                                rotation={-90}
                                origin="100, 100"
                              />
                            </G>
                          );
                        });
                      })()}
                      {/* Center circle for donut effect */}
                      <Circle cx="100" cy="100" r="50" fill="#FFFFFF" />
                      <SvgText
                        x="100"
                        y="95"
                        fontSize="14"
                        fontWeight="600"
                        fill="#666"
                        textAnchor="middle"
                      >
                        Total
                      </SvgText>
                      <SvgText
                        x="100"
                        y="110"
                        fontSize="16"
                        fontWeight="bold"
                        fill="#1a1a1a"
                        textAnchor="middle"
                      >
                        {formatCurrency(expenseBreakdown.reduce((sum, item) => sum + item.total, 0)).replace('Rs. ', '')}
                      </SvgText>
                    </G>
                  </Svg>
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                  {expenseBreakdown.map((item, index) => {
                    const total = expenseBreakdown.reduce((sum, cat) => sum + cat.total, 0);
                    const percentage = ((item.total / total) * 100).toFixed(1);
                    
                    return (
                      <View key={index} style={styles.legendItem}>
                        <View style={styles.legendLeft}>
                          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                          <Text style={styles.legendIcon}>{item.icon}</Text>
                          <Text style={styles.legendLabel}>{item.name}</Text>
                        </View>
                        <View style={styles.legendRight}>
                          <Text style={styles.legendAmount}>{formatCurrency(item.total)}</Text>
                          <Text style={styles.legendPercentage}>{percentage}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="pie-chart-outline" size={48} color="#CCC" />
                <Text style={styles.emptyChartText}>No expense data available</Text>
                <Text style={styles.emptyChartSubtext}>Add expenses to see breakdown</Text>
              </View>
            )}
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/expenses')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {/* Transaction Items */}
          {dashboardData.recentExpenses.length > 0 || recentSavings.length > 0 ? (
            [
              ...dashboardData.recentExpenses.map(expense => ({
                ...expense,
                type: 'expense',
                date: expense.expense_date,
              })),
              ...recentSavings.map(tx => ({
                ...tx,
                type: 'savings',
                date: tx.transaction_date,
              }))
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map(item => (
                <View key={item.id + item.type} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.transactionIconBox}>
                      <Text style={styles.transactionEmoji}>
                        {item.type === 'expense' && 'category_icon' in item ? (item.category_icon || '💳') : '💰'}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>
                        {'title' in item ? item.title : item.description || 'Savings'}
                      </Text>
                      <Text style={styles.transactionType}>
                        {item.type === 'expense' && 'category_name' in item
                          ? item.category_name
                          : item.type === 'savings' && 'transaction_type' in item
                          ? item.transaction_type
                          : 'Transaction'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmountNew, { color: item.type === 'expense' ? '#F44336' : '#4CAF50' }]}>
                      Rs. {item.amount.toLocaleString('en-LK', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={styles.transactionDateNew}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
                    </Text>
                  </View>
                </View>
              ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>No recent transactions</Text>
              <Text style={styles.emptySubtext}>Add your first expense or savings to see it here</Text>
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
    paddingTop: 25,
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
  profileButton: {
    padding: 4,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  notificationButton: {
    padding: 4,
  },
  balanceCardContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: '#2D3142',
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#B8B8D1',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  balanceBreakdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  balanceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  balanceBreakdownLabel: {
    fontSize: 13,
    color: '#B8B8D1',
  },
  balanceBreakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardNumberContainer: {
    marginBottom: 20,
  },
  cardNumber: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  cardLogoContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    flexDirection: 'row',
  },
  mastercardCircle1: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EB001B',
    marginRight: -10,
  },
  mastercardCircle2: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F79E1B',
  },
  analyticsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  analyticsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  monthLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  legendContainer: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  legendPercentage: {
    fontSize: 12,
    color: '#666',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewAllText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 13,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmountNew: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDateNew: {
    fontSize: 12,
    color: '#999',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 10,
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