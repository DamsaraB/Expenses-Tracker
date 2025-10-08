import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { mockBudgets, mockExpenses, mockSavingsGoals } from '../../data/mockData';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Food & Dining': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Bills & Utilities': '⚡',
      'Healthcare': '🏥',
      'Education': '📚',
      'Travel': '✈️',
    };
    return icons[category] || '💳';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Dining': '#FF6B6B',
      'Transportation': '#4ECDC4',
      'Entertainment': '#96CEB4',
      'Shopping': '#45B7D1',
      'Bills & Utilities': '#FFEAA7',
      'Healthcare': '#DDA0DD',
      'Education': '#98D8C8',
      'Travel': '#F7DC6F',
    };
    return colors[category] || '#666';
  };

  // Calculate expense breakdown by category
  const getExpenseBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    mockExpenses.forEach(expense => {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
    });
    return breakdown;
  };

  const expenseBreakdown = getExpenseBreakdown();
  const totalExpenses = Object.values(expenseBreakdown).reduce((sum, amount) => sum + amount, 0);

  // Calculate budget performance
  const getBudgetPerformance = () => {
    return mockBudgets.map(budget => ({
      ...budget,
      percentage: (budget.spent / budget.amount) * 100,
      remaining: budget.amount - budget.spent,
    }));
  };

  const budgetPerformance = getBudgetPerformance();

  // Calculate savings progress
  const getSavingsProgress = () => {
    const totalTarget = mockSavingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = mockSavingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    return {
      totalTarget,
      totalSaved,
      percentage: (totalSaved / totalTarget) * 100,
    };
  };

  const savingsProgress = getSavingsProgress();

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.selectedPeriodButton
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.selectedPeriodButtonText
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderExpenseChart = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Expense Breakdown</Text>
      <View style={styles.chartContainer}>
        {Object.entries(expenseBreakdown).map(([category, amount], index) => {
          const percentage = (amount / totalExpenses) * 100;
          const barWidth = (percentage / 100) * (width - 120);
          
          return (
            <View key={category} style={styles.chartRow}>
              <View style={styles.chartLabel}>
                <Text style={styles.chartIcon}>{getCategoryIcon(category)}</Text>
                <Text style={styles.chartCategoryName}>{category}</Text>
              </View>
              <View style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      width: barWidth,
                      backgroundColor: getCategoryColor(category),
                    }
                  ]}
                />
              </View>
              <Text style={styles.chartAmount}>{formatCurrency(amount)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderBudgetPerformance = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Budget Performance</Text>
      {budgetPerformance.map((budget) => (
        <View key={budget.id} style={styles.budgetRow}>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetIcon}>{getCategoryIcon(budget.category)}</Text>
            <View>
              <Text style={styles.budgetCategoryName}>{budget.category}</Text>
              <Text style={styles.budgetDetails}>
                {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
              </Text>
            </View>
          </View>
          <View style={styles.budgetProgress}>
            <View style={styles.budgetProgressBar}>
              <View
                style={[
                  styles.budgetProgressFill,
                  {
                    width: `${Math.min(budget.percentage, 100)}%`,
                    backgroundColor: budget.percentage > 100 ? '#F44336' : '#4CAF50',
                  }
                ]}
              />
            </View>
            <Text style={[
              styles.budgetPercentage,
              { color: budget.percentage > 100 ? '#F44336' : '#4CAF50' }
            ]}>
              {budget.percentage.toFixed(0)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSavingsOverview = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Savings Overview</Text>
      <View style={styles.savingsSummary}>
        <View style={styles.savingsStat}>
          <Text style={styles.savingsLabel}>Total Saved</Text>
          <Text style={styles.savingsAmount}>{formatCurrency(savingsProgress.totalSaved)}</Text>
        </View>
        <View style={styles.savingsStat}>
          <Text style={styles.savingsLabel}>Total Target</Text>
          <Text style={styles.savingsAmount}>{formatCurrency(savingsProgress.totalTarget)}</Text>
        </View>
        <View style={styles.savingsStat}>
          <Text style={styles.savingsLabel}>Progress</Text>
          <Text style={styles.savingsAmount}>{savingsProgress.percentage.toFixed(0)}%</Text>
        </View>
      </View>
      
      <View style={styles.savingsProgressBar}>
        <View
          style={[
            styles.savingsProgressFill,
            {
              width: `${savingsProgress.percentage}%`,
            }
          ]}
        />
      </View>

      <View style={styles.savingsGoalsList}>
        {mockSavingsGoals.map((goal) => (
          <View key={goal.id} style={styles.savingsGoalItem}>
            <Text style={styles.savingsGoalIcon}>{getCategoryIcon(goal.category)}</Text>
            <View style={styles.savingsGoalDetails}>
              <Text style={styles.savingsGoalTitle}>{goal.title}</Text>
              <Text style={styles.savingsGoalAmount}>
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </Text>
            </View>
            <Text style={styles.savingsGoalPercentage}>
              {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSummaryStats = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Summary Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Ionicons name="trending-down" size={24} color="#F44336" />
          <Text style={styles.statLabel}>Total Expenses</Text>
          <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="pie-chart" size={24} color="#2196F3" />
          <Text style={styles.statLabel}>Budget Used</Text>
          <Text style={styles.statValue}>
            {(budgetPerformance.reduce((sum, b) => sum + b.percentage, 0) / budgetPerformance.length).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.statLabel}>Savings Rate</Text>
          <Text style={styles.statValue}>{savingsProgress.percentage.toFixed(0)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="wallet" size={24} color="#FF9800" />
          <Text style={styles.statLabel}>Active Goals</Text>
          <Text style={styles.statValue}>{mockSavingsGoals.length}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderPeriodSelector()}
        {renderSummaryStats()}
        {renderExpenseChart()}
        {renderBudgetPerformance()}
        {renderSavingsOverview()}
        
        {/* Export Section */}
        <View style={styles.exportSection}>
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="download" size={24} color="#007AFF" />
            <Text style={styles.exportButtonText}>Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share" size={24} color="#4CAF50" />
            <Text style={styles.shareButtonText}>Share Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  filterButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  selectedPeriodButtonText: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chartContainer: {
    marginTop: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  chartIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  chartCategoryName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  chartBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  chartBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    width: 80,
    textAlign: 'right',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  budgetCategoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  budgetDetails: {
    fontSize: 12,
    color: '#666',
  },
  budgetProgress: {
    alignItems: 'flex-end',
    width: 100,
  },
  budgetProgressBar: {
    width: 80,
    height: 6,
    backgroundColor: '#e1e5e9',
    borderRadius: 3,
    marginBottom: 4,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  savingsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  savingsStat: {
    alignItems: 'center',
    flex: 1,
  },
  savingsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  savingsProgressBar: {
    height: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 4,
    marginBottom: 20,
  },
  savingsProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  savingsGoalsList: {
    marginTop: 8,
  },
  savingsGoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsGoalIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  savingsGoalDetails: {
    flex: 1,
  },
  savingsGoalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  savingsGoalAmount: {
    fontSize: 12,
    color: '#666',
  },
  savingsGoalPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  exportSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
});
