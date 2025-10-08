import * as Haptics from 'expo-haptics';
import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
  style?: any;
};

export default function HapticTab({ children, onPress, accessibilityState, style, ...rest }: Props) {
  const handlePress = (e: GestureResponderEvent) => {
    Haptics.selectionAsync().catch(() => {});
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [styles.container, style, pressed && styles.pressed]}>
      <View>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});