import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { SharedValue } from "react-native-reanimated";

interface ISwipeAction {
  key: string;
  side: "left" | "right";
  children: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface ISwipeActionsParsedChildren {
  mainChildren: React.ReactNode[];
  leftActions: ISwipeAction[];
  rightActions: ISwipeAction[];
}

interface ISwipeActionsRootHandle {
  close: (animated?: boolean) => void;
  open: (side: "left" | "right") => void;
}

interface ISwipeMotionCurve extends ReadonlyArray<number> {
  readonly 0: number;
  readonly 1: number;
  readonly 2: number;
  readonly 3: number;
  readonly length: 4;
}

interface ISwipeMotionConfig {
  easingCurve?: ISwipeMotionCurve;
  releaseDurationMs?: number;
  commitSnapDurationMs?: number;
  commitMorphDurationMs?: number;
  actionContentDurationMs?: number;
}

interface ISwipeTuning {
  easingCurve?: ISwipeMotionCurve;
  releaseDurationMs?: number;
  commitSnapDurationMs?: number;
  actionContentDurationMs?: number;
  iconTravelRange?: number;
  fullSwipeThreshold?: number;
  commitOvershoot?: number;
  commitDurationMs?: number;
  fullSwipeExpansionOffset?: number;
  elasticRatio?: number;
  closeVelocity?: number;
  minOpenTranslation?: number;
  velocityCommit?: number;
}

interface ISwipeActionsRootProps {
  children: React.ReactNode;
  actionWidth?: number;
  fullSwipeEnabled?: boolean;
  fullSwipeExpansionOffset?: number;
  onOpen?: (side: "left" | "right") => void;
  onClose?: () => void;
  onHapticCue?: (kind: "reveal" | "commit") => void;
  motion?: ISwipeMotionConfig;
  tuning?: ISwipeTuning;
  style?: StyleProp<ViewStyle>;
}

interface ISwipeActionsMainProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface ISwipeActionsContainerProps {
  children: React.ReactNode;
  onPress: () => void;
  side?: "left" | "right";
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface ISwipeSlotComponent {
  slot?: "container" | "main";
}

interface ISwipeActionsContainerComponent
  extends React.NamedExoticComponent<ISwipeActionsContainerProps>,
    ISwipeSlotComponent {
  slot?: "container";
}

interface ISwipeActionsMainComponent
  extends React.NamedExoticComponent<ISwipeActionsMainProps>,
    ISwipeSlotComponent {
  slot?: "main";
}

interface ISwipeRegistryValue {
  register: (id: string, close: () => void) => void;
  unregister: (id: string) => void;
  notifyOpen: (id: string) => void;
  closeActive: (exceptId?: string) => void;
}

interface ISwipeActionsProviderProps {
  children: React.ReactNode;
}

interface IResolvedSwipeTuning {
  easingCurve: ISwipeMotionCurve;
  releaseDurationMs: number;
  commitSnapDurationMs: number;
  actionContentDurationMs: number;
  iconTravelRange: number;
  fullSwipeThreshold: number;
  commitOvershoot: number;
  commitDurationMs: number;
  fullSwipeExpansionOffset: number;
  elasticRatio: number;
  closeVelocity: number;
  minOpenTranslation: number;
  velocityCommit: number;
}

interface ISwipeEasing {
  factory: () => (value: number) => number;
}

interface ISwipeTimingTransition {
  duration: number;
  easing: ISwipeEasing;
}

interface ISwipeMotion {
  tuning: IResolvedSwipeTuning;
  easing: ISwipeEasing;
  releaseTransition: ISwipeTimingTransition;
  commitSnapTransition: ISwipeTimingTransition;
}

interface IUseSwipeMotionParams {
  motion?: ISwipeMotionConfig;
  tuning?: ISwipeTuning;
  fullSwipeExpansionOffset?: number;
}

interface ISwipeActionsLayerProps {
  side: "left" | "right";
  actions: ISwipeAction[];
  actionWidth: number;
  translateX: SharedValue<number>;
  cellWidth: SharedValue<number>;
  fullSwipeEnabled: boolean;
  tuning: IResolvedSwipeTuning;
  easing: ISwipeEasing;
  onActionPress: (
    action: ISwipeAction,
    context: ISwipeActionPressContext,
  ) => void;
}

interface ISwipeActionPressContext {
  side: "left" | "right";
  isDominant: boolean;
}

interface ISwipeActionButtonProps {
  action: ISwipeAction;
  side: "left" | "right";
  isDominant: boolean;
  actionWidth: number;
  total: number;
  translateX: SharedValue<number>;
  cellWidth: SharedValue<number>;
  fullSwipeEnabled: boolean;
  commitTransition: SharedValue<number>;
  actionContentTriggerProgress: SharedValue<number>;
  onActionPress: (
    action: ISwipeAction,
    context: ISwipeActionPressContext,
  ) => void;
}

interface ISwipeActionIconProps {
  icon: React.ReactNode | keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}

interface ISwipeActionTitleProps {
  children: React.ReactNode;
  color?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

export {
  ISwipeAction,
  ISwipeActionPressContext,
  ISwipeActionButtonProps,
  ISwipeActionIconProps,
  ISwipeActionTitleProps,
  ISwipeActionsContainerComponent,
  ISwipeActionsContainerProps,
  ISwipeActionsLayerProps,
  ISwipeActionsMainComponent,
  ISwipeActionsMainProps,
  ISwipeActionsParsedChildren,
  ISwipeActionsProviderProps,
  ISwipeActionsRootHandle,
  ISwipeActionsRootProps,
  ISwipeEasing,
  ISwipeMotion,
  ISwipeMotionConfig,
  ISwipeMotionCurve,
  ISwipeRegistryValue,
  ISwipeSlotComponent,
  ISwipeTimingTransition,
  ISwipeTuning,
  IResolvedSwipeTuning,
  IUseSwipeMotionParams,
};
