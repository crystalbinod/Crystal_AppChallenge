import * as React from 'react';

// import the drawer navigator creator from React Navigation
// this lets you create a sidebarnavigation menu
import { createDrawerNavigator } from '@react-navigation/drawer';

// Import another navigator (Tabs) — this is to access the homescreen and profile screen in tabs
// so the tabs navigator is wrapped in the drawer navigator
import TabsNavigator from '../tabs/TabsNavigator';

// Import the Settings screen — another screen in the drawer
import SettingsScreen from '../../screens/SettingsScreen';


// Define the types for your drawer routes and their parameters
// 'Tabs' and 'Settings' are the names of the screens in this navigator
// 'undefined' means they don't take any route parameters
export type DrawerParamList = {
  Tabs: undefined;     // the bottom tabs live here
  Settings: undefined;
};


// Create a Drawer Navigator instance that uses the DrawerParamList type
const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (
    // initialRouteName sets which screen appears first
    <Drawer.Navigator initialRouteName="Tabs">
      {/* First drawer item — the Tabs navigator (contains bottom tabs) */}
      <Drawer.Screen
        name="Tabs"
        component={TabsNavigator}
        options={{ title: 'Home' }}
      />
      {/* Second drawer item — opens the Settings screen */}
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}
