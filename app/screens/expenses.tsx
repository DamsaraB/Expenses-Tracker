import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { expenseCategories, mockExpenses } from '../../data/mockData';
import { Expense } from '../../types';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Food & Dining',
    description: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = expenseCategories.find(cat => cat.name === category);
    return categoryData?.icon || '💳';
  };

  const getCategoryColor = (category: string) => {
    const categoryData = expenseCategories.find(cat => cat.name === category);
    return categoryData?.color || '#666';
  };

  const handleAddExpense = () => {
    if (!newExpense.title || !newExpense.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      description: newExpense.description,
      date: new Date().toISOString().split('T')[0],
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({ title: '', amount: '', category: 'Food & Dining', description: '' });
    setShowAddModal(false);
    Alert.alert('Success', 'Expense added successfully!');
  };

  const handleEditExpense = () => {
    if (!selectedExpense || !newExpense.title || !newExpense.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedExpense: Expense = {
      ...selectedExpense,
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      description: newExpense.description,
    };

    setExpenses(expenses.map(exp => exp.id === selectedExpense.id ? updatedExpense : exp));
    setShowEditModal(false);
    setSelectedExpense(null);
    setNewExpense({ title: '', amount: '', category: 'Food & Dining', description: '' });
    Alert.alert('Success', 'Expense updated successfully!');
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
          onPress: () => {
            setExpenses(expenses.filter(exp => exp.id !== expense.id));
            Alert.alert('Success', 'Expense deleted successfully!');
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
      category: expense.category,
      description: expense.description || '',
    });
    setShowEditModal(true);
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseIcon}>
        <Text style={styles.expenseEmoji}>{getCategoryIcon(item.category)}</Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expenseDate}>{item.date}</Text>
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
            setNewExpense({ title: '', amount: '', category: 'Food & Dining', description: '' });
          }}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {showAddModal ? 'Add Expense' : 'Edit Expense'}
          </Text>
          <TouchableOpacity onPress={showAddModal ? handleAddExpense : handleEditExpense}>
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
              {expenseCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    newExpense.category === category.name && styles.selectedCategory
                  ]}
                  onPress={() => setNewExpense({ ...newExpense, category: category.name })}
                >
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryName,
                    newExpense.category === category.name && styles.selectedCategoryText
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

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.summaryLabel}>Total Expenses This Month</Text>
        <Text style={styles.summaryAmount}>
          {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
        </Text>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
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
    backgroundColor: '#f8f9fa',
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
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  selectedCategory: {
    borderColor: '#007AFF',
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
