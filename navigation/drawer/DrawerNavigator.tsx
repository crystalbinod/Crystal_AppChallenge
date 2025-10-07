import * as React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TabsNavigator from '../tabs/TabsNavigator';
import SettingsScreen from '../../screens/SettingsScreen';

export type DrawerParamList = {
  Tabs: undefined;     // the bottom tabs live here
  Settings: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Tabs">
      <Drawer.Screen
        name="Tabs"
        component={TabsNavigator}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}
