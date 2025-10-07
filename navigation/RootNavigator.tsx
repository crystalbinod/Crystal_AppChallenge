import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './drawer/DrawerNavigator';
import DetailsScreen from '../screens/DetailsScreen';


// Define the types for the stack routes and their parameters
// 'Main' holds your drawer navigation
// 'Details' is a standalone screen (can receive an optional 'id' parameter)

export type RootStackParamList = {
  Main: undefined;         // the drawer lives here
  Details: { id?: string } | undefined; // example stack-only screen
};

// Create a Stack Navigator instance using the defined type
const Stack = createNativeStackNavigator<RootStackParamList>();


// Define and export the RootNavigator component
// This is your top-level navigation container
export default function RootNavigator() {
  return (
    // Stack.Navigator wraps all your stack screens
    <Stack.Navigator>
      {/* 
        The 'Main' screen contains your Drawer Navigator.
        headerShown: false hides the top bar because the Drawer/Tabs already have their own headers.
      */}
      <Stack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ headerShown: false}}
      />

      {/* 
        A standalone screen that can be opened from anywhere in the app.
        Useful for showing extra details (e.g., user info, post details, etc.)
      */}
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );

}

/*RootNavigator
 └── DrawerNavigator (Main)
      ├── TabsNavigator (Home, Profile)
      └── Settings
*/