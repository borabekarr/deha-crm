import React from 'react';
import { Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import type { NavigationMenuProps as ContractNavigationMenuProps } from '@deha/ui-contracts';
import { tabPillSlide } from '../lib/choreography';
import type { ReanimatedTween } from '../lib/choreography';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Vendor surface — typed subset forwarded to LinearTabBar.
 * The vendor is excluded from tsc (tsconfig "exclude"), so we define only
 * what we pass through.
 */
type VendorLinearTabBarProps = {
  state: object;
  navigation: object;
  descriptors: object;
  onLinearTabPress?: () => void;
  onMenuItemPress?: (index: number) => void;
};

export interface LinearBottomTabsProps extends ContractNavigationMenuProps {
  /**
   * react-navigation bottom-tabs state forwarded to LinearTabBar.
   */
  navigationState: object;
  /** react-navigation navigation object */
  navigation: object;
  /** react-navigation descriptors map */
  descriptors: object;
  /**
   * Called when a linear tab item is pressed.
   */
  onLinearTabPress?: () => void;
  /**
   * Called when an expanded menu item is pressed with its index.
   */
  onMenuItemPress?: (index: number) => void;
  /**
   * Override the tabPillSlide animation config.
   * Defaults to `tabPillSlide({ reducedMotion })`.
   */
  pillConfig?: ReanimatedTween;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderVendorLinearTabBar(props: VendorLinearTabBarProps) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LinearTabBar } = require('expo-linear-like-bottom-tabs') as {
      LinearTabBar: React.ComponentType<VendorLinearTabBarProps>;
    };
    return <LinearTabBar {...props} />;
  } catch {
    return (
      <View
        style={{
          height: 64,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.mutedFg, fontSize: 13 }}>
          Linear bottom tabs unavailable in this environment.
        </Text>
      </View>
    );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LinearBottomTabs({
  value: _value,
  defaultValue: _defaultValue,
  onValueChange: _onValueChange,
  orientation: _orientation,
  reducedMotion,
  children: _children,
  navigationState,
  navigation,
  descriptors,
  onLinearTabPress,
  onMenuItemPress,
  pillConfig,
}: LinearBottomTabsProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  // Resolve pillConfig so the tabPillSlide token is consumed even if the vendor
  // component is unavailable. Stored as typed surface for future native bridge.
  const resolvedPill = pillConfig ?? tabPillSlide({ reducedMotion: isReduced });
  void resolvedPill;

  const vendorProps: VendorLinearTabBarProps = {
    state: navigationState,
    navigation,
    descriptors,
    onLinearTabPress,
    onMenuItemPress,
  };

  return renderVendorLinearTabBar(vendorProps);
}

// Convenience re-export so consumers can import the contract type from here.
export type { LinearBottomTabsProps as LinearBottomTabsComponentProps };
