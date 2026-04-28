import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View, StyleSheet} from 'react-native';
import {Colors, Radius} from '../utils/theme';
import HomeScreen    from '../screens/HomeScreen';
import AIScreen      from '../screens/AIScreen';
import UdharScreen   from '../screens/UdharScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  {name: 'Home',     icon: '🏠', component: HomeScreen},
  {name: 'AI',       icon: '🤖', component: AIScreen},
  {name: 'Udhar',    icon: '📒', component: UdharScreen},
  {name: 'Reports',  icon: '📊', component: ReportsScreen},
  {name: 'Settings', icon: '⚙️', component: SettingsScreen},
];

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarShowLabel: false,
      }}>
      {TABS.map(t => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            tabBarIcon: ({focused}) => (
              <View style={[styles.item, focused && styles.itemOn]}>
                <Text style={styles.icon}>{t.icon}</Text>
                <Text style={[styles.label, focused && styles.labelOn]}>{t.name}</Text>
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.bg2,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 0,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  itemOn: {backgroundColor: Colors.primaryFade},
  icon:    {fontSize: 20},
  label:   {fontSize: 9.5, fontWeight: '500', color: Colors.t4, letterSpacing: 0.2},
  labelOn: {color: Colors.primary},
});
