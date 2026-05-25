import React from "react";
import { StyleSheet, Text } from "react-native";
import { ISwipeActionTitleProps } from "../typings/swipe.interfaces";

const SwipeActionTitle: React.FC<ISwipeActionTitleProps> = ({
  children,
  color = "#fff",
  numberOfLines = 1,
  style,
}) => {
  return (
    <Text
      style={[styles.title, { color }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const SwipeActionTitleMemo = React.memo(SwipeActionTitle);
SwipeActionTitleMemo.displayName = "SwipeActionTitle";

const styles = StyleSheet.create({
  title: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export { SwipeActionTitleMemo as SwipeActionTitle };
export default SwipeActionTitleMemo;
