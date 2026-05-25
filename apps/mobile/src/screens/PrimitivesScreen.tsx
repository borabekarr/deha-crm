import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import TabsSection from './primitives-sections/tabs';
import PaginationSection from './primitives-sections/pagination';
import BadgeSection from './primitives-sections/badge';
import PopoverSection from './primitives-sections/popover';
import TooltipSection from './primitives-sections/tooltip';
import DropdownMenuSection from './primitives-sections/dropdown-menu';
import SelectSection from './primitives-sections/select';
import ComboboxSection from './primitives-sections/combobox';
import SidebarSection from './primitives-sections/sidebar';
import SheetSection from './primitives-sections/sheet';
import DialogSection from './primitives-sections/dialog';
import NavigationMenuSection from './primitives-sections/navigation-menu';
import ContextMenuSection from './primitives-sections/context-menu';
import ScrollAreaSection from './primitives-sections/scroll-area';
import CalendarSection from './primitives-sections/calendar';
import DatePickerSection from './primitives-sections/date-picker';
import WheelDatePickerSection from './primitives-sections/wheel-date-picker';
import ToastSection from './primitives-sections/toast';
import ToastivaSection from './primitives-sections/toastiva';
import MotionTabsSection from './primitives-sections/motion-tabs';
import LinearBottomTabsSection from './primitives-sections/linear-bottom-tabs';
import SwipeActionsSection from './primitives-sections/swipe-actions';
import ProgressiveBlurSection from './primitives-sections/progressive-blur';
import FabSection from './primitives-sections/fab';

export default function PrimitivesScreen() {
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.sections}>
        <TabsSection />
        <PaginationSection />
        <BadgeSection />
        <PopoverSection />
        <TooltipSection />
        <DropdownMenuSection />
        <SelectSection />
        <ComboboxSection />
        <SidebarSection />
        <SheetSection />
        <DialogSection />
        <NavigationMenuSection />
        <ContextMenuSection />
        <ScrollAreaSection />
        <CalendarSection />
        <DatePickerSection />
        <WheelDatePickerSection />
        <ToastSection />
        <ToastivaSection />
        <MotionTabsSection />
        <LinearBottomTabsSection />
        <SwipeActionsSection />
        <ProgressiveBlurSection />
        <FabSection />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: '#fff' },
  content:   { paddingBottom: 48 },
  sections:  { paddingHorizontal: 16 },
});
