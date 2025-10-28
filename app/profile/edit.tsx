import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
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
import { authApi } from '../../services/api/api'; // <-- Import your API client
import { updateUserProfile } from '../../services/database';

export default function EditProfileScreen() {
  const { user, setUser } = useUser();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    monthly_income: (user as any)?.monthly_income?.toString() || '',
    currency: (user as any)?.currency || 'USD',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      // Prepare update data
      const updateData: any = {
        name: formData.name.trim(),
        currency: formData.currency,
      };

      if (formData.monthly_income.trim()) {
        const income = parseFloat(formData.monthly_income);
        if (!isNaN(income)) {
          updateData.monthly_income = income;
        }
      }

      // Update local database
      const localResult = updateUserProfile(user.id, updateData);

      // Update backend
      const backendResult = await authApi.updateProfile(updateData);

      if (localResult.success && backendResult) {
        // Update user context with backend result (latest data)
        setUser(backendResult);

        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', localResult.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Edit Profile
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, { color: loading ? Colors[isDarkMode ? 'dark' : 'light'].icon : Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Picture Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
              <Text style={styles.avatarText}>
                {formData.name.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.changePhotoButton, { borderColor: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
              <Text style={[styles.changePhotoText, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Full Name
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Email Address (Read Only)
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '10',
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                  color: Colors[isDarkMode ? 'dark' : 'light'].icon,
                }]}
                value={formData.email}
                placeholder="Enter your email address"
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Monthly Income (Optional)
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                }]}
                value={formData.monthly_income}
                onChangeText={(text) => setFormData({ ...formData, monthly_income: text })}
                placeholder="Enter your monthly income"
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Currency
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                  color: Colors[isDarkMode ? 'dark' : 'light'].text,
                }]}
                value={formData.currency}
                onChangeText={(text) => setFormData({ ...formData, currency: text })}
                placeholder="USD"
                placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
              />
            </View>
          </View>

          {/* Change Password Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Security
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background, borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}
              onPress={() => Alert.alert('Coming Soon', 'Password change feature will be available soon.')}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color={Colors[isDarkMode ? 'dark' : 'light'].tint}
                />
                <Text style={[styles.settingText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                  Change Password
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors[isDarkMode ? 'dark' : 'light'].icon}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  changePhotoButton: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
