import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { checkUserExists, getAllUsers, registerUser } from '../services/database';

export const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState('');

  const handleCheckUsers = () => {
    const users = getAllUsers();
    setDebugInfo(`Found ${users.length} users:\n${JSON.stringify(users, null, 2)}`);
  };

  const handleCheckSpecificUser = () => {
    const user = checkUserExists('kushansr77@gmail.com');
    setDebugInfo(`User check result:\n${JSON.stringify(user, null, 2)}`);
  };

  const handleCreateTestUser = async () => {
    try {
      const result = await registerUser('Test User', 'test@example.com', 'test123');
      setDebugInfo(`Test user creation result:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      if (error instanceof Error) {
        setDebugInfo(`Error creating test user:\n${error.message}`);
      } else {
        setDebugInfo(`Error creating test user:\n${String(error)}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Panel</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleCheckUsers}>
        <Text style={styles.buttonText}>List All Users</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleCheckSpecificUser}>
        <Text style={styles.buttonText}>Check Your Email</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleCreateTestUser}>
        <Text style={styles.buttonText}>Create Test User</Text>
      </TouchableOpacity>

      {debugInfo && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  debugInfo: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});