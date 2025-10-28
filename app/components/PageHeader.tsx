import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  title: string;
  leftIconName: React.ComponentProps<typeof Ionicons>['name'];
  rightIconName?: React.ComponentProps<typeof Ionicons>['name'];
  onRightPress?: () => void;
  onLeftPress?: () => void;
};

export const PageHeader: React.FC<Props> = ({
  title,
  leftIconName,
  rightIconName,
  onRightPress,
  onLeftPress,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <View>
      <View style={styles.headerContainer}>
        <TouchableOpacity activeOpacity={onLeftPress ? 0.7 : 1} onPress={onLeftPress} style={styles.leftIconBox}>
          <Ionicons name={leftIconName} size={24} color={Colors[isDarkMode ? 'dark' : 'light'].text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>{title}</Text>
        {rightIconName ? (
          <TouchableOpacity style={styles.actionButton} onPress={onRightPress}>
            <Ionicons name={rightIconName} size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <View style={styles.headerLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leftIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#42B7FF',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  placeholder: {
    width: 32,
    height: 32,
    marginLeft: 10,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#DDE5D2',
    marginHorizontal: 20,
    marginBottom: 10,
  },
});

export default PageHeader;


