import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationMenu } from '../../components/navigation-menu';

export default function NavigationMenuSection() {
  const [active, setActive] = useState('home');
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Navigation Menu</Text>
      <NavigationMenu value={active} onValueChange={setActive}>
        <NavigationMenu.Item value="home">Home</NavigationMenu.Item>
        <NavigationMenu.Item value="explore">Explore</NavigationMenu.Item>
        <NavigationMenu.Item value="profile">Profile</NavigationMenu.Item>
      </NavigationMenu>
      <Text style={s.hint}>Active: {active}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint:  { fontSize: 13, color: '#9ca3af', marginTop: 10 },
});
