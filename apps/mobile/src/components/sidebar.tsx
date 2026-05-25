import React, {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SidebarProps } from '@deha/ui-contracts';
import { tabPillSlide } from '../lib/choreography';
import { colors } from '../lib/tokens';

const SIDEBAR_WIDTH = 260;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface SidebarCtx {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  isReduced: boolean;
  translateX: ReturnType<typeof useSharedValue<number>>;
  side: 'left' | 'right';
}

const SidebarContext = createContext<SidebarCtx | null>(null);

function useSidebarCtx() {
  const ctx = use(SidebarContext);
  if (!ctx) throw new Error('Sidebar sub-component used outside <Sidebar>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function SidebarRoot({
  collapsed: controlledCollapsed,
  defaultCollapsed = true,
  onCollapsedChange,
  side = 'left',
  reducedMotion,
  children,
}: SidebarProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const [internal, setInternal] = useState(defaultCollapsed);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internal;

  const hiddenX = side === 'left' ? -SIDEBAR_WIDTH : SIDEBAR_WIDTH;
  const translateX = useSharedValue(collapsed ? hiddenX : 0);

  const setCollapsed = useCallback(
    (v: boolean) => {
      const cfg = tabPillSlide({ reducedMotion: isReduced });
      translateX.value = withTiming(v ? hiddenX : 0, {
        duration: cfg.duration,
        easing: cfg.easing,
      });
      if (controlledCollapsed === undefined) setInternal(v);
      onCollapsedChange?.(v);
    },
    [controlledCollapsed, onCollapsedChange, isReduced, translateX, hiddenX],
  );

  const ctxValue = useMemo(
    () => ({ collapsed, setCollapsed, isReduced, translateX, side }),
    [collapsed, setCollapsed, isReduced, translateX, side],
  );

  return (
    <SidebarContext.Provider value={ctxValue}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </SidebarContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Panel (the animated drawer)
// ---------------------------------------------------------------------------
function Panel({ children }: { children: React.ReactNode }) {
  const { translateX, side } = useSidebarCtx();

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const positionStyle = side === 'left'
    ? { left: 0 }
    : { right: 0 };

  return (
    <Animated.View style={[styles.panel, positionStyle, panelStyle]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
function Header({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------
interface ItemProps {
  active?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

function Item({ active = false, onPress, children }: ItemProps) {
  const { isReduced } = useSidebarCtx();
  const pillOpacity = useSharedValue(active ? 1 : 0);

  const cfg = tabPillSlide({ reducedMotion: isReduced });

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
  }));

  const handlePress = useCallback(() => {
    pillOpacity.value = withTiming(active ? 0 : 1, {
      duration: cfg.duration,
      easing: cfg.easing,
    });
    onPress?.();
  }, [active, cfg.duration, cfg.easing, onPress, pillOpacity]);

  return (
    <Pressable onPress={handlePress} style={styles.item}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pill, pillStyle]} />
      <Text style={[styles.itemText, active && styles.itemTextActive]}>
        {children}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export const Sidebar = Object.assign(SidebarRoot, { Panel, Header, Item });

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingTop: 48,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  item: {
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pill: {
    backgroundColor: colors.primary + '1a',
    borderRadius: 8,
  },
  itemText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
  },
  itemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
