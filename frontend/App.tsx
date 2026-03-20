import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, AppDispatch } from './src/store';
import { setUser } from './src/store/authSlice';
import { getToken, getStoredUser } from './src/services/auth';
import { requestPermissions } from './src/services/notifications';
import AppNavigator from './src/navigation/AppNavigator';

function AppInner() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    async function bootstrap() {
      // Restore session
      const [token, user] = await Promise.all([getToken(), getStoredUser()]);
      if (token && user) {
        dispatch(setUser({ user, token }));
      }

      // Request notification permissions (non-blocking)
      requestPermissions().catch(() => null);
    }
    bootstrap();
  }, [dispatch]);

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </Provider>
  );
}
