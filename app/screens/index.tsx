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
import { mockSummaryData } from '../../data/mockData';

export default function HomeScreen() {
  const handleQuickAction = (action: string) => {
    Alert.alert('Quick Action', `${action} feature coming soon!`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBudgetProgress = () => {
    const percentage = (mockSummaryData.budgetSpent / mockSummaryData.monthlyBudget) * 100;
    return Math.min(percentage, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Personal Finance</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          
          {/* Income Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Ionicons name="trending-up" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.summaryAmount}>{formatCurrency(mockSummaryData.totalIncome)}</Text>
          </View>

          {/* Expenses Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Ionicons name="trending-down" size={20} color="#F44336" />
            </View>
            <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
              {formatCurrency(mockSummaryData.totalExpenses)}
            </Text>
          </View>

          {/* Savings Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Savings</Text>
              <Ionicons name="wallet" size={20} color="#2196F3" />
            </View>
            <Text style={styles.summaryAmount}>{formatCurrency(mockSummaryData.totalSavings)}</Text>
          </View>

          {/* Budget Progress Card */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Monthly Budget</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(mockSummaryData.budgetSpent)} / {formatCurrency(mockSummaryData.monthlyBudget)}
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
              {formatCurrency(mockSummaryData.remainingBudget)} remaining
            </Text>
          </View>
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
              <Ionicons name="target" size={32} color="#FF9800" />
              <Text style={styles.actionText}>Savings Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('View Reports')}
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
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Ionicons name="restaurant" size={20} color="#FF6B6B" />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Grocery Shopping</Text>
              <Text style={styles.transactionCategory}>Food & Dining</Text>
            </View>
            <Text style={styles.transactionAmount}>-$85.50</Text>
          </View>

          <View style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Ionicons name="car" size={20} color="#4ECDC4" />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Gas Station</Text>
              <Text style={styles.transactionCategory}>Transportation</Text>
            </View>
            <Text style={styles.transactionAmount}>-$45.00</Text>
          </View>

          <View style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Ionicons name="card" size={20} color="#45B7D1" />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Netflix</Text>
              <Text style={styles.transactionCategory}>Entertainment</Text>
            </View>
            <Text style={styles.transactionAmount}>-$15.99</Text>
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
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
});
