import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { authApi } from '../services/api/api'; // <-- import backend API
import { loginUser } from '../services/database';
import { LoginFormData } from '../types';

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({
    email: (params.email as string) || '', // Pre-fill from signup
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const { setUser } = useUser();

  // Enhanced validation with better UX
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);

    // Show first error if any
    const errorMessages = Object.values(newErrors);
    if (errorMessages.length > 0) {
      Alert.alert('Validation Error', errorMessages[0]);
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      // 1. Try backend login first
      try {
        const backendResult = await authApi.login({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });
        // If backend login succeeds, save token/user info
        await AsyncStorage.setItem('authToken', backendResult.access_token);
        await AsyncStorage.setItem('userId', backendResult.user_id.toString());
        setUser({
          id: backendResult.user_id,
          name: backendResult.name,
          email: formData.email.trim().toLowerCase(),
          // Add other fields if needed
        });
        router.replace('/(tabs)/');
        setIsLoading(false);
        return;
      } catch (backendError) {
        console.log('Backend login failed, trying local:', backendError);
      }

      // 2. Fallback to local SQLite login
      const localResult = await loginUser(
        formData.email.trim().toLowerCase(),
        formData.password
      );
      if (localResult.success && localResult.user) {
        await AsyncStorage.setItem('userId', localResult.user.id.toString());
        setUser(localResult.user);
        router.replace('/(tabs)/');
      } else {
        const errorMessage = localResult.error || 'Invalid email or password';
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupPress = () => {
    router.push('/Signup');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be available soon. For now, you can create a new account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create New Account', onPress: handleSignupPress }
      ]
    );
  };

  // Get input styles with error state
  const getInputStyle = (field: keyof LoginFormData) => {
    return [
      styles.input,
      errors[field] ? styles.inputError : null
    ];
  };

  const getPasswordContainerStyle = () => {
    return [
      styles.passwordContainer,
      errors.password ? styles.inputError : null
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="wallet" size={48} color="#007AFF" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to manage your expenses</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={getInputStyle('email')}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!isLoading}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPassword}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={getPasswordContainerStyle()}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(text) => {
                    setFormData({ ...formData, password: text });
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" style={styles.loadingSpinner} />
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Demo Account Button (for testing) */}
            {__DEV__ && (
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => {
                  setFormData({ 
                    email: 'demo@example.com', 
                    password: 'demo123' 
                  });
                }}
                disabled={isLoading}
              >
                <Text style={styles.demoButtonText}>Use Demo Account</Text>
              </TouchableOpacity>
            )}

            {/* Signup Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignupPress} disabled={isLoading}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  demoButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
