import * as React from 'react';

// import the drawer navigator creator from React Navigation
// this lets you create a sidebarnavigation menu
import { createDrawerNavigator } from '@react-navigation/drawer';

// Import another navigator (Tabs) — this is to access the homescreen and profile screen in tabs
// so the tabs navigator is wrapped in the drawer navigator

import { useFonts } from 'expo-font';

// Import the Settings screen — another screen in the drawer
import BankScreen from '../../screens/BankScreen';
import CheckingScreen from '../../screens/CheckingScreen';
import SavingsScreen from '../../screens/SavingsScreen';
import LoanScreen from '../../screens/LoanScreen';


// Define the types for your drawer routes and their parameters
// 'Tabs' and 'Settings' are the names of the screens in this navigator
// 'undefined' means they don't take any route parameters
export type DrawerParamList = {
     // the bottom tabs live here
  Bank: undefined;
  Checking:undefined
  Investment:undefined;
  Savings:undefined;
  Credit: undefined;
  Loan: undefined;
};


// Create a Drawer Navigator instance that uses the DrawerParamList type
const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (

     

    // initialRouteName sets which screen appears first
    <Drawer.Navigator
    screenOptions={{
        drawerActiveTintColor:"#ffb5b5ff",
        // Color of active tab icon and label
        drawerActiveBackgroundColor: '#63372cb4', // Color of inactive tab icon and label'#7e4c40ff'
        drawerStyle: {
          borderTopRightRadius:10, 
          backgroundColor: '#eec5c5ff', // Background color of the tab bar
           // Height of the tab bar
           // Padding at the bottom
        },
        
        drawerLabelStyle: {
           
          fontSize: 12, // Font size of tab labels
          fontFamily:'Pixel',
        },
        headerStyle: {
          height: 40,
          backgroundColor: '#eec5c5ff',
          borderBottomRightRadius:10,
          borderBottomLeftRadius:10,
            
          },
      headerTitleStyle: {
          fontFamily: 'Windows', // must match the key you used in useFonts
          fontSize: 20,
          color: "#63372C"
         },
    }}
     initialRouteName='Bank'>
      {/* First drawer item — the Tabs navigator (contains bottom tabs) */}
      
      {/* Second drawer item — opens the Settings screen */}
      <Drawer.Screen name="Bank" component={BankScreen}  />
      <Drawer.Screen name="Checking" component={CheckingScreen} />
  <Drawer.Screen name="Credit" component={require('../../screens/CreditScreen').default} />
      <Drawer.Screen name="Loan" component={LoanScreen}  />
      <Drawer.Screen name="Savings" component={SavingsScreen} />
    </Drawer.Navigator>
  );
}
