import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './drawer/DrawerNavigator';
import LoginScreen from '../screens/LoginScreen';
import ShopScreen from '../screens/ShopScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JobScreen from '../screens/JobScreen';

import BankScreen from '../screens/BankScreen';
import LearnScreen from '../screens/LearnScreen';
import snakegame from '../screens/snakegame';
import MineSweeperScreen from '../screens/MineSweeperScreen';
import twentyScreen from '../screens/twentyScreen';
import SignupScreen from '../screens/SignupScreen';
import MemoryScreen from '../screens/MemoryScreen';
import PongScreen from '../screens/PongScreen';
import CupPongScreen from '../screens/CupPongScreen';
import MoleScreen from '../screens/MoleScreen';
import FlappyBirdScreen from '../screens/FlappyBirdScreen';
import DinoScreen from '../screens/DinoScreen';
import JobGeneratorScreen from '../screens/JobGeneratorScreen';
import PartTimeScreen from '../screens/PartTimeScreen';
import CompanyScreen from '../screens/CompanyScreen';
import FreelanceScreen from '../screens/FreelanceScreen';
import RemindersScreen from '../screens/RemindersScreen';
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
  
  Bank: undefined;
  Learn: undefined;
  MineSweeper:  undefined;
  snakegame:undefined;
  Signup:undefined;
  2048:undefined;
  Memory:undefined;
  Pong:undefined;
  CupPong:undefined;
  WhackAMole:undefined;
  FlappyBird:undefined;
  Dino:undefined;
  Reminders: undefined;
  JobGenerator:undefined;
  PartTime:undefined;
  Company:undefined;
  Freelance:undefined;
};

// Create a Stack Navigator instance using the defined type
const Stack = createNativeStackNavigator<RootStackParamList>();

// Define and export the RootNavigator component
// This is your top-level navigation container
export default function RootNavigator() {
  return (
    // Stack.Navigator wraps all your stack screens
    <Stack.Navigator initialRouteName="Login" screenOptions={{
      headerStyle: {
          height: 40,
          backgroundColor: '#c78e71ff',
          borderBottomRightRadius:10,
          borderBottomLeftRadius:10,
            
          },
      headerTitleStyle: {
          fontFamily: 'Windows', // must match the key you used in useFonts
          fontSize: 20,
          color: "#63372C"
         },
    }}>
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
  <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false}}/>
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="Job" component={JobScreen} />
      
      <Stack.Screen name="Bank" component={BankScreen} />
      <Stack.Screen name="Learn" component={LearnScreen} />
      <Stack.Screen name="MineSweeper" component={MineSweeperScreen} />
      <Stack.Screen name="snakegame" component={snakegame} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="2048" component={twentyScreen} />
      <Stack.Screen name="Memory" component={MemoryScreen} />
      <Stack.Screen name="Pong" component={PongScreen} />
      <Stack.Screen name="Cup-Pong" component={CupPongScreen} />
      <Stack.Screen name="Whack-A-Mole" component={MoleScreen} />
      <Stack.Screen name="FlappyBird" component={FlappyBirdScreen} />
      <Stack.Screen name="Dino" component={DinoScreen} />
      <Stack.Screen name="JobGenerator" component={JobGeneratorScreen} />
      <Stack.Screen name="PartTime" component={PartTimeScreen} />
      <Stack.Screen name="Company" component={CompanyScreen} />
      <Stack.Screen name="Freelance" component={FreelanceScreen} />

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