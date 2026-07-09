import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { speakText } from '../lib/speech';

type Props = {
  text: string;
  label?: string;
  variant?: 'dark' | 'light';
  compact?: boolean;
};

export default function SpeakButton({ text, label = 'Listen', variant = 'dark', compact = false }: Props) {
  return (
    <TouchableOpacity
      onPress={() => speakText(text)}
      activeOpacity={0.7}
      style={[styles.btn, compact && styles.btnCompact]}
      accessibilityLabel={`Read aloud: ${label}`}
      accessibilityRole="button"
    >
      <Text style={[styles.icon, variant === 'light' ? styles.iconLight : styles.iconDark]}>🔊</Text>
      {!compact && (
        <Text style={[styles.label, variant === 'light' ? styles.labelLight : styles.labelDark]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  btnCompact: {
    marginTop: 0,
    marginLeft: 6,
  },
  icon: {
    fontSize: 14,
  },
  iconDark: {
    color: '#63372C',
  },
  iconLight: {
    color: '#C97D60',
  },
  label: {
    fontFamily: 'LazyDaze',
    fontSize: 13,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  labelDark: {
    color: '#63372C',
  },
  labelLight: {
    color: '#C97D60',
  },
});
