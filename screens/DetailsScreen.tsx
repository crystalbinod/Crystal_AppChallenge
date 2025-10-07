// screens/DetailsScreen.tsx
import * as React from 'react';
import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function DetailsScreen() {
  const route = useRoute<any>();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
      <Text>id: {route.params?.id ?? '—'}</Text>
    </View>
  );
}