import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ToastivaProvider } from './src/components/toastiva';
import PrimitivesScreen from './src/screens/PrimitivesScreen';

type RootStackParamList = {
  Primitives: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastivaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Primitives">
            <Stack.Screen
              name="Primitives"
              component={PrimitivesScreen}
              options={{ title: 'Primitives', headerLargeTitle: true }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </ToastivaProvider>
    </GestureHandlerRootView>
  );
}
