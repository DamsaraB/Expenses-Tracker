import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { incomeApi } from '../../services/api/api';
import type { IncomeCreate, IncomeResponse, IncomeUpdate } from '../../services/api/types';

interface IncomeFormData {
  title: string;
  amount: string;
  source: string;
  description: string;
  income_date: string;
  is_recurring: boolean;
  recurring_frequency?: string;
}

export default function IncomeScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  const [incomes, setIncomes] = useState<IncomeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeResponse | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  
  const [formData, setFormData] = useState<IncomeFormData>({
    title: '',
    amount: '',
    source: '',
    description: '',
    income_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_frequency: '',
  });

  const frequencyOptions = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];
  const sourceOptions = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'];

  useEffect(() => {
    loadIncomes();
    loadTotalIncome();
  }, []);

  const loadIncomes = async () => {
    try {
      setLoading(true);
      const response = await incomeApi.list({
        limit: 100,
        skip: 0,
      });
      setIncomes(response);
    } catch (error) {
      console.error('Failed to load incomes:', error);
      Alert.alert('Error', 'Failed to load income records');
    } finally {
      setLoading(false);
    }
  };

  const loadTotalIncome = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const response = await incomeApi.total(startDate, endDate);
      setTotalIncome(response.total_income);
    } catch (error) {
      console.error('Failed to load total income:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      source: '',
      description: '',
      income_date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      recurring_frequency: '',
    });
    setEditingIncome(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (income: IncomeResponse) => {
    setFormData({
      title: income.title,
      amount: income.amount.toString(),
      source: income.source,
      description: income.description || '',
      income_date: income.income_date,
      is_recurring: income.is_recurring || false,
      recurring_frequency: income.recurring_frequency || '',
    });
    setEditingIncome(income);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.source) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const incomeData: IncomeCreate | IncomeUpdate = {
        title: formData.title,
        amount: amount,
        source: formData.source,
        description: formData.description || undefined,
        income_date: formData.income_date,
        is_recurring: formData.is_recurring,
        recurring_frequency: formData.is_recurring ? formData.recurring_frequency : undefined,
      };

      if (editingIncome) {
        await incomeApi.update(editingIncome.id, incomeData);
        Alert.alert('Success', 'Income updated successfully');
      } else {
        await incomeApi.create(incomeData as IncomeCreate);
        Alert.alert('Success', 'Income added successfully');
      }

      setShowModal(false);
      resetForm();
      loadIncomes();
      loadTotalIncome();
    } catch (error) {
      console.error('Failed to save income:', error);
      Alert.alert('Error', 'Failed to save income record');
    }
  };

  const handleDelete = (income: IncomeResponse) => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await incomeApi.delete(income.id);
              Alert.alert('Success', 'Income deleted successfully');
              loadIncomes();
              loadTotalIncome();
            } catch (error) {
              console.error('Failed to delete income:', error);
              Alert.alert('Error', 'Failed to delete income record');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
          Income Management
        </Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
        </TouchableOpacity>
      </View>

      {/* Total Income Card */}
      <View style={[styles.totalCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
        <View style={styles.totalCardContent}>
          <View>
            <Text style={[styles.totalLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              Total Income (This Year)
            </Text>
            <Text style={[styles.totalAmount, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={[styles.totalIcon, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint + '20' }]}>
            <Ionicons name="trending-up" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
          </View>
        </View>
      </View>

      {/* Income List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
            <Text style={[styles.loadingText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Loading income records...
            </Text>
          </View>
        ) : incomes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
            <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              No income records found
            </Text>
            <Text style={[styles.emptySubtext, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              Add your first income record to get started
            </Text>
          </View>
        ) : (
          incomes.map((income, index) => (
            <View key={income.id} style={[styles.incomeCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
              <View style={styles.incomeHeader}>
                <View style={styles.incomeInfo}>
                  <Text style={[styles.incomeTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                    {income.title}
                  </Text>
                  <Text style={[styles.incomeSource, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                    {income.source} • {formatDate(income.income_date)}
                  </Text>
                  {income.description && (
                    <Text style={[styles.incomeDescription, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                      {income.description}
                    </Text>
                  )}
                </View>
                <View style={styles.incomeActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint + '20' }]}
                    onPress={() => openEditModal(income)}
                  >
                    <Ionicons name="pencil" size={16} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F4433620' }]}
                    onPress={() => handleDelete(income)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.incomeFooter}>
                <Text style={[styles.incomeAmount, { color: '#4CAF50' }]}>
                  +{formatCurrency(income.amount)}
                </Text>
                {income.is_recurring && (
                  <View style={[styles.recurringBadge, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint + '20' }]}>
                    <Ionicons name="repeat" size={12} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
                    <Text style={[styles.recurringText, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
                      {income.recurring_frequency}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
              <Text style={[styles.cancelButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {editingIncome ? 'Edit Income' : 'Add Income'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Title *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                  borderColor: '#E1E5E9',
                }]}
                placeholder="e.g., Monthly Salary"
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Amount *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                  borderColor: '#E1E5E9',
                }]}
                placeholder="0.00"
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Source *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                {sourceOptions.map((source) => (
                  <TouchableOpacity
                    key={source}
                    style={[
                      styles.optionChip,
                      formData.source === source && styles.optionChipSelected,
                      { 
                        backgroundColor: formData.source === source 
                                  ? Colors[isDarkMode ? 'dark' : 'light'].tint 
                                  : Colors[isDarkMode ? 'dark' : 'light'].background,
                        borderColor: '#E1E5E9',
                      }
                    ]}
                    onPress={() => setFormData({ ...formData, source })}
                  >
                    <Text style={[
                      styles.optionChipText,
                      { color: formData.source === source 
                          ? '#FFFFFF' 
                          : Colors[isDarkMode ? 'dark' : 'light'].text 
                      }
                    ]}>
                      {source}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Date *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                  borderColor: '#E1E5E9',
                }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                value={formData.income_date}
                onChangeText={(text) => setFormData({ ...formData, income_date: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Description
              </Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                  borderColor: '#E1E5E9',
                }]}
                placeholder="Optional description..."
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                  Recurring Income
                </Text>
                <Text style={[styles.switchDescription, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                  Enable if this is a recurring income
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.switch,
                  formData.is_recurring && styles.switchActive,
                  { backgroundColor: formData.is_recurring 
                      ? Colors[isDarkMode ? 'dark' : 'light'].tint 
                      : '#E1E5E9'
                  }
                ]}
                onPress={() => setFormData({ ...formData, is_recurring: !formData.is_recurring })}
              >
                <View style={[
                  styles.switchThumb,
                  formData.is_recurring && styles.switchThumbActive,
                ]} />
              </TouchableOpacity>
            </View>

            {formData.is_recurring && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                  Frequency
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                  {frequencyOptions.map((frequency) => (
                    <TouchableOpacity
                      key={frequency}
                      style={[
                        styles.optionChip,
                        formData.recurring_frequency === frequency && styles.optionChipSelected,
                        { 
                          backgroundColor: formData.recurring_frequency === frequency 
                            ? Colors[isDarkMode ? 'dark' : 'light'].tint 
                            : Colors[isDarkMode ? 'dark' : 'light'].background,
                          borderColor: '#E1E5E9',
                        }
                      ]}
                      onPress={() => setFormData({ ...formData, recurring_frequency: frequency })}
                    >
                      <Text style={[
                        styles.optionChipText,
                        { color: formData.recurring_frequency === frequency 
                            ? '#FFFFFF' 
                            : Colors[isDarkMode ? 'dark' : 'light'].text 
                        }
                      ]}>
                        {frequency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  incomeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  incomeInfo: {
    flex: 1,
    marginRight: 12,
  },
  incomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  incomeSource: {
    fontSize: 13,
    marginBottom: 2,
  },
  incomeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  incomeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recurringText: {
    fontSize: 11,
    fontWeight: '600',
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
    borderBottomColor: '#E1E5E9',
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  optionChipSelected: {
    borderWidth: 0,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    justifyContent: 'flex-end',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
});