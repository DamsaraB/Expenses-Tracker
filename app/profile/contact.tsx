import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
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

export default function ContactScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Create mailto link with pre-filled content
      const subject = encodeURIComponent(formData.subject);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      );
      const mailtoUrl = `mailto:support@expensetracker.com?subject=${subject}&body=${body}`;
      
      await Linking.openURL(mailtoUrl);
      
      Alert.alert('Success', 'Your email client will open with your message pre-filled. Please send the email to complete your inquiry.', [
        { text: 'OK', onPress: () => {
          setFormData({ name: '', email: '', subject: '', message: '' });
          router.back();
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Unable to open email client. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@expensetracker.com');
  };

  const contactOptions = [
    {
      title: 'Email Support',
      subtitle: 'support@expensetracker.com',
      icon: 'mail-outline',
      onPress: handleEmailSupport,
    },
    {
      title: 'Phone Support',
      subtitle: '+1 (234) 567-890',
      icon: 'call-outline',
      onPress: handleCallSupport,
    },
    {
      title: 'Business Hours',
      subtitle: 'Monday - Friday, 9 AM - 6 PM EST',
      icon: 'time-outline',
      onPress: null,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Contact Us
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Contact Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Get in Touch
            </Text>
            
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.contactOption, { 
                  backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                  borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20'
                }]}
                onPress={option.onPress}
                disabled={!option.onPress}
              >
                <View style={styles.contactLeft}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={Colors[isDarkMode ? 'dark' : 'light'].tint} 
                  />
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.contactSubtitle, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                </View>
                {option.onPress && (
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={Colors[isDarkMode ? 'dark' : 'light'].icon} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Contact Form */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Send us a Message
            </Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                  Full Name *
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
                  Email Address *
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                    borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                    color: Colors[isDarkMode ? 'dark' : 'light'].text,
                  }]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email address"
                  placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                  Subject *
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                    borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                    color: Colors[isDarkMode ? 'dark' : 'light'].text,
                  }]}
                  value={formData.subject}
                  onChangeText={(text) => setFormData({ ...formData, subject: text })}
                  placeholder="What's this about?"
                  placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                  Message *
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background,
                    borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '30',
                    color: Colors[isDarkMode ? 'dark' : 'light'].text,
                  }]}
                  value={formData.message}
                  onChangeText={(text) => setFormData({ ...formData, message: text })}
                  placeholder="Tell us how we can help you..."
                  placeholderTextColor={Colors[isDarkMode ? 'dark' : 'light'].icon}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.submitText}>
                  {loading ? 'Sending...' : 'Send Message'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Frequently Asked Questions
            </Text>
            
            <TouchableOpacity 
              style={[styles.faqItem, { borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}
              onPress={() => Alert.alert('FAQ', 'Q: How do I backup my data?\nA: Your data is automatically synced to our secure servers. You can also export your data from the settings menu.')}
            >
              <Text style={[styles.faqText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                How do I backup my expense data?
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.faqItem, { borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}
              onPress={() => Alert.alert('FAQ', 'Q: Is my financial data secure?\nA: Yes, we use industry-standard encryption to protect your data. Your information is never shared with third parties.')}
            >
              <Text style={[styles.faqText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Is my financial data secure?
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.faqItem, { borderColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}
              onPress={() => Alert.alert('FAQ', 'Q: Can I use the app offline?\nA: Yes, you can add expenses offline and they will sync when you reconnect to the internet.')}
            >
              <Text style={[styles.faqText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Can I use the app offline?
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
  },
  formContainer: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
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
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  faqText: {
    fontSize: 16,
    flex: 1,
  },
});
