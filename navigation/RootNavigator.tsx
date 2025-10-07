import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './drawer/DrawerNavigator';
import DetailsScreen from '../screens/DetailsScreen';

export type RootStackParamList = {
  Main: undefined;         // the drawer lives here
  Details: { id?: string } | undefined; // example stack-only screen
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}
