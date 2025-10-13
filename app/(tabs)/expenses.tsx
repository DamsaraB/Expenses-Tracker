import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
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
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'Rs.',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `Rs. ${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
    }
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
    <View style={styles.expenseItem}>
      <View style={[styles.expenseIcon, { backgroundColor: item.category_color + '20' }]}>
        <Text style={styles.expenseEmoji}>{item.category_icon || '💳'}</Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseCategory}>{item.category_name}</Text>
        <Text style={styles.expenseDate}>{new Date(item.expense_date).toLocaleDateString()}</Text>
        {item.description && (
          <Text style={styles.expenseDescription} numberOfLines={1}>{item.description}</Text>
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
          <Ionicons name="create-outline" size={20} color="#007AFF" />
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
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedExpense(null);
            setNewExpense({ title: '', amount: '', categoryId: categories[0]?.id || 0, description: '' });
          }}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {showAddModal ? 'Add Expense' : 'Edit Expense'}
          </Text>
          <TouchableOpacity
            onPress={showAddModal ? handleAddExpense : handleEditExpense}
            disabled={categories.length === 0 || newExpense.categoryId === 0}
          >
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter expense title"
              value={newExpense.title}
              onChangeText={(text) => setNewExpense({ ...newExpense, title: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    newExpense.categoryId === category.id && styles.selectedCategory,
                    { borderColor: category.color }
                  ]}
                  onPress={() => setNewExpense({ ...newExpense, categoryId: category.id })}
                >
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryName,
                    newExpense.categoryId === category.id && styles.selectedCategoryText
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description (optional)"
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={styles.summaryAmount}>
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
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
          </View>
        }
      />

      {renderAddEditModal()}
    </SafeAreaView>
  );
}

// Add the new styles
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
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F44336',
  },
  expenseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
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
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
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
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e1e5e9',
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
    color: '#666',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
