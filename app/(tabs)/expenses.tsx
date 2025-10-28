import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
    View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { categoriesApi, expensesApi } from '../../services/api/api'; // Import backend API
import {
    addExpense,
    deleteExpense,
    Expense,
    ExpenseCategory,
    updateExpense
} from '../../services/expenseService';
import { syncService } from '../../services/syncService'; // Add this import
import PageHeader from '../components/PageHeader';

export default function ExpensesScreen() {
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    categoryId: 0,
    description: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Real-time updates: Reload data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      }
    }, [user])
  );

  // After loading categories, set a valid default:
  useEffect(() => {
    if (categories.length > 0 && newExpense.categoryId === 0) {
      setNewExpense(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [expensesData, categoriesData] = await Promise.all([
        expensesApi.list({ user_id: user.id }), // <-- Fetch from backend
        categoriesApi.list()
      ]);
      // Map categories as before
      const mappedCategories = categoriesData.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        user_id: cat.user_id,
      }));
      setCategories(mappedCategories);

      // Map expenses to include category fields for UI
      const mappedExpenses = expensesData.map(exp => {
        const cat = mappedCategories.find(c => c.id === exp.category_id);
        return {
          ...exp,
          category_name: cat?.name || '',
          category_color: cat?.color || '#e1e5e9',
          category_icon: cat?.icon || '💳',
        };
      });
      setExpenses(mappedExpenses);

      if (mappedCategories.length > 0 && newExpense.categoryId === 0) {
        setNewExpense(prev => ({ ...prev, categoryId: mappedCategories[0].id }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${Number(amount || 0).toLocaleString('en-LK', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  };

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount || !user || !newExpense.categoryId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const result = await addExpense(
        user.id,
        newExpense.title,
        parseFloat(newExpense.amount),
        newExpense.categoryId,
        newExpense.description
      );

      if (result.success) {
        await syncService.syncData(); // <-- Trigger sync to backend
        await loadData(); // Refresh the list
        setNewExpense({ title: '', amount: '', categoryId: categories[0]?.id || 0, description: '' });
        setShowAddModal(false);
        Alert.alert('Success', 'Expense added successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to add expense');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleEditExpense = async () => {
    if (!selectedExpense || !newExpense.title || !newExpense.amount || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const result = await updateExpense(
        selectedExpense.id,
        user.id,
        newExpense.title,
        parseFloat(newExpense.amount),
        newExpense.categoryId,
        newExpense.description
      );

      if (result.success) {
        await loadData(); // Refresh the list
        setShowEditModal(false);
        setSelectedExpense(null);
        setNewExpense({ title: '', amount: '', categoryId: categories[0]?.id || 0, description: '' });
        Alert.alert('Success', 'Expense updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to update expense');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update expense');
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            
            try {
              const result = await deleteExpense(expense.id, user.id);
              if (result.success) {
                await loadData(); // Refresh the list
                Alert.alert('Success', 'Expense deleted successfully!');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete expense');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      categoryId: expense.category_id,
      description: expense.description || '',
    });
    setShowEditModal(true);
  };

  const getCategoryById = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={[
      styles.expenseItem,
      {
        backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
        borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20',
      }
    ]}>
      <View style={[styles.expenseIcon, { backgroundColor: item.category_color + '20' }]}>
        <Text style={styles.expenseEmoji}>{item.category_icon || '💳'}</Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={[styles.expenseTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>{item.title}</Text>
        <Text style={[styles.expenseCategory, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>{item.category_name}</Text>
        <Text style={[styles.expenseDate, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>{new Date(item.expense_date).toLocaleDateString()}</Text>
        {item.description && (
          <Text style={[styles.expenseDescription, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]} numberOfLines={1}>{item.description}</Text>
        )}
      </View>
      <View style={styles.expenseAmount}>
        <Text style={styles.expenseAmountText}>-{formatCurrency(item.amount)}</Text>
      </View>
      <View style={styles.expenseActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={20} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteExpense(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
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
        <View style={[
          styles.modalHeader,
          {
            backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
            borderBottomColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20',
          }
        ]}>
          <TouchableOpacity onPress={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedExpense(null);
            setNewExpense({ title: '', amount: '', categoryId: categories[0]?.id || 0, description: '' });
          }}>
            <Text style={[styles.cancelButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            {showAddModal ? 'Add Expense' : 'Edit Expense'}
          </Text>
          <TouchableOpacity
            onPress={showAddModal ? handleAddExpense : handleEditExpense}
            disabled={categories.length === 0 || newExpense.categoryId === 0}
          >
            <Text style={[styles.saveButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Save</Text>
          </TouchableOpacity>
        </View>
<ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

        <View style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Title *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                }
              ]}
              placeholder="Enter expense title"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={newExpense.title}
              onChangeText={(text) => setNewExpense({ ...newExpense, title: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Amount *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                }
              ]}
              placeholder="Enter amount"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Category</Text>
            <View style={styles.categoryGrid}>
                          {categories.map((category) => (
                            <TouchableOpacity
                              key={category.id}
                              style={[
                                styles.categoryItem,
                                newExpense.categoryId === category.id && styles.selectedCategory,
                                { borderColor: category.color, backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }
                              ]}
                              onPress={() => setNewExpense({ ...newExpense, categoryId: category.id })}
                            >
                              <Text style={styles.categoryEmoji}>{category.icon}</Text>
                              <Text style={[
                                styles.categoryName,
                                { color: Colors[isDarkMode ? 'dark' : 'light'].text },
                                newExpense.categoryId === category.id && styles.selectedCategoryText
                              ]}>
                                {category.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                }
              ]}
              placeholder="Enter description (optional)"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
              multiline
              numberOfLines={3}
            />
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
          <Text style={{ color: Colors[isDarkMode ? 'dark' : 'light'].text }}>Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      <PageHeader
        title={"EXPENSES"}
        leftIconName="receipt-outline"
        rightIconName="add"
        onRightPress={() => setShowAddModal(true)}
      />

      <View style={[styles.summaryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
        <Text style={[styles.summaryLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>Total Expenses</Text>
        <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
          {formatCurrency(totalExpenses)}
        </Text>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.expenseList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
            <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>No expenses yet</Text>
            <Text style={[styles.emptySubtext, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>Add your first expense to get started</Text>
          </View>
        }
      />

      {renderAddEditModal()}
    </SafeAreaView>
  );
}

// Update styles to use theme colors
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  container: {
    flex: 1,
    paddingTop: 40,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  expenseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.icon + '20', // Will be overridden in render
    backgroundColor: Colors.light.background, // Will be overridden in render
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseEmoji: {
    fontSize: 24,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseCategory: {
    fontSize: 14,
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseAmount: {
    marginRight: 12,
  },
  expenseAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  expenseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
});
