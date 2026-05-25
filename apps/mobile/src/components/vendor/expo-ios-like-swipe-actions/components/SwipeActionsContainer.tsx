import React from "react";
import { StyleSheet, View } from "react-native";
import {
  ISwipeActionsContainerComponent,
  ISwipeActionsContainerProps,
} from "../typings/swipe.interfaces";

const SwipeActionsContainerBase: React.FC<ISwipeActionsContainerProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const SwipeActionsContainer = React.memo(
  SwipeActionsContainerBase,
) as ISwipeActionsContainerComponent;

SwipeActionsContainer.slot = "container";
SwipeActionsContainer.displayName = "SwipeActionsContainer";

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
});

export { SwipeActionsContainer };
export default SwipeActionsContainer;
