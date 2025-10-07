import * as React from 'react';
// Import the bottom tab navigator creator from React Navigation
// This lets you create a bar at the bottom of the screen with multiple tabs
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Import the screens that will be shown in each tab
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';

// Define the types for your bottom tab routes and their parameters
// 'undefined' means these routes don't expect any route params
export type TabsParamList = {
  Home: undefined;
  Profile: undefined;
};


// Create a Bottom Tab Navigator instance that uses the TabsParamList type
const Tab = createBottomTabNavigator<TabsParamList>();


//function to create the bottom tab navigator
export default function TabsNavigator() {
  // The Tab.Navigator component wraps all your tab screens
  // initialRouteName specifies which tab appears first (Home)
  return (
    <Tab.Navigator initialRouteName="Home">
      {/* First tab — shows the Home screen */}
      <Tab.Screen name="Home" component={HomeScreen} />
      {/* Second tab — shows the Profile screen */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
