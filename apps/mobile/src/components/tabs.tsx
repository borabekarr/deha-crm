import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutRectangle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { TabsProps } from '@deha/ui-contracts';
import { tabMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface TabsCtx {
  active: string;
  setActive: (v: string) => void;
  isReduced: boolean;
  indicatorX: ReturnType<typeof useSharedValue<number>>;
  indicatorW: ReturnType<typeof useSharedValue<number>>;
  registerTrigger: (value: string, layout: LayoutRectangle) => void;
}

const TabsContext = createContext<TabsCtx | null>(null);

function useTabsCtx() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs sub-component used outside <Tabs>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function TabsRoot({ value, defaultValue = '', onValueChange, children, reducedMotion }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const active = value !== undefined ? value : internal;
  const isReduced = reducedMotion === 'reduce';

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const layouts = useRef<Record<string, LayoutRectangle>>({});

  const registerTrigger = useCallback(
    (v: string, layout: LayoutRectangle) => {
      layouts.current[v] = layout;
      if (v === active) {
        const cfg = tabMorph({ reducedMotion: isReduced });
        indicatorX.value = withTiming(layout.x, { duration: cfg.duration, easing: cfg.easing });
        indicatorW.value = withTiming(layout.width, { duration: cfg.duration, easing: cfg.easing });
      }
    },
    [active, indicatorX, indicatorW, isReduced],
  );

  const setActive = useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
      const layout = layouts.current[v];
      if (layout) {
        const cfg = tabMorph({ reducedMotion: isReduced });
        indicatorX.value = withTiming(layout.x, { duration: cfg.duration, easing: cfg.easing });
        indicatorW.value = withTiming(layout.width, { duration: cfg.duration, easing: cfg.easing });
      }
    },
    [value, onValueChange, indicatorX, indicatorW, isReduced],
  );

  const ctxValue = useMemo(
    () => ({ active, setActive, isReduced, indicatorX, indicatorW, registerTrigger }),
    [active, setActive, isReduced, indicatorX, indicatorW, registerTrigger],
  );

  return (
    <TabsContext.Provider value={ctxValue}>
      <View style={styles.root}>{children}</View>
    </TabsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
function List({ children }: { children: React.ReactNode }) {
  const { indicatorX, indicatorW } = useTabsCtx();
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  return (
    <View style={styles.list}>
      <Animated.View style={[styles.indicator, animStyle]} />
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
function Trigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive, registerTrigger } = useTabsCtx();
  const isActive = active === value;

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: LayoutRectangle } }) => {
      registerTrigger(value, e.nativeEvent.layout);
    },
    [registerTrigger, value],
  );

  return (
    <Pressable
      onLayout={onLayout}
      onPress={() => setActive(value)}
      style={styles.trigger}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.triggerText, isActive && styles.triggerTextActive]}>
        {children}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
function Content({ value, children }: { value: string; children: React.ReactNode }) {
  const { active } = useTabsCtx();
  if (active !== value) return null;
  return <View style={styles.content}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export const Tabs = Object.assign(TabsRoot, { List, Trigger, Content });

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
  },
  list: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  trigger: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  triggerText: {
    fontSize: 14,
    color: colors.mutedFg,
    fontWeight: '500',
  },
  triggerTextActive: {
    color: colors.foreground,
  },
  content: {
    paddingTop: 16,
  },
});
