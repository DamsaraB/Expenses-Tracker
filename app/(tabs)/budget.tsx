import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import {
    addBudget,
    Budget,
    deleteBudget,
    getBudgetSummary,
    getUserBudgets,
    updateBudget
} from '../../services/budgetService';
import { ExpenseCategory, getUserCategories } from '../../services/expenseService';

export default function BudgetScreen() {
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [summary, setSummary] = useState({ totalBudget: 0, totalSpent: 0, remaining: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState({
    categoryId: 0,
    amount: '',
    period: 'monthly',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [budgetsData, categoriesData, summaryData] = await Promise.all([
        getUserBudgets(user.id),
        getUserCategories(user.id),
        getBudgetSummary(user.id)
      ]);
      
      setBudgets(budgetsData);
      setCategories(categoriesData);
      setSummary(summaryData);
      
      // Set default category if available
      if (categoriesData.length > 0 && newBudget.categoryId === 0) {
        setNewBudget(prev => ({ ...prev, categoryId: categoriesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      Alert.alert('Error', 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `Rs. ${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
    }
  };

  const getBudgetProgress = (spent: number, total: number) => {
    if (total === 0) return 0;
    const percentage = (spent / total) * 100;
    return Math.min(percentage, 100);
  };

  const getProgressColor = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 90) return '#F44336';
    if (percentage >= 75) return '#FF9800';
    return '#4CAF50';
  };

  const handleAddBudget = async () => {
    if (!newBudget.categoryId || !newBudget.amount || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const result = await addBudget(
        user.id,
        newBudget.categoryId,
        parseFloat(newBudget.amount),
        newBudget.period
      );

      if (result.success) {
        await loadData(); // Refresh the data
        setNewBudget({ categoryId: categories[0]?.id || 0, amount: '', period: 'monthly' });
        setShowAddModal(false);
        Alert.alert('Success', 'Budget added successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to add budget');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add budget');
    }
  };

  const handleEditBudget = async () => {
    if (!selectedBudget || !newBudget.amount || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const result = await updateBudget(
        selectedBudget.id,
        user.id,
        parseFloat(newBudget.amount),
        newBudget.period
      );

      if (result.success) {
        await loadData(); // Refresh the data
        setShowEditModal(false);
        setSelectedBudget(null);
        setNewBudget({ categoryId: categories[0]?.id || 0, amount: '', period: 'monthly' });
        Alert.alert('Success', 'Budget updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to update budget');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update budget');
    }
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            
            try {
              const result = await deleteBudget(budget.id, user.id);
              if (result.success) {
                await loadData(); // Refresh the data
                Alert.alert('Success', 'Budget deleted successfully!');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete budget');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (budget: Budget) => {
    setSelectedBudget(budget);
    setNewBudget({
      categoryId: budget.category_id,
      amount: budget.amount.toString(),
      period: budget.period,
    });
    setShowEditModal(true);
  };

  const getCategoryById = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const renderBudgetItem = ({ item }: { item: Budget }) => (
    <View style={[styles.budgetItem, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetCategory}>
          <Text style={styles.budgetIcon}>{item.category_icon}</Text>
          <View>
            <Text style={[styles.budgetCategoryName, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {item.category_name}
            </Text>
            <Text style={[styles.budgetPeriod, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              {item.period}
            </Text>
          </View>
        </View>
        <View style={styles.budgetActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={20} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
          </TouchableOpacity>
        <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteBudget(item)}
        >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
        </View>
      </View>

      <View style={styles.budgetAmounts}>
        <Text style={[styles.budgetSpent, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
          {formatCurrency(item.spent || 0)} / {formatCurrency(item.amount)}
        </Text>
        <Text style={[styles.budgetRemaining, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
          {formatCurrency(item.amount - (item.spent || 0))} remaining
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${getBudgetProgress(item.spent || 0, item.amount)}%`,
                backgroundColor: getProgressColor(item.spent || 0, item.amount),
              },
            ]}
          />
        </View>
        <Text style={[styles.progressPercentage, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
          {getBudgetProgress(item.spent || 0, item.amount).toFixed(0)}%
        </Text>
      </View>

      <View style={[styles.budgetDates, { borderTopColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
        <Text style={[styles.budgetDate, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
          {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderAddEditModal = () => (
    <Modal
      visible={showAddModal || showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <TouchableOpacity onPress={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedBudget(null);
            setNewBudget({ categoryId: categories[0]?.id || 0, amount: '', period: 'monthly' });
          }}>
            <Text style={[styles.cancelButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            {showAddModal ? 'Add Budget' : 'Edit Budget'}
          </Text>
          <TouchableOpacity onPress={showAddModal ? handleAddBudget : handleEditBudget}>
            <Text style={[styles.saveButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Category *
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    newBudget.categoryId === category.id && styles.selectedCategory,
                    { borderColor: category.color, backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }
                  ]}
                  onPress={() => setNewBudget({ ...newBudget, categoryId: category.id })}
                >
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryName,
                    { color: Colors[isDarkMode ? 'dark' : 'light'].text },
                    newBudget.categoryId === category.id && styles.selectedCategoryText
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Amount *
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                color: Colors[isDarkMode ? 'dark' : 'light'].text,
              }]}
              placeholder="Enter budget amount"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={newBudget.amount}
              onChangeText={(text) => setNewBudget({ ...newBudget, amount: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Period
            </Text>
            <View style={styles.periodContainer}>
              {['monthly', 'weekly', 'yearly'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    { borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30' },
                    newBudget.period === period && { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint + '20' }
                  ]}
                  onPress={() => setNewBudget({ ...newBudget, period })}
                >
                  <Text style={[
                    styles.periodText,
                    { color: Colors[isDarkMode ? 'dark' : 'light'].text },
                    newBudget.period === period && { color: Colors[isDarkMode ? 'dark' : 'light'].tint }
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Loading budgets...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Budget</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Monthly Overview */}
        <View style={[styles.overviewCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <Text style={[styles.overviewTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Monthly Overview
          </Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Total Budget
              </Text>
              <Text style={[styles.statValue, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {formatCurrency(summary.totalBudget)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Spent
              </Text>
              <Text style={[styles.statValue, { color: '#F44336' }]}>
                {formatCurrency(summary.totalSpent)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Remaining
              </Text>
              <Text style={[styles.statValue, { color: summary.remaining >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatCurrency(summary.remaining)}
              </Text>
            </View>
          </View>

          <View style={styles.overallProgress}>
            <View style={[styles.progressBar, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getBudgetProgress(summary.totalSpent, summary.totalBudget)}%`,
                    backgroundColor: getProgressColor(summary.totalSpent, summary.totalBudget),
                  },
                ]}
              />
            </View>
            <Text style={[styles.overallProgressText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              {getBudgetProgress(summary.totalSpent, summary.totalBudget).toFixed(1)}% of monthly budget used
            </Text>
          </View>
        </View>

        {/* Budget Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Budget Categories
          </Text>
          
          {budgets.length > 0 ? (
            <FlatList
              data={budgets}
              renderItem={renderBudgetItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
              <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                No budgets yet
              </Text>
              <Text style={[styles.emptySubtext, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Create your first budget to start tracking your spending
              </Text>
          </View>
          )}
        </View>

        {/* Budget Tips */}
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Budget Tips
          </Text>
          <View style={[styles.tipCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
            <Ionicons name="bulb" size={24} color="#FF9800" />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Track Daily Expenses
              </Text>
              <Text style={[styles.tipDescription, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Log your expenses daily to stay within budget limits.
              </Text>
            </View>
          </View>
          <View style={[styles.tipCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Review Weekly
              </Text>
              <Text style={[styles.tipDescription, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Check your spending weekly and adjust accordingly.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderAddEditModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  overallProgress: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  budgetItem: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
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
  },
  budgetPeriod: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  budgetActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
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
  },
  budgetRemaining: {
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    minWidth: 40,
  },
  budgetDates: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  budgetDate: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  tipsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
    borderWidth: 2,
  },
  selectedCategory: {
    backgroundColor: '#f0f8ff',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  selectedCategoryText: {
    fontWeight: '600',
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
