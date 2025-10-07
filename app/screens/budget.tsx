import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { mockBudgets } from '../../data/mockData';

export default function BudgetScreen() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBudgetProgress = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    return Math.min(percentage, 100);
  };

  const getProgressColor = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 90) return '#F44336';
    if (percentage >= 75) return '#FF9800';
    return '#4CAF50';
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

  const handleEditBudget = (budget: any) => {
    Alert.alert('Edit Budget', `Edit ${budget.category} budget feature coming soon!`);
  };

  const handleAddBudget = () => {
    Alert.alert('Add Budget', 'Add new budget feature coming soon!');
  };

  const renderBudgetItem = (budget: any) => (
    <View key={budget.id} style={styles.budgetItem}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetCategory}>
          <Text style={styles.budgetIcon}>{getCategoryIcon(budget.category)}</Text>
          <View>
            <Text style={styles.budgetCategoryName}>{budget.category}</Text>
            <Text style={styles.budgetPeriod}>{budget.period}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditBudget(budget)}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.budgetAmounts}>
        <Text style={styles.budgetSpent}>
          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
        </Text>
        <Text style={styles.budgetRemaining}>
          {formatCurrency(budget.amount - budget.spent)} remaining
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${getBudgetProgress(budget.spent, budget.amount)}%`,
                backgroundColor: getProgressColor(budget.spent, budget.amount),
              },
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>
          {getBudgetProgress(budget.spent, budget.amount).toFixed(0)}%
        </Text>
      </View>

      <View style={styles.budgetDates}>
        <Text style={styles.budgetDate}>
          {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const totalBudget = mockBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = mockBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddBudget}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Monthly Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Monthly Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Budget</Text>
              <Text style={styles.statValue}>{formatCurrency(totalBudget)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Spent</Text>
              <Text style={[styles.statValue, { color: '#F44336' }]}>
                {formatCurrency(totalSpent)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {formatCurrency(totalRemaining)}
              </Text>
            </View>
          </View>

          <View style={styles.overallProgress}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getBudgetProgress(totalSpent, totalBudget)}%`,
                    backgroundColor: getProgressColor(totalSpent, totalBudget),
                  },
                ]}
              />
            </View>
            <Text style={styles.overallProgressText}>
              {getBudgetProgress(totalSpent, totalBudget).toFixed(1)}% of monthly budget used
            </Text>
          </View>
        </View>

        {/* Budget Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          {mockBudgets.map(renderBudgetItem)}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="analytics" size={24} color="#007AFF" />
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="settings" size={24} color="#666" />
              <Text style={styles.actionText}>Budget Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Budget Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#FF9800" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Track Daily Expenses</Text>
              <Text style={styles.tipDescription}>
                Log your expenses daily to stay within budget limits.
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Review Weekly</Text>
              <Text style={styles.tipDescription}>
                Check your spending weekly and adjust accordingly.
              </Text>
            </View>
          </View>
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
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  overallProgress: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  budgetItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  budgetCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  budgetCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  budgetPeriod: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  editButton: {
    padding: 8,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetSpent: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  budgetRemaining: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 12,
    minWidth: 40,
  },
  budgetDates: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 12,
  },
  budgetDate: {
    fontSize: 12,
    color: '#999',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '48%',
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
  tipsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
