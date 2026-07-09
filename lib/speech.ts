import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

export function textForSpeech(raw: string): string {
  return raw
    .replace(/[•?]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function speakText(raw: string) {
  const text = textForSpeech(raw);
  if (!text) return;

  try {
    await Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      rate: Platform.OS === 'ios' ? 0.92 : 0.95,
      pitch: 1,
    });
  } catch (error) {
    console.warn('speakText failed', error);
  }
}

export function stopSpeaking() {
  Speech.stop();
}
