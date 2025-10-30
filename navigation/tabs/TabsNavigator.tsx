import * as React from 'react';
// Import the bottom tab navigator creator from React Navigation
// This lets you create a bar at the bottom of the screen with multiple tabs
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Import the screens that will be shown in each tab
import HomeScreen from '../../screens/HomeScreen';
import ShopScreen from '../../screens/ShopScreen';

import BankScreen from '../../screens/BankScreen';
import LearnScreen from '../../screens/LearnScreen';
import DrawerNavigator from '../drawer/DrawerNavigator';
import { useFonts } from 'expo-font';


// Define the types for your bottom tab routes and their parameters
// 'undefined' means these routes don't expect any route params
export type TabsParamList = {
  Home: undefined;
  Shop: undefined;

  Bank:undefined;
  Learn:undefined;
};


// Create a Bottom Tab Navigator instance that uses the TabsParamList type
const Tab = createBottomTabNavigator<TabsParamList>();


//function to create the bottom tab navigator
export default function TabsNavigator() {
  const [fontsLoaded] = useFonts({
      'LazyDaze': require('../../assets/ATP-Lazy Daze.ttf'),
      'Windows': require('../../assets/windows-bold.ttf'),
      'RetroBoulevard': require('../../assets/Retro Boulevard.ttf'),
      'Pixel': require('../../assets/pixel.ttf'),
    });
  
  // The Tab.Navigator component wraps all your tab screens
  // initialRouteName specifies which tab appears first (Home)
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#63372C', // Color of active tab icon and label
        tabBarInactiveTintColor: '#63372cb4', // Color of inactive tab icon and label'#7e4c40ff'
        tabBarStyle: {
          borderRadius:10, 
          backgroundColor: '#c78e71ff', // Background color of the tab bar
          height: 60, // Height of the tab bar
           // Padding at the bottom
        },
        
        tabBarLabelStyle: { 
          fontSize: 15, // Font size of tab labels
          fontFamily:'Pixel',
        },
      }}
     initialRouteName="Home">
      {/* First tab — shows the Home screen */}
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
      {/* Second tab — shows the Shop screen */}
      <Tab.Screen name="Shop" component={ShopScreen} options={{ headerShown: false}} />
      
      <Tab.Screen name="Bank" component={DrawerNavigator} options={{ headerShown: false}}/>
      <Tab.Screen name="Learn" component={LearnScreen} options={{ headerShown: false}}/>
    </Tab.Navigator>
  );
}
