import React from 'react';
import {
    View,
    ViewStyle
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  shadow?: boolean;
}

export default function Card({
  children,
  style,
  padding = 16,
  margin = 0,
  shadow = true,
}: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding,
    margin,
  };

  if (shadow) {
    cardStyle.shadowColor = '#000';
    cardStyle.shadowOffset = { width: 0, height: 2 };
    cardStyle.shadowOpacity = 0.1;
    cardStyle.shadowRadius = 4;
    cardStyle.elevation = 3;
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
