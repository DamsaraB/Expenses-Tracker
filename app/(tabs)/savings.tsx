import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
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
import {
  addMoneyToGoal,
  addSavingsGoal,
  deleteSavingsGoal,
  getSavingsSummary,
  getSavingsTransactionsForGoal,
  getUserSavingsGoals,
  SavingsGoal,
  SavingsTransaction,
  updateSavingsGoal
} from '../../services/savingsService';
import { syncService } from '../../services/syncService';

export default function SavingsScreen() {
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const [goalTransactions, setGoalTransactions] = useState<{ [goalId: number]: SavingsTransaction[] }>({});
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [summary, setSummary] = useState({ totalTarget: 0, totalSaved: 0, progress: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    targetDate: '',
    category: 'Emergency',
    description: '',
  });
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load local data first (defensive - handle empty data)
      const localGoals = getUserSavingsGoals(user.id) || [];
      const localSummary = getSavingsSummary(user.id) || { totalTarget: 0, totalSaved: 0, progress: 0 };
      
      setSavingsGoals(localGoals);
      setSummary(localSummary);

      // Fetch transactions for each goal
      const transactionsMap: { [goalId: number]: SavingsTransaction[] } = {};
      for (const goal of localGoals) {
        transactionsMap[goal.id] = getSavingsTransactionsForGoal(goal.id) || [];
      }
      setGoalTransactions(transactionsMap);
      
      // Background sync (don't await - let it fail silently)
      syncService.syncData().catch(error => {
        console.error('Background sync failed:', error);
      });
      
    } catch (error) {
      console.error('Error loading savings data:', error);
      // Don't show alert - just continue with empty state
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const getProgressPercentage = (current: number, target: number) => {
  if (!target || target <= 0) return 0;
  const percentage = Math.min((current / target) * 100, 100);
  return Math.max(percentage, 0); // Ensure it's not negative
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

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.targetAmount || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Add ONLY to local SQLite (like budget)
      const result = await addSavingsGoal(
        user.id,
        newGoal.title,
        parseFloat(newGoal.targetAmount),
        newGoal.category,
        newGoal.targetDate || undefined,
        newGoal.description || undefined
      );

      if (result.success) {
        await loadData(); // Refresh local data
        setNewGoal({ title: '', targetAmount: '', targetDate: '', category: 'Emergency', description: '' });
        setShowAddModal(false);
        Alert.alert('Success', 'Savings goal added successfully!');
        
        // Background sync (no await)
        syncService.syncData().catch(console.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add savings goal');
    }
  };

  const handleEditGoal = async () => {
    if (!selectedGoal || !newGoal.title || !newGoal.targetAmount || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Update local database first
      const result = await updateSavingsGoal(
        selectedGoal.id,
        user.id,
        newGoal.title,
        parseFloat(newGoal.targetAmount),
        newGoal.category,
        newGoal.targetDate || undefined,
        newGoal.description || undefined
      );

      if (result.success) {
        await loadData(); // Refresh the data
        setShowEditModal(false);
        setSelectedGoal(null);
        setNewGoal({ title: '', targetAmount: '', targetDate: '', category: 'Emergency', description: '' });
        Alert.alert('Success', 'Savings goal updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to update savings goal');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update savings goal');
    }
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
          onPress: async () => {
            if (!user) return;
            
            try {
              // Delete from local database first
              const result = await deleteSavingsGoal(goal.id, user.id);
              if (result.success) {
                await loadData(); // Refresh the data
                Alert.alert('Success', 'Savings goal deleted successfully!');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete savings goal');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete savings goal');
            }
          },
        },
      ]
    );
  };

  const handleAddMoney = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setAddMoneyAmount('');
    setShowAddMoneyModal(true);
  };

  const handleAddMoneySubmit = async () => {
    if (!selectedGoal || !addMoneyAmount || !user) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    try {
      // Add to local database first
      const result = await addMoneyToGoal(
        selectedGoal.id,
        user.id,
        parseFloat(addMoneyAmount),
        `Deposit to ${selectedGoal.title}`
      );

      if (result.success) {
        await loadData(); // Refresh the data
        setShowAddMoneyModal(false);
        setSelectedGoal(null);
        setAddMoneyAmount('');
        Alert.alert('Success', 'Money added to savings goal successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to add money to goal');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add money to goal');
    }
  };

  const openEditModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setNewGoal({
      title: goal.title,
      targetAmount: goal.target_amount.toString(),
      targetDate: goal.target_date || '',
      category: goal.category,
      description: goal.description || '',
    });
    setShowEditModal(true);
  };

  const renderGoalItem = ({ item }: { item: SavingsGoal }) => (
    <View style={[styles.goalItem, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
      <View style={styles.goalHeader}>
        <View style={styles.goalInfo}>
          <Text style={styles.goalIcon}>{getCategoryIcon(item.category)}</Text>
          <View style={styles.goalDetails}>
            <Text style={[styles.goalTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {item.title}
            </Text>
            <Text style={[styles.goalCategory, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              {item.category}
            </Text>
          </View>
        </View>
        <View style={styles.goalActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={20} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteGoal(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.goalAmounts}>
        <Text style={styles.currentAmount}>
          {formatCurrency(item.current_amount)}
        </Text>
        <Text style={[styles.targetAmount, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
          of {formatCurrency(item.target_amount)}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${getProgressPercentage(item.current_amount, item.target_amount)}%`,
                backgroundColor: getCategoryColor(item.category),
              },
            ]}
          />
        </View>
        <Text style={[styles.progressPercentage, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
          {getProgressPercentage(item.current_amount, item.target_amount).toFixed(0)}%
        </Text>
      </View>

      {item.target_date && (
        <View style={[styles.goalFooter, { borderTopColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <Text style={[styles.targetDate, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
            Target: {new Date(item.target_date).toLocaleDateString()}
          </Text>
          <Text style={styles.daysLeft}>
            {getDaysUntilTarget(item.target_date)} days left
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.addMoneyButton, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint }]}
        onPress={() => handleAddMoney(item)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addMoneyText}>Add Money</Text>
      </TouchableOpacity>

      {goalTransactions[item.id] && goalTransactions[item.id].length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4, color: Colors[isDarkMode ? 'dark' : 'light'].icon }}>
            Transactions
          </Text>
          {goalTransactions[item.id].map(tx => (
            <View key={tx.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ color: Colors[isDarkMode ? 'dark' : 'light'].text }}>
                {tx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
              </Text>
              <Text style={{ color: Colors[isDarkMode ? 'dark' : 'light'].icon, fontSize: 12 }}>
                {tx.transaction_date}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderAddMoneyModal = () => (
    <Modal
      visible={showAddMoneyModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <TouchableOpacity onPress={() => {
            setShowAddMoneyModal(false);
            setSelectedGoal(null);
            setAddMoneyAmount('');
          }}>
            <Text style={[styles.cancelButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Add Money
          </Text>
          <TouchableOpacity onPress={handleAddMoneySubmit}>
            <Text style={[styles.saveButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Amount to Add *
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                color: Colors[isDarkMode ? 'dark' : 'light'].text,
              }]}
              placeholder="Enter amount"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={addMoneyAmount}
              onChangeText={setAddMoneyAmount}
              keyboardType="numeric"
            />
          </View>
          
          {selectedGoal && (
            <View style={styles.goalPreview}>
              <Text style={[styles.goalPreviewTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Goal: {selectedGoal.title}
              </Text>
              <Text style={[styles.goalPreviewAmount, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Current: {formatCurrency(selectedGoal.current_amount)} / {formatCurrency(selectedGoal.target_amount)}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
            setSelectedGoal(null);
            setNewGoal({ title: '', targetAmount: '', targetDate: '', category: 'Emergency', description: '' });
          }}>
            <Text style={[styles.cancelButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            {showAddModal ? 'Add Savings Goal' : 'Edit Savings Goal'}
          </Text>
          <TouchableOpacity onPress={showAddModal ? handleAddGoal : handleEditGoal}>
            <Text style={[styles.saveButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Goal Title *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                color: Colors[isDarkMode ? 'dark' : 'light'].text,
              }]}
              placeholder="Enter goal title"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Target Amount *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                color: Colors[isDarkMode ? 'dark' : 'light'].text,
              }]}
              placeholder="Enter target amount"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={newGoal.targetAmount}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Target Date (Optional)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                color: Colors[isDarkMode ? 'dark' : 'light'].text,
              }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={newGoal.targetDate}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetDate: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                color: Colors[isDarkMode ? 'dark' : 'light'].text,
              }]}
              placeholder="Enter description"
              placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Emergency', 'Travel', 'Electronics', 'Housing', 'Education', 'Vehicle', 'Health', 'Entertainment'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30' },
                    newGoal.category === category && styles.selectedCategoryChip
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, category })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: Colors[isDarkMode ? 'dark' : 'light'].text },
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Loading savings goals...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Savings Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors[isDarkMode ? 'dark' : 'light'].tint]}
            tintColor={Colors[isDarkMode ? 'dark' : 'light'].tint}
          />
        }
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <Text style={[styles.summaryTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Total Savings Progress
          </Text>
          <View style={styles.summaryAmounts}>
            <Text style={styles.totalSaved}>{formatCurrency(summary.totalSaved)}</Text>
            <Text style={[styles.totalTarget, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              of {formatCurrency(summary.totalTarget)}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${summary.progress}%`,
                    backgroundColor: '#4CAF50',
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercentage, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              {summary.progress.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Savings Goals List */}
        <View style={styles.goalsSection}>
          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Your Goals
          </Text>
          {savingsGoals.length > 0 ? (
            <FlatList
              data={savingsGoals}
              renderItem={renderGoalItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
              <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                No savings goals yet
              </Text>
              <Text style={[styles.emptySubtext, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Create your first savings goal to get started
              </Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Savings Tips
          </Text>
          <View style={[styles.tipCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
            <Ionicons name="bulb" size={24} color="#FF9800" />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Set Realistic Goals
              </Text>
              <Text style={[styles.tipDescription, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Break down large goals into smaller, achievable milestones.
              </Text>
            </View>
          </View>
          <View style={[styles.tipCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
            <Ionicons name="calendar" size={24} color="#2196F3" />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Automate Savings
              </Text>
              <Text style={[styles.tipDescription, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Set up automatic transfers to reach your goals faster.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderAddEditModal()}
      {renderAddMoneyModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    borderWidth: 1,
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
    borderWidth: 1,
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
  goalPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  goalPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalPreviewAmount: {
    fontSize: 14,
  },
});
