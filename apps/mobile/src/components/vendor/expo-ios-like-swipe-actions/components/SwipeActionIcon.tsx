import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ISwipeActionIconProps } from "../typings/swipe.interfaces";

const SwipeActionIcon: React.FC<ISwipeActionIconProps> = ({
  icon,
  color = "#fff",
  size = 22,
  style,
}) => {
  if (typeof icon === "string") {
    return (
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  return <>{icon}</>;
};

const SwipeActionIconMemo = React.memo(SwipeActionIcon);
SwipeActionIconMemo.displayName = "SwipeActionIcon";

export { SwipeActionIconMemo as SwipeActionIcon };
export default SwipeActionIconMemo;
