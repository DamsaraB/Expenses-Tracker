import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function PrivacyScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:info.damsara@gmail.com');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors[isDarkMode ? 'dark' : 'light'].icon + '20' }]}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.lastUpdated, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>

          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            1. Information We Collect
          </Text>
          <Text style={[styles.sectionText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            We collect information you provide directly to us, such as when you create an account, add expenses, or contact us for support. This may include your name, email address, and financial data you choose to store in the app.
          </Text>

          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            2. How We Use Your Information
          </Text>
          <Text style={[styles.sectionText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.
          </Text>

          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            3. Information Sharing and Disclosure
          </Text>
          <Text style={[styles.sectionText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information in certain limited circumstances, such as with your consent or to comply with legal obligations.
          </Text>

          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            4. Data Security
          </Text>
          <Text style={[styles.sectionText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data is encrypted and stored securely on our servers.
          </Text>

          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            5. Data Retention
          </Text>
          <Text style={[styles.sectionText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.
          </Text>

          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            6. Your Rights
          </Text>
          <Text style={[styles.sectionText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            You have the right to access, update, or delete your personal information. You can also opt out of certain communications from us. To exercise these rights, please contact us using the information provided below.
          </Text>

          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            7. Changes to This Policy
          </Text>
          <Text style={[styles.sectionText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </Text>

          <Text style={[styles.sectionTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            8. Contact Us
          </Text>
          <Text style={[styles.sectionText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            If you have any questions about this privacy policy, please contact us at:
          </Text>
          
          <TouchableOpacity 
            style={[styles.contactButton, { borderColor: Colors[isDarkMode ? 'dark' : 'light'].tint }]}
            onPress={handleContactSupport}
          >
            <Ionicons name="mail-outline" size={20} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
            <Text style={[styles.contactText, { color: Colors[isDarkMode ? 'dark' : 'light'].tint }]}>
              privacy@expensetracker.com
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              This privacy policy is effective as of the date listed above.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: 25,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
