import 'react-native-gesture-handler'; // must be first
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';

/// The main entry point of your app
export default function App() {
  return (
    //Wraps over your root navigator which wrap all the other navigation
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}