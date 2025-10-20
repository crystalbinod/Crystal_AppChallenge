import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './drawer/DrawerNavigator';
import LoginScreen from '../screens/LoginScreen';
import ShopScreen from '../screens/ShopScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JobScreen from '../screens/JobScreen';
import FinancialSimScreen from '../screens/FinancialSimScreen';
import BankScreen from '../screens/BankScreen';
import LearnScreen from '../screens/LearnScreen';
import snakegame from '../screens/snakegame';
import Job1Screen from '../screens/Job1Screen';
import TabsNavigator from './tabs/TabsNavigator';


// Define the types for the stack routes and their parameters
// 'Main' holds your drawer navigation
// 'Details' is a standalone screen (can receive an optional 'id' parameter)

export type RootStackParamList = {
  Main: undefined;         // the tabs lives here
  Profile: { id?: string } | undefined; // example stack-only screen
  Login: undefined;
  Shop: undefined;
  Job: undefined;
  FinancialSim: undefined;
  Bank: undefined;
  Learn: undefined;
  Job1:  undefined;
  snakegame:undefined;
};

// Create a Stack Navigator instance using the defined type
const Stack = createNativeStackNavigator<RootStackParamList>();


// Define and export the RootNavigator component
// This is your top-level navigation container
export default function RootNavigator() {
  return (
    // Stack.Navigator wraps all your stack screens
    <Stack.Navigator initialRouteName="Login">
      {/* 
        The 'Main' screen contains your tabs Navigator.
        headerShown: false hides the top bar because the Drawer/Tabs already have their own headers.
      */}
      <Stack.Screen
        name="Main"
        component={TabsNavigator}
        options={{ headerShown: false}}
      />

      {/* 
        A standalone screen that can be opened from anywhere in the app.
        Useful for showing extra details (e.g., user info, post details, etc.)
      */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false}}/>
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="Job" component={JobScreen} />
      <Stack.Screen name="FinancialSim" component={FinancialSimScreen} />
      <Stack.Screen name="Bank" component={BankScreen} />
      <Stack.Screen name="Learn" component={LearnScreen} />
      <Stack.Screen name="Job1" component={Job1Screen} />
      <Stack.Screen name="snakegame" component={snakegame} />
    </Stack.Navigator>
  );

}

/*RootNavigator
 └── TabsNavigator (Main)
      ├── Home 
      ├── Shop 
      ├── FinancialSim 
      ├── DrawerNavigator(Bank, Checking, Savings, Investment) 
      └── Learn
      
*/