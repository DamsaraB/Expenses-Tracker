import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { mockSavingsGoals } from '../../data/mockData';
import { SavingsGoal } from '../../types';

export default function SavingsScreen() {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(mockSavingsGoals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    targetDate: '',
    category: 'Emergency',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Emergency': '🚨',
      'Travel': '✈️',
      'Electronics': '💻',
      'Housing': '🏠',
      'Education': '📚',
      'Vehicle': '🚗',
      'Health': '🏥',
      'Entertainment': '🎬',
    };
    return icons[category] || '💰';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Emergency': '#F44336',
      'Travel': '#2196F3',
      'Electronics': '#9C27B0',
      'Housing': '#4CAF50',
      'Education': '#FF9800',
      'Vehicle': '#795548',
      'Health': '#E91E63',
      'Entertainment': '#FF5722',
    };
    return colors[category] || '#666';
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      targetDate: newGoal.targetDate,
      category: newGoal.category,
    };

    setSavingsGoals([goal, ...savingsGoals]);
    setNewGoal({ title: '', targetAmount: '', targetDate: '', category: 'Emergency' });
    setShowAddModal(false);
    Alert.alert('Success', 'Savings goal added successfully!');
  };

  const handleEditGoal = () => {
    if (!selectedGoal || !newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedGoal: SavingsGoal = {
      ...selectedGoal,
      title: newGoal.title,
      targetAmount: parseFloat(newGoal.targetAmount),
      targetDate: newGoal.targetDate,
      category: newGoal.category,
    };

    setSavingsGoals(savingsGoals.map(goal => goal.id === selectedGoal.id ? updatedGoal : goal));
    setShowEditModal(false);
    setSelectedGoal(null);
    setNewGoal({ title: '', targetAmount: '', targetDate: '', category: 'Emergency' });
    Alert.alert('Success', 'Savings goal updated successfully!');
  };

  const handleDeleteGoal = (goal: SavingsGoal) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this savings goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSavingsGoals(savingsGoals.filter(g => g.id !== goal.id));
            Alert.alert('Success', 'Savings goal deleted successfully!');
          },
        },
      ]
    );
  };

  const handleAddMoney = (goal: SavingsGoal) => {
    Alert.alert('Add Money', `Add money to ${goal.title} feature coming soon!`);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setNewGoal({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate,
      category: goal.category,
    });
    setShowEditModal(true);
  };

  const renderGoalItem = (goal: SavingsGoal) => (
    <View key={goal.id} style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <View style={styles.goalInfo}>
          <Text style={styles.goalIcon}>{getCategoryIcon(goal.category)}</Text>
          <View style={styles.goalDetails}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalCategory}>{goal.category}</Text>
          </View>
        </View>
        <View style={styles.goalActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(goal)}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteGoal(goal)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.goalAmounts}>
        <Text style={styles.currentAmount}>
          {formatCurrency(goal.currentAmount)}
        </Text>
        <Text style={styles.targetAmount}>
          of {formatCurrency(goal.targetAmount)}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${getProgressPercentage(goal.currentAmount, goal.targetAmount)}%`,
                backgroundColor: getCategoryColor(goal.category),
              },
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>
          {getProgressPercentage(goal.currentAmount, goal.targetAmount).toFixed(0)}%
        </Text>
      </View>

      <View style={styles.goalFooter}>
        <Text style={styles.targetDate}>
          Target: {new Date(goal.targetDate).toLocaleDateString()}
        </Text>
        <Text style={styles.daysLeft}>
          {getDaysUntilTarget(goal.targetDate)} days left
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addMoneyButton}
        onPress={() => handleAddMoney(goal)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addMoneyText}>Add Money</Text>
      </TouchableOpacity>
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
            setSelectedGoal(null);
            setNewGoal({ title: '', targetAmount: '', targetDate: '', category: 'Emergency' });
          }}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {showAddModal ? 'Add Savings Goal' : 'Edit Savings Goal'}
          </Text>
          <TouchableOpacity onPress={showAddModal ? handleAddGoal : handleEditGoal}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Goal Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter goal title"
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Target Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter target amount"
              value={newGoal.targetAmount}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Target Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={newGoal.targetDate}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetDate: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Emergency', 'Travel', 'Electronics', 'Housing', 'Education', 'Vehicle', 'Health', 'Entertainment'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    newGoal.category === category && styles.selectedCategoryChip
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, category })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    newGoal.category === category && styles.selectedCategoryChipText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Savings Progress</Text>
          <View style={styles.summaryAmounts}>
            <Text style={styles.totalSaved}>{formatCurrency(totalSavings)}</Text>
            <Text style={styles.totalTarget}>of {formatCurrency(totalTarget)}</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getProgressPercentage(totalSavings, totalTarget)}%`,
                    backgroundColor: '#4CAF50',
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {getProgressPercentage(totalSavings, totalTarget).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Savings Goals List */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>Your Goals</Text>
          {savingsGoals.length > 0 ? (
            savingsGoals.map(renderGoalItem)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No savings goals yet</Text>
              <Text style={styles.emptySubtext}>Create your first savings goal to get started</Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Savings Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#FF9800" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Set Realistic Goals</Text>
              <Text style={styles.tipDescription}>
                Break down large goals into smaller, achievable milestones.
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="calendar" size={24} color="#2196F3" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Automate Savings</Text>
              <Text style={styles.tipDescription}>
                Set up automatic transfers to reach your goals faster.
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
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  totalSaved: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalTarget: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 40,
  },
  goalsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  goalItem: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  goalDetails: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 14,
    color: '#666',
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  targetAmount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  targetDate: {
    fontSize: 14,
    color: '#666',
  },
  daysLeft: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  addMoneyButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  addMoneyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  categoryChip: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  selectedCategoryChip: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
});
