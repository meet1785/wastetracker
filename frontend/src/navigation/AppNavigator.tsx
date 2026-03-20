import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS } from '../utils/constants';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import AddItemScreen from '../screens/AddItemScreen';
import RecipesScreen from '../screens/RecipesScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Inventory: undefined;
  Recipes: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AddItem: undefined;
  ShoppingList: undefined;
  Community: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppTab = createBottomTabNavigator<AppTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function MainTabs() {
  return (
    <AppTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { color: COLORS.textPrimary, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <AppTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'FreshTrack',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <AppTab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: 'My Food',
          tabBarIcon: ({ focused }) => <TabIcon icon="🥗" focused={focused} />,
        }}
      />
      <AppTab.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{
          title: 'Recipes',
          tabBarIcon: ({ focused }) => <TabIcon icon="👨‍🍳" focused={focused} />,
        }}
      />
      <AppTab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <AppTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </AppTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigatorInner() {
  return (
    <RootStack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.surface }, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Food Item', presentation: 'modal' }} />
      <RootStack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
      <RootStack.Screen name="Community" component={CommunityScreen} options={{ title: 'Community Board' }} />
    </RootStack.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigatorInner /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
