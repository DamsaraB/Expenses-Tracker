import { authApi } from '@/services/api/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { updateUserProfile } from '../../services/database';

export default function ProfileScreen() {
  const { user, logout, setUser } = useUser();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const remoteUser = await authApi.getCurrentUser();
      setUser(remoteUser);
      setMonthlySalary(remoteUser.monthly_income ? remoteUser.monthly_income.toString() : '');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/Login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handlePrivacy = () => {
    router.push('/profile/privacy');
  };

  const handleContactUs = () => {
    router.push('/profile/contact');
  };

  const handleSalaryUpdate = () => {
    setMonthlySalary(user?.monthly_income ? user.monthly_income.toString() : '');
    setShowSalaryModal(true);
  };

  const handleSalarySave = async () => {
    if (!monthlySalary || isNaN(parseFloat(monthlySalary))) {
      Alert.alert('Error', 'Please enter a valid salary amount');
      return;
    }

    try {
      if (!user) return;

      const amount = parseFloat(monthlySalary);

      // Update LOCAL database first
      const localResult = await updateUserProfile(user.id, {
        monthly_income: amount,
      });

      if (localResult.success) {
        // Update user context immediately for UI
        const updatedUser = {
          ...user,
          monthly_income: amount,
        };
        setUser(updatedUser);

        // Sync with backend
        await authApi.updateProfile({
          name: user.name,
          monthly_income: amount,
          currency: user.currency || 'INR',
        });

        // Fetch latest user profile from backend
        await fetchUserProfile();

        Alert.alert('Success', 'Monthly salary updated successfully!');
        setShowSalaryModal(false);
      } else {
        Alert.alert('Error', localResult.error || 'Failed to update salary');
      }
    } catch (error) {
      console.error('Salary update error:', error);
      Alert.alert('Error', 'Failed to update salary');
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

  const profileItems = [
    {
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: handleEditProfile,
    },
    {
      title: 'Monthly Salary',
      icon: 'cash-outline',
      onPress: handleSalaryUpdate,
      subtitle: user?.monthly_income ? formatCurrency(user.monthly_income) : 'Not set',
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-outline',
      onPress: handlePrivacy,
    },
    {
      title: 'Contact Us',
      icon: 'mail-outline',
      onPress: handleContactUs,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Profile
          </Text>
        </View>

        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Settings
          </Text>
          {/* Dark Mode Toggle */}
          <View style={[styles.settingItem, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={isDarkMode ? "moon" : "sunny"}
                size={24}
                color={Colors[isDarkMode ? 'dark' : 'light'].tint}
              />
              <Text style={[styles.settingText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E5E5E5', true: Colors[isDarkMode ? 'dark' : 'light'].tint }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Profile Options
          </Text>
          {profileItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.settingItem, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}
              onPress={item.onPress}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={Colors[isDarkMode ? 'dark' : 'light'].tint}
                />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.settingSubtext, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors[isDarkMode ? 'dark' : 'light'].icon}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#F44336' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Monthly Salary Modal */}
      <Modal
        visible={showSalaryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
            <TouchableOpacity onPress={() => {
              setShowSalaryModal(false);
              setMonthlySalary(user?.monthly_income?.toString() || '');
            }}>
              <Text style={[styles.cancelButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Monthly Salary
            </Text>
            <TouchableOpacity onPress={handleSalarySave}>
              <Text style={[styles.saveButton, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Monthly Salary *
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                }]}
                placeholder="Enter your monthly salary"
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                value={monthlySalary}
                onChangeText={setMonthlySalary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.salaryInfo}>
              <Text style={[styles.infoTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Why track your salary?
              </Text>
              <Text style={[styles.infoText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                • Better budget planning and expense tracking{'\n'}
                • Calculate savings rate and financial goals{'\n'}
                • Get insights into your spending patterns{'\n'}
                • Set realistic savings targets
              </Text>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingSubtext: {
    fontSize: 14,
    marginTop: 2,
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
  salaryInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
