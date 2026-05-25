import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutRectangle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import type { NavigationMenuProps } from '@deha/ui-contracts';
import { tabPillSlide } from '../lib/choreography';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface NavigationMenuCtx {
  active: string;
  setActive: (v: string) => void;
  isReduced: boolean;
  pillX: ReturnType<typeof useSharedValue<number>>;
  pillW: ReturnType<typeof useSharedValue<number>>;
  registerItem: (value: string, layout: LayoutRectangle) => void;
}

const NavigationMenuContext = createContext<NavigationMenuCtx | null>(null);

function useNavCtx() {
  const ctx = useContext(NavigationMenuContext);
  if (!ctx) throw new Error('NavigationMenu sub-component used outside <NavigationMenu>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function NavigationMenuRoot({
  value,
  defaultValue = '',
  onValueChange,
  reducedMotion,
  children,
}: NavigationMenuProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const [internal, setInternal] = useState(defaultValue);
  const active = value !== undefined ? value : internal;

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const layouts = useRef<Record<string, LayoutRectangle>>({});

  const registerItem = useCallback(
    (v: string, layout: LayoutRectangle) => {
      layouts.current[v] = layout;
      if (v === active) {
        const cfg = tabPillSlide({ reducedMotion: isReduced });
        pillX.value = withTiming(layout.x, { duration: cfg.duration, easing: cfg.easing });
        pillW.value = withTiming(layout.width, { duration: cfg.duration, easing: cfg.easing });
      }
    },
    [active, pillX, pillW, isReduced],
  );

  const setActive = useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
      const layout = layouts.current[v];
      if (layout) {
        const cfg = tabPillSlide({ reducedMotion: isReduced });
        pillX.value = withTiming(layout.x, { duration: cfg.duration, easing: cfg.easing });
        pillW.value = withTiming(layout.width, { duration: cfg.duration, easing: cfg.easing });
      }
    },
    [value, onValueChange, pillX, pillW, isReduced],
  );

  return (
    <NavigationMenuContext.Provider value={{ active, setActive, isReduced, pillX, pillW, registerItem }}>
      <View style={styles.root} accessibilityRole="tablist">
        {children}
      </View>
    </NavigationMenuContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------
interface ItemProps {
  value: string;
  children: React.ReactNode;
}

function Item({ value, children }: ItemProps) {
  const { active, setActive, pillX, pillW, registerItem } = useNavCtx();
  const isActive = active === value;

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: LayoutRectangle } }) => {
      registerItem(value, e.nativeEvent.layout);
    },
    [registerItem, value],
  );

  return (
    <View style={styles.itemWrapper}>
      {isActive && (
        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />
      )}
      <Pressable
        onLayout={onLayout}
        onPress={() => setActive(value)}
        style={styles.item}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <Text style={[styles.itemText, isActive && styles.itemTextActive]}>
          {children}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export const NavigationMenu = Object.assign(NavigationMenuRoot, { Item });

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 10,
    padding: 3,
    alignSelf: 'flex-start',
  },
  itemWrapper: {
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  item: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedFg,
  },
  itemTextActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
});
