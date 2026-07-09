import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ExplainerKey, showExplainer } from '../lib/financeExplainers';

type Props = {
  topic: ExplainerKey;
  label?: string;
  variant?: 'dark' | 'light';
};

export default function FinanceHelpLink({ topic, label, variant = 'dark' }: Props) {
  return (
    <TouchableOpacity
      onPress={() => showExplainer(topic)}
      activeOpacity={0.7}
      accessibilityLabel={label || `Explain ${topic}`}
      accessibilityRole="button"
    >
      <Text style={[styles.link, variant === 'light' ? styles.linkLight : styles.linkDark]}>
        ? {label || topic}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: {
    fontFamily: 'LazyDaze',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  linkDark: {
    color: '#ffd27a',
  },
  linkLight: {
    color: '#C97D60',
  },
});
