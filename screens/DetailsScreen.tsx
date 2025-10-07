// screens/DetailsScreen.tsx
import * as React from 'react';
import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function DetailsScreen() {
  const route = useRoute<any>();
  // Return the UI for the screen
  return (
    // A centered container
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
      {/* Display the "id" parameter passed from navigation */}
      {/* If no id is provided, it shows '—' instead */}
      <Text>id: {route.params?.id ?? '—'}</Text>
    </View>
  );
}